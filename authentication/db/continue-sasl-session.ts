import { _IpostgrancerDBConnectionData } from "../../database/interface";
import crypto from "crypto";
import constants from "../../constants";
import { sha256, hmacSha256, xorBuffers } from "../../utils";

function continueSaslSession(params: {
  data: Buffer;
  _postgrancerDBConnectionData: _IpostgrancerDBConnectionData;
}) {
  const data = params.data;
  let offset = 0;
  let message = "";

  const messageLength = data.readInt32BE(1);

  // First Byte (1) + Message Length Bytes (4) + authType/Message contenxt (4)
  offset = 1 + 4 + 4;

  for (let i = offset; i <= messageLength; i++) {
    const char = String.fromCharCode(data.readInt8(i));
    message += char;
  }

  // Generate Response //
  ///////////////////////////////////////////////////
  // Validations & SCRAM logic from 'pg-protocol'  //
  // 'https://datatracker.ietf.org/doc/rfc5802/'   //
  ///////////////////////////////////////////////////

  // Extract Attributes
  const attributes = new Map(
    message.split(",").map((attrValue) => {
      if (!/^.=/.test(attrValue)) {
        throw new Error("SASL: Invalid attribute pair entry");
      }
      const name = attrValue[0];
      const value = attrValue.substring(2);
      return [name, value];
    })
  );

  const nonce = attributes.get("r");
  if (!nonce) {
    throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
  }
  const salt = attributes.get("s");
  if (!salt) {
    throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
  }
  const iterationText = attributes.get("i");
  if (!iterationText) {
    throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
  } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
    throw new Error(
      "SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count"
    );
  }
  const iteration = parseInt(iterationText, 10);

  const clientNonce = params._postgrancerDBConnectionData.clientNonce;
  if (!clientNonce) {
    throw new Error("clientNonce is empty for dbConnection");
  }
  if (!nonce.startsWith(clientNonce)) {
    throw new Error("server nonce does not start with client nonce");
  } else if (nonce.length === clientNonce.length) {
    throw new Error("server nonce is too short");
  }

  var saltBytes = Buffer.from(salt, "base64");

  const password = constants.dbPassword;
  var saltedPassword = crypto.pbkdf2Sync(
    password,
    saltBytes,
    iteration,
    32,
    "sha256"
  );

  const clientKey = hmacSha256(saltedPassword, "Client Key");
  const storedKey = sha256(clientKey);

  const clientFirstMessageBare = "n=*,r=" + clientNonce;
  const serverFirstMessage = "r=" + nonce + ",s=" + salt + ",i=" + iteration;

  const clientFinalMessageWithoutProof = "c=biws,r=" + nonce;

  const authMessage =
    clientFirstMessageBare +
    "," +
    serverFirstMessage +
    "," +
    clientFinalMessageWithoutProof;

  const clientSignature = hmacSha256(storedKey, authMessage);
  const clientProofBytes = xorBuffers(clientKey, clientSignature);
  const clientProof = clientProofBytes.toString("base64");

  const serverKey = hmacSha256(saltedPassword, "Server Key");
  const serverSignatureBytes = hmacSha256(serverKey, authMessage);

  const serverSignature = serverSignatureBytes.toString("base64");
  const response = clientFinalMessageWithoutProof + ",p=" + clientProof;
  const responseLength = Buffer.byteLength(response);

  // Message Byte (1) + Length of Message (4) + Bytes response (n)
  const totalLength = 1 + 4 + responseLength;
  let responseBuffer = Buffer.allocUnsafe(totalLength);
  responseBuffer.write("p", 0);
  responseBuffer.writeInt32BE(responseLength + 4, 1);
  responseBuffer.write(response, 5);
  return {
    serverSignature,
    response,
    responseBuffer,
  };
}

export default continueSaslSession;

import crypto from "crypto";
import constants from "../../constants";
import getDbPassword from "./get-db-password";

function finalClientSaslSession(
  data: Buffer,
  responseNonceFromContinueStage: string,
  clientNonceFromContinueStage: string,
  saltFromContinueStage: string
): {
  error?: string;
  responseBuffer?: Buffer;
} {
  let responseBuffer = null,
    offset: number = 0;

  // Verify first byte
  const firstByte = data.readInt8(offset);
  offset += 1;
  const firstChar = String.fromCharCode(firstByte);
  if (firstChar !== "p") {
    return {
      error: "Not a valid SASLResponse",
    };
  }

  // Length of received Message
  const receivedMessageLength: number = data.readInt32BE(offset);
  offset += 4;

  // Client Message
  let receivedMessage: string = "";
  for (let i = offset; i <= receivedMessageLength; i++) {
    const byte = data.readInt8(i);
    const char = String.fromCharCode(byte);
    receivedMessage += char;
  }

  // Extract Attributes
  if (!receivedMessage) {
    return {
      error: "Not a valid SASLResponse",
    };
  }
  const receivedMessageArray: string[] = receivedMessage.split(",");
  if (receivedMessageArray.length !== 3) {
    return {
      error: "Not a valid SASLResponse",
    };
  }

  const receivedNonce: string =
    receivedMessageArray[1] && receivedMessageArray[1].slice(2);

  const clientProof: string =
    receivedMessageArray[2] && receivedMessageArray[2].slice(2);

  // Verify
  if (receivedNonce !== responseNonceFromContinueStage) {
    return {
      error: "Not a valid Nonce",
    };
  }

  // Calculate Client Signature
  var saltBytes = Buffer.from(saltFromContinueStage, "base64");
  const password = getDbPassword("make it multiple db architecture");
  const iteration = constants.scramIterations;

  var saltedPassword = crypto.pbkdf2Sync(
    password,
    saltBytes,
    iteration,
    32,
    "sha256"
  );

  const clientKey = hmacSha256(saltedPassword, "Client Key");
  const storedKey = sha256(clientKey);

  const clientFirstMessageBare = "n=*,r=" + clientNonceFromContinueStage;
  const serverFirstMessage =
    "r=" +
    responseNonceFromContinueStage +
    ",s=" +
    saltFromContinueStage +
    ",i=" +
    iteration;

  const clientFinalMessageWithoutProof =
    "c=biws,r=" + responseNonceFromContinueStage;

  const authMessage =
    clientFirstMessageBare +
    "," +
    serverFirstMessage +
    "," +
    clientFinalMessageWithoutProof;

  const clientSignature = hmacSha256(storedKey, authMessage);

  // Verify by exclusive-ORing clientSignature with the ClientProof
  // to recover the ClientKey and verifying the correctness of the ClientKey
  // by applying the hashfunction and comparing the result to the StoredKey

  const clientProofBuffer: Buffer = Buffer.from(clientProof, "base64");

  const clientKeyFromClientProof: Buffer = xorBuffers(
    clientSignature,
    clientProofBuffer
  );

  const storedKeyFromClientProof = sha256(clientKeyFromClientProof);

  const isStoredKeySame =
    Buffer.compare(storedKey, storedKeyFromClientProof) === 0;
  if (!isStoredKeySame) {
    return {
      error: "Not a valid SASLResponse",
    };
  }

  // Calculate Server Signature
  const serverKey = hmacSha256(saltedPassword, "Server Key");
  const serverSignatureBytes = hmacSha256(serverKey, authMessage);
  const serverSignature = serverSignatureBytes.toString("base64");

  // Response
  const message = `v=${serverSignature}`;
  // Message Type (1) + Message Length (4) + Message Code (4) + Message
  const messageLength: number = 1 + 4 + 4 + Buffer.byteLength(message);
  let responseOffset = 0;
  responseBuffer = Buffer.allocUnsafe(messageLength);

  responseBuffer.write("R");
  responseOffset += 1;
  responseBuffer.writeInt32BE(messageLength - 1, responseOffset);
  responseOffset += 4;
  responseBuffer.writeInt32BE(12, responseOffset);
  responseOffset += 4;
  responseBuffer.write(message, responseOffset);

  return {
    responseBuffer,
  };
}

function sha256(text: Buffer) {
  return crypto.createHash("sha256").update(text).digest();
}

function hmacSha256(key: Buffer, msg: string) {
  return crypto.createHmac("sha256", key).update(msg).digest();
}

function xorBuffers(a: Buffer, b: Buffer) {
  if (!Buffer.isBuffer(a)) {
    throw new TypeError("first argument must be a Buffer");
  }
  if (!Buffer.isBuffer(b)) {
    throw new TypeError("second argument must be a Buffer");
  }
  if (a.length !== b.length) {
    throw new Error("Buffer lengths must match");
  }
  if (a.length === 0) {
    throw new Error("Buffers cannot be empty");
  }
  return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
}

export default finalClientSaslSession;

import crypto from "crypto";

function initiateSaslMechanism(params: { mechanism: string }) {
  const clientNonce = crypto.randomBytes(18).toString("base64");
  const saslResponse = "n,,n=*,r=" + clientNonce;
  const saslResponseLength = Buffer.byteLength(saslResponse);
  const mechanism = params.mechanism + "\0";
  const mechanismLength = Buffer.byteLength(mechanism);

  // Message Byte (1) + Total Length (4) + Mechanism + sasl response length (4) + sasl response
  const totalLength = 1 + 4 + mechanismLength + 4 + saslResponseLength;

  // Generate Buffer
  let response = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  response.write("p", offset);
  offset += 1;
  response.writeInt32BE(totalLength - 1, offset);
  offset += 4;
  response.write(mechanism, offset);
  offset += mechanismLength;
  response.writeInt32BE(saslResponseLength, offset);
  offset += 4;
  response.write(saslResponse, offset);

  return {
    response,
    clientNonce,
  };
}

export default initiateSaslMechanism;

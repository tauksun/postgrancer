import crypto from "crypto";
import constants from "../../constants";

function continueClientSaslSession(data: Buffer): {
  error?: string;
  responseBuffer?: Buffer;
  responseNonce?: string;
  clientNonce?: string;
  salt?: string;
} {
  let responseBuffer = null,
    offset = 0;

  // Verify first byte
  const firstByte = data.readInt8(offset);
  offset += 1;
  const firstChar = String.fromCharCode(firstByte);
  if (firstChar !== "p") {
    return {
      error: "Not a valid SASLInitialResponse",
    };
  }

  // Length of received Message
  const receivedMessageLength = data.readInt32BE(offset);
  offset += 4;

  // Name of authentication mechanism
  let authenticationMechanism = "";
  for (let i = offset; i < receivedMessageLength; i++) {
    offset++;
    const byte = data.readInt8(i);
    const char = String.fromCharCode(byte);
    if (char === "\x00") {
      break;
    }
    authenticationMechanism += char;
  }

  // SASL mechanism specific "Initial Response" length
  const initialResponseLength = data.readInt32BE(offset);
  offset += 4;

  // SASL mechanism data
  let saslMechanismData = "";
  for (let i = offset; i <= receivedMessageLength; i++) {
    const byte = data.readInt8(i);
    const char = String.fromCharCode(byte);
    saslMechanismData += char;
  }

  if (!saslMechanismData) {
    return {
      error: "Not a valid SASLInitialResponse",
    };
  }
  const saslMechanismDataArray: string[] = saslMechanismData.split(",");
  if (!(saslMechanismDataArray.length === 4)) {
    return {
      error: "Not a valid SASLInitialResponse",
    };
  }
  const userData: string = saslMechanismDataArray[2];
  const user: string = userData.slice(2);

  const clientNonceData: string = saslMechanismDataArray[3];
  const clientNonce: string = clientNonceData.slice(2);

  // Response
  const salt = crypto.randomBytes(18).toString("base64");

  const serverNonce = crypto.randomBytes(18).toString("base64");
  const responseNonce = clientNonce + serverNonce;

  const iterations: number = constants.scramIterations;

  // AuthenticationSASLContinue Message
  const message = `r=${responseNonce},s=${salt},i=${iterations}`;
  // Message Byte (1) + Message Length (4) + Message Code (4) + Message
  const messageLength = 1 + 4 + 4 + Buffer.byteLength(message);

  responseBuffer = Buffer.allocUnsafe(messageLength);

  let serverResponseBufferOffset = 0;
  responseBuffer.write("R");
  serverResponseBufferOffset += 1;
  // Not including Message Byte
  responseBuffer.writeInt32BE(messageLength - 1, serverResponseBufferOffset);
  serverResponseBufferOffset += 4;
  // SASL challenge specific mechanism
  responseBuffer.writeInt32BE(11, serverResponseBufferOffset);
  serverResponseBufferOffset += 4;
  responseBuffer.write(message, serverResponseBufferOffset);

  return {
    responseBuffer,
    responseNonce,
    clientNonce,
    salt,
  };
}

export default continueClientSaslSession;

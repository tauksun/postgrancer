function continueClientSaslSession(data: Buffer): {
  error?: string;
  responseBuffer?: Buffer;
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
  for (let i = offset; i < receivedMessageLength; i++) {
    const byte = data.readInt8(i);
    const char = String.fromCharCode(byte);
    saslMechanismData += char;
  }

  ////////////////////////////////////////
  ////////////////////////////////////////
  ////////////////////////////////////////
  console.log({
    firstChar,
    receivedMessageLength,
    authenticationMechanism,
    initialResponseLength,
    saslMechanismData,
  });
  ////////////////////////////////////////
  ////////////////////////////////////////
  ////////////////////////////////////////

  // Response
  const responseLength = 0;
  responseBuffer = Buffer.allocUnsafe(responseLength);

  return {
    responseBuffer,
  };
}

export default continueClientSaslSession;

import constants from "../../constants";
import isValidDB from "./is-valid-db";
import isValidUser from "./is-valid-user";

function initiateClientAuthSession(data: Buffer): {
  error?: string;
  responseBuffer?: Buffer;
} {
  let responseBuffer = null;
  // Verify Startup Packet
  let offset = 0;
  const startUpPacketLength = data.readInt32BE(offset);
  offset += 4;
  const protocol = data.readInt32BE(offset);
  offset += 4;

  // Validate Protocol Version
  if (protocol !== constants.protocol) {
    // TODO: Check for different versions of ORM & in different languages
    // return {
    //   error: "Protocol does not match",
    // };
  }

  let startUpMessageData = "";
  for (let i = offset; i < startUpPacketLength; i++) {
    const byte = data.readInt8(i);
    const char = String.fromCharCode(byte);
    startUpMessageData += char;
  }

  // Extract data
  let user = "";
  let database = "";
  let clientEncoding = "";

  let word = "";
  let stateIdentifier = "";
  for (let char = 0; char < startUpMessageData.length; char++) {
    const messageChar = startUpMessageData[char];
    if (messageChar === "\x00") {
      if (stateIdentifier) {
        switch (stateIdentifier) {
          case "user":
            user = word;
            break;

          case "database":
            database = word;
            break;

          case "client_encoding":
            clientEncoding = word;
            break;
          default:
            break;
        }
        stateIdentifier = "";
      } else {
        stateIdentifier = word;
      }
      word = "";
    } else {
      word += messageChar;
    }
  }

  // Validate User, Database
  // Default Database equals to User
  if (user && !isValidUser(user)) {
    return {
      error: user ? "Invalid User" : "No database user",
    };
  }

  if (database) {
    if (!isValidDB(database)) {
      return {
        error: "Invalid database",
      };
    }
  } else {
    database = user;
  }

  // Response
  const saslAuthenticationMechanism = "SCRAM-SHA-256\0\0";

  // Message type (1) + length of message (4)
  // + identifier (4) + mechanism name string
  const responseMessageLength =
    1 + 4 + 4 + Buffer.byteLength(saslAuthenticationMechanism);

  let responseOffset = 0;
  responseBuffer = Buffer.allocUnsafe(responseMessageLength);
  responseBuffer.write("R", responseOffset);
  responseOffset += 1;
  responseBuffer.writeInt32BE(responseMessageLength - 1, responseOffset);
  responseOffset += 4;
  responseBuffer.writeInt32BE(10, responseOffset);
  responseOffset += 4;
  responseBuffer.write(saslAuthenticationMechanism, responseOffset);

  return {
    responseBuffer,
  };
}

export default initiateClientAuthSession;

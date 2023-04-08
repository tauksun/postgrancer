import constants from "../../constants";

function initiateAuthSession(): Buffer {
  // User & Database configuration
  const database: string = constants.dbName;
  const user: string = constants.dbUser;
  const client_encoding: string = constants.client_encoding;

  const startupMessageString: string = `user\0${user}\0database\0${database}\0client_encoding\0${client_encoding}\0\0`;

  const startupMessageBuffer: Buffer = Buffer.from(startupMessageString);
  const startupMessageBufferLength: number = startupMessageBuffer.byteLength;

  // Int32 (4 - Length of message) + Int32(196608) (4) + String (startup message string)
  const authBufferLength: number = 4 + 4 + startupMessageBufferLength;

  // Initialize Buffer
  let authInitialBuffer: Buffer = Buffer.allocUnsafe(authBufferLength);
  authInitialBuffer.writeInt32BE(4 + 4 + startupMessageBufferLength, 0);
  authInitialBuffer.writeInt32BE(196608, 4);
  authInitialBuffer.write(startupMessageString, 8);

  return authInitialBuffer;
}

export default initiateAuthSession;

import { session } from "../../database/session";

function additionalDatabaseMetaData(): {
  data: Buffer[];
} {
  const { databaseMetaData } = session;

  // Additional Parameters
  const additionalParameters = {
    client_encoding: databaseMetaData["client_encoding"],
    server_encoding: databaseMetaData["server_encoding"],
    Timezone: databaseMetaData["Timezone"],
    server_version: databaseMetaData["server_version"],
    DateStyle: databaseMetaData["DateStyle"],
  };

  const additionalParametersBuffers: Buffer[] = [];
  Object.entries(additionalParameters).forEach(([key, value]) => {
    if (value) {
      const message = `${key}\x00${value}\x00`;
      const messageLength = Buffer.byteLength(message);
      // Message Type Byte + Message Length (4 Bytes) + Message
      const messageBuffer = Buffer.allocUnsafe(1 + 4 + messageLength);

      // Parameter Status Code : S
      let offset = 0;
      messageBuffer.write("S");
      offset++;
      messageBuffer.writeInt32BE(4 + messageLength, offset);
      offset += 4;
      messageBuffer.write(message, offset);

      additionalParametersBuffers.push(messageBuffer);
    }
  });

  return {
    data: additionalParametersBuffers,
  };
}

export default additionalDatabaseMetaData;

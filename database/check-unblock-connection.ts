import { IpostgranceDBSocket } from "./interface";

function checkAndUnblock(params: {
  data: Buffer;
  dbConnection: IpostgranceDBSocket;
}) {
  const { data, dbConnection } = params;


  // Parse Backend message
  const commandTypes: string[] = [];
  const parseDatabaseMessage = (
    message: Buffer
  ): {
    parsed: boolean;
    dataInNextChunk: boolean;
    currentRemaningMessage: Buffer;
  } => {
    const firstByte = message.readInt8(0);
    const firstChar = String.fromCharCode(firstByte);

    commandTypes.push(firstChar);
    const lengthOfMessage = message.readInt32BE(1);

    // This signifies there is more data for this messageType
    // It will be sent from database in next buffer chunk
    if (message.byteLength < lengthOfMessage) {
      return {
        parsed: false,
        dataInNextChunk: true,
        currentRemaningMessage: message,
      };
    }

    // Total length of message data -
    // (length of identified message) -
    // (message type byte of identified message,
    // as this is not counted in length of message (Int32))
    const identifiedMessageLength = lengthOfMessage + 1;
    const remaningMessageLength = message.byteLength - identifiedMessageLength;

    const remaningMessage = Buffer.allocUnsafe(remaningMessageLength);

    for (let i = identifiedMessageLength; i < message.byteLength; i++) {
      const byte = message.readInt8(i);
      remaningMessage.writeInt8(byte, i - identifiedMessageLength);
    }

    // Recursively parse & extract different messages from DB
    if (!(remaningMessage.byteLength == 0)) {
      dbConnection.previousBuffer = null;
      return parseDatabaseMessage(remaningMessage);
    }
    return {
      parsed: true,
      dataInNextChunk: false,
      currentRemaningMessage: remaningMessage,
    };
  };

  let databaseMessage;
  if (dbConnection.previousBuffer) {
    const previousBuffer = dbConnection.previousBuffer;
    databaseMessage = Buffer.concat([previousBuffer, data]);
  } else {
    databaseMessage = data;
  }

  const parseDatabaseMessageResult = parseDatabaseMessage(databaseMessage);
  const { parsed, dataInNextChunk, currentRemaningMessage } =
    parseDatabaseMessageResult;
  if (!parsed && dataInNextChunk) {
    dbConnection.previousBuffer = currentRemaningMessage;
  }


  const isReadyForQuery = commandTypes.includes("Z");
  const commandComplete = commandTypes.includes("C");
  const closeComplete = commandTypes.includes("3");
  const emptyQueryResponse = commandTypes.includes("I");
  const errorResponse = commandTypes.includes("E");
  const functionCallResponse = commandTypes.includes("V");
  const noData = commandTypes.includes("n");
  const clientSocketConnection =
    dbConnection._postgrancerDBConnectionData &&
    dbConnection._postgrancerDBConnectionData?.clientSocketConnection;

  const isExtendedQuery = clientSocketConnection?.isExtendedQuery;

  if (!isExtendedQuery) {
    if (
      isReadyForQuery ||
      commandComplete ||
      closeComplete ||
      emptyQueryResponse ||
      errorResponse ||
      functionCallResponse ||
      noData
    ) {
      dbConnection.locked = false;
    }
  } else {
    if (
      closeComplete ||
      commandComplete ||
      errorResponse ||
      noData ||
      emptyQueryResponse
    ) {
      dbConnection.locked = false;
    }
  }
}

export default checkAndUnblock;

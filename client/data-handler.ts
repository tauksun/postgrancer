import {
  initiateClientAuthSession,
  continueClientSaslSession,
  finalClientSaslSession,
} from "../authentication";
import clearSession from "./clear-session";
import { IdbPoolType, IpostgranceClientSocket } from "./interface";
import session from "./session";
import {
  identifier,
  isSelectStatment,
  messageParser,
  readyForQueryMessageBuffer,
} from "../query-handler";
import getDatabaseConnection from "./getDatabaseConnection";
import constants from "../constants";
import log from "./logger";

function destroyAndClearSocket(socket: IpostgranceClientSocket) {
  socket.destroy();
  clearSession(socket);
}

async function dataHandler(data: Buffer, socket: IpostgranceClientSocket) {
  const socketId = socket.auth?.id;
  const socketSession = socketId && session[socketId];
  const isAuthenticated = socket.auth?.isAuthenticated;
  if (!socketId || !socketSession) {
    return destroyAndClearSocket(socket);
  }

  if (!isAuthenticated) {
    const stage = socket.auth?.stage;
    switch (stage) {
      case 0:
        // Parse Start Up Packet
        // Send Scram as authentication method
        const { error = null, responseBuffer = "" } =
          initiateClientAuthSession(data);
        if (error) {
          return destroyAndClearSocket(socket);
        }
        socket.write(responseBuffer);
        if (socket.auth) {
          socket.auth.stage++;
        }
        return;

      case 1:
        // Parse Initital Sasl Message
        // Send Sasl Continue Message
        const {
          error: errorContinue = null,
          responseBuffer: responseBufferContinue = "",
          responseNonce: responseNonceContinue,
          clientNonce: clientNonceContinue,
          salt: saltContinue,
        } = continueClientSaslSession(data);

        if (errorContinue) {
          return destroyAndClearSocket(socket);
        }

        socket.write(responseBufferContinue);

        if (socket.auth) {
          socket.auth.stage++;
          socket.auth.responseNonceContinue = responseNonceContinue;
          socket.auth.saltContinue = saltContinue;
          socket.auth.clientNonceContinue = clientNonceContinue;
        }
        return;

      case 2:
        // Parse client message
        // Verify password
        // Send Sasl Final Message
        const responseNonceFromContinueStage =
          socket.auth?.responseNonceContinue || "";
        const saltFromContinueStage = socket.auth?.saltContinue || "";
        const clientNonceFromContinueStage =
          socket.auth?.clientNonceContinue || "";

        const {
          error: errorFinal = null,
          responseBuffer: responseBufferFinal = "",
        } = finalClientSaslSession(
          data,
          responseNonceFromContinueStage,
          clientNonceFromContinueStage,
          saltFromContinueStage
        );

        if (errorFinal) {
          return destroyAndClearSocket(socket);
        }
        socket.write(responseBufferFinal);
        if (socket.auth) {
          socket.auth.stage++;
          socket.auth.isAuthenticated = true;
        }
        //Send ready for query message
        const readyForQueryBuffer = readyForQueryMessageBuffer();
        socket.write(readyForQueryBuffer);
        return;

      default:
        return destroyAndClearSocket(socket);
    }
  }

  // Parse data
  // & pass to relevant dbConnection
  // (new / previous - depending on client message)
  const messageType = identifier({ data });
  console.log({ strData: data.toString(), messageType });

  let dbPoolType: IdbPoolType = "primary";
  const extendedQueryCommands: string[] = [
    "bindCommand",
    "execute",
    "sync",
    "describe",
  ];

  if (messageType === "parseCommand") {
    socket.isExtendedQuery = true;
    // Unlock dbConnection
    // This unlocks previous dbConnection in case of
    // more parse/bind commands follow through same socket
    if (socket.previousCommandDbConnection) {
      socket.previousCommandDbConnection.locked = false;
    }
  } else if (
    socket.isExtendedQuery &&
    !extendedQueryCommands.includes(messageType)
  ) {
    // This marks isExtendedQuery as false when
    // a command other than extended query related command follows
    // the socket connection.

    // This ensures that client can send multiple bind statements
    // after a parse statement which keeps the isExtendedQuery as true
    socket.isExtendedQuery = false;
    // Un-lock dbConnection
    if (socket.previousCommandDbConnection) {
      socket.previousCommandDbConnection.locked = false;
    }
    socket.previousCommandDbConnection = null;
  }

  if (["simpleQuery", "parseCommand"].includes(messageType)) {
    // Parse Message > for select type statement > set dbPoolType to replica
    // For a parseCommand message > for select type statement > set...
    // ...dbPoolType to replica
    // Following bind message after a parseCommand message must go to...
    // ...same db socket connection (which parseCommand message was sent to)
    const parsedMessageResult = await messageParser(data);
    const parsedMessageData = parsedMessageResult.data;

    // Is-A-Select-Query
    const isSelect = isSelectStatment(parsedMessageData);
    if (isSelect) {
      dbPoolType = "replica";
    }
  }

  // Fetch dbConnection from selected pool
  // Set clientSocketConnection on fetched dbConnection
  let dbConnection = null;
  if (messageType === "terminate") {
    destroyAndClearSocket(socket);
    return;
  }

  if (socket.isExtendedQuery && extendedQueryCommands.includes(messageType)) {
    // Following bind/execute/sync message after a parseCommand message
    // must go to same dbConnection (which parseCommand message was sent to)

    let dbConnection = null;
    const commandData = data;
    const attachSameConnection = () => {
      dbConnection = socket.previousCommandDbConnection;
      if (dbConnection) {
        dbConnection.write(commandData);
      } else {
        setTimeout(attachSameConnection);
      }
    };
    setTimeout(attachSameConnection);
  } else {
    // Statement Arrival Timestamp
    const arrivalTimestamp: number = new Date().getTime();
    socket.arrivalTimestamp = arrivalTimestamp;

    const fetchAndWriteToDbConnection = (params: {
      socket: IpostgranceClientSocket;
      dbPoolType: IdbPoolType;
      dbConnection: any;
    }) => {
      const { socket, dbPoolType } = params;
      let { dbConnection } = params;
      // Dequeue request after 'n' secs (set by environment variables)
      // Dequeue if request takes more than 'n' secs & is in
      // setTimeout queue trying to get dbConnection
      const now = new Date().getTime();
      const dequeue_request_time_in_milliseconds =
        constants.dequeue_request_time * 1000;
      if (!socket.arrivalTimestamp) {
        if (socket.timeoutQueueID) {
          clearTimeout(socket.timeoutQueueID);
        }
        return destroyAndClearSocket(socket);
      }
      if (
        now - socket.arrivalTimestamp >
        dequeue_request_time_in_milliseconds
      ) {
        if (socket.timeoutQueueID) {
          clearTimeout(socket.timeoutQueueID);
          return destroyAndClearSocket(socket);
        }
      }

      // Fetching a new connection //
      dbConnection = getDatabaseConnection({ type: dbPoolType });

      if (dbConnection) {
        socket.prevDbId = dbConnection.id;
        if (messageType === "parseCommand") {
          socket.previousCommandDbConnection = dbConnection;
        }
        if (dbConnection._postgrancerDBConnectionData) {
          dbConnection._postgrancerDBConnectionData.clientSocketConnection =
            socket;
        }
        // Lock this dbConnection to not be used by other socket queries
        dbConnection.locked = true;
        log({ data, dbPoolType });
        dbConnection.lockedAt = new Date().getTime();
        dbConnection.write(data);
      } else {
        console.log("**********----------------************");
        console.log("Not found dbConnection __ timing out ");
        console.log({ messageType });
        console.log("*********----------------*************");
        const timeoutId = setTimeout(() => {
          fetchAndWriteToDbConnection({
            socket,
            dbPoolType,
            dbConnection,
          });
        });
        socket.timeoutQueueID = timeoutId;
      }
    };
    fetchAndWriteToDbConnection({
      socket,
      dbPoolType,
      dbConnection,
    });
  }
}

export default dataHandler;

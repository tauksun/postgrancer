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
    const extendedQueryWaitingTimeInSeconds = 3;
    // Based on extended query start timestamp
    // if query doesn't complete within 3 seconds
    // (extendedQueryWaitingTimeInSeconds):
    // 1. terminate this socket connection
    // 2. unblock dbConnection  & reset
    socket.extendedQueryTimestamp = new Date().getTime();
    const checkExtendedQuery = () => {
      setTimeout(() => {
        if (!socket) {
          return;
        }
        const isExtendedQuery = socket.isExtendedQuery;
        const extendedQueryTimestamp = socket.extendedQueryTimestamp;
        const now = new Date().getTime();
        if (!extendedQueryTimestamp) {
          return destroyAndClearSocket(socket);
        }
        if (isExtendedQuery) {
          if (
            now - extendedQueryTimestamp >
            extendedQueryWaitingTimeInSeconds * 1000
          ) {
            // Terminate this socket
            destroyAndClearSocket(socket);
          } else {
            // For multiple binds statements following parse statement
            checkExtendedQuery();
          }
        }
      }, extendedQueryWaitingTimeInSeconds * 1000);
    };
    checkExtendedQuery();
  } else if (!extendedQueryCommands.includes(messageType)) {
    // This marks isExtendedQuery as false when
    // a command other than extended query related command follows
    // the socket connection.

    // This ensures that client can send multiple bind statements
    // after a parse statement which keeps the isExtendedQuery as true
    socket.isExtendedQuery = false;
    socket.parseCommandDbConnection = null;

    // Un-lock dbConnection
    //
    //
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

    if (messageType === "bindCommand") {
      // This increases the time for a extended query
      // if the client issues mulitple bind statement
      // after a parse command
      // This helps in clearing socket & unblocking
      // dbConnection incase of a incomplete extended query
      // after extendedQueryWaitingTimeInSeconds time
      socket.extendedQueryTimestamp = new Date().getTime();
    }

    let dbConnection = null;
    const commandData = data;
    const attachSameConnection = () => {
      dbConnection = socket.parseCommandDbConnection;
      if (dbConnection) {
        dbConnection.write(commandData);
      } else {
        setTimeout(attachSameConnection);
      }
    };
    setTimeout(attachSameConnection);
  } else {
    //
    const fetchAndWriteToDbConnection = (params: {
      socket: IpostgranceClientSocket;
      dbPoolType: IdbPoolType;
      dbConnection: any;
    }) => {
      const { socket, dbPoolType } = params;
      let { dbConnection } = params;
      // Fetching a new connection //
      dbConnection = getDatabaseConnection({ type: dbPoolType });

      if (dbConnection) {
        socket.prevDbId = dbConnection.id;
        // Store dbConnection used for parseCommand, as it is
        // to be used for bindCommand
        if (messageType === "parseCommand") {
          socket.parseCommandDbConnection = dbConnection;
        }
        if (dbConnection._postgrancerDBConnectionData) {
          dbConnection._postgrancerDBConnectionData.clientSocketConnection =
            socket;
        }
        // Lock this dbConnection to not be used by other socket queries
        dbConnection.locked = true;
        dbConnection.write(data);
      } else {
        console.log("**********----------------************");
        console.log("Not found dbConnection __ timing out ");
        console.log({ messageType });
        console.log("*********----------------*************");
        setTimeout(() => {
          fetchAndWriteToDbConnection({
            socket,
            dbPoolType,
            dbConnection,
          });
        });
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

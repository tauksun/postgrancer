import {
  initiateClientAuthSession,
  continueClientSaslSession,
  finalClientSaslSession,
} from "../authentication";
import clearSession from "./clear-session";
import { IpostgranceClientSocket } from "./interface";
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

  let dbPoolType: "primary" | "replica" = "primary";

  if (["simpleQuery", "parseCommand"].includes(messageType)) {
    // Parse Message > for select type statement > set dbPoolType to replica
    // For a parseCommand message > for select type statement > set...
    // ...dbPoolType to replica
    // Following bind message after a parseCommand message must go to...
    // ...same db (which parseCommand message was sent to)
    const parsedMessageResult = await messageParser(data);
    const parsedMessageData = parsedMessageResult.data;

    ///////////////////////////////////////////
    ///////////////////////////////////////////
    console.log({
      data,
      strData: data.toString(),
      parsedMessageResult: JSON.stringify(parsedMessageResult),
      parsedMessageData: JSON.stringify(parsedMessageData),
    });
    ///////////////////////////////////////////
    ///////////////////////////////////////////

    // Is-A-Select-Query
    const isSelect = isSelectStatment(parsedMessageData);
    if (isSelect) {
      dbPoolType = "replica";
    }

    ///////////////////////////////////////////
    ///////////////////////////////////////////
    console.log({
      isSelect,
    });
    ///////////////////////////////////////////
    ///////////////////////////////////////////
  }

  // Fetch dbConnection from selected pool
  // Set clientSocketConnection on fetched dbConnection
  let dbConnection = null;
  if (messageType === "terminate") {
    return;
  } else if (messageType === "bindCommand") {
    // Following bind message after a parseCommand message must go to...
    // ...same db (which parseCommand message was sent to)
    // //////////////////////////////////////
    // //////////////////////////////////////
    console.log("\n\n\n----- Using same db as used by parse command -----");
    console.log(" => prevDbId : ", socket.prevDbId);
    console.log("------------------------------ \n\n\n");
    // //////////////////////////////////////
    // //////////////////////////////////////
    // //////////////////////////////////////
    const dbId = socket.prevDbId;
    if (!dbId) {
      return destroyAndClearSocket(socket);
    } else {
      dbConnection = getDatabaseConnection({ id: dbId });
    }
  } else {
    // Fetching a new connection //
    if (dbPoolType === "primary") {
      // Fetch from primary connection pool
      console.log("//...........................................//");
      console.log("=== > Fetching from  : ", { dbPoolType }, " < ===");
      console.log("//...........................................//");
      dbConnection = getDatabaseConnection({ type: "primary" });
    } else if (dbPoolType === "replica") {
      // Fetch from replica connection pool
      console.log("//...........................................//");
      console.log("=== > Fetching from  : ", { dbPoolType }, " < ===");
      console.log("//...........................................//");
      dbConnection = getDatabaseConnection({ type: "replica" });
    }
  }
  console.log({ idOfDBConnectoin: dbConnection?.id });
  if (dbConnection) {
    socket.prevDbId = dbConnection.id;
    if (dbConnection._postgrancerDBConnectionData) {
      dbConnection._postgrancerDBConnectionData.clientSocketConnection = socket;
    }
    dbConnection.write(data);
  }
}

export default dataHandler;

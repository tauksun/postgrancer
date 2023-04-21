import {
  initiateClientAuthSession,
  continueClientSaslSession,
  finalClientSaslSession,
} from "../authentication";
import clearSession from "./clear-session";
import { IpostgranceClientSocket } from "./interface";
import session from "./session";

function destroyAndClearSocket(socket: IpostgranceClientSocket) {
  socket.destroy();
  clearSession(socket);
}

function dataHandler(data: Buffer, socket: IpostgranceClientSocket) {
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
        return;

      default:
        break;
    }
  }

  // Parse data
  // & pass to relevant dbConnection
  // (new / previous - depending on query)
}

export default dataHandler;

import {
  initiateClientAuthSession,
  continueClientSaslSession,
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
        console.log({
          data,
          strData: data.toString(),
        });
        const {
          error: errorContinue = null,
          responseBuffer: responseBufferContinue = "",
        } = continueClientSaslSession(data);

        //////////////////////////
        //////////////////////////
        //////////////////////////
        console.log({ errorContinue, responseBufferContinue });
        //////////////////////////
        //////////////////////////
        //////////////////////////

        if (socket.auth?.stage) {
          socket.auth.stage++;
        }
        return;

      case 2:
        // Parse frontend continue Sasl Message
        // Check Password
        // Send Sasl Final Message
        if (socket.auth?.stage) {
          socket.auth.stage++;
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

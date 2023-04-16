import { IpostgranceClientSocket } from "./interface";
import session from "./session";

function clearSession(socket: IpostgranceClientSocket) {
  //////////////////////////////////////
  // If exists :  Remove from Session //
  //////////////////////////////////////

  const socketId = socket.auth?.id;
  if (socketId) {
    const isSession = session[socketId];
    if (isSession) {
      delete session[socketId];
    }
  }
}

export default clearSession;

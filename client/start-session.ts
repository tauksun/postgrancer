import { IpostgranceClientSocket } from "./interface";
import session from "./session";
import { v4 } from "uuid";

function startSession(socket: IpostgranceClientSocket) {
  // Socket Unique Id
  const id: string = v4();

  // Socket Connection Authentication Data
  socket.auth = {
    id,
    isAuthenticated: false,
    stage: 0,
  };

  // Create Session
  session[id] = socket;
}

export default startSession;

import { IpostgranceClientSocket } from "./interface";

const session: {
  [key: string]: IpostgranceClientSocket;
} = {};

export default session;

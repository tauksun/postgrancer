import { Socket } from "net";

interface auth {
  id?: string;
  isAuthenticated: boolean;
  /**
   * @description
   * 0 - Authentication not started
   * 1 - Already received startup packet from client, Parse client nonce
   * 2 - Already received initial sasl message, Parse & check password
   * 3 - Sent final sasl message
   */
  stage: number;
}

interface IpostgranceClientSocket extends Socket {
  auth?: auth;
}

export { IpostgranceClientSocket };

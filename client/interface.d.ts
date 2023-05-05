import { Socket } from "net";
import { IpostgranceDBSocket } from "../database/interface";

interface Iauth {
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
  responseNonceContinue?: string;
  clientNonceContinue?: string;
  saltContinue?: string;
}

type IdbPoolType = "primary" | "replica";

type IprevDbId = string;
type IpreviousCommandDbConnection = IpostgranceDBSocket | null;

interface IpostgranceClientSocket extends Socket {
  auth?: Iauth;
  prevDbId?: IprevDbId;
  isExtendedQuery?: boolean;
  extendedQueryTimestamp?: number;
  previousCommandDbConnection?: IpreviousCommandDbConnection;
}

export { IpostgranceClientSocket, IdbPoolType };

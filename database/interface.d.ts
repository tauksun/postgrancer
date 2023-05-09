import { Socket } from "net";
import { IpostgranceClientSocket } from "../client";

type IconnectionType = "primary" | "replica";
type Iid = string;
type IpreviousBuffer = Buffer | null;

interface _IpostgrancerDBConnectionData {
  clientNonce?: string;
  serverSignature?: string;
  clientSocketConnection?: IpostgranceClientSocket;
}

interface IpostgranceDBSocket extends Socket {
  _postgrancerDBConnectionData?: _IpostgrancerDBConnectionData;
  type?: IconnectionType;
  id?: Iid;
  locked?: boolean;
  previousBuffer?: IpreviousBuffer;
  lockedAt?: number;
  lastWriteAt?: number;
}

export { IpostgranceDBSocket, _IpostgrancerDBConnectionData, IconnectionType };

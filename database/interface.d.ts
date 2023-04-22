import { Socket } from "net";

type IconnectionType = "primary" | "replica";
type Iid = string;

interface _IpostgrancerDBConnectionData {
  clientNonce?: string;
  serverSignature?: string;
  clientSocketConnection?: Socket;
}

interface IpostgranceDBSocket extends Socket {
  _postgrancerDBConnectionData?: _IpostgrancerDBConnectionData;
  type?: IconnectionType;
  id?: Iid;
}

export { IpostgranceDBSocket, _IpostgrancerDBConnectionData };

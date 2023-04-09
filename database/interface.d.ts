import { Socket } from "net";

interface _IpostgrancerDBConnectionData {
  clientNonce?: string;
  serverSignature?: string;
}

interface IpostgranceDBSocket extends Socket {
  _postgrancerDBConnectionData?: _IpostgrancerDBConnectionData;
}

export { IpostgranceDBSocket, _IpostgrancerDBConnectionData };

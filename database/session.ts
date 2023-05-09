import { IpostgranceDBSocket } from "./interface";

// Use as circular queue //
// Before fetching the connection from connectionPool
// increase the value of current & if it exceeds the length of
// connectionPool, then set it to 0 & start going round again
const sessionById: {
  [id: string]: {
    current: number;
    connectionPool: IpostgranceDBSocket[];
    maxConnections: number;
  };
} = {};

// Fetch the id from session to get the connection with db
// from sessionById
const session: {
  primary: string;
  replicas: {
    current: number;
    machinePool: string[];
  };
} = {
  primary: "",
  replicas: {
    current: 0,
    machinePool: [],
  },
};

export { session, sessionById };

// Primary DB
const primaryDatabaseConnectionPool = 20;

// Replicas DB
const replicaConnectionPoolValue = 20;
const replicaDatabaseConnectionPool = (params: {
  numberOfReplicas: number;
}): number[] => {
  const defaultPool: number[] = [];
  const defaultReplicaPoolValue = replicaConnectionPoolValue;
  for (let i = 0; i < params.numberOfReplicas; i++) {
    defaultPool.push(defaultReplicaPoolValue);
  }
  return defaultPool;
};

const client_encoding: string = "utf8";

// Client Server
const clientServerPort = 9876;
const clientServerHost = "localhost";

const defaults = {
  primaryDatabaseConnectionPool,
  replicaDatabaseConnectionPool,
  client_encoding,
  clientServerPort,
  clientServerHost,
};

export default defaults;

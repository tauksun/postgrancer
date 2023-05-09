// Postgres Protocol
const protocol = 196608;
const scramIterations = 4096;

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

// Dequeue Request Time
const dequeue_request_time = 3;

// logger
const logger = true;
// Logging frequency (minute/hour/day) : Creates new log file
// as set by frequency, defaults to hour
const logFrequency = "hour";
const validLogFrequencies = ["minute", "hour", "day"];

// Pool Manager
const maxDbConnectionLockTime = 10;
const maxLastWroteTime = 3;
const poolManagerLoopTime = 10;

const defaults = {
  protocol,
  scramIterations,
  primaryDatabaseConnectionPool,
  replicaDatabaseConnectionPool,
  client_encoding,
  clientServerPort,
  clientServerHost,
  dequeue_request_time,
  logger,
  logFrequency,
  validLogFrequencies,
  maxDbConnectionLockTime,
  maxLastWroteTime,
  poolManagerLoopTime,
};

export default defaults;

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

// Watch Dog
// Time (seconds) interval to check for database health
const watchDogLoopTime = 5;
// Time (seconds) before promoting or removing replica
const watchDogWaitTime = 15;

// Primary Failover
const enableFailover: boolean = false;
const replicaPromotionHost: string | null = null;
const replicaPromotionPort: number | null = null;

const sendFailoverInformation: boolean = false;
const failoverInformationEndpoint: string | null = null;

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
  watchDogLoopTime,
  watchDogWaitTime,
  enableFailover,
  replicaPromotionHost,
  replicaPromotionPort,
  sendFailoverInformation,
  failoverInformationEndpoint,
};

export default defaults;

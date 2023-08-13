import envLoader from "./environment-loader";
import defaults from "./defaults";

// Load Environment
const pathToEnvironmentVariables: string = "./.postgrancer.conf";
envLoader({ path: pathToEnvironmentVariables });

// Constants
const environmentVariables = process.env;
const version: string | undefined = environmentVariables.version;
const protocol: number =
  (environmentVariables.protocol && parseInt(environmentVariables.protocol)) ||
  defaults.protocol;
const scramIterations: number =
  (environmentVariables.scramIterations &&
    parseInt(environmentVariables.scramIterations)) ||
  defaults.scramIterations;

// Primary
const primaryDatabaseHost: string =
  environmentVariables.primaryDatabaseHost || "";
const primaryDatabasePort: number = parseInt(
  environmentVariables.primaryDatabasePort || ""
);
const primaryDatabaseConnectionPool: number =
  parseInt(environmentVariables.primaryDatabaseConnectionPool || "") ||
  defaults.primaryDatabaseConnectionPool;

// Replicas
const replicas: string = environmentVariables.replicaDatabaseHosts || "";
const replicaDatabaseHosts: string[] = (replicas && replicas.split(",")) || [];
const replicaPorts: string = environmentVariables.replicaDatabasePorts || "";
const replicaDatabasePorts: number[] =
  (replicaPorts && replicaPorts.split(",").map((ele) => parseInt(ele))) || [];
const replicasPool: string =
  environmentVariables.replicaDatabaseConnectionPool || "";
const replicaDatabaseConnectionPool: number[] =
  (replicasPool && replicasPool.split(",").map((ele) => parseInt(ele))) ||
  defaults.replicaDatabaseConnectionPool({
    numberOfReplicas: replicaDatabaseHosts.length,
  });

// Database Configuration & Credentials
const dbName: string = environmentVariables.dbName || "";
const dbUser: string = environmentVariables.dbUser || "";
const dbPassword: string = environmentVariables.dbPassword || "";
const client_encoding: string =
  environmentVariables.client_encoding || defaults.client_encoding;

// Client Server Configuration
const clientServerPort: number = environmentVariables.clientServerPort
  ? parseInt(environmentVariables.clientServerPort)
  : defaults.clientServerPort;
const clientServerHost: string =
  environmentVariables.clientServerHost || defaults.clientServerHost;

// Dequeue Request Time
const dequeue_request_time: number = environmentVariables.dequeue_request_time
  ? parseInt(environmentVariables.dequeue_request_time)
  : defaults.dequeue_request_time;

// logger
const logger = environmentVariables.logger == "false" ? false : defaults.logger;
// Logging frequency (minute/hour/day)
const validLogFrequencies = defaults.validLogFrequencies;
const logFrequency = validLogFrequencies.includes(
  environmentVariables.logFrequency || ""
)
  ? environmentVariables.logFrequency
  : defaults.logFrequency;

// Pool Manager
const maxDbConnectionLockTime = environmentVariables.maxDbConnectionLockTime
  ? parseInt(environmentVariables.maxDbConnectionLockTime)
  : defaults.maxDbConnectionLockTime;

const maxLastWroteTime = environmentVariables.maxLastWroteTime
  ? parseInt(environmentVariables.maxLastWroteTime)
  : defaults.maxLastWroteTime;

const poolManagerLoopTime = environmentVariables.poolManagerLoopTime
  ? parseInt(environmentVariables.poolManagerLoopTime)
  : defaults.poolManagerLoopTime;

// Watch Dog
const watchDogLoopTime: number = environmentVariables.watchDogLoopTime
  ? parseInt(environmentVariables.watchDogLoopTime)
  : defaults.watchDogLoopTime;
const watchDogWaitTime: number = environmentVariables.watchDogWaitTime
  ? parseInt(environmentVariables.watchDogWaitTime)
  : defaults.watchDogWaitTime;

// Primary Failover
const enableFailover: boolean =
  environmentVariables.enableFailover === "true"
    ? true
    : defaults.enableFailover;
const replicaPromotionHost: string | null =
  environmentVariables.replicaPromotionHost || defaults.replicaPromotionHost;
const replicaPromotionPort: number | null =
  environmentVariables.replicaPromotionPort
    ? parseInt(environmentVariables.replicaPromotionPort)
    : defaults.replicaPromotionPort;

const sendFailoverInformation: boolean =
  environmentVariables.sendFailoverInformation === "true"
    ? true
    : defaults.sendFailoverInformation;
const failoverInformationEndpoint: string | null =
  environmentVariables.failoverInformationEndpoint ||
  defaults.failoverInformationEndpoint;

// SSL
const enableSSL: boolean =
  environmentVariables.enableSSL === "true" ? true : defaults.enableSSL;
const postgresSSLIdentifier: number = environmentVariables.postgresSSLIdentifier
  ? parseInt(environmentVariables.postgresSSLIdentifier)
  : defaults.postgresSSLIdentifier;

function validateEnvs() {
  // 1. Promiting replica configuration  must
  // match the configuration from the replicas
  if (enableFailover) {
    if (!replicaPromotionHost) {
      throw "No replicaPromotionHost configured.";
    }
    if (!replicaPromotionPort) {
      throw "No replicaPromotionPort configured.";
    }
    const isHostPresent = replicaDatabaseHosts.includes(replicaPromotionHost);
    const isPortPresent = replicaDatabasePorts.includes(replicaPromotionPort);
    if (!isHostPresent) {
      throw "replicaPromotionHost is not present in replicas.";
    }

    if (!isPortPresent) {
      throw "replicaPromotionPort is not present in replica ports.";
    }
  }

  // 2. If sendFailoverInformation is true,
  // failoverInformationEndpoint must be configured
  if (sendFailoverInformation) {
    if (!failoverInformationEndpoint) {
      throw "No failoverInformationEndpoint is configured.";
    }
  }
}

validateEnvs();

const constants = {
  version,
  protocol,
  scramIterations,
  primaryDatabaseHost,
  primaryDatabasePort,
  primaryDatabaseConnectionPool,
  replicaDatabaseHosts,
  replicaDatabasePorts,
  replicaDatabaseConnectionPool,
  dbName,
  dbUser,
  dbPassword,
  client_encoding,
  clientServerPort,
  clientServerHost,
  dequeue_request_time,
  logger,
  logFrequency,
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
  enableSSL,
  postgresSSLIdentifier,
};

export default constants;

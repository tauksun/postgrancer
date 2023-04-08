import envLoader from "./environment-loader";
import defaults from "./defaults";

// Load Environment
const pathToEnvironmentVariables: string = "./.postgrancer.conf";
envLoader({ path: pathToEnvironmentVariables });

// Constants
const environmentVariables = process.env;
const version: string | undefined = environmentVariables.version;

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

const constants = {
  version,
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
};

export default constants;

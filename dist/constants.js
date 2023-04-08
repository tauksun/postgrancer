"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const environment_loader_1 = __importDefault(require("./environment-loader"));
const defaults_1 = __importDefault(require("./defaults"));
// Load Environment
const pathToEnvironmentVariables = "./.postgrancer.conf";
(0, environment_loader_1.default)({ path: pathToEnvironmentVariables });
// Constants
const environmentVariables = process.env;
const version = environmentVariables.version;
// Primary
const primaryDatabaseHost = environmentVariables.primaryDatabaseHost || "";
const primaryDatabasePort = parseInt(environmentVariables.primaryDatabasePort || "");
const primaryDatabaseConnectionPool = parseInt(environmentVariables.primaryDatabaseConnectionPool || "") ||
    defaults_1.default.primaryDatabaseConnectionPool;
// Replicas
const replicas = environmentVariables.replicaDatabaseHosts || "";
const replicaDatabaseHosts = (replicas && replicas.split(",")) || [];
const replicaPorts = environmentVariables.replicaDatabasePorts || "";
const replicaDatabasePorts = (replicaPorts && replicaPorts.split(",").map((ele) => parseInt(ele))) || [];
const replicasPool = environmentVariables.replicaDatabaseConnectionPool || "";
const replicaDatabaseConnectionPool = (replicasPool && replicasPool.split(",").map((ele) => parseInt(ele))) ||
    defaults_1.default.replicaDatabaseConnectionPool({
        numberOfReplicas: replicaDatabaseHosts.length,
    });
// Database Configuration & Credentials
const dbName = environmentVariables.dbName || "";
const dbUser = environmentVariables.dbUser || "";
const dbPassword = environmentVariables.dbPassword || "";
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
};
exports.default = constants;

import connectToDB from "./connect";
import constants from "../constants";
import { v4 } from "uuid";
import { session, sessionById } from "./session";
import { IpostgranceDBSocket } from "./interface";
import poolManager from "./pool-manager";
import watchDog from "./watchdog";

async function establishPrimaryDatabaseConnections() {
  const host = constants.primaryDatabaseHost;
  const port = constants.primaryDatabasePort;

  const primaryId = v4();
  session.primary = primaryId;

  let connectionPool = constants.primaryDatabaseConnectionPool;
  // One connection out of 100 is reserved for watchdog
  connectionPool = connectionPool > 99 ? 99 : connectionPool;
  sessionById[primaryId] = {
    current: 0,
    connectionPool: [],
    maxConnections: connectionPool,
    type: "primary",
    host,
    port,
  };

  for (let i = 0; i < connectionPool; i++) {
    try {
      await connectToDB({
        type: "primary",
        id: primaryId,
        host,
        port,
      });
    } catch (error) {
      //////////////////
      console.log("Error occured while connection to Primary database : ", {
        error,
      });
      //////////////////
    }
  }

  //Watchdog Primary DB Connection

  const watchDogPrimaryConnection: IpostgranceDBSocket = await connectToDB({
    type: "primary",
    id: primaryId,
    host,
    port,
    watchDogConnection: true,
  });

  const now = new Date().getTime();
  session.watchDog.primary = {
    [primaryId]: {
      lastHealthCheckTimestamp: now,
      dbConnection: watchDogPrimaryConnection,
    },
  };
}

async function establishReplicasDatabaseConnections() {
  try {
    const replicaDatabaseHosts = constants.replicaDatabaseHosts;
    const replicaDatabasePorts = constants.replicaDatabasePorts;
    const replicaConnectionPool = constants.replicaDatabaseConnectionPool;
    if (replicaDatabaseHosts.length !== replicaDatabasePorts.length) {
      throw `Number of replica hosts do not match with ports.
    Hosts : ${replicaDatabaseHosts}, 
    Ports : ${replicaDatabasePorts}`;
    }
    for (let i = 0; i < replicaDatabaseHosts.length; i++) {
      const host = replicaDatabaseHosts[i];
      const port = replicaDatabasePorts[i];

      const replicaId = v4();
      session.replicas.machinePool.push(replicaId);
      sessionById[replicaId] = {
        current: 0,
        connectionPool: [],
        maxConnections: replicaConnectionPool[i],
        type: "replica",
        host,
        port,
      };

      let connectionPool = replicaConnectionPool[i];
      // One connection out of 100 is reserved for watchdog
      connectionPool = connectionPool > 99 ? 99 : connectionPool;

      for (let j = 0; j < connectionPool; j++) {
        try {
          await connectToDB({
            type: "replica",
            id: replicaId,
            host,
            port,
          });
        } catch (error) {
          //////////////////
          console.log(
            `Error occured while connection to replica database : ${i} `,
            {
              error,
            }
          );
          //////////////////
        }
      }

      //Watchdog Replica DB Connection

      const watchDogReplicaConnection: IpostgranceDBSocket = await connectToDB({
        type: "replica",
        id: replicaId,
        host,
        port,
        watchDogConnection: true,
      });

      const now = new Date().getTime();
      session.watchDog.replicas = {
        [replicaId]: {
          lastHealthCheckTimestamp: now,
          dbConnection: watchDogReplicaConnection,
          host,
          port,
        },
      };
    }
  } catch (error) {
    console.log("Error : ", error);
    process.exit(1);
  }
}

function establishDatabaseConnections() {
  establishPrimaryDatabaseConnections();
  establishReplicasDatabaseConnections();
  setTimeout(poolManager, 10000);
  setTimeout(watchDog, 10000);
}

export { establishDatabaseConnections };

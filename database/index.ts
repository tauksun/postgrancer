import connectToDB from "./connect";
import constants from "../constants";
import { initiateAuthSession } from "../authentication";
import { v4 } from "uuid";
import { session, sessionById } from "./session";
import { IpostgranceDBSocket } from "./interface";

async function establishPrimaryDatabaseConnections() {
  const host = constants.primaryDatabaseHost;
  const port = constants.primaryDatabasePort;

  const primaryId = v4();
  session.primary = primaryId;
  sessionById[primaryId] = {
    current: 0,
    connectionPool: [],
  };

  const connectionPool = constants.primaryDatabaseConnectionPool;
  for (let i = 0; i < connectionPool; i++) {
    try {
      const primaryConnection: IpostgranceDBSocket = await connectToDB({
        host,
        port,
      });

      primaryConnection.type = "primary";
      primaryConnection.id = primaryId;
      //-----------------------------------------------
      console.log(
        `Sending Intiate Auth Query Primary with id : ${primaryId} ....`
      );
      //-----------------------------------------------
      const authBuffer = initiateAuthSession();
      primaryConnection.write(authBuffer);
    } catch (error) {
      //////////////////
      //////////////////
      //////////////////
      console.log("Error occured while connection to Primary database : ", {
        error,
      });
      //////////////////
      //////////////////
      //////////////////
      //////////////////
    }
  }
}

async function establishReplicasDatabaseConnections() {
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
    };

    for (let j = 0; j < replicaConnectionPool[i]; j++) {
      try {
        const replicaConnection = await connectToDB({ host, port });
        replicaConnection.type = "replica";
        replicaConnection.id = replicaId;
        //-----------------------------------------------
        console.log(
          `Sending Intiate Auth Query Replica : ${i} id : ${replicaId} ....`
        );
        //-----------------------------------------------
        const authBuffer = initiateAuthSession();
        replicaConnection.write(authBuffer);
      } catch (error) {
        //////////////////
        //////////////////
        //////////////////
        console.log(
          `Error occured while connection to replica database : ${i} `,
          {
            error,
          }
        );
        //////////////////
        //////////////////
        //////////////////
        //////////////////
      }
    }
  }
}

function establishDatabaseConnections() {
  establishPrimaryDatabaseConnections();
  establishReplicasDatabaseConnections();
}

export { establishDatabaseConnections };

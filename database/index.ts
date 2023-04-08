import connectToDB from "./connect";
import constants from "../constants";
import { initiateAuthSession } from "../authentication";

async function establishPrimaryDatabaseConnections() {
  const host = constants.primaryDatabaseHost;
  const port = constants.primaryDatabasePort;
  const connectionPool = constants.primaryDatabaseConnectionPool;
  for (let i = 0; i < connectionPool; i++) {
    try {
      const primaryConnection = await connectToDB({
        host,
        port,
      });

      //-----------------------------------------------
      console.log("Sending Intiate Auth Query ....");
      //-----------------------------------------------
      const authBuffer = initiateAuthSession();
      primaryConnection.write(authBuffer);
    } catch (error) {
      //////////////////
      console.log("Error occured while connection to Primary database : ", {
        error,
      });
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
    for (let j = 0; j < replicaConnectionPool[i]; j++) {
      try {
        const replicaConnection = await connectToDB({ host, port });
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
  }
}

function establishDatabaseConnections() {
  establishPrimaryDatabaseConnections();
  // establishReplicasDatabaseConnections();
}

export { establishDatabaseConnections };

import constants from "../constants";
import connectToDB from "./connect";
import { IpostgranceDBSocket } from "./interface";
import { sessionById, session } from "./session";

const { watchDogLoopTime, watchDogWaitTime } = constants;

async function healthCheck(dbConnection: IpostgranceDBSocket, dbType: string) {
  // Health Check Query
  const query = "SELECT 1;";
  const queryLength = Buffer.byteLength(query);
  // 1 (Message Type Identifier) + 4 (Message length)
  // + Query Length + 1 (Terminator)
  const bufferLength = 1 + 4 + queryLength + 1;
  const queryBuffer = Buffer.allocUnsafe(bufferLength);
  let offset = 0;
  queryBuffer.write("Q", offset);
  offset += 1;
  queryBuffer.writeInt32BE(4 + queryLength + 1, offset);
  offset += 4;
  queryBuffer.write(query, offset);
  offset += queryLength;
  queryBuffer.write("\0", offset);
  dbConnection.write(queryBuffer);
}

function promoteReplica(params: { id: string }) {
  const replicas = session.watchDog.replicas;
  const { id } = params;
  const { lastHealthCheckTimestamp, dbConnection } = replicas[id];

  // Promote Replica To Primary
  const promoteQuery = "";
  ////
  //
  //
  // Update in session
  // Replace primary with replica
  // Update the dbConnection.type on each connection in connectionPool

  // Update in WatchDog
  // Replace primary with replica &
  // remove from replicas
}

function removeReplica(params: { id: string }) {
  const { id } = params;
  // Remove from session & watchDog
  delete sessionById[id];
  delete session.watchDog.replicas[id];

  // Remove from MachinePool in session
  const newMachinePool: string[] = [];
  for (let i = 0; i < session.replicas.machinePool.length; i++) {
    if (!(session.replicas.machinePool[i] === id)) {
      newMachinePool.push(session.replicas.machinePool[i]);
    }
  }
  session.replicas.machinePool = newMachinePool;
}

async function watchDog() {
  const primary = session.watchDog.primary;
  const replicas = session.watchDog.replicas;

  // Primary //
  const primaryId = primary && Object.keys(primary)[0];
  const { lastHealthCheckTimestamp, dbConnection: primaryConnection } =
    primary[primaryId];

  const now = new Date().getTime();
  if (now - lastHealthCheckTimestamp > watchDogWaitTime * 1000) {
    // Promote first replica from the list of replicas
    const firstReplicaId = Object.keys(replicas)[0];
    promoteReplica({ id: firstReplicaId });
  } else {
    // Check Health : Primary
    if (
      primaryConnection &&
      true /**
   someother property on  dbConnection 
   which signifies that this is active connection &
   not just a value in a array 
      **/
    ) {
      healthCheck(primaryConnection, "primary");
    } else {
      console.error(
        `No dbConnection found for Primary,
       Retrying : Establishing Primary DB connection...`
      );
      const { host, port } = primaryConnection || {};
      const dbConnection = await connectToDB({
        type: "primary",
        id: primaryId,
        host,
        port,
      });
      if (dbConnection) {
        // Delete & Assign
        delete session.watchDog.primary[primaryId];
        session.watchDog.primary[primaryId] = {
          lastHealthCheckTimestamp,
          dbConnection,
        };
      }
    }
  }

  // Replica //
  const replicaIds = Object.keys(replicas);
  const replicaConnections = Object.values(replicas);
  for (let i = 0; i < replicaIds.length; i++) {
    const { lastHealthCheckTimestamp, dbConnection: replicaConnection } =
      replicaConnections[i];

    const now = new Date().getTime();
    if (now - lastHealthCheckTimestamp > watchDogWaitTime * 1000) {
      removeReplica({ id: replicaIds[i] });
    } else {
      if (
        replicaConnection &&
        true /**
   someother property on  dbConnection 
   which signifies that this is active connection &
   not just a value in a array 
      **/
      ) {
        healthCheck(replicaConnection, `replica-${i + 1}`);
      } else {
        console.error(
          `No dbConnection found for REPLICA-${i + 1}, with replicaId : ${
            replicaIds[i]
          }.\nRetrying : Establishing Primary DB connection...`
        );
        const { host, port } = replicaConnection || {};
        const dbConnection = await connectToDB({
          type: "replica",
          id: replicaIds[i],
          host,
          port,
        });
        if (dbConnection) {
          // Delete & Assign
          delete session.watchDog.replicas[replicaIds[i]];
          session.watchDog.replicas[replicaIds[i]] = {
            lastHealthCheckTimestamp,
            dbConnection,
          };
        }
      }
    }
  }

  // Api Endpoint To Inform

  setTimeout(watchDog, watchDogLoopTime * 1000);
}

export default watchDog;

import constants from "../constants";
import connectToDB from "./connect";
import { IpostgranceDBSocket, IconnectionType } from "./interface";
import { sessionById, session } from "./session";
import { httpRequest, generateQueryBuffer } from "../utils";

const { watchDogLoopTime, watchDogWaitTime } = constants;

let isPromotionInProgress: boolean = false;

async function healthCheck(dbConnection: IpostgranceDBSocket, dbType: string) {
  // Health Check Query
  const query = "SELECT 1;";
  const { queryBuffer } = generateQueryBuffer({ query });
  dbConnection.write(queryBuffer);
}

function promoteReplica() {
  const { enableFailover } = constants;

  if (!enableFailover) {
    console.log("Failover is disabled. Not promoting replica to primary");
    return;
  }

  // Begin Promoting
  isPromotionInProgress = true;
  const { replicaPromotionHost, replicaPromotionPort } = constants;
  // Make Promote Query
  const query = "select pg_promote();";
  const { queryBuffer } = generateQueryBuffer({ query });


  // Fetch Replica configuration
  let replicaIdForPromotion = "";
  const replicas = session.watchDog.replicas;
  Object.entries(replicas).forEach(([key, value]) => {
    const { host, port } = value;
    if (host === replicaPromotionHost && port === replicaPromotionPort) {
      replicaIdForPromotion = key;
    }
  });

  // Promote Replica to Primary
  if (replicaIdForPromotion) {
    const { dbConnection } = replicas[replicaIdForPromotion];
    dbConnection.write(queryBuffer);
  }


  // Update in session
  // Replace primary with replica
  session.primary = replicaIdForPromotion;
  // Update the dbConnection.type on each connection in connectionPool
  const { connectionPool } = sessionById[replicaIdForPromotion];
  for (let i = 0; i < connectionPool.length; i++) {
    const conn = connectionPool[i];
    conn.type = "primary";
  }

  // Remove from replica MachinePool in session
  const newMachinePool: string[] = [];
  for (let i = 0; i < session.replicas.machinePool.length; i++) {
    if (!(session.replicas.machinePool[i] === replicaIdForPromotion)) {
      newMachinePool.push(session.replicas.machinePool[i]);
    }
  }
  session.replicas.machinePool = newMachinePool;


  // Update in WatchDog
  // Replace primary with replica &
  // remove from replicas
  const watchDogPrimaryKey = Object.keys(session.watchDog.primary)[0];
  delete session.watchDog.primary[watchDogPrimaryKey];
  session.watchDog.primary[replicaIdForPromotion] =
    session.watchDog.replicas[replicaIdForPromotion];
  session.watchDog.primary[replicaIdForPromotion].dbConnection.type = "primary";
  delete session.watchDog.replicas[replicaIdForPromotion];

  // Complete Promotion
  isPromotionInProgress = false;
}

function failoverInformation(params: {
  type: IconnectionType;
  host: string;
  port: number;
}) {
  const { sendFailoverInformation, failoverInformationEndpoint } = constants;
  if (!sendFailoverInformation) {
    console.log("Not sending failover information.");
    return;
  }
  // Api Endpoint To Inform
  if (failoverInformationEndpoint) {
    const { type, host, port } = params;
    const data = {
      timestamp: new Date().getTime(),
      failureType: "database failure",
      application: "Postgrancer",
      databaseType: type,
      host,
      port,
    };
    httpRequest({ method: "post", url: failoverInformationEndpoint, data });
  } else {
    console.log("No failoverInformationEndpoint configured.");
  }
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
  if (isPromotionInProgress) {
    console.log(
      "Watchdog is suspended, till replica to primary promotion is completed"
    );
    return;
  }

  const primary = session.watchDog.primary;
  const replicas = session.watchDog.replicas;

  // Primary //
  const primaryId = primary && Object.keys(primary)[0];
  const { lastHealthCheckTimestamp, dbConnection: primaryConnection } =
    primary[primaryId];

  const now = new Date().getTime();
  if (now - lastHealthCheckTimestamp > watchDogWaitTime * 1000) {
    // Send failover information
    failoverInformation({
      type: "primary",
      host: primaryConnection.host || "primary db host",
      port: primaryConnection.port || 0,
    });
    // Promote replica
    promoteReplica();
  } else {
    // Check Health : Primary
    if (primaryConnection && !primaryConnection.error) {
      healthCheck(primaryConnection, "primary");
    } else {
      console.error(
        `No dbConnection found for Primary,
       Retrying : Establishing DB connection...`
      );
      const { host = "", port = 0 } = primaryConnection;
      const dbConnection = await connectToDB({
        type: "primary",
        id: primaryId,
        host,
        port,
        watchDogConnection: true,
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
      // Send failover information
      failoverInformation({
        type: "replica",
        host: replicaConnection.host || `replica ${i} db host`,
        port: replicaConnection.port || 0,
      });
      removeReplica({ id: replicaIds[i] });
    } else {
      if (replicaConnection && !replicaConnection.error) {
        healthCheck(replicaConnection, `replica-${i + 1}`);
      } else {
        console.error(
          `No dbConnection found for REPLICA-${i + 1}, with replicaId : ${
            replicaIds[i]
          }.\nRetrying : Establishing DB connection...`
        );
        const { host = "", port = 0 } = replicaConnection;
        const dbConnection = await connectToDB({
          type: "replica",
          id: replicaIds[i],
          host,
          port,
          watchDogConnection: true,
        });
        if (dbConnection) {
          // Delete & Assign
          delete session.watchDog.replicas[replicaIds[i]];
          session.watchDog.replicas[replicaIds[i]] = {
            lastHealthCheckTimestamp,
            dbConnection,
            host,
            port,
          };
        }
      }
    }
  }

  setTimeout(watchDog, watchDogLoopTime * 1000);
}

export default watchDog;

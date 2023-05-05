import { session, sessionById } from "../database/session";
import { IdbPoolType } from "./interface";
function getDatabaseConnection(params: { type?: IdbPoolType; id?: string }) {
  const connType = params.type;
  const id = params.id || null;

  if (id) {
    const current = sessionById[id].current;
    // Circular Queue //
    if (current + 1 === sessionById[id].connectionPool.length) {
      sessionById[id].current = 0;
    } else {
      sessionById[id].current += 1;
    }
    const connection = sessionById[id].connectionPool[current];
    return connection;
  }

  if (connType === "primary") {
    const primaryId = session.primary;
    // Loop over the connection pool ONCE, if the fetched connection is locked
    // return the first unlocked connection.
    // If all connections are locked, return null
    let connection = null;
    for (let i = 0; i < sessionById[primaryId].connectionPool.length; i++) {
      const current = sessionById[primaryId].current;
      // Circular Queue //
      if (current + 1 === sessionById[primaryId].connectionPool.length) {
        sessionById[primaryId].current = 0;
      } else {
        sessionById[primaryId].current += 1;
      }
      connection = sessionById[primaryId].connectionPool[current];
      if (!connection.locked) {
        break;
      } else {
        connection = null;
      }
    }
    return connection;
  } else if (connType === "replica") {
    // DB Connection
    let connection = null;

    for (let i = 0; i < session.replicas.machinePool.length; i++) {
      const currentReplica = session.replicas.current;
      // Circular Queue //
      if (currentReplica + 1 === session.replicas.machinePool.length) {
        session.replicas.current = 0;
      } else {
        session.replicas.current += 1;
      }

      const currentReplicaId = session.replicas.machinePool[currentReplica];
      for (
        let j = 0;
        j < sessionById[currentReplicaId].connectionPool.length;
        j++
      ) {
        const replicaConnectionPoolCurrent =
          sessionById[currentReplicaId].current;
        // Circular Queue //
        if (
          replicaConnectionPoolCurrent + 1 ===
          sessionById[currentReplicaId].connectionPool.length
        ) {
          sessionById[currentReplicaId].current = 0;
        } else {
          sessionById[currentReplicaId].current += 1;
        }
        connection =
          sessionById[currentReplicaId].connectionPool[
            replicaConnectionPoolCurrent
          ];
        if (!connection.locked) {
          break;
        } else {
          connection = null;
        }
      }

      if (connection && !connection.locked) {
        break;
      }
    }
    return connection;
  }
}

export default getDatabaseConnection;

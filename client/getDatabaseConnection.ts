import { session, sessionById } from "../database/session";
function getDatabaseConnection(params: {
  type?: "primary" | "replica";
  id?: string;
}) {
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
    const current = sessionById[primaryId].current;
    // Circular Queue //
    if (current + 1 === sessionById[primaryId].connectionPool.length) {
      sessionById[primaryId].current = 0;
    } else {
      sessionById[primaryId].current += 1;
    }
    const connection = sessionById[primaryId].connectionPool[current];
    return connection;
  } else if (connType === "replica") {
    const currentReplica = session.replicas.current;
    // Circular Queue //
    if (currentReplica + 1 === session.replicas.machinePool.length) {
      session.replicas.current = 0;
    } else {
      session.replicas.current += 1;
    }
    const currentReplicaId = session.replicas.machinePool[currentReplica];
    const replicaConnectionPoolCurrent = sessionById[currentReplicaId].current;
    // Circular Queue //
    if (
      replicaConnectionPoolCurrent + 1 ===
      sessionById[currentReplica].connectionPool.length
    ) {
      sessionById[currentReplicaId].current = 0;
    } else {
      sessionById[currentReplicaId].current += 1;
    }
    const connection =
      sessionById[currentReplicaId].connectionPool[
        replicaConnectionPoolCurrent
      ];
    return connection;
  }
}

export default getDatabaseConnection;

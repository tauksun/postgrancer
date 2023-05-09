import { clearSession } from "../client";
import constants from "../constants";
import { IpostgranceDBSocket } from "./interface";
import { sessionById } from "./session";

const { maxDbConnectionLockTime, maxLastWroteTime, poolManagerLoopTime } =
  constants;

function destroyAndClearSocket(clientSocket: IpostgranceDBSocket | undefined) {
  if (clientSocket) {
    clientSocket?.destroy();
    clearSession(clientSocket);
  }
}

function reset(params: { dbConnection: IpostgranceDBSocket }) {
  const { dbConnection } = params;

  // Reset
  dbConnection.locked = false;
  dbConnection.previousBuffer = null;
  if (dbConnection._postgrancerDBConnectionData) {
    dbConnection._postgrancerDBConnectionData.clientSocketConnection =
      undefined;
  }
}

async function poolManager() {
  const dbs = Object.values(sessionById);
  for (let i = 0; i < dbs.length; i++) {
    const db = dbs[i];
    const { maxConnections, connectionPool } = db;
    for (let j = 0; j < connectionPool.length; j++) {
      let dbConnection = connectionPool[j];

      if (dbConnection.locked) {
        const now = new Date().getTime();
        const lockedAt = dbConnection.lockedAt;
        const lastWriteAt = dbConnection.lastWriteAt;

        const clientSocket =
          dbConnection._postgrancerDBConnectionData?.clientSocketConnection;

        if (!lockedAt) {
          // Re-connect & destroy client Socket Connection
          destroyAndClearSocket(clientSocket);
          reset({
            dbConnection,
          });
        } else if (now - lockedAt > maxDbConnectionLockTime * 1000) {
          if (!lastWriteAt || now - lastWriteAt > maxLastWroteTime * 1000) {
            // Re-connect & destroy client Socket Connection
            destroyAndClearSocket(clientSocket);
            reset({
              dbConnection,
            });
          }
        }
      }
    }
  }

  setTimeout(poolManager, poolManagerLoopTime * 1000);
}

export default poolManager;

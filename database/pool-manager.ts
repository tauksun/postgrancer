import { clearSession } from "../client";
import constants from "../constants";
import connectToDB from "./connect";
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

function reset(params: { dbConnection: IpostgranceDBSocket | null }) {
  let { dbConnection } = params;

  // Reset > Disconnect from DB
  if (dbConnection) {
    dbConnection.end();
    dbConnection.destroy();
    dbConnection = null;
  }
}

async function poolManager() {
  const databases = Object.entries(sessionById);
  for (let i = 0; i < databases.length; i++) {
    const [dbId, db] = databases[i];
    const { maxConnections, connectionPool, host, port, type } = db;

    // Check & Maintain connections in pool
    // Re-Establish blocked dbConnection
    // Re-Establish dbConnection with ERROR
    for (let j = 0; j < maxConnections; j++) {
      let dbConnection = connectionPool[j];

      // Adds the missing connection to pool
      if (!dbConnection) {
        connectionPool[j] = await connectToDB({
          host,
          port,
          type,
          id: dbId,
          reConnecting: true,
        });
      } else if (dbConnection.locked || dbConnection.error) {
        const now = new Date().getTime();
        const lockedAt = dbConnection.lockedAt;
        const lastWriteAt = dbConnection.lastWriteAt;

        const clientSocket =
          dbConnection._postgrancerDBConnectionData?.clientSocketConnection;

        // Re-Establishes dbConnection on ERROR
        if (dbConnection.error || !lockedAt) {
          // Re-connect & destroy client Socket Connection

          destroyAndClearSocket(clientSocket);
          reset({ dbConnection });
          delete connectionPool[j];
          connectionPool[j] = await connectToDB({
            host,
            port,
            type,
            id: dbId,
            reConnecting: true,
          });
        } else if (now - lockedAt > maxDbConnectionLockTime * 1000) {
          // Re-Establish locked dbConnection
          if (!lastWriteAt || now - lastWriteAt > maxLastWroteTime * 1000) {
            // Re-connect & destroy client Socket Connection
            destroyAndClearSocket(clientSocket);
            reset({ dbConnection });
            delete connectionPool[j];

            connectionPool[j] = await connectToDB({
              host,
              port,
              type,
              id: dbId,
              reConnecting: true,
            });
          }
        }
      }
    }
  }

  setTimeout(poolManager, poolManagerLoopTime * 1000);
}

export default poolManager;

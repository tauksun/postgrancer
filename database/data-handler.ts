import {
  continueSaslSession,
  finalizeSaslSession,
  initiateSaslMechanism,
} from "../authentication";
import { identifier } from "../query-handler";
import checkAndUnblock from "./check-unblock-connection";
import { IpostgranceDBSocket } from "./interface";
import { sessionById } from "./session";

function dataHandler(params: {
  data: Buffer;
  dbConnection: IpostgranceDBSocket;
}) {
  // Identify
  const data = params.data;
  const dbConnection = params.dbConnection;
  const identity = identifier({ data });

  // Call Handler for respective message type
  switch (identity) {
    case "auth":
      // Authentication Stage
      let stage = "";
      const messageLength = data.readInt32BE(1);
      const authType = data.readInt32BE(5);
      if (authType === 10) {
        stage = "initial";
        let mechanism = "";
        for (let i = 9; i < messageLength - 1; i++) {
          const char = String.fromCharCode(data.readInt8(i));
          mechanism += char;
        }
        if (mechanism !== "SCRAM-SHA-256") {
          // Terminate connection (supported mechanism is SCRAM only)
          console.error(
            "\x1b[41m%s\x1b[0m",
            `Not a supported authentication mechanism. Terminating Connection.`
          );
          return dbConnection.destroy();
        }

        // Generate Initial SASL response
        const { response, clientNonce } = initiateSaslMechanism({ mechanism });
        // Store connection parameters
        Object.defineProperty(dbConnection, "_postgrancerDBConnectionData", {
          value: {
            clientNonce,
          },
          enumerable: true,
          writable: true,
          configurable: true,
        });
        dbConnection.write(response);
      } else if (authType === 11) {
        stage = "continue";
        let connectionData = {};
        if (dbConnection._postgrancerDBConnectionData) {
          connectionData = dbConnection._postgrancerDBConnectionData;
        }
        const { response, serverSignature, responseBuffer } =
          continueSaslSession({
            data,
            _postgrancerDBConnectionData: connectionData,
          });
        if (dbConnection._postgrancerDBConnectionData) {
          dbConnection._postgrancerDBConnectionData.serverSignature =
            serverSignature;
        }
        dbConnection.write(responseBuffer);
      } else if (authType === 12) {
        stage = "final";
        // Validate Server Signature
        // Don't Respond, Wait for Ready For Query
        // Store Database Metadata
        let connectionData = {};
        if (dbConnection._postgrancerDBConnectionData) {
          connectionData = dbConnection._postgrancerDBConnectionData;
        }
        finalizeSaslSession({
          data,
          _postgrancerDBConnectionData: connectionData,
        });
        // Add to connection pool
        const connectionId = dbConnection.id;
        if (connectionId) {
          sessionById[connectionId].connectionPool.push(dbConnection);
        }
      }

      if (!stage) {
        // Terminate Connection
        console.error(
          "\x1b[41m%s\x1b[0m",
          `Not a valid authentication stage. Terminating Connection.`
        );
        return dbConnection.destroy();
      }

      break;

    default:
      // Write to client socket
      const clientSocketConnection =
        dbConnection._postgrancerDBConnectionData &&
        dbConnection._postgrancerDBConnectionData?.clientSocketConnection;
      if (clientSocketConnection) {
        clientSocketConnection.write(data);
      }
      // Check And Unblock database connection on current statement completion
      checkAndUnblock({
        data,
        dbConnection,
      });
      break;
  }
}

export default dataHandler;

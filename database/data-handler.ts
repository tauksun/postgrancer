import {
  continueSaslSession,
  finalizeSaslSession,
  initiateSaslMechanism,
} from "../authentication";
import { identifier } from "../query-handler";
import { IpostgranceDBSocket } from "./interface";

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
      // Pipe to client socket
      break;
  }
}

export default dataHandler;

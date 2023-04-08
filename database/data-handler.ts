import { Socket } from "net";
import { initiateSaslMechanism } from "../authentication";
import { identifier } from "../query-handler";
function dataHandler(params: { data: Buffer; dbConnection: Socket }) {
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
          console.log("=================================");
          console.log(`Not a supported authentication mechanism. 
                    Terminating Connecton.`);
          console.log("=================================");
          return dbConnection.destroy();
        }

        // Generate Initial SASL response
        const saslResponse = initiateSaslMechanism({ mechanism });
        dbConnection.write(saslResponse);
      } else if (authType === 11) {
        stage = "continue";
        console.log({
          stage,
          data,
          dataSTR: data.toString(),
        });
      } else if (authType === 12) {
        stage = "final";
        // Don't Respond, Wait for Ready For Query
        // Store Database Metadata
        console.log({
          stage,
          data,
          dataSTR: data.toString(),
        });
      }

      if (!stage) {
        // Terminate Connection
        console.log("=================================");
        console.log(`Not a valid authentication stage. 
                    Terminating Connecton.`);
        console.log("=================================");
        return dbConnection.destroy();
      }

      break;

    default:
      // Pipe to client socket
      break;
  }
}

export default dataHandler;

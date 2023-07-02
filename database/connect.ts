import net from "net";
import { initiateAuthSession } from "../authentication";
import { IdbPoolType } from "../client/interface";
import dataHandler from "./data-handler";
import { IpostgranceDBSocket } from "./interface";

const connectToDB = (options: {
  type: IdbPoolType;
  id: string;
  host: string;
  port: number;
  reConnecting?: boolean;
  watchDogConnection?: boolean;
}): Promise<IpostgranceDBSocket> => {
  return new Promise((resolve, reject) => {
    const { type, id, host, port, reConnecting, watchDogConnection } = options;
    const dbConnection: IpostgranceDBSocket = net.createConnection({
      host,
      port,
    });

    // Flags
    dbConnection.reConnecting = reConnecting;
    dbConnection.watchDogConnection = watchDogConnection;

    dbConnection.on("ready", () => {
      dbConnection.id = id;
      dbConnection.type = type;
      dbConnection.host = host;
      dbConnection.port = port;
      const authBuffer = initiateAuthSession();
      dbConnection.write(authBuffer);
      resolve(dbConnection);
    });
    dbConnection.on("error", (error) => {
      console.log("Error on connection : ", error);
      dbConnection.error = true;
    });
    dbConnection.on("data", (data) => {
      dataHandler({ data, dbConnection });
    });
  });
};

export default connectToDB;

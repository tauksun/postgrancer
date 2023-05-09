import net from "net";
import dataHandler from "./data-handler";
import { IpostgranceDBSocket } from "./interface";
const connectToDB = (options: {
  host: string;
  port: number;
}): Promise<IpostgranceDBSocket> => {
  return new Promise((resolve, reject) => {
    const dbConnection: IpostgranceDBSocket = net.createConnection({
      host: options.host,
      port: options.port,
    });
    dbConnection.on("ready", () => {
      resolve(dbConnection);
    });
    dbConnection.on("error", (error) => {
      ///////////////
      console.log("Connection Error : ", error);
      // What to do on error ? coz reject won't work later
      reject(error);
      ///////////////
    });
    dbConnection.on("data", (data) => {
      dataHandler({ data, dbConnection });
    });
  });
};

export default connectToDB;

import net from "net";
import dataHandler from "./data-handler";
const connectToDB = (options: {
  host: string;
  port: number;
}): Promise<net.Socket> => {
  return new Promise((resolve, reject) => {
    const dbConnection = net.createConnection({
      host: options.host,
      port: options.port,
    });
    dbConnection.on("ready", () => {
      //-----------------------------------------------
      console.log("connection to primary is ready ");
      //-----------------------------------------------
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

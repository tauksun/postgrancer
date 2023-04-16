import net from "net";
import dataHandler from "./data-handler";
import clearSession from "./clear-session";
import constants from "../constants";
import startSession from "./start-session";
import { IpostgranceClientSocket } from "./interface";

function clientConnectionServer() {
  const server = net.createServer((socket: IpostgranceClientSocket) => {
    socket.on("data", (data) => {
      dataHandler(data, socket);
    });

    socket.on("error", (error) => {
      // Log Error
      console.log("Error from connection on clientConnectionServer");
      console.log({ error });
      // Terminate Connection
      socket.destroy(error);
      // Clear Session
      clearSession(socket);
    });

    socket.on("close", () => {
      clearSession(socket);
    });
  });

  // Server Configuration
  const port = constants.clientServerPort;
  const host = constants.clientServerHost;

  // Initiate
  server.listen(port, host);

  server.on("error", (error) => {
    console.log("Error occured while starting client server.");
    console.log({ error });
  });

  server.on("listening", () => {
    console.log("Client Server is Up & Listening ...");
  });

  server.on("connection", (socket: IpostgranceClientSocket) => {
    // Start Socket Session
    startSession(socket);
  });
}

export { clientConnectionServer };

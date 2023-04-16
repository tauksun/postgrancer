// Load Environment/Constants
import constants from "./constants";
import { establishDatabaseConnections } from "./database";
import { clientConnectionServer } from "./client";
function main() {
  console.log(constants);
  // Connect with Primary & Replicas
  establishDatabaseConnections();
  // Start Client Server
  clientConnectionServer();
}

main();

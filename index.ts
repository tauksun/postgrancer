// Load Environment/Constants
import constants from "./constants";
import { establishDatabaseConnections } from "./database";
function main() {
  console.log(constants);
  establishDatabaseConnections();
}

main();

import constants from "../../constants";

function getDbPassword(database: string): string {
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  // Make Below validation for multiple database architecture
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  console.log("== ", { database });
  const password = constants.dbPassword;
  return password;
}

export default getDbPassword;

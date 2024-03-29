import constants from "../../constants";

function isValidUser(user: string): boolean {
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  // Make Below validation for multiple database/user architecture
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  const validUsers = [constants.dbUser];
  if (validUsers.includes(user)) {
    return true;
  }
  return false;
}

export default isValidUser;

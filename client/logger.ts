import { appendFile } from "fs";
import path from "path";
import constants from "../constants";
import { IdbPoolType } from "./interface";

const { logger, logFrequency } = constants;

function log(params: { data: Buffer; dbPoolType: IdbPoolType }) {
  if (!logger) {
    return;
  }

  const { data, dbPoolType } = params;
  let fileName: string = ``;

  const now = new Date();
  const minute = now.getUTCMinutes();
  const hour = now.getUTCHours();
  const day =
    now.getUTCDate() +
    "-" +
    (now.getUTCMonth() + 1) +
    "-" +
    now.getUTCFullYear();

  switch (logFrequency) {
    case "minute":
      fileName = `M : ${minute} % ${day}`;
      break;
    case "hour":
      fileName = `H : ${hour} % ${day}`;
      break;
    case "day":
      fileName = `D : ${day}`;
      break;
  }

  const fileData: string = `
\n----- BEGIN -----\n
${new Date()}
\n
Pool Type : ${dbPoolType}
\n
Data : ${data.toString()}
\n----- END -----\n
`;

  const filePath = path.join(__dirname, `../logs/${fileName}`);
  appendFile(filePath, fileData, (error) => {
    if (error) {
      console.log("Error while logging : ", { error });
    }
  });
}

export default log;

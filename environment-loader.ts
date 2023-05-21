import path from "path";
import fs from "fs";
import dotenv from "dotenv";

function envLoader(params: { path: string }) {
  try {
    const pathToCustomEnv: string = params.path;

    const basePath: string = process.cwd();

    const pathToEnv: string = path.join(basePath, pathToCustomEnv);

    // Check if file exists //
    const isFileExists = fs.existsSync(pathToEnv);
    if (!isFileExists) {
      throw `Could not find config file at ${pathToEnv}`;
    }

    dotenv.config({ path: pathToEnv });
    return;
  } catch (error) {
    console.error(
      "\x1b[41m%s\x1b[0m",
      ` Error occured while loading Environment : ${error}`
    );
    throw error;
  }
}

export default envLoader;

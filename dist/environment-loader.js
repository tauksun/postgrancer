"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
function envLoader(params) {
    try {
        const pathToCustomEnv = params.path;
        const basePath = __dirname;
        const pathToEnv = path_1.default.join(basePath, pathToCustomEnv);
        // Check if file exists //
        const isFileExists = fs_1.default.existsSync(pathToEnv);
        if (!isFileExists) {
            throw `Could not find config file at ${pathToEnv}`;
        }
        dotenv_1.default.config({ path: pathToEnv });
        return;
    }
    catch (error) {
        console.error("\x1b[41m%s\x1b[0m", ` Error occured while loading Environment : ${error}`);
        throw error;
    }
}
exports.default = envLoader;

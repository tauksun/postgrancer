"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const connectToDB = (options) => {
    return new Promise((resolve, reject) => {
        const dbConnection = net_1.default.createConnection({
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
            // Parse data
        });
    });
};
exports.default = connectToDB;

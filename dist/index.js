"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load Environment/Constants
const constants_1 = __importDefault(require("./constants"));
const database_1 = require("./database");
function main() {
    console.log(constants_1.default);
    (0, database_1.establishDatabaseConnections)();
}
main();

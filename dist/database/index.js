"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.establishDatabaseConnections = void 0;
const connect_1 = __importDefault(require("./connect"));
const constants_1 = __importDefault(require("../constants"));
/////////////////////////////////
/////////////////////////////////
/////////////////////////////////
const fs_1 = __importDefault(require("fs"));
function establishPrimaryDatabaseConnections() {
    return __awaiter(this, void 0, void 0, function* () {
        const host = constants_1.default.primaryDatabaseHost;
        const port = constants_1.default.primaryDatabasePort;
        const connectionPool = constants_1.default.primaryDatabaseConnectionPool;
        for (let i = 0; i < connectionPool; i++) {
            try {
                const primaryConnection = yield (0, connect_1.default)({
                    host,
                    port,
                });
                fs_1.default.appendFileSync("./primary", "\n\n" + i + " :  " + JSON.stringify(primaryConnection));
            }
            catch (error) {
                //////////////////
                console.log("Error occured while connection to Primary database : ", {
                    error,
                });
                //////////////////
            }
        }
    });
}
function establishReplicasDatabaseConnections() {
    return __awaiter(this, void 0, void 0, function* () {
        const replicaDatabaseHosts = constants_1.default.replicaDatabaseHosts;
        const replicaDatabasePorts = constants_1.default.replicaDatabasePorts;
        const replicaConnectionPool = constants_1.default.replicaDatabaseConnectionPool;
        if (replicaDatabaseHosts.length !== replicaDatabasePorts.length) {
            throw `Number of replica hosts do not match with ports.
    Hosts : ${replicaDatabaseHosts}, 
    Ports : ${replicaDatabasePorts}`;
        }
        for (let i = 0; i < replicaDatabaseHosts.length; i++) {
            const host = replicaDatabaseHosts[i];
            const port = replicaDatabasePorts[i];
            for (let j = 0; j < replicaConnectionPool[i]; j++) {
                try {
                    const replicaConnection = yield (0, connect_1.default)({ host, port });
                    fs_1.default.appendFileSync(`replica${i}`, "\n\n" + JSON.stringify(replicaConnection));
                }
                catch (error) {
                    //////////////////
                    console.log(`Error occured while connection to replica database : ${i} `, {
                        error,
                    });
                    //////////////////
                }
            }
        }
    });
}
function establishDatabaseConnections() {
    establishPrimaryDatabaseConnections();
    establishReplicasDatabaseConnections();
}
exports.establishDatabaseConnections = establishDatabaseConnections;

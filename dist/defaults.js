"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Primary DB
const primaryDatabaseConnectionPool = 20;
// Replicas DB
const replicaConnectionPoolValue = 20;
const replicaDatabaseConnectionPool = (params) => {
    const defaultPool = [];
    const defaultReplicaPoolValue = replicaConnectionPoolValue;
    for (let i = 0; i < params.numberOfReplicas; i++) {
        defaultPool.push(defaultReplicaPoolValue);
    }
    return defaultPool;
};
const defaults = {
    primaryDatabaseConnectionPool,
    replicaDatabaseConnectionPool,
};
exports.default = defaults;

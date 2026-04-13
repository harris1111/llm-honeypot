"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTraceId = createTraceId;
exports.toErrorMessage = toErrorMessage;
const node_crypto_1 = require("node:crypto");
function createTraceId(prefix = 'trace') {
    return `${prefix}_${(0, node_crypto_1.randomUUID)()}`;
}
function toErrorMessage(error) {
    return error instanceof Error ? error.message : 'Unknown error';
}
//# sourceMappingURL=index.js.map
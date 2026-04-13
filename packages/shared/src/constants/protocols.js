"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protocolFamilies = exports.protocolPorts = void 0;
exports.protocolPorts = {
    anthropic: 8081,
    api: 4000,
    dns: 53,
    ftp: 21,
    node: 11434,
    ollama: 11434,
    openai: 8080,
    smb: 445,
    smtp: 25,
    ssh: 22,
    telnet: 23,
    worker: 4100,
};
exports.protocolFamilies = {
    dashboard: ['api', 'worker'],
    honeypot: ['openai', 'ollama', 'anthropic', 'ssh', 'ftp', 'smtp', 'dns', 'smb', 'telnet'],
};
//# sourceMappingURL=protocols.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeEnvSchema = exports.dashboardEnvSchema = void 0;
exports.parseDashboardEnv = parseDashboardEnv;
exports.parseNodeEnv = parseNodeEnv;
const zod_1 = require("zod");
const baseEnvSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
});
exports.dashboardEnvSchema = baseEnvSchema.extend({
    API_PORT: zod_1.z.coerce.number().int().positive().default(4000),
    JWT_SECRET: zod_1.z.string().min(32),
    POSTGRES_DB: zod_1.z.string().min(1),
    POSTGRES_PASSWORD: zod_1.z.string().min(1),
    POSTGRES_USER: zod_1.z.string().min(1),
    WEB_PORT: zod_1.z.coerce.number().int().positive().default(3000),
    WORKER_CONCURRENCY: zod_1.z.coerce.number().int().positive().default(4),
});
exports.nodeEnvSchema = zod_1.z.object({
    LLMTRAP_DASHBOARD_URL: zod_1.z.string().url(),
    LLMTRAP_NODE_KEY: zod_1.z.string().min(1),
    OPENAI_COMPAT_API_KEY: zod_1.z.string().min(1).optional(),
    OPENAI_COMPAT_BASE_URL: zod_1.z.string().url().optional(),
    OPENAI_COMPAT_MODEL: zod_1.z.string().min(1).optional(),
    REDIS_URL: zod_1.z.string().url(),
});
function parseDashboardEnv(env) {
    return exports.dashboardEnvSchema.parse(env);
}
function parseNodeEnv(env) {
    return exports.nodeEnvSchema.parse(env);
}
//# sourceMappingURL=env-schema.js.map
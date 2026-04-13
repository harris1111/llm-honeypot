import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  __llmtrapPrisma__?: PrismaClient;
};

export const prisma = globalForPrisma.__llmtrapPrisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__llmtrapPrisma__ = prisma;
}

export * from '@prisma/client';
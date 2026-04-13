import { beforeEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/llmtrap_test';
process.env.REDIS_URL ??= 'redis://127.0.0.1:6379';
process.env.JWT_SECRET ??= 'test-jwt-secret-value-that-is-long-enough';
process.env.POSTGRES_DB ??= 'llmtrap_test';
process.env.POSTGRES_PASSWORD ??= 'test';
process.env.POSTGRES_USER ??= 'test';

const prismaMethodMocks = {
	$transaction: vi.fn(),
	auditLogCreate: vi.fn(),
	capturedRequestCreate: vi.fn(),
	capturedRequestFindFirst: vi.fn(),
	honeypotSessionCreate: vi.fn(),
	honeypotSessionFindFirst: vi.fn(),
	honeypotSessionUpdate: vi.fn(),
	nodeFindUnique: vi.fn(),
	nodeUpdateMany: vi.fn(),
	userCount: vi.fn(),
	userCreate: vi.fn(),
	userFindUnique: vi.fn(),
	userSessionCreate: vi.fn(),
	userSessionDelete: vi.fn(),
	userSessionDeleteMany: vi.fn(),
	userSessionFindUnique: vi.fn(),
	userUpdate: vi.fn(),
};

function resetPrismaMock(name: string, mock: ReturnType<typeof vi.fn>): void {
	mock.mockReset();
	mock.mockImplementation(() => {
		throw new Error(`Unexpected Prisma call: ${name}`);
	});
}

const prisma = {
	$transaction: prismaMethodMocks.$transaction,
	auditLog: {
		create: prismaMethodMocks.auditLogCreate,
	},
	capturedRequest: {
		create: prismaMethodMocks.capturedRequestCreate,
		findFirst: prismaMethodMocks.capturedRequestFindFirst,
	},
	honeypotSession: {
		create: prismaMethodMocks.honeypotSessionCreate,
		findFirst: prismaMethodMocks.honeypotSessionFindFirst,
		update: prismaMethodMocks.honeypotSessionUpdate,
	},
	node: {
		findUnique: prismaMethodMocks.nodeFindUnique,
		updateMany: prismaMethodMocks.nodeUpdateMany,
	},
	user: {
		count: prismaMethodMocks.userCount,
		create: prismaMethodMocks.userCreate,
		findUnique: prismaMethodMocks.userFindUnique,
		update: prismaMethodMocks.userUpdate,
	},
	userSession: {
		create: prismaMethodMocks.userSessionCreate,
		delete: prismaMethodMocks.userSessionDelete,
		deleteMany: prismaMethodMocks.userSessionDeleteMany,
		findUnique: prismaMethodMocks.userSessionFindUnique,
	},
};

vi.mock('@llmtrap/db', async () => {
	const actual = await vi.importActual<typeof import('@llmtrap/db')>('@llmtrap/db');

	return {
		...actual,
		prisma,
	};
});

beforeEach(() => {
	for (const [name, mock] of Object.entries(prismaMethodMocks)) {
		resetPrismaMock(name, mock);
	}
});
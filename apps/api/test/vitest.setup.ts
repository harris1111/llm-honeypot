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
	archiveManifestCreate: vi.fn(),
	archiveManifestFindMany: vi.fn(),
	archiveManifestFindUnique: vi.fn(),
	actorCreate: vi.fn(),
	actorDeleteMany: vi.fn(),
	actorFindMany: vi.fn(),
	actorFindUnique: vi.fn(),
	actorUpdate: vi.fn(),
	alertLogFindMany: vi.fn(),
	alertRuleCreate: vi.fn(),
	alertRuleDelete: vi.fn(),
	alertRuleFindMany: vi.fn(),
	alertRuleFindUnique: vi.fn(),
	alertRuleUpdate: vi.fn(),
	auditLogCreate: vi.fn(),
	capturedRequestCount: vi.fn(),
	capturedRequestCreate: vi.fn(),
	capturedRequestFindMany: vi.fn(),
	capturedRequestFindFirst: vi.fn(),
	honeypotSessionCount: vi.fn(),
	honeypotSessionCreate: vi.fn(),
	honeypotSessionFindMany: vi.fn(),
	honeypotSessionFindFirst: vi.fn(),
	honeypotSessionFindUnique: vi.fn(),
	honeypotSessionUpdate: vi.fn(),
	honeypotSessionUpdateMany: vi.fn(),
	nodeCount: vi.fn(),
	nodeUpdate: vi.fn(),
	nodeFindUnique: vi.fn(),
	nodeUpdateMany: vi.fn(),
	personaCreate: vi.fn(),
	personaDelete: vi.fn(),
	personaFindMany: vi.fn(),
	personaFindUnique: vi.fn(),
	personaUpdate: vi.fn(),
	responseTemplateCreate: vi.fn(),
	responseTemplateFindMany: vi.fn(),
	responseTemplateFindUnique: vi.fn(),
	responseTemplateUpdate: vi.fn(),
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
	archiveManifest: {
		create: prismaMethodMocks.archiveManifestCreate,
		findMany: prismaMethodMocks.archiveManifestFindMany,
		findUnique: prismaMethodMocks.archiveManifestFindUnique,
	},
	actor: {
		create: prismaMethodMocks.actorCreate,
		deleteMany: prismaMethodMocks.actorDeleteMany,
		findMany: prismaMethodMocks.actorFindMany,
		findUnique: prismaMethodMocks.actorFindUnique,
		update: prismaMethodMocks.actorUpdate,
	},
	alertLog: {
		findMany: prismaMethodMocks.alertLogFindMany,
	},
	alertRule: {
		create: prismaMethodMocks.alertRuleCreate,
		delete: prismaMethodMocks.alertRuleDelete,
		findMany: prismaMethodMocks.alertRuleFindMany,
		findUnique: prismaMethodMocks.alertRuleFindUnique,
		update: prismaMethodMocks.alertRuleUpdate,
	},
	auditLog: {
		create: prismaMethodMocks.auditLogCreate,
	},
	capturedRequest: {
		count: prismaMethodMocks.capturedRequestCount,
		create: prismaMethodMocks.capturedRequestCreate,
		findMany: prismaMethodMocks.capturedRequestFindMany,
		findFirst: prismaMethodMocks.capturedRequestFindFirst,
	},
	honeypotSession: {
		count: prismaMethodMocks.honeypotSessionCount,
		create: prismaMethodMocks.honeypotSessionCreate,
		findMany: prismaMethodMocks.honeypotSessionFindMany,
		findFirst: prismaMethodMocks.honeypotSessionFindFirst,
		findUnique: prismaMethodMocks.honeypotSessionFindUnique,
		update: prismaMethodMocks.honeypotSessionUpdate,
		updateMany: prismaMethodMocks.honeypotSessionUpdateMany,
	},
	node: {
		count: prismaMethodMocks.nodeCount,
		findUnique: prismaMethodMocks.nodeFindUnique,
		update: prismaMethodMocks.nodeUpdate,
		updateMany: prismaMethodMocks.nodeUpdateMany,
	},
	persona: {
		create: prismaMethodMocks.personaCreate,
		delete: prismaMethodMocks.personaDelete,
		findMany: prismaMethodMocks.personaFindMany,
		findUnique: prismaMethodMocks.personaFindUnique,
		update: prismaMethodMocks.personaUpdate,
	},
	responseTemplate: {
		create: prismaMethodMocks.responseTemplateCreate,
		findMany: prismaMethodMocks.responseTemplateFindMany,
		findUnique: prismaMethodMocks.responseTemplateFindUnique,
		update: prismaMethodMocks.responseTemplateUpdate,
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
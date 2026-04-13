# LLMTrap Code Standards

**Version:** 0.1.0  
**Last Updated:** April 13, 2026  
**Applies To:** All packages and applications

---

## Language & Tooling

### TypeScript

**Configuration:**
- **Mode:** Strict (`strict: true`)
- **Target:** ES2020 (frontend), ES2017 (backend)
- **Module:** CommonJS (backend), ESM (frontend via Vite)
- **Declaration Maps:** Enabled for debugging

**Rules:**
- ✅ No `any` type usage (use `unknown` + type guards instead)
- ✅ No `object` type (use specific interfaces)
- ✅ All function parameters must be typed
- ✅ All return types must be explicit
- ✅ Discriminated unions over conditional types where possible
- ✅ Generic constraints required for T usage

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
}

function getUserEmail(user: User): string {
  return user.email;
}

// ❌ Bad
const getUserEmail = (user: any) => user.email;
```

---

### Linting & Formatting

**Linter:** ESLint 8.57.1  
**Formatter:** Prettier 3.5.3

**Commands:**
```bash
# Check formatting
pnpm format

# Auto-fix formatting
pnpm format:write

# Lint all packages
pnpm lint

# Lint single package
pnpm --filter @llmtrap/shared lint
```

**ESLint Config:** Shared at root (`.eslintrc.cjs`)  
**Prettier Config:** Shared at root (`.prettierrc`)

---

## Monorepo Structure

### Package Organization

```
packages/
├── shared/                    # Low-level types, DTOs, validation
│   ├── src/
│   │   ├── types/            # Interfaces
│   │   ├── schemas/          # Zod validation
│   │   ├── constants/        # Enums, PORT definitions
│   │   └── utils/            # Functions
│   ├── package.json
│   └── tsconfig.json
│
├── db/                        # Prisma ORM + schema
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   └── index.ts          # Re-export PrismaClient
│   └── package.json
│
├── response-engine/           # Response template matching
│   ├── src/
│   │   ├── engine.ts         # Core logic
│   │   └── types.ts
│   └── package.json
│
└── persona-engine/            # Persona state management
    ├── src/
    │   ├── engine.ts         # Core logic
    │   └── types.ts
    └── package.json
```

**Dependency Order:**
```
apps/* → packages/db, packages/response-engine, packages/persona-engine → packages/shared
```

---

## NestJS Backend (apps/api, apps/node, apps/worker)

### Module Organization

**Module-per-domain pattern:**
```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   └── auth.guard.ts
│
├── nodes/
│   ├── nodes.module.ts
│   ├── nodes.service.ts
│   ├── nodes.controller.ts
│   ├── dto/
│   └── entities/
│
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   └── pipes/
│       └── validation.pipe.ts
│
├── app.module.ts
└── main.ts
```

### Service/Repository Pattern

**Design Layer Hierarchy:**
```
Controller
  ↓ (calls)
Service
  ↓ (calls)
Repository
  ↓ (calls)
Prisma/DB
```

**Example:**
```typescript
// nodes.controller.ts
@Controller('nodes')
export class NodesController {
  constructor(private nodesService: NodesService) {}

  @Get()
  async list(): Promise<NodeDTO[]> {
    return this.nodesService.list();
  }
}

// nodes.service.ts
@Injectable()
export class NodesService {
  constructor(private nodesRepository: NodesRepository) {}

  async list(): Promise<NodeDTO[]> {
    const nodes = await this.nodesRepository.findAll();
    return nodes.map(toNodeDTO);
  }
}

// nodes.repository.ts
@Injectable()
export class NodesRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.node.findMany();
  }
}
```

### Validation

**Zod + @anatine/zod-nestjs pattern:**
```typescript
import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const createNodeSchema = z.object({
  name: z.string().min(1),
  apiKey: z.string(),
  url: z.string().url(),
});

export class CreateNodeDto extends createZodDto(createNodeSchema) {}
```

### Guards, Interceptors, Pipes

**Location:**
```
common/
├── guards/
│   ├── jwt.guard.ts          # Authentication
│   └── roles.guard.ts        # Authorization
├── interceptors/
│   ├── logging.interceptor.ts  # Request/response logging
│   └── timing.interceptor.ts   # Performance metrics
└── pipes/
    ├── validation.pipe.ts    # Apply Zod schemas
    └── parse-uuid.pipe.ts    # Path parameter parsing
```

**Usage:**
```typescript
@UseGuards(JwtGuard)
@UseInterceptors(LoggingInterceptor)
@Post('nodes')
async create(@Body(ZodValidationPipe) dto: CreateNodeDto) {
  return this.nodesService.create(dto);
}
```

### Error Handling

**Custom Exception Filter:**
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.getResponse(),
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## React Frontend (apps/web)

### Component Structure

**Functional components only, no class components:**
```typescript
// ✅ Good
export const UserCard: React.FC<{ user: User }> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  return <div>{user.name}</div>;
};

// ❌ Bad
class UserCard extends React.Component { ... }
```

### State Management

**TanStack Query** (server state):
```typescript
import { useQuery } from '@tanstack/react-query';

export const UserList = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/v1/users').then(r => r.json()),
  });

  if (isLoading) return <Spinner />;
  return <div>{users.map(u => <UserCard key={u.id} user={u} />)}</div>;
};
```

**Zustand** (client state):
```typescript
import { create } from 'zustand';

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

### Routing

**TanStack Router (file-based, type-safe):**
```typescript
// routes/__root.tsx (layout)
export const Route = createRootRoute({
  component: RootLayout,
});

// routes/dashboard.tsx (page)
export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
  loader: async () => {
    // Preload data for this route
  },
});
```

### Styling

**shadcn/ui + Tailwind CSS:**
```typescript
import { Button } from '@/components/ui/button';

export const SaveButton = () => (
  <Button 
    onClick={save} 
    className="bg-blue-600 hover:bg-blue-700 rounded-md"
  >
    Save
  </Button>
);
```

---

## Shared Package (packages/shared)

### Zod Schemas

**Location:** `src/schemas/`

**Pattern:**
```typescript
// env.schema.ts
import { z } from 'zod';

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  API_PORT: z.string().pipe(z.coerce.number()),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv): ApiEnv {
  try {
    return apiEnvSchema.parse(env);
  } catch (error) {
    throw new Error(`Invalid environment: ${error}`);
  }
}
```

### Type Definitions

**Location:** `src/types/`  
**Naming:** Use explicit, domain-specific names:
```typescript
// ✅ Good
export interface CreateSessionRequest { ... }
export interface SessionAnalyticsResponse { ... }

// ❌ Bad
export interface IRequest { ... }
export interface IResponse { ... }
```

### Constants

**Location:** `src/constants/`

```typescript
// protocols.ts
export const PROTOCOL_PORTS = {
  OLLAMA: 11434,
  OPENAI: 443,
  SSH: 22,
  FTP: 21,
  SMTP: 587,
} as const;

// actor-types.ts
export const ACTOR_TYPES = ['APT', 'SCRIPT_KIDDY', 'RESEARCHER'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];
```

---

## Database (packages/db)

### Prisma Schema

**Location:** `prisma/schema.prisma`

**Naming Conventions:**
- Model names: PascalCase (`User`, `Node`, `Session`)
- Field names: camelCase (`createdAt`, `apiKey`)
- Relations: camelCase, singular (`node` links to Node)
- Enums: PascalCase (`SessionStatus`)

**Example:**
```prisma
model Node {
  id        String   @id @default(cuid())
  name      String
  apiKey    String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  
  sessions  Session[]  // 1-to-many relation
  
  @@unique([name, createdAt])
}

model Session {
  id     String @id @default(cuid())
  nodeId String
  node   Node   @relation(fields: [nodeId], references: [id])
  
  requests Request[]
}

enum SessionStatus {
  ACTIVE
  CLOSED
  ANALYZED
}
```

### Migrations

**Create migration:**
```bash
pnpm --filter @llmtrap/db prisma migrate dev --name add_user_table
```

**Apply migrations:**
```bash
pnpm --filter @llmtrap/db prisma migrate deploy
```

**Seed database:**
```bash
pnpm --filter @llmtrap/db seed
```

---

## Git & Commits

### Branch Naming

**Format:** `<type>/<scope>/<description>`

**Examples:**
```
feat/api/user-authentication
fix/node/persona-consistency
refactor/db/session-queries
test/e2e/dashboard-flows
docs/architecture-update
```

### Conventional Commits

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code refactoring
- `test` — Test improvements
- `docs` — Documentation
- `chore` — Dependency/tooling
- `devops` — CI/CD/Docker

**Examples:**
```bash
git commit -m "feat(api): add node registration endpoint"
git commit -m "fix(node): fix persona consistency race condition"
git commit -m "test(e2e): add dashboard authentication flow"
```

---

## Testing

### Strategy

**Unit Tests** → Vitest + services, utils, engines  
**Integration Tests** → Vitest + Supertest + API endpoints  
**E2E Tests** → Playwright + full dashboard flows  
**Smoke Tests** → Protocol validation (node responds correctly)

### Coverage Target

- **Minimum:** >80% on critical paths
- **Critical paths:**
  - Response engine template matching
  - Persona consistency logic
  - API authentication/authorization
  - Session capture + logging

### Running Tests

```bash
# All unit tests
pnpm test

# Specific package
pnpm --filter @llmtrap/api test

# E2E tests
pnpm test:e2e

# With coverage
pnpm test -- --coverage
```

---

## Performance Guidelines

### Frontend

- Bundle size target: <100 KB gzipped
- Lighthouse score: >90 (mobile + desktop)
- First Contentful Paint: <1s
- Lazy load charts/heavy components
- Use React.memo for memoization

### Backend

- API response time: <100ms (p80)
- Database query time: <50ms average
- Memory usage: <256 MB per service
- Connection pooling: 20-50 connections

### Database

- Index all foreign keys
- Index frequently-queried columns
- Analyze slow queries quarterly
- Archive sessions older than 1 year

---

## Security Practices

### Secrets Management

**❌ Never commit:**
- API keys, tokens, passwords
- Private keys (.pem, .key files)
- Database credentials
- JWT secrets

**Use instead:**
- `.env.local` (ignored by Git)
- `.env.example` (checked in, no secrets)
- Environment variables in CI/CD
- Rotating secrets in production

### Input Validation

**All user inputs must be validated:**
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Dependency Audits

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix
```

---

## Code Review Checklist

Before submitting a PR:

- [ ] Code follows TypeScript strict mode (no implicit `any`)
- [ ] Code passes linting (`pnpm lint`)
- [ ] Code passes type checking (`pnpm typecheck`)
- [ ] Code compiles successfully (`pnpm build`)
- [ ] Tests written and passing (`pnpm test`)
- [ ] No console.log() left behind (use proper logging)
- [ ] No `.env` or secrets committed
- [ ] Git commit messages follow conventional commits
- [ ] Dependencies are necessary and audited
- [ ] Breaking changes documented

---

## Logging

### Backend (NestJS)

**Use Logger from @nestjs/common:**
```typescript
import { Logger } from '@nestjs/common';

export class UsersService {
  private logger = new Logger(UsersService.name);

  async findAll() {
    this.logger.log('Fetching all users');
    return this.prisma.user.findMany();
  }
}
```

### Frontend (React)

**Structured logging via console.error for errors only:**
```typescript
try {
  const response = await fetch('/api/users');
} catch (error) {
  console.error('Failed to fetch users:', error);
}
```

---

## File Size Limits

**Soft limit per file:** 200 lines  
**Hard limit per file:** 400 lines

If a file exceeds 200 lines, consider:
1. Extracting utility functions into separate files
2. Splitting services into multiple focused classes
3. Moving component logic into custom hooks

---

## Related Documentation

- [Development Roadmap](./development-roadmap.md)
- [System Architecture](./system-architecture.md)
- [Project Changelog](./project-changelog.md)

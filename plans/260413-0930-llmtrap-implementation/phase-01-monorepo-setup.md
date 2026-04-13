# Phase 1: Monorepo Setup

## Overview
- **Priority:** P1 (Critical Path -- blocks all other phases)
- **Status:** Complete
- **Effort:** 12h
- **Branch:** `feat/infra/monorepo-setup`
- **Validation:** ✅ All checks passed (2026-04-13): pnpm install, lint, typecheck, build, Docker Compose configs verified

Scaffold the entire monorepo structure with pnpm workspaces + Turborepo, define the Prisma schema, create Docker Compose files for both stacks, and establish CI/CD baseline.

## Key Insights (from Research)

- T-Pot uses Docker Compose with 20+ containers; our approach is simpler (2 compose files, 8 total services)
- Turborepo gives parallel builds/tests across `apps/` and `packages/` with caching
- Prisma schema must cover: users, nodes, sessions, requests, templates, personas, alerts, actors
- 3-tier Docker network isolation (frontend, backend, honeypot-services) prevents lateral movement
- Non-root containers + resource limits mandatory from day 1

## Requirements

### Functional
- pnpm workspace with `apps/{api,web,worker,node}` and `packages/{shared,db,response-engine,persona-engine}`
- Turborepo pipelines: `build`, `dev`, `lint`, `test`, `typecheck`
- Prisma schema with all core tables (can be iteratively extended)
- Docker Compose files for dashboard + node stacks
- Shared TypeScript config (strict mode, path aliases)
- Shared ESLint + Prettier config
- Environment variable validation (Zod) in shared package

### Non-Functional
- `pnpm install` < 60s on clean cache
- `turbo build` < 90s (all packages)
- All packages compile with zero errors under strict mode
- Docker images build successfully

## Architecture

```
llm-honeypot/                  # Git root
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml        # Workspace definition
├── package.json               # Root scripts + devDependencies
├── tsconfig.base.json         # Shared TS config (strict)
├── .eslintrc.cjs              # Shared ESLint config
├── .prettierrc                # Shared Prettier config
├── .env.example               # Template env vars
│
├── apps/
│   ├── api/                   # NestJS backend
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json      # Extends base
│   │   └── nest-cli.json
│   ├── web/                   # React + Vite frontend
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── worker/                # BullMQ job processors
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── node/                  # Honeypot node (NestJS multi-port)
│       ├── src/
<!-- Updated: Validation Session 1 - Node changed from Express to NestJS -->
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                # Types, DTOs, Zod schemas, constants, utils
│   │   ├── src/
│   │   │   ├── types/         # Shared TypeScript interfaces
│   │   │   ├── schemas/       # Zod validation schemas
│   │   │   ├── constants/     # Protocol ports, classification enums, etc.
│   │   │   └── utils/         # Hashing, formatting, date helpers
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── db/                    # Prisma schema, client, migrations, seed
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── index.ts       # Re-export PrismaClient
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── response-engine/       # Template matching + streaming simulation
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── persona-engine/        # Persona consistency + dynamic values
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   ├── Dockerfile.node
│   ├── docker-compose.dashboard.yml
│   └── docker-compose.node.yml
│
├── templates/                 # Starter response templates (JSON files)
├── personas/                  # Built-in persona presets (JSON files)
├── scripts/                   # Dev/ops helper scripts
├── docs/                      # Project documentation
├── plans/                     # Implementation plans
└── tests/
    ├── e2e/                   # Playwright
    └── smoke/                 # Protocol smoke tests
```

## Prisma Schema (Core Tables)

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Auth & Users ---
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(VIEWER)
  totpSecret    String?
  totpEnabled   Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  auditLogs     AuditLog[]
  sessions      UserSession[]
}

enum UserRole {
  ADMIN
  ANALYST
  VIEWER
}

model UserSession {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}

// --- Honeypot Nodes ---
model Node {
  id          String     @id @default(cuid())
  name        String
  hostname    String?
  publicIp    String?
  nodeKey     String     @unique
  status      NodeStatus @default(PENDING)
  lastHeartbeat DateTime?
  personaId   String?
  persona     Persona?   @relation(fields: [personaId], references: [id])
  config      Json       @default("{}")  // Service toggles, port assignments, response config
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  requests    CapturedRequest[]
  sessions    HoneypotSession[]
}

enum NodeStatus {
  PENDING
  ONLINE
  OFFLINE
  DISABLED
}

// --- Personas ---
model Persona {
  id          String   @id @default(cuid())
  name        String
  preset      String?  // "homelabber" | "startup" | "researcher" | null (custom)
  identity    Json     // hostname, OS, SSH banner, kernel
  hardware    Json     // GPU, VRAM, CPU, RAM, disk
  models      Json     // Array of model objects {name, size, family}
  services    Json     // Service toggle map
  configFiles Json     // IDE config path map
  timing      Json     // uptime range, load avg, GPU util
  credentials Json     // Honeytoken API keys, passwords
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  nodes       Node[]
}

// --- Request Capture ---
model CapturedRequest {
  id               String   @id @default(cuid())
  timestamp        DateTime @default(now())
  nodeId           String
  node             Node     @relation(fields: [nodeId], references: [id])
  sessionId        String?
  session          HoneypotSession? @relation(fields: [sessionId], references: [id])
  sourceIp         String
  sourcePort       Int?
  protocol         String   // HTTP, SSH, FTP, SMTP, DNS, SMB, Telnet
  service          String   // ollama, openai, anthropic, mcp, ssh, etc.
  method           String   // GET, POST, SSH_AUTH, FTP_LOGIN, etc.
  path             String?
  headers          Json?
  headerHash       String?  // SHA-256 of ordered header names
  userAgent        String?
  requestBody      Json?
  responseCode     Int?
  responseBody     Json?
  responseStrategy String?  // real_model, template, static
  tlsFingerprint   String?  // JA3/JA4 hash
  classification   String?  // free_rider, scanner, config_hunter, etc.
  geo              Json?    // {country, city, asn, org}
  createdAt        DateTime @default(now())

  @@index([nodeId, timestamp])
  @@index([sourceIp])
  @@index([sessionId])
  @@index([classification])
  @@index([service])
  @@index([timestamp])
}

// --- Sessions ---
model HoneypotSession {
  id             String   @id @default(cuid())
  nodeId         String
  node           Node     @relation(fields: [nodeId], references: [id])
  sourceIp       String
  userAgent      String?
  service        String
  classification String?
  startedAt      DateTime @default(now())
  endedAt        DateTime?
  requestCount   Int      @default(0)
  actorId        String?
  actor          Actor?   @relation(fields: [actorId], references: [id])
  requests       CapturedRequest[]

  @@index([nodeId, startedAt])
  @@index([sourceIp])
  @@index([actorId])
}

// --- Actors (Fingerprint Groups) ---
model Actor {
  id               String   @id @default(cuid())
  label            String?  // Operator-assigned name
  headerFingerprint String?
  tlsFingerprints  String[] // Array of JA3/JA4 hashes
  userAgents       String[]
  firstSeen        DateTime @default(now())
  lastSeen         DateTime @default(now())
  sessionCount     Int      @default(0)
  mergedFrom       String[] // IDs of actors merged into this one
  sessions         HoneypotSession[]
}

// --- Response Templates ---
model ResponseTemplate {
  id           String   @id @default(cuid())
  category     String   // code, chat, creative, analysis, translation, extraction
  subcategory  String?
  promptHash   String?  @unique // For dedup
  promptText   String
  responseText String
  modelName    String?  // Which model generated this
  keywords     String[] // For keyword matching
  burned       Boolean  @default(false)
  autoGenerated Boolean @default(false)
  approved     Boolean  @default(true) // false = pending review
  usageCount   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([category])
  @@index([burned, approved])
}

// --- Alert Rules & Logs ---
model AlertRule {
  id         String   @id @default(cuid())
  name       String
  conditions Json     // {field, operator, value}[]
  severity   String   // info, warning, critical
  channels   String[] // telegram, discord, email, webhook
  cooldownMin Int     @default(5)
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  logs       AlertLog[]
}

model AlertLog {
  id        String    @id @default(cuid())
  ruleId    String
  rule      AlertRule @relation(fields: [ruleId], references: [id])
  payload   Json
  channel   String
  sentAt    DateTime  @default(now())
  success   Boolean   @default(true)
}

// --- IP Enrichment Cache ---
model IpEnrichment {
  ip           String   @id
  country      String?
  city         String?
  region       String?
  asn          String?
  org          String?
  isp          String?
  ispType      String?  // residential, datacenter, mobile
  reverseDns   String?
  isKnownBad   Boolean  @default(false)
  abuseScore   Float?
  isTor        Boolean  @default(false)
  isVpn        Boolean  @default(false)
  cloudProvider String? // aws, gcp, azure, etc.
  enrichedAt   DateTime @default(now())
  expiresAt    DateTime // Default: enrichedAt + 7 days
}

// --- Budget Tracking ---
model BudgetEntry {
  id          String   @id @default(cuid())
  nodeId      String?  // null = global
  month       String   // "2026-04"
  tokensSent  Int      @default(0)
  tokensRecv  Int      @default(0)
  estimatedCost Float  @default(0)
  limitCost   Float?   // Budget cap
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([nodeId, month])
}

// --- Audit Log ---
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String   // login, config_change, node_approve, etc.
  target    String?  // What was changed
  details   Json?
  ip        String?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([action])
}
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace root definition |
| `turbo.json` | Turborepo pipeline config |
| `package.json` | Root scripts, devDeps |
| `tsconfig.base.json` | Shared strict TS config |
| `.eslintrc.cjs` | Shared ESLint rules |
| `.prettierrc` | Prettier config |
| `.env.example` | Template env vars |
| `.gitignore` | Standard Node + Prisma ignores |
| `.dockerignore` | Exclude node_modules, .env, .git |
| `apps/api/package.json` | NestJS app package |
| `apps/api/tsconfig.json` | Extends base |
| `apps/api/nest-cli.json` | NestJS CLI config |
| `apps/api/src/main.ts` | NestJS bootstrap (placeholder) |
| `apps/api/src/app.module.ts` | Root module (placeholder) |
| `apps/web/package.json` | React + Vite package |
| `apps/web/tsconfig.json` | Extends base |
| `apps/web/vite.config.ts` | Vite config with path aliases |
| `apps/web/src/main.tsx` | React entry (placeholder) |
| `apps/worker/package.json` | BullMQ worker package |
| `apps/worker/tsconfig.json` | Extends base |
| `apps/worker/src/main.ts` | Worker bootstrap (placeholder) |
| `apps/node/package.json` | Honeypot node package |
| `apps/node/tsconfig.json` | Extends base |
| `apps/node/src/main.ts` | Node bootstrap (placeholder) |
| `packages/shared/package.json` | Shared types/utils package |
| `packages/shared/tsconfig.json` | Extends base |
| `packages/shared/src/index.ts` | Barrel export |
| `packages/shared/src/types/index.ts` | Core type definitions |
| `packages/shared/src/schemas/env-schema.ts` | Zod env validation |
| `packages/shared/src/constants/protocols.ts` | Protocol ports, service names |
| `packages/shared/src/constants/classifications.ts` | Classification enum/map |
| `packages/db/package.json` | Prisma package |
| `packages/db/tsconfig.json` | Extends base |
| `packages/db/prisma/schema.prisma` | Full schema (above) |
| `packages/db/prisma/seed.ts` | Seed data (admin user, default personas) |
| `packages/db/src/index.ts` | Re-export PrismaClient singleton |
| `packages/response-engine/package.json` | Response engine package |
| `packages/response-engine/tsconfig.json` | Extends base |
| `packages/response-engine/src/index.ts` | Barrel export (placeholder) |
| `packages/persona-engine/package.json` | Persona engine package |
| `packages/persona-engine/tsconfig.json` | Extends base |
| `packages/persona-engine/src/index.ts` | Barrel export (placeholder) |
| `docker/Dockerfile.api` | Multi-stage NestJS build |
| `docker/Dockerfile.web` | Multi-stage React build + nginx |
| `docker/Dockerfile.worker` | Worker container |
| `docker/Dockerfile.node` | Honeypot node container |
| `docker/docker-compose.dashboard.yml` | Dashboard stack |
| `docker/docker-compose.node.yml` | Honeypot node stack |
| `personas/homelabber.json` | Reckless Homelabber preset |
| `personas/startup.json` | Scrappy AI Startup preset |
| `personas/researcher.json` | University Researcher preset |

## Docker Compose: Dashboard Stack

```yaml
# docker/docker-compose.dashboard.yml
version: "3.9"

services:
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    ports:
      - "127.0.0.1:4000:4000"
    environment:
      - DATABASE_URL=postgresql://llmtrap:llmtrap@postgres:5432/llmtrap
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    restart: unless-stopped
    user: "1000:1000"
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
    ports:
      - "0.0.0.0:3000:80"
    depends_on:
      - api
    networks:
      - frontend
      - backend
    restart: unless-stopped
    user: "1000:1000"
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M

  worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile.worker
    environment:
      - DATABASE_URL=postgresql://llmtrap:llmtrap@postgres:5432/llmtrap
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    restart: unless-stopped
    user: "1000:1000"
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: llmtrap
      POSTGRES_USER: llmtrap
      POSTGRES_PASSWORD: llmtrap
    volumes:
      - pgdata:/var/lib/postgresql/data
    expose:
      - "5432"
    networks:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U llmtrap"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    expose:
      - "6379"
    volumes:
      - redisdata:/data
    networks:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

volumes:
  pgdata:
  redisdata:
```

## Docker Compose: Honeypot Node Stack

```yaml
# docker/docker-compose.node.yml
version: "3.9"

services:
  trap-core:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
    ports:
      - "0.0.0.0:11434:11434"  # Ollama
      - "0.0.0.0:8080:8080"    # OpenAI-compatible
      - "0.0.0.0:8081:8081"    # Anthropic-compatible
      - "0.0.0.0:1234:1234"    # LM Studio
      - "0.0.0.0:5000:5000"    # text-gen-webui
      - "0.0.0.0:8000:8000"    # LangServe
      - "0.0.0.0:8082:8082"    # llama.cpp
      - "0.0.0.0:8083:8083"    # vLLM
      - "0.0.0.0:8084:8084"    # AutoGPT
      - "0.0.0.0:6333:6333"    # Qdrant
      - "0.0.0.0:8085:8085"    # ChromaDB
      - "0.0.0.0:7474:7474"    # Neo4j
      - "0.0.0.0:8086:8086"    # Weaviate
      - "0.0.0.0:19530:19530"  # Milvus
      - "0.0.0.0:80:80"        # HTTP (login pages)
      - "0.0.0.0:443:443"      # HTTPS
      - "0.0.0.0:32400:32400"  # Plex
      - "0.0.0.0:8989:8989"    # Sonarr
      - "0.0.0.0:7878:7878"    # Radarr
      - "0.0.0.0:9696:9696"    # Prowlarr
      - "0.0.0.0:9000:9000"    # Portainer
      - "0.0.0.0:8123:8123"    # Home Assistant
      - "0.0.0.0:3001:3001"    # Grafana
      - "0.0.0.0:9090:9090"    # Prometheus
      - "0.0.0.0:3002:3002"    # Uptime Kuma
    environment:
      - LLMTRAP_DASHBOARD_URL=${LLMTRAP_DASHBOARD_URL}
      - LLMTRAP_NODE_KEY=${LLMTRAP_NODE_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

  trap-ssh:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
      args:
        SERVICE: ssh
    ports:
      - "0.0.0.0:22:2222"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"
    deploy:
      resources:
        limits:
          cpus: "0.25"
          memory: 128M

  trap-ftp:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
      args:
        SERVICE: ftp
    ports:
      - "0.0.0.0:21:2121"
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"

  trap-smtp:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
      args:
        SERVICE: smtp
    ports:
      - "0.0.0.0:25:2525"
      - "0.0.0.0:587:2587"
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"

  trap-dns:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
      args:
        SERVICE: dns
    ports:
      - "0.0.0.0:53:5353/udp"
      - "0.0.0.0:53:5353/tcp"
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"

  trap-smb:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
      args:
        SERVICE: smb
    ports:
      - "0.0.0.0:445:4450"
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"

  trap-telnet:
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
      args:
        SERVICE: telnet
    ports:
      - "0.0.0.0:23:2323"
    networks:
      - honeypot
      - internal
    restart: unless-stopped
    user: "1000:1000"

  redis:
    image: redis:7-alpine
    expose:
      - "6379"
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

networks:
  honeypot:
    driver: bridge
  internal:
    driver: bridge

```

## Implementation Steps

1. **Initialize monorepo root**
   - `pnpm init` at root
   - Create `pnpm-workspace.yaml` referencing `apps/*` and `packages/*`
   - Create `turbo.json` with build/dev/lint/test/typecheck pipelines
   - Create `tsconfig.base.json` with strict mode, path aliases

2. **Create shared packages**
   - `packages/shared`: types, Zod schemas, constants, utils
   - `packages/db`: Prisma schema (full schema above), PrismaClient singleton, seed script
   - `packages/response-engine`: placeholder barrel export
   - `packages/persona-engine`: placeholder barrel export
   - Each with `package.json` (name: `@llmtrap/<name>`) and `tsconfig.json` extending base

3. **Scaffold apps**
   - `apps/api`: `nest new` skeleton, wire up `@llmtrap/db` and `@llmtrap/shared`
   - `apps/web`: `pnpm create vite` with React + TS, add Tailwind + shadcn/ui + TanStack
   - `apps/worker`: minimal NestJS standalone app for BullMQ processors
   - `apps/node`: NestJS app with multi-port listener skeleton (consistent with api/worker)
<!-- Updated: Validation Session 1 - Node uses NestJS for monorepo consistency -->

4. **Docker files**
   - Multi-stage Dockerfiles (builder -> runner) for api, web, worker, node
   - `docker-compose.dashboard.yml` with api, web, worker, postgres, redis
   - `docker-compose.node.yml` with trap-core + protocol containers + redis
   - `.dockerignore` excluding node_modules, .env, .git, plans/

5. **CI/CD baseline**
   - GitHub Actions workflow: install -> lint -> typecheck -> build -> test
   - Runs on PR to `main`
   - Docker build verification (build images, don't push yet)

6. **Persona presets**
   - Create `personas/homelabber.json`, `startup.json`, `researcher.json`
   - Match PRD persona specs (GPU, OS, models, services, credentials)

7. **Verify everything compiles**
   - `pnpm install && pnpm build` passes
   - `pnpm lint` passes
   - `docker compose -f docker/docker-compose.dashboard.yml build` succeeds
   - Prisma generate + migrate works against local Postgres

## Todo List

- [ ] Init pnpm workspace + turbo.json
- [ ] Create tsconfig.base.json (strict mode)
- [ ] Create ESLint + Prettier configs
- [ ] Scaffold `packages/shared` with types, schemas, constants
- [ ] Scaffold `packages/db` with full Prisma schema
- [ ] Create seed script (admin user + 3 persona presets)
- [ ] Scaffold `packages/response-engine` (placeholder)
- [ ] Scaffold `packages/persona-engine` (placeholder)
- [ ] Scaffold `apps/api` (NestJS skeleton)
- [ ] Scaffold `apps/web` (React + Vite + Tailwind + shadcn)
- [ ] Scaffold `apps/worker` (BullMQ standalone)
- [ ] Scaffold `apps/node` (Express multi-port skeleton)
- [ ] Create `.env.example` with all env vars
- [ ] Write 4 Dockerfiles (multi-stage)
- [ ] Write `docker-compose.dashboard.yml`
- [ ] Write `docker-compose.node.yml`
- [ ] Create `.dockerignore`
- [ ] Create 3 persona preset JSON files
- [ ] Create GitHub Actions CI workflow
- [ ] Verify: `pnpm install && pnpm build` passes
- [ ] Verify: `pnpm lint` passes
- [ ] Verify: Docker images build successfully
- [ ] Verify: Prisma generate + migrate dev works

## Success Criteria

- `pnpm install` resolves all workspace dependencies
- `pnpm build` completes for all packages and apps with zero errors
- `pnpm lint` passes with zero warnings
- All tsconfig strict checks pass
- Prisma schema validates and `prisma generate` succeeds
- Docker Compose builds all images successfully
- CI workflow runs green on a test PR
- `packages/shared` importable from all apps

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Turborepo cache invalidation issues | Medium | Low | Pin turbo version, use `--force` in CI |
| Prisma schema too large for initial migration | Low | Low | Start with core tables, extend incrementally |
| pnpm workspace resolution conflicts | Medium | Medium | Use `workspace:*` protocol, explicit peer deps |
| Docker build context too large | Low | Low | Strict `.dockerignore`, multi-stage builds |

## Security Considerations

- `.env` files NEVER committed (added to `.gitignore`)
- Docker containers run as non-root `user: 1000:1000`
- PostgreSQL credentials only in `.env`, not hardcoded
- Prisma connection string via environment variable only
- All containers have resource limits (CPU + memory)
- Network isolation: honeypot containers cannot reach postgres directly

## Next Steps

After Phase 1 completes:
- **Phase 2** can start: NestJS auth + user mgmt + node mgmt modules + React dashboard shell
- **Phase 3** can start (parallel with Phase 2): Honeypot node protocol emulators + template engine

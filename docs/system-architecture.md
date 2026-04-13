# LLMTrap System Architecture

**Version:** 0.1.0  
**Last Updated:** April 13, 2026  
**Status:** Phase 1 Complete, Phase 2/3 Complete

---

## Architecture Overview

LLMTrap is a distributed honeypot platform consisting of two independent deployment stacks:

1. **Dashboard Stack** — Central management, analysis, threat intelligence
2. **Node Stack** — Distributed honeypot instances emulating LLM/AI services

Both stacks currently communicate via authenticated REST APIs for enrollment, configuration, heartbeat, and capture sync. This topology has been validated end-to-end in Docker with dashboard login, live node registration/approval, protocol responses, and capture persistence. Operator-facing real-time updates remain a later addition.

---

## Deployment Architecture

### Dashboard Stack (docker-compose.dashboard.yml)

Central command center running on a secure server.

Remote browsers and remote nodes do not connect directly to the API container. A public HTTPS ingress or reverse proxy fronts the dashboard host, serves the web app, and forwards operator and node REST traffic to the internal API service.

```
┌─────────────────────────────────────────────┐
│     Dashboard Stack (6 Services incl. init)  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Frontend (React + Vite)             │   │
│  │  Port: 3000 (browser)                │   │
│  └──────────────────────────────────────┘   │
│             ↓ (API calls only)               │
│  ┌──────────────────────────────────────┐   │
│  │  API (NestJS)                        │   │
│  │  Port: 4000 (internal)               │   │
│  │  Routes: /api/v1/*                   │   │
│  │  Health: /api/v1/health              │   │
│  └──────────────────────────────────────┘   │
│       ↓ (SQL + Cache)            ↓ (Jobs)  │
│  ┌────────────────┐         ┌──────────┐   │
│  │  PostgreSQL    │    │    Worker    │   │
│  │  Port: 5432    │    │  (BullMQ)    │   │
│  │  Volume: pgdata│    │  Jobs: archive,  │
│  └────────────────┘    │  enrichment,   │
│                        │  alerts      │   │
│                        └──────────────┘   │
│                              ↓            │
│                        ┌──────────────┐   │
│                        │  Redis Pub   │   │
│                        │  Port: 6379  │   │
│                        │  (cache+jobs)│   │
│                        └──────────────┘   │
│                                              │
│  Networks:                                   │
│  - backend: API ↔ DB ↔ Redis ↔ Worker      │
│  - frontend: Web ↔ API                      │
└─────────────────────────────────────────────┘
```

**Services:**
- **db-init** (one-shot bootstrap): Runs migrations and optional seed/bootstrap steps
- **api** (NestJS): Core business logic, REST endpoints
- **web** (React): Dashboard UI for operator workflows
- **worker** (BullMQ): Async jobs (enrichment, archival, alerts)
- **postgres**: Primary relational DB
- **redis**: Cache layer + message broker

**Networks:**
- `backend`: Isolated network for API ↔ DB ↔ Redis ↔ Worker
- `frontend`: Bridge network for Web ↔ API
- External HTTPS ingress: Terminates TLS and forwards public dashboard and node-control traffic to the internal API container

---

### Node Stack (docker-compose.node.yml)

Individual honeypot instances deployed at remote locations.

```
┌────────────────────────────────────────┐
│   Honeypot Node (2 Services)           │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  trap-core (NestJS)              │  │
│  │  Ports: 11434 / 8080 / 8081      │  │
│  │  - Ollama, OpenAI, Anthropic     │  │
│  │  - Request capture + logging     │  │
│  │  - Dashboard sync scheduler      │  │
│  │  Health: /internal/health        │  │
│  └──────────────────────────────────┘  │
│            ↓ (REST API)                 │
│  Dashboard (Remote via LLMTRAP_...)     │
│            ↓ (batch sync)               │
│  ┌──────────────────────────────────┐  │
│  │  Local Redis (Autonomous)        │  │
│  │  - Request spool queue           │  │
│  │  - Offline operation             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Networks:                              │
│  - honeypot: External traffic           │
│  - internal: trap-core ↔ Redis         │
└────────────────────────────────────────┘
```

**Services:**
- **trap-core** (NestJS): Multi-protocol emulator, request capture, local buffering
- **redis** (local): Autonomous operation when dashboard unreachable

**Networks:**
- `honeypot`: External-facing network (exposes Ollama/OpenAI/Anthropic listeners)
- `internal`: Node-to-Redis communication only

**Environment Variables:**
- `LLMTRAP_DASHBOARD_URL`: Dashboard enrollment URL
- `LLMTRAP_NODE_KEY`: Unique node shared secret used in the `x-node-key` header
- `NODE_HTTP_PORT`: Ollama/control-plane listener (default: 11434)
- `OPENAI_HTTP_PORT`: OpenAI-compatible listener (default: 8080)
- `ANTHROPIC_HTTP_PORT`: Anthropic-compatible listener (default: 8081)

---

## Monorepo Structure

```
llm-honeypot/
│
├── apps/                      # Deployable applications
│   ├── api/                   # NestJS dashboard API
│   ├── web/                   # React frontend
│   ├── worker/                # BullMQ job processor
│   └── node/                  # Honeypot node emulator
│
├── packages/                  # Shared libraries
│   ├── shared/                # Types, DTOs, Zod schemas, utils
│   ├── db/                    # Prisma ORM layer
│   ├── response-engine/       # Template matching + response generation
│   └── persona-engine/        # AI personality consistency logic
│
├── docker/                    # Container definitions
│   ├── Dockerfile.api         # NestJS API image
│   ├── Dockerfile.web         # React frontend image
│   ├── Dockerfile.worker      # BullMQ processor image
│   ├── Dockerfile.node        # Honeypot node image
│   ├── docker-compose.dashboard.yml
│   └── docker-compose.node.yml
│
├── personas/                  # JSON personality presets
│   ├── startup.json           # Startup AI assistant persona
│   ├── researcher.json        # Research codegen model
│   └── homelabber.json        # Hobbyist developer model
│
├── templates/                 # Starter response templates
│   └── core.json
│
├── turbo.json                 # Turborepo pipeline config
├── pnpm-workspace.yaml        # Workspace definition
└── package.json               # Root scripts
```

---

## Application Architecture

### apps/api (NestJS Backend)

**Modules (Current foundation):**
- `auth`: JWT sessions, refresh, TOTP, bootstrap registration
- `users`: Admin-managed user CRUD
- `nodes`: Node provisioning, registration, approval, config, heartbeat
- `capture`: Batch ingest and session grouping
- `audit`: Auth and control-plane audit events
- `health`: Liveness/readiness endpoints

**Modules (Planned next):**
- `analytics`, `alerts`, `export`, `response-config`, `threat-intel`

**Design Pattern:**
```
Controller → Service → Repository → Prisma
```

**Port:** 4000  
**Prefix:** `/api/v1`

---

### apps/web (React Frontend)

**Stack:**
- React 18 (functional components)
- Vite (HMR, instant builds)
- TanStack Router (manually declared route tree)
- TanStack Query (server state)
- Zustand (client state)
- shadcn/ui (Radix UI + Tailwind)
- Recharts (visualizations)

**Current routes:**
- `/login` — bootstrap/login/TOTP verification
- `/` — overview shell
- `/nodes` and `/nodes/:nodeId` — provisioning and config edits
- `/settings` — TOTP setup and operator settings foundation

**Port:** 3000  
**Bundle:** ~73 KB gzipped (target: <100 KB)

---

### apps/worker (BullMQ)

**Processors (Planned):**
- `archival`: Move old sessions to cold storage (S3)
- `enrichment`: VirusTotal, OSINT lookups
- `alerts`: Send notifications (webhook, email, Slack)
- `backfeed`: Sync threat intel from external feeds

**Redis Connection:** 6379 (shared with API)

---

### apps/node (NestJS Honeypot)

**Current runtime structure:**
```
apps/node/src/
   ├── app.module.ts            # Control-plane + Ollama listener
   ├── node-shared.module.ts    # Shared runtime providers
   ├── capture/                 # HTTP capture + Redis spool
   ├── runtime/                 # Shared process state
   ├── sync/                    # Registration/config/heartbeat/flush
   └── protocols/
         ├── ollama/
         ├── openai/
         └── anthropic/
```

**Ports:** 11434 (Ollama/control plane), 8080 (OpenAI-compatible), 8081 (Anthropic-compatible)  
**Health:** `/internal/health`  
**Local Redis:** Autonomous buffering when offline

---

## Package Architecture

### packages/shared

**Responsibilities:**
- Common TypeScript interfaces (Request, Response, Session, etc.)
- DTOs for API contracts (strict validation via Zod)
- Validation schemas (environment variables, API payloads)
- Constants (protocol ports, actor classifications)
- Utilities (hash, date formatting, log helpers)

**Key Exports:**
- `parseApiEnv()` — Validate API environment variables
- `parseNodeEnv()` — Validate node environment variables
- Zod schemas for all domain types

---

### packages/db (Prisma ORM)

**Schema Overview:**
```prisma
// Core entities
model User { ... }              // Dashboard users
model Node { ... }              // Honeypot instances
model Session { ... }           // Attack sessions
model Request { ... }           // Individual requests
model ResponseTemplate { ... }  // Response presets
model Persona { ... }           // AI personalities
model Alert { ... }             // Security alerts
model Actor { ... }             // Threat intel actors

// Relations managed via foreign keys
```

**Migrations:** Versioned in `prisma/migrations/`  
**Seed:** `prisma/seed.ts` for development data

---

### packages/response-engine

**Purpose:** Match incoming requests to response templates, stream simulated responses.

**Integration Points:**
- Loaded by `apps/node` during honeypot startup
- Generates fake LLM/service responses matching captured patterns
- Ensures responses are persona-consistent

---

### packages/persona-engine

**Purpose:** Manage AI personality state (model name, uptime, system prompt variations).

**Integration Points:**
- Currently a lightweight helper package; deeper startup integration remains future work
- Ensures all responses match the assigned persona
- Provides dynamic values (session IDs, uptime, computed fields)

---

## Data Flow Examples

### Attack Detection Flow

```
1. External attacker connects to Node (port 11434)
   ↓
2. Honeypot captures request (headers, body, path, IP, user agent)
   ↓
3. Request logged to local Redis (if offline)
   ↓
4. Response engine generates fake response (persona-consistent)
   ↓
5. Response streamed back to attacker
   ↓
6. When the dashboard is reachable, the local buffer is synced to PostgreSQL
   ↓
7. Dashboard groups captured requests into honeypot sessions during ingest
```

### Current Dashboard Control-Plane Flow

```
1. User logs into dashboard (Web)
   ↓
2. TanStack Query fetches control-plane routes such as `/api/v1/nodes` using the JWT issued by the auth module
   ↓
3. API queries PostgreSQL and returns envelope-shaped responses
   ↓
4. Dashboard renders login, overview, node management, and settings surfaces
   ↓
5. Rich session analytics and charts remain later-phase work
```

---

## Network Isolation

### Dashboard Stack Networks

**`backend`** (API ↔ DB ↔ Redis ↔ Worker)
- Internal only, no external access
- High-trust zone (all services communicate freely)

**`frontend`** (Web ↔ API)
- Web → API only (one-way routing)
- Web exposed to browser traffic

### Node Stack Networks

**`honeypot`** (External traffic)
- Exposes the Ollama, OpenAI-compatible, and Anthropic-compatible listeners
- Only `trap-core` service listens here

**`internal`** (trap-core ↔ Redis)
- Isolated, local communication only
- No external access

---

## Security Model (Current Foundation)

### Current State
- ✅ Network isolation via Docker networks
- ✅ Type-safe validation (Zod) at boundaries
- ✅ JWT-based operator authentication
- ✅ `x-node-key` shared-secret auth for node-to-dashboard sync
- 🔄 mTLS for node-to-dashboard enrollment (future hardening)
- 🔄 Encryption at rest for additional sensitive secrets remains future hardening
- ✅ Non-root runtime containers
- 🔄 Resource limits remain future hardening

### Threat Model
- **Honeypot compromise**: Services are sandboxed (no real shell, no real FS)
- **API compromise**: Isolated backend network prevents direct DB access
- **Persona leakage**: Response consistency validated locally before sync

---

## Performance Characteristics

### Build Performance (Phase 1)
- `pnpm install`: <10s (post-cache)
- `pnpm build`: <200ms per package via Turbo caching
- Web bundle: 225 KB → 73 KB gzipped (73% reduction)
- Type checking: 127ms (all packages)

### Runtime Performance (Expected)
- API response time: <100ms (80th percentile, local DB)
- Node request capture: <10ms latency
- Dashboard refresh: <1s (API + UI render)

---

## Future Considerations (Phase 2+)

1. **Multi-region**: Federated nodes with distributed PostgreSQL
2. **Kubernetes**: Move from Compose to K8s for scaling
3. **Streaming**: Optional operator-facing session updates via WebSocket or SSE
4. **Cold storage**: S3 integration for archived sessions
5. **API rate limiting**: Protect dashboard API from brute force
6. **Observability**: Prometheus metrics + ELK stack

---

## Related Documentation

- [Development Roadmap](./development-roadmap.md) — Phase timeline
- [Code Standards](./code-standards.md) — Development patterns
- [Project Changelog](./project-changelog.md) — Completed work

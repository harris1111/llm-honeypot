# LLMTrap System Architecture

**Version:** 0.1.0  
**Last Updated:** April 13, 2026  
**Status:** Phase 1 Complete (Scaffolding)

---

## Architecture Overview

LLMTrap is a distributed honeypot platform consisting of two independent deployment stacks:

1. **Dashboard Stack** — Central management, analysis, threat intelligence
2. **Node Stack** — Distributed honeypot instances emulating LLM/AI services

Both stacks communicate via REST API + WebSocket heartbeat for enrollment, heartbeat, and data sync.

---

## Deployment Architecture

### Dashboard Stack (docker-compose.dashboard.yml)

Central command center running on a secure server.

```
┌─────────────────────────────────────────────┐
│         Dashboard Stack (5 Services)         │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Frontend (React + Vite)             │   │
│  │  Port: 3000 (browser)                │   │
│  └──────────────────────────────────────┘   │
│            ↓ (API calls + WS)                │
│  ┌──────────────────────────────────────┐   │
│  │  API (NestJS)                        │   │
│  │  Port: 4000 (internal)               │   │
│  │  Routes: /api/v1/*                   │   │
│  │  Health: /internal/health            │   │
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
- **api** (NestJS): Core business logic, REST endpoints
- **web** (React): Dashboard UI, real-time updates
- **worker** (BullMQ): Async jobs (enrichment, archival, alerts)
- **postgres**: Primary relational DB
- **redis**: Cache layer + message broker

**Networks:**
- `backend`: Isolated network for API ↔ DB ↔ Redis ↔ Worker
- `frontend`: Bridge network for Web ↔ API

---

### Node Stack (docker-compose.node.yml)

Individual honeypot instances deployed at remote locations.

```
┌────────────────────────────────────────┐
│   Honeypot Node (2 Services)           │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  trap-core (NestJS)              │  │
│  │  Port: 11434 (external Ollama)  │  │
│  │  - HTTP/LLM server emulation     │  │
│  │  - Request capture + logging     │  │
│  │  - Persona consistency           │  │
│  │  Health: /internal/health        │  │
│  └──────────────────────────────────┘  │
│            ↓ (mTLS API)                 │
│  Dashboard (Remote via LLMTRAP_...)     │
│            ↓ (data sync)                │
│  ┌──────────────────────────────────┐  │
│  │  Local Redis (Autonomous)        │  │
│  │  - Request buffering             │  │
│  │  - Offline operation             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Networks:                              │
│  - honeypot: External traffic (11434)  │
│  - internal: trap-core ↔ Redis         │
└────────────────────────────────────────┘
```

**Services:**
- **trap-core** (NestJS): Multi-protocol emulator, request capture, local buffering
- **redis** (local): Autonomous operation when dashboard unreachable

**Networks:**
- `honeypot`: External-facing network (exposes port 11434)
- `internal`: Node-to-Redis communication only

**Environment Variables:**
- `LLMTRAP_DASHBOARD_URL`: Dashboard enrollment URL
- `LLMTRAP_NODE_KEY`: Unique node credentials (mTLS cert fingerprint)
- `NODE_HTTP_PORT`: Service port (default: 11434)

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
├── templates/                 # Response templates (500+)
│   └── (organized by protocol)
│
├── turbo.json                 # Turborepo pipeline config
├── pnpm-workspace.yaml        # Workspace definition
└── package.json               # Root scripts
```

---

## Application Architecture

### apps/api (NestJS Backend)

**Modules (Planned):**
- `auth`: JWT, OAuth, session management
- `nodes`: Node registration, heartbeat, lifecycle
- `sessions`: Captured attack session metadata
- `analytics`: Dashboards, charts, KPIs
- `alerts`: Threshold-based alerting
- `export`: CSV/JSON/API data export
- `response-config`: Response template management
- `threat-intel`: External feed integration

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
- TanStack Router (file-based routing)
- TanStack Query (server state)
- Zustand (client state)
- shadcn/ui (Radix UI + Tailwind)
- Recharts (visualizations)

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

**Module Structure:**
```
trap-core/
  ├── llm-module/      # Ollama/OpenAI/Claude emulation
  ├── mcp-module/      # MCP server emulation (Phase 3)
  ├── ssh-module/      # SSH trap (Phase 3)
  ├── ftp-module/      # FTP trap (Phase 3)
  ├── dns-module/      # DNS trap (Phase 3)
  ├── request-logger/  # Capture all requests
  ├── persona/         # Load persona-engine
  └── response/        # Load response-engine
```

**Port:** 11434 (Ollama-compatible)  
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
- Loaded by `apps/node` during honeypot startup
- Ensures all responses match the assigned persona
- Provides dynamic values (session IDs, uptime, computed fields)

---

## Data Flow Examples

### Attack Detection Flow

```
1. External attacker connects to Node (port 11434)
   ↓
2. Honeypot captures request (headers, body, IP, TLS fingerprint)
   ↓
3. Request logged to local Redis (if offline)
   ↓
4. Response engine generates fake response (persona-consistent)
   ↓
5. Response streamed back to attacker
   ↓
6. On dashboard reconnect, local buffer synced to PostgreSQL
   ↓
7. Worker enriches session with threat intelligence
   ↓
8. Alert triggered if threshold exceeded
   ↓
9. Dashboard visualizes attack session
```

### Dashboard Query Flow

```
1. User logs into dashboard (Web)
   ↓
2. TanStack Query fetches `/api/v1/sessions` (JWT from auth module)
   ↓
3. API queries PostgreSQL + Redis cache
   ↓
4. API returns paginated sessions with metadata
   ↓
5. Dashboard renders charts (Recharts) + session details
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
- Exposes port 11434 to the internet
- Only `trap-core` service listens here

**`internal`** (trap-core ↔ Redis)
- Isolated, local communication only
- No external access

---

## Security Model (Phase 1 Foundation)

### Current State (Phase 1)
- ✅ Network isolation via Docker networks
- ✅ Type-safe validation (Zod) at boundaries
- 🔄 JWT authentication scaffolding (Phase 2)
- 🔄 mTLS for node-to-dashboard enrollment (Phase 2)
- 🔄 Encryption at rest (Phase 2+)
- 🔄 Non-root containers (Phase 2)
- 🔄 Resource limits (Phase 2)

### Threat Model
- **Honeypot compromise**: Services are sandboxed (no real shell, no real FS)
- **API compromise**: Isolated backend network prevents direct DB access
- **BoltQR**: Messages expire quickly, no persistent message store
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
3. **Streaming**: Real-time session updates via WebSocket
4. **Cold storage**: S3 integration for archived sessions
5. **API rate limiting**: Protect dashboard API from brute force
6. **Observability**: Prometheus metrics + ELK stack

---

## Related Documentation

- [Development Roadmap](./development-roadmap.md) — Phase timeline
- [Code Standards](./code-standards.md) — Development patterns
- [Project Changelog](./project-changelog.md) — Completed work

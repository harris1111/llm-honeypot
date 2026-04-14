# LLMTrap Project Changelog

**Version:** 0.1.0-alpha  
**Last Updated:** April 14, 2026

---

## Multi-Page Public Docs Area — April 14, 2026

### Public Docs Experience
- Reworked the public docs surface into a multi-page docs area with `/docs`, `/docs/getting-started`, `/docs/deploy-dashboard`, `/docs/enroll-node`, and `/docs/smoke-tests`
- Added a reusable docs shell with a left sidebar on desktop plus in-page anchor navigation for the current page sections
- Moved the deeper operator walkthrough into typed in-app docs pages so the public web surface no longer hands users off immediately to repo markdown

### Documentation Sync
- Updated `README.md`, `docs/system-architecture.md`, `docs/development-roadmap.md`, `docs/shipped-app-testing-walkthrough.md`, and `LLMTrap-Requirements.md` to describe the multi-page `/docs` area
- Kept the repo walkthrough markdown aligned as the repository mirror of the in-app runbook instead of the only detailed public guide

### Validation Results
```
✅ pnpm --filter @llmtrap/web build
```

---

## Public Landing, Docs Home, And Dashboard Entry Split — April 14, 2026

### Public Web Surface
- Added a public landing page at `/` with shipped feature highlights, architecture summary, and clear operator CTA links
- Added a public docs page at `/docs` that now focuses on local quickstart, first-run flow, and walkthrough guidance for operators and evaluators
- Kept the operator login public at `/login` while moving the authenticated dashboard home to `/overview`

### Router And Operator Flow
- Split the web router into a public frame and an authenticated dashboard frame instead of branching on pathname checks inside one shell
- Added auth-aware redirects so authenticated visits to `/` or `/login` land on `/overview`
- Updated the login form to navigate to `/overview` after successful sign-in or TOTP verification
- Lazy-loaded protected dashboard route views so the public entry no longer eagerly ships the full operator surface

### Documentation Updates
- Updated `README.md` with the new public web entry points and protected dashboard route
- Updated `README.md`, `docs/system-architecture.md`, and `docs/shipped-app-testing-walkthrough.md` so `/docs` is described as a setup and walkthrough hub instead of a repository inventory page
- Updated `docs/system-architecture.md` to document the public landing/docs routes and lazy route delivery
- Updated `docs/development-roadmap.md`, `docs/shipped-app-testing-walkthrough.md`, and `LLMTrap-Requirements.md` to reflect the public onboarding split and `/overview` verification flow

### Validation Results
```
✅ pnpm --filter @llmtrap/web lint
✅ pnpm --filter @llmtrap/web typecheck
✅ pnpm --filter @llmtrap/web build
```

---

## Documentation Surface Refresh — April 14, 2026

### Contributor-Facing Docs
- Expanded the root `README.md` with a phase-by-phase feature map and a clearer guide to the apps, packages, and supporting directories
- Refreshed `docs/system-architecture.md` so the monorepo structure, control-plane flow, and supporting surfaces reflect the current public landing/docs split
- Updated `LLMTrap-Requirements.md` so the central dashboard description now includes the public landing/docs surfaces in front of the protected operator dashboard
- Tightened `docs/shipped-app-testing-walkthrough.md` so `/docs` verification now checks the quickstart and walkthrough surface instead of a repository explainer

---

## Cold Storage, Shared Live Feed, And Smoke Automation — April 14, 2026

### Cold Storage And Archive Retrieval
- Added `ArchiveManifest` persistence plus `archivedAt` / `archiveManifestId` tracking on sessions
- Implemented worker-side archival to S3-compatible storage using gzipped NDJSON bundles
- Exposed archive list and retrieval endpoints under the export module
- Extended the dashboard export route with archive bundle browsing and preview
- Prevented archived sessions from being reopened by later capture grouping

### Shared Real-Time Delivery And Local Stack Hardening
- Upgraded live-feed fan-out to Redis pub/sub so multiple API replicas receive the same captured events
- Added MinIO and bucket bootstrap to the local dashboard compose stack so archive smoke does not depend on external S3
- Added a local webhook smoke target contract through `WORKER_ALERT_WEBHOOK_URL=http://host.docker.internal:7780/smoke-alert`
- Allowed `ARCHIVE_RETENTION_DAYS=0` for immediate local archival during smoke validation
- Passed the archive timing envs through to the worker container and mapped `host.docker.internal` to the host gateway for local webhook smoke on Linux
- Fixed the namespaced live-feed gateway room cleanup so websocket publish does not crash the API process during smoke runs
- Fixed the local MinIO healthcheck to use `curl` because the pinned MinIO image does not ship `wget`
- Fixed the local `minio-init` bootstrap to run through `/bin/sh -c` so the archive bucket is actually created on the pinned `minio/mc` image
- Removed the API's hard dependency on MinIO health so storage-only startup issues do not block login, live-feed, or alert validation
- Tightened the websocket smoke to wait for the explicit `live-feed:subscribed` acknowledgement before asserting event delivery

### Repository-Owned Smoke Scripts
- Added `tests/smoke/live-feed-websocket.smoke.mjs` for authenticated Socket.IO live-feed validation
- Added `tests/smoke/alert-webhook.smoke.mjs` for end-to-end webhook alert delivery validation
- Added `tests/smoke/archive-retrieval.smoke.mjs` for archive list + retrieval validation
- Added root scripts `pnpm run test:smoke:*` for running the compose-backed smoke suite

### Validation Results
```
✅ pnpm --filter @llmtrap/shared lint
✅ pnpm --filter @llmtrap/shared typecheck
✅ pnpm --filter @llmtrap/shared build
✅ pnpm --filter @llmtrap/api test -- export.service.spec.ts capture.service.spec.ts live-feed.service.spec.ts live-feed.gateway.spec.ts
✅ pnpm --filter @llmtrap/api lint
✅ pnpm --filter @llmtrap/api typecheck
✅ pnpm --filter @llmtrap/api build
✅ pnpm --filter @llmtrap/worker test -- archive-processor.service.spec.ts alert-processor.service.spec.ts
✅ pnpm --filter @llmtrap/worker lint
✅ pnpm --filter @llmtrap/worker typecheck
✅ pnpm --filter @llmtrap/worker build
✅ pnpm --filter @llmtrap/web lint
✅ pnpm --filter @llmtrap/web typecheck
✅ pnpm --filter @llmtrap/web build
✅ docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml config
✅ node --check tests/smoke/*.mjs
```

---

## Webhook Alerts & WebSocket Live Feed — April 14, 2026

### External Alert Delivery (Webhook)
- Implemented worker-side webhook delivery with configurable URL endpoint
- POST requests include alert metadata (name, severity, cooldown, ruleId) and session payload (paths, service, classification, source IP, etc.)
- Tracks HTTP status codes and delivery timestamps in alert logs with success/failure markers
- Configurable timeout prevents hanging webhook requests (environ: `WORKER_ALERT_WEBHOOK_TIMEOUT_MS`)
- Suppression logic respects cooldown windows to avoid alert storms

### Real-Time Live Feed (WebSocket)
- Implemented Socket.IO gateway at `/api/v1/socket.io` with namespace `/live-feed`
- Authenticated connections require valid JWT bearer token in handshake auth or Authorization header
- Publishes events with classification, method, response code, service, source IP, actor ID, strategy tag, and timestamp
- Supports client-side filters: classification, nodeId, service, sourceIp (room-based routing for efficiency)
- REST endpoint `/api/v1/live-feed/events` provides polling fallback with same filter support
- Events stream 100 most recent captures when filtering

### Validation Results
```
✅ pnpm --filter @llmtrap/api test -- live-feed.service.spec.ts live-feed.gateway.spec.ts capture.service.spec.ts
✅ pnpm --filter @llmtrap/worker test -- alert-processor.service.spec.ts
✅ pnpm --filter @llmtrap/api lint
✅ pnpm --filter @llmtrap/api build
✅ pnpm --filter @llmtrap/web lint
✅ pnpm --filter @llmtrap/api typecheck
✅ pnpm --filter @llmtrap/web typecheck
✅ pnpm --filter @llmtrap/web build
✅ websocket connection auth and filter subscription verified
✅ webhook POST delivery and fallback logging confirmed
```

---

## Phase 5/6 Partial Execution — April 14, 2026

### Response Strategy Execution & Backfeed Queue
- Implemented node-side response strategy execution supporting `smart`, `fixed_n`, and `budget` routing modes
- Added runtime strategy orchestration that evaluates template coverage, applies budget guards, and falls back safely when proxy routing fails
- Hardened node response routing with fallback cascading and capture-level strategy tagging for observability
- Added API manual backfeed endpoints and template review queue using existing `ResponseTemplate` records with `autoGenerated=true` and `approved=false` flags
- Wired approved templates into node config snapshots so reviewed candidates participate in live routing

### Dashboard Response Engine Route
- Added new `/response-engine` dashboard route for operators to review, approve, and reject backfeed candidates
- Integrated template review workflows into node response-config visibility
- Exposed node context and queue state for manual backfeed review without leaving the dashboard

### Filterable Threat-Intel Controls
- Enhanced threat-intel API endpoints (blocklist, IOC, MITRE, STIX) with node, classification, service, source IP, time-window, and limit filters
- Added dashboard threat-intel filter UI for operator-driven filtering across the same supported fields
- Corrected STIX export identifiers to use standards-compatible `type--UUID` values

### Validation Results
```
✅ pnpm --filter @llmtrap/response-engine build
✅ pnpm --filter @llmtrap/api lint
✅ pnpm --filter @llmtrap/api typecheck
✅ pnpm --filter @llmtrap/api test
✅ pnpm --filter @llmtrap/node test
✅ pnpm --filter @llmtrap/node typecheck
✅ pnpm --filter @llmtrap/web build
✅ pnpm --filter @llmtrap/web lint
✅ pnpm typecheck
✅ pnpm build
```

### Remaining Phase 5/6 Scope
- Durable budget accounting for proxy routing beyond the current in-memory guard
- Additional external alert channels (Telegram, Discord, email)
- Richer persona consistency validation, replay workflows, and broader operator automation
- Repository-owned browser e2e automation

---

## Documentation And Walkthrough Update — April 14, 2026

### Cross-Platform Local Testing Guide
- Added `docs/shipped-app-testing-walkthrough.md` as the canonical local walkthrough for the currently shipped slice
- Documented Windows PowerShell, macOS bash, and Linux bash commands for dashboard startup, node provisioning, node approval, node startup, representative protocol probes, dashboard verification, and teardown
- Linked the root `README.md` to the walkthrough so the short quickstart no longer has to duplicate the full testing flow
- Added a repo rule that future user-testable feature changes must update the walkthrough in the same change

---

## Phase 4 Completion — April 13, 2026

### Full Protocol Matrix Landed
- Added raw-protocol capture plumbing and a protocol listener manager inside the node runtime so non-HTTP services flow through the existing capture pipeline
- Added RAG bait services for Qdrant, ChromaDB, Neo4j, Weaviate, and Milvus plus homelab bait services for Plex, Sonarr, Radarr, Prowlarr, Portainer, Home Assistant, Gitea, Grafana, Prometheus, and Uptime Kuma
- Added traditional listeners for SSH, FTP, SMTP, DNS, SMB, and Telnet with persona-shaped shell/file responses and decoy node-key bait instead of the real dashboard secret
- Hardened the node Docker stack with writable runtime-directory SSH host-key caching and dedicated `HOST_*` traditional port remaps for Windows-safe local smoke validation

### Validation Results
```
✅ pnpm --filter @llmtrap/node test
✅ pnpm --filter @llmtrap/node build
✅ pnpm --filter @llmtrap/node lint
✅ pnpm typecheck
✅ pnpm test
✅ pnpm build
✅ docker compose --env-file docker/node-compose.env.example -f docker/docker-compose.node.yml up -d --build
✅ Docker smoke: Qdrant /collections
✅ Docker smoke: Grafana /api/health
✅ Docker smoke: Milvus bait /v1/vector/collections
✅ Docker smoke: SSH 20022, FTP 20021, SMTP 20025, SMTP submission 20587, Telnet 20023, SMB 20445, DNS 20053/udp
```

### Remaining Gaps
- Runtime proxy routing, backfeed/template review, and cross-container template distribution remain open
- External alert channels remain open beyond webhook delivery
- Repository-level browser e2e automation is still absent (`tests/e2e` remains empty)

---

## Phase 4/5/6 Expansion — April 13, 2026

### Protocol And Node Surface Expansion
- Added new node listeners for LM Studio, llama.cpp, vLLM, text-generation-webui, LangServe, and AutoGPT
- Added MCP well-known and JSON-RPC honeypot routes plus a broad IDE/config bait surface for Claude, Cursor, Continue, Aider, Copilot, Roo, Windsurf, Streamlit, Terraform, and common secret files
- Expanded the node Docker image and compose stack to expose the additional listener ports

### Dashboard API And Worker Intelligence
- Added API modules for personas, response-config, analytics, sessions, actors, alerts, threat-intel, export/report, and live-feed
- Added worker processors for session classification, actor correlation, IP enrichment, and alert-log materialization, plus worker health/status reporting
- Added actor merge/split workflows, export/report generation, and polling live-feed APIs with audit logging on operator actions

### Dashboard UI Expansion
- Replaced placeholder control-plane gaps with routes for sessions, personas, actors, alerts, threat intel, export preview, and live feed
- Extended the dashboard client/hooks layer to consume the new API modules and surface operator-facing summaries for response config, actors, alerts, threat intel, export outputs, and recent request events

### Validation Results
```
✅ pnpm --filter @llmtrap/worker test
✅ pnpm --filter @llmtrap/worker build
✅ pnpm --filter @llmtrap/api test
✅ pnpm --filter @llmtrap/api build
✅ pnpm --filter @llmtrap/web build
✅ pnpm typecheck
✅ pnpm test
✅ pnpm build
✅ docker compose -f docker/docker-compose.dashboard.yml config
✅ docker compose -f docker/docker-compose.node.yml config
```

### Remaining Gaps
- Runtime proxy routing, backfeed/template review, and cross-container template distribution remain open
- External alert channels, shared live-feed fan-out hardening, and cold-storage automation moved forward in later April 14 work
- Repository-level browser e2e automation remains open

---

## Automated Test Hardening — April 13, 2026

### Dashboard API And Node Coverage
- Replaced placeholder `test` scripts in `apps/api` and `apps/node` with real Vitest suites
- Added focused API service coverage for auth rate limiting, TOTP challenge flow, refresh-session rotation, capture key validation, de-duplication, and session grouping
- Added focused node service coverage for runtime state transitions, dashboard client request/envelope handling, and lifecycle registration/config/heartbeat/flush behavior
- Added package-local Vitest typecheck configs so the new test files are validated by `tsc`, not only executed by Vitest
- Made the API test harness hermetic by overriding the exported Prisma client in test setup so unstubbed Prisma calls fail fast instead of touching a developer database

### Validation Results
```
✅ pnpm --filter @llmtrap/api test
✅ pnpm --filter @llmtrap/node test
✅ pnpm --filter @llmtrap/api typecheck
✅ pnpm --filter @llmtrap/node typecheck
✅ pnpm test
✅ pnpm build
```

---

## Phase 2/3 Completion — April 13, 2026

### Dashboard Control Plane
- Added shared API envelopes plus auth, node, persona, and capture contracts in `@llmtrap/shared`
- Implemented NestJS modules for auth, users, nodes, capture, audit, and health
- Added first-user bootstrap, JWT refresh sessions, hashed refresh-token storage, rate-limited login, and TOTP setup/enable/verify flows
- Added admin-facing user CRUD and node provisioning/approval/configuration APIs
- Added capture batch ingestion with session grouping on the dashboard side

### Dashboard UI
- Replaced the Phase 1 placeholder page with a routed React control plane using TanStack Router, TanStack Query, and Zustand
- Added login/bootstrap flow, overview metrics shell, node list/detail views, and settings page
- Wired TOTP verification during login and authenticator setup in settings
- Fixed the web package dependency graph so shared contracts resolve cleanly from the frontend

### Honeypot Node Core
- Replaced the node stub with a control-plane runtime that registers with the dashboard, refreshes config, sends REST heartbeats, and flushes captures
- Added Redis-backed local spooling for pending captures
- Expanded `@llmtrap/response-engine` into a basic template loader/router with keyword matching and variable substitution
- Added starter templates in `templates/core.json`
- Implemented Ollama-compatible, OpenAI-compatible, and Anthropic-compatible listeners with protocol-specific streaming formats

### Validation Results
```
✅ pnpm lint
✅ pnpm typecheck
✅ pnpm build
✅ pnpm test (current workspace scripts are placeholder smoke commands)
✅ Docker smoke: dashboard API health + seeded-admin login
✅ Docker smoke: live node provisioning + approval + ONLINE heartbeat
✅ Runtime smoke: Ollama /api/tags
✅ Runtime smoke: OpenAI /v1/models + /v1/chat/completions
✅ Runtime smoke: Anthropic /v1/models + /v1/messages
✅ Dashboard persistence smoke: 3 captured requests + 3 grouped sessions, node buffer depth 0
```

### Follow-up Gaps
- Invite workflow and richer dashboard analytics remain open
- Full protocol coverage and stronger node hardening remain Phase 4/5 follow-up work

---

## Phase 1 Completion — April 13, 2026

### Infrastructure Setup
- ✅ Initialized pnpm monorepo with workspace configuration
- ✅ Installed Turborepo for orchestrated builds, linting, and type checking
- ✅ Configured TypeScript strict mode across all packages
- ✅ Set up ESLint and Prettier for code formatting and linting

### Applications & Packages Created

#### Apps
- **`apps/api`**: NestJS backend for dashboard (port 4000)
  - HTTP server bootstrap configured
  - Module framework in place for domain-driven design
  
- **`apps/web`**: React + Vite frontend (port 3000)
  - Vite dev server configuration
  - TypeScript strict mode enabled
  
- **`apps/worker`**: BullMQ job processor
  - Background job infrastructure ready
  - Redis integration configured
  
- **`apps/node`**: NestJS honeypot node server (port 11434, Ollama default)
  - Multi-port protocol emulation scaffolding
  - Health check endpoints configured

#### Packages
- **`packages/shared`**: Shared types, DTOs, validation schemas
  - Zod runtime validation library integrated
  - Environment variable schemas
  - Common constants and utilities
  
- **`packages/db`**: Prisma ORM layer
  - Database schema defined
  - Client generation working
  - Seed script framework ready
  
- **`packages/response-engine`**: Template matching and response generation
  - Package scaffolding complete
  - Integration hooks prepared
  
- **`packages/persona-engine`**: Persona consistency logic
  - Package scaffolding complete
  - Integration hooks prepared

### Infrastructure & Deployment
- ✅ **Docker Compose: Dashboard Stack** (`docker/docker-compose.dashboard.yml`)
  - `db-init`: One-shot bootstrap for migrations and optional seed flow
  - `api`: NestJS backend with health checks
  - `web`: React frontend with Vite
  - `worker`: BullMQ processor
  - `postgres`: PostgreSQL database (pgdata volume)
  - `redis`: Cache and BullMQ/job-queue backing
  - Network isolation: `backend` (API/DB/Redis) + `frontend` (Web/API)

- ✅ **Docker Compose: Node Stack** (`docker/docker-compose.node.yml`)
  - `trap-core`: Honeypot emulator (port 11434)
  - `redis`: Local cache for node autonomy
  - Network isolation: `honeypot` (external) + `internal` (node-to-redis)

- ✅ Docker Dockerfile scaffolds created for all 4 applications

### Database & Schemes
- ✅ Prisma schema initialized with core tables:
  - `User` (dashboard users)
  - `Node` (honeypot instances)
  - `Session` (attack sessions captured)
  - `Request` (individual requests logged)
  - `ResponseTemplate` (response presets)
  - `Persona` (AI personality profiles)
  - `Alert` (security alerts)
  - `Actor` (threat intelligence actors)

### Build & CI/CD
- ✅ Turbo pipeline configuration with task dependencies:
  - `build`: Compiles all packages, respects dependency graph
  - `dev`: Parallel development servers for all apps
  - `lint`: Runs ESLint across all packages
  - `test`: Unit test pipeline (framework ready, tests TBD)
  - `typecheck`: TypeScript validation across all packages
  
- ✅ Workspace hoisting via pnpm for monorepo dependency management

### Validation Results

#### Build Verification (April 13, 2026)
```
✅ pnpm install --frozen-lockfile: Reproducible builds confirmed
✅ pnpm lint: All 8 packages pass (130ms cached)
✅ pnpm typecheck: Zero type errors across all packages (127ms cached)
✅ pnpm build: All packages compile successfully (<200ms per package)
✅ Web bundle: 225.91 KB → 73.45 KB gzipped (35% of original)
```

#### Docker Configuration Validation
```
✅ docker compose -f docker/docker-compose.dashboard.yml config
   Valid: 5 services, 2 networks
   
✅ docker compose -f docker/docker-compose.node.yml config
   Valid: 2 services, 2 networks (isolated honeypot environment)
```

---

## Known Issues & Deprecations

### Minor Warnings
- **Prisma Config Location**: Schema location in `package.json` generates a Prisma deprecation warning (non-blocking). Recommended migration: move to `prisma.config.ts` in a follow-up maintenance pass.

### Post-Phase-2/3 Hardening TODOs (Non-blocking)
1. Docker resource limits (CPU, memory) remain to be enforced
2. Additional container hardening beyond the current non-root runtime images remains to be completed

---

## Dependency Summary

### Core Runtime
- **Node.js**: ^22.0.0
- **pnpm**: 10.10.0 (monorepo manager)
- **Turbo**: 2.5.3 (build orchestration)

### Framework Stack
- **NestJS**: ^10.x (backend framework)
- **React**: ^18.x (frontend)
- **Vite**: Latest (frontend bundler)
- **TypeScript**: 5.8.3 (strict mode)
- **Prisma**: 6.6.0 (ORM)
- **Zod**: 3.24.4 (validation)

### Development Tools
- **ESLint**: 8.57.1 (linting)
- **Prettier**: 3.5.3 (formatting)
- **tsx**: 4.19.3 (TypeScript executor)

---

## Breaking Changes

**None.** This is the initial release (0.1.0-alpha).

---

## Performance Notes

- **Install time**: <10s (post-cache) vs. 60s target ✅
- **Build time**: <200ms per package vs. 90s total target ✅
- **Lint performance**: 130ms via Turbo caching
- **Type check performance**: 127ms via Turbo caching

---

## Next Steps

1. **Phase 5 (Intelligence Engine)**: Add smart response routing, proxy/backfeed, and deeper classification
2. **Phase 6 (Threat Intel & Alerts)**: Add feeds, alerts, reporting, and cold-storage automation
3. **Automation Hardening**: Add repository-owned e2e and smoke suites for the expanded protocol matrix

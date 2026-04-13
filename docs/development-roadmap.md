# LLMTrap Development Roadmap

**Project Version:** 0.1.0  
**Last Updated:** April 13, 2026  
**Status:** Phase 1 Complete, Phase 2/3 Complete, Phase 4 Complete, Phase 5/6 In Progress

---

## Executive Summary

LLMTrap is an open-source, multi-protocol AI honeypot platform for security research. Phase 1 established the monorepo and deployment baseline. Phase 2 and Phase 3 are complete, Phase 4 is now complete, and the current milestone is carrying Phase 5/6 slices across the dashboard API, worker, and dashboard UI: operator analytics/persona/actor views, background classification/enrichment/alert processing, and threat-intel/export/live-feed surfaces.

---

## Phase Overview

### Phase 1: Monorepo Setup ✅ Complete

**Objective:** Scaffold infrastructure for all subsequent phases.  
**Timeline:** Complete (April 13, 2026)
**Validation Status:** All checks passed

#### Deliverables
- ✅ pnpm workspaces with 4 apps + 4 packages
- ✅ Turborepo build pipelines (`build`, `dev`, `lint`, `test`, `typecheck`)
- ✅ Prisma schema with core tables (users, nodes, sessions, requests, templates, personas, alerts)
- ✅ Docker Compose configs (dashboard + node stacks)
- ✅ Shared packages (types, DTOs, validation, environment)
- ✅ TypeScript strict mode + ESLint + Prettier
- ✅ All build commands verified: `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`
- ✅ Docker Compose configs validated

#### Test Results
| Command | Status | Duration |
|---------|--------|----------|
| `pnpm install --frozen-lockfile` | ✅ PASS | Reproducible |
| `pnpm lint` | ✅ PASS | ~130ms (cached) |
| `pnpm typecheck` | ✅ PASS | ~127ms (cached) |
| `pnpm build` | ✅ PASS | <200ms per package |
| `docker compose` (dashboard) | ✅ PASS | Valid config |
| `docker compose` (node) | ✅ PASS | Valid config |

---

### Phase 2: Dashboard Foundation ✅ Complete

**Objective:** Implement dashboard API + basic UI shell.  
**Timeline:** Complete (April 13, 2026)
**Status:** Dashboard foundation validated

#### Landed Deliverables
- Auth flows: first-user bootstrap, login, refresh/logout, TOTP challenge/setup/enable
- API modules: auth, users, nodes, capture, audit, health
- Node lifecycle endpoints: register, approve, config pull, REST heartbeat, capture batch ingest
- React shell: login, overview, nodes list/detail, settings, auth state, node CRUD workflows
- Shared envelopes/contracts exported through `@llmtrap/shared`

#### Deferred Follow-up Work
- Admin invite workflow and richer user lifecycle UX
- Broader API test coverage and dashboard analytics surfaces
- Optional WebSocket operator updates beyond the current REST heartbeat/control-plane baseline

---

### Phase 3: Honeypot Node Core ✅ Complete

**Objective:** Implement multi-protocol honeypot node.  
**Timeline:** Complete (April 13, 2026)
**Status:** Core runtime validated

#### Landed Deliverables
- Shared runtime state and control-plane scheduler for registration, config refresh, heartbeat, and capture flush
- Redis-backed local capture queue with dashboard batch sync
- Template loader/router in `@llmtrap/response-engine` plus starter templates
- Multi-listener Nest runtime exposing Ollama on `11434`, OpenAI-compatible on `8080`, and Anthropic-compatible on `8081`
- Runtime health/status reporting and protocol request capture plumbing

#### Deferred Follow-up Work
- Broader protocol coverage beyond the initial Ollama/OpenAI/Anthropic slice
- Stronger fingerprint extraction, session analytics, and load/perf hardening
- More exhaustive node integration and smoke automation

---

### Phase 4: Full Protocol Coverage ✅ Complete

**Objective:** Add all target protocol emulators.  
**Timeline:** Complete (April 13, 2026)  
**Status:** Full protocol matrix validated

#### Landed Deliverables
- LM Studio, llama.cpp, vLLM, text-generation-webui, LangServe, and AutoGPT listeners added to the node runtime
- MCP JSON-RPC and well-known endpoints added on the node control-plane port
- High-value IDE/config honeypot file paths added for Claude, Cursor, Continue, Aider, Copilot, Roo, Windsurf, Streamlit, Terraform, and common secret/config bait
- RAG bait endpoints added for Qdrant, ChromaDB, Neo4j, Weaviate, and Milvus
- Homelab bait services added for Plex, Sonarr, Radarr, Prowlarr, Portainer, Home Assistant, Gitea, Grafana, Prometheus, and Uptime Kuma
- Traditional protocol listeners added for SSH, FTP, SMTP, DNS, SMB, and Telnet using raw capture plumbing plus persona-shaped shell/file responses
- Node Docker image and compose file expanded to expose the new listener surfaces, including dedicated `HOST_*` remaps for traditional services during local Docker smoke on Windows

#### Follow-up Hardening
- Higher-fidelity native wire-protocol behavior for services that currently use lightweight bait responses
- Broader automated socket-level smoke coverage and capture-label assertions
- Additional container/runtime isolation tuning if specific traditional listeners are later split out of the current `trap-core` process

---

### Phase 5: Intelligence Engine 🚧 In Progress

**Objective:** Response strategies, proxy routing, and deeper classification.
**Status:** Partially landed

#### Landed Deliverables
- Dashboard API modules for personas, response config, analytics, sessions, and actors
- Dashboard routes for sessions, personas, actors, and node response-config visibility
- Worker processors for session classification, actor correlation, IP enrichment, and alert-log materialization
- Actor merge/split APIs with audit logging and operator-facing actor inventory views

#### Remaining Scope
- Response strategy execution beyond stored config
- Generic OpenAI-compatible proxy routing
- Backfeed/template review queue and runtime template distribution
- Configurable classification rules and richer persona consistency workflows

---

### Phase 6: Threat Intel & Alerts 🚧 In Progress

**Objective:** Threat intel, alerts, reporting, and storage automation.
**Status:** Partially landed

#### Landed Deliverables
- Threat-intel API for blocklist preview, IOC feed, MITRE summary, and STIX bundle generation
- Alerts API plus worker-side rule evaluation and alert-log materialization
- Export/report API for markdown, HTML, JSON, and CSV outputs
- Dashboard routes for alerts, threat intel, export preview, and polling-based live feed
- Worker health endpoint now reports degraded state when background processors fail

#### Remaining Scope
- External alert channel delivery (Telegram, Discord, email, webhook)
- Cold-storage archival and retrieval
- WebSocket-based live feed beyond the current polling implementation
- CI/CD and open-source release preparation

---

## Success Metrics by Phase

### Phase 1 (Completed Baseline) ✅
- ✅ All packages compile with zero errors
- ✅ Frozen lockfile reproducibility
- ✅ Build time: <200ms per package
- ✅ Web bundle: ~73 KB gzipped
- ✅ Docker validation: both compose configs valid

### Phase 2/3 (Completed Milestone)
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass across the monorepo
- `pnpm test` passes for the current workspace test surface (placeholder package scripts; deeper coverage remains future work)
- Docker smoke confirms dashboard health, seeded-admin login, live node provisioning/approval, and protocol-shaped Ollama/OpenAI-compatible/Anthropic-compatible responses
- Latest runtime smoke persisted `3` captured requests across `3` grouped sessions and drained the node buffer back to `0`

### Phase 4/5/6 (Current In-Progress Slice)
- `pnpm typecheck` passes across all workspace packages after protocol, worker, API, and web additions
- `pnpm test` passes with `@llmtrap/node` at 35 tests, `@llmtrap/api` at 19 tests, and `@llmtrap/worker` at 8 tests
- `pnpm build` passes across the monorepo after the new worker/API/web slices
- `docker compose -f docker/docker-compose.dashboard.yml config` passes with required env provided
- `docker compose -f docker/docker-compose.node.yml config` passes with required env provided
- Docker smoke validates the new Phase 4 listeners through representative probes for Qdrant, Grafana, Milvus bait, SSH, FTP, SMTP, SMTP submission, Telnet, SMB, and DNS on the published node ports
- No repository-level e2e or smoke scripts exist yet; `tests/e2e` and `tests/smoke` are currently empty

---

## Known Constraints & Notes

### Current Hardening (Non-blocking)
1. Prisma config migration from `package.json` → `prisma.config.ts` (cosmetic deprecation warning)
2. Docker resource limits not yet enforced (CPU, memory)
3. Broader container-runtime hardening remains follow-up work beyond the current non-root images
4. Dashboard analytics deepening and runtime template/proxy distribution remain follow-up work after the current Phase 5/6 slice

### Architecture Decisions
- **NestJS for all backend:** Unified framework for API, node, and worker services
- **React + Vite for web:** Fast HMR, minimal bundle size
- **Prisma ORM:** Type-safe database layer
- **Docker Compose for local/single-node:** Simpler than Kubernetes for Phase 1

---

## Quick Start

```bash
# Install dependencies (pnpm required)
pnpm install --frozen-lockfile

# Development (all apps in parallel)
pnpm dev

# Build all packages
pnpm build

# Run linter
pnpm lint

# Type check all packages
pnpm typecheck

# Build Docker services
docker compose -f docker/docker-compose.dashboard.yml build
docker compose -f docker/docker-compose.node.yml build
```

---

## Related Documentation

- [System Architecture](./system-architecture.md) — Infrastructure & service topology
- [Code Standards](./code-standards.md) — Development conventions & patterns
- API surface: currently defined by `@llmtrap/shared` contracts and the NestJS controllers; standalone API reference remains future work

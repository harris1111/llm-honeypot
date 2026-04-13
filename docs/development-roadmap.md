# LLMTrap Development Roadmap

**Project Version:** 0.1.0  
**Last Updated:** April 13, 2026  
**Status:** Phase 1 Complete, Phase 2/3 Core Milestone In Progress

---

## Executive Summary

LLMTrap is an open-source, multi-protocol AI honeypot platform for security research. Phase 1 established the monorepo and deployment baseline. The current milestone has now landed the Phase 2 dashboard control-plane foundation and the Phase 3 node-core runtime slice: authenticated operator flows, node registration/config/capture APIs, a React dashboard shell, and a multi-listener honeypot node with Ollama, OpenAI-compatible, and Anthropic-compatible emulation backed by Redis spooling.

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

### Phase 2: Dashboard Foundation (In Progress)

**Objective:** Implement dashboard API + basic UI shell.  
**Timeline:** In progress (April 13, 2026)  
**Status:** Core foundation landed

#### Landed Deliverables
- Auth flows: first-user bootstrap, login, refresh/logout, TOTP challenge/setup/enable
- API modules: auth, users, nodes, capture, audit, health
- Node lifecycle endpoints: register, approve, config pull, REST heartbeat, capture batch ingest
- React shell: login, overview, nodes list/detail, settings, auth state, node CRUD workflows
- Shared envelopes/contracts exported through `@llmtrap/shared`

#### Remaining Closure Work
- Admin invite workflow and richer user lifecycle UX
- Broader API test coverage and dashboard analytics surfaces
- Optional WebSocket operator updates beyond the current REST heartbeat/control-plane baseline

---

### Phase 3: Honeypot Node Core (In Progress)

**Objective:** Implement multi-protocol honeypot node.  
**Timeline:** In progress (April 13, 2026)  
**Status:** Core runtime landed

#### Landed Deliverables
- Shared runtime state and control-plane scheduler for registration, config refresh, heartbeat, and capture flush
- Redis-backed local capture queue with dashboard batch sync
- Template loader/router in `@llmtrap/response-engine` plus starter templates
- Multi-listener Nest runtime exposing Ollama on `11434`, OpenAI-compatible on `8080`, and Anthropic-compatible on `8081`
- Runtime health/status reporting and protocol request capture plumbing

#### Remaining Closure Work
- Broader protocol coverage beyond the initial Ollama/OpenAI/Anthropic slice
- Stronger fingerprint extraction, session analytics, and load/perf hardening
- More exhaustive node integration and smoke automation

---

### Phase 4: Full Protocol Coverage (Planned)

**Objective:** Add all target protocol emulators.  
**Est. Timeline:** Following Phase 3  
**Status:** Blocked

#### Scope
- SSH, FTP, SMTP, DNS, SMB trap services
- MCP server emulation
- AI IDE config listening (Cursor, Windsurf, etc.)
- RAG database simulation

---

### Phase 5: Intelligence Engine (Planned)

**Objective:** Backfeed analysis + enrichment.  
**Status:** Blocked

#### Scope
- Threat intelligence correlation
- Artifact enrichment (VirusTotal, OSINT)
- Alert engine + notification channels
- Session replay + video capture

---

### Phase 6: Threat Intel & Alerts (Planned)

**Objective:** External threat feeds + alerting.  
**Status:** Blocked

#### Scope
- Third-party feed integrations
- Webhook + email alerts
- Dashboard real-time updates

---

## Success Metrics by Phase

### Phase 1 (Current) ✅
- ✅ All packages compile with zero errors
- ✅ Frozen lockfile reproducibility
- ✅ Build time: <200ms per package
- ✅ Web bundle: ~73 KB gzipped
- ✅ Docker validation: both compose configs valid

### Phase 2/3 (Current Milestone)
- Auth, node CRUD, and capture-control routes compile and typecheck cleanly
- Dashboard UI renders login, node management, and settings flows without type errors
- Node runtime boots three listeners and returns protocol-shaped responses for Ollama, OpenAI-compatible, and Anthropic-compatible probes
- Redis-backed buffering and dashboard sync codepaths compile cleanly

---

## Known Constraints & Notes

### Current Hardening (Non-blocking)
1. Prisma config migration from `package.json` → `prisma.config.ts` (cosmetic deprecation warning)
2. Docker resource limits not yet enforced (CPU, memory)
3. Non-root user enforcement pending for broader runtime hardening
4. Dashboard analytics, invite flows, and broader protocol coverage remain open before Phase 2/3 can be marked complete

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
- [API Documentation](./api-documentation.md) — Endpoint specifications (TBD for Phase 2)

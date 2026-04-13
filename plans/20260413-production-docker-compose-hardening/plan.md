---
title: "Production Docker/Compose Hardening"
description: "Minimal plan to make the current monorepo Dockerfiles and compose stacks boot reliably and behave correctly in production-like environments."
status: pending
priority: P1
effort: 5h
branch: feat/fullstack/dashboard-node-core
tags: [docker, compose, production, infra]
created: 2026-04-13
---

# Production Docker/Compose Hardening

## Goal
- Make the dashboard stack bootstrap Postgres schema before app traffic.
- Remove the web container's implicit `localhost` API dependency.
- Keep node compose testable with explicit dashboard wiring, without broad image refactors.

## Phases
1. [Phase 1: Dashboard Bootstrap And Readiness](./phase-01-dashboard-bootstrap-and-readiness.md)
   Outcome: `db-init` runs once, `api` and `worker` wait for schema readiness, health checks become meaningful.
2. [Phase 2: Web Production Connectivity](./phase-01-dashboard-bootstrap-and-readiness.md#phase-2-web-production-connectivity)
   Outcome: browser traffic stays same-origin through nginx; `VITE_API_BASE_URL` remains an override.
3. [Phase 3: Node Compose Env Hygiene](./phase-01-dashboard-bootstrap-and-readiness.md#phase-3-node-compose-env-hygiene)
   Outcome: node stack stays bootable and testable with an explicit dashboard target.

## Minimum File Changes
- `docker/docker-compose.dashboard.yml`
- `apps/web/src/lib/api-client.ts`
- `docker/Dockerfile.web`
- `docker/nginx.web.conf` (new)
- `docker/docker-compose.node.yml`

## Likely Breakpoints
- No Prisma migrations exist today. If `prisma db push` is unacceptable for prod, add a baseline migration and swap to `prisma migrate deploy`.
- `depends_on.condition: service_completed_successfully` requires modern Docker Compose. If unavailable, move schema init into an entrypoint or bootstrap script.
- If deployments must keep the API on another origin, preserve `VITE_API_BASE_URL` and treat nginx proxying as the compose default, not the only mode.

## Validation Sequence
1. `pnpm build`
2. `docker compose -f docker/docker-compose.dashboard.yml config`
3. `docker compose -f docker/docker-compose.dashboard.yml up -d postgres redis db-init`
4. Confirm `db-init` exits `0`, then `docker compose -f docker/docker-compose.dashboard.yml up -d api worker web`
5. Probe `http://localhost:4000/api/v1/health`, `http://localhost:3000/`, `http://localhost:3000/api/v1/health`, and worker `http://localhost:4100/internal/health` if exposed temporarily or via `exec`
6. `docker compose -f docker/docker-compose.node.yml config`
7. `docker compose -f docker/docker-compose.node.yml up -d` with explicit `LLMTRAP_DASHBOARD_URL`, then probe `http://localhost:11434/internal/health`

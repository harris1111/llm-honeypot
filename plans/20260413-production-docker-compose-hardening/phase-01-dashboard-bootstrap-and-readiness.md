# Phase 1: Dashboard Bootstrap And Readiness

## Context Links
- [docker/Dockerfile.api](../../docker/Dockerfile.api)
- [docker/Dockerfile.web](../../docker/Dockerfile.web)
- [docker/Dockerfile.worker](../../docker/Dockerfile.worker)
- [docker/Dockerfile.node](../../docker/Dockerfile.node)
- [docker/docker-compose.dashboard.yml](../../docker/docker-compose.dashboard.yml)
- [docker/docker-compose.node.yml](../../docker/docker-compose.node.yml)
- [apps/web/src/lib/api-client.ts](../../apps/web/src/lib/api-client.ts)
- [packages/db/prisma/schema.prisma](../../packages/db/prisma/schema.prisma)
- [packages/db/prisma/seed.ts](../../packages/db/prisma/seed.ts)
- [packages/shared/src/schemas/env-schema.ts](../../packages/shared/src/schemas/env-schema.ts)
- [apps/api/src/main.ts](../../apps/api/src/main.ts)
- [apps/node/src/config/node-runtime-config.ts](../../apps/node/src/config/node-runtime-config.ts)
- [apps/worker/src/main.ts](../../apps/worker/src/main.ts)

## Overview
- Priority: P1
- Current status: pending
- Brief: keep the existing images and service topology, add only the missing bootstrap and proxy pieces required for reliable compose startup.

## Key Insights
- Postgres can become healthy before any schema exists; the current dashboard compose file has no schema bootstrap step.
- The web bundle falls back to `http://localhost:4000/api/v1`, which breaks for any remote browser hitting a deployed container.
- The current API and worker images already copy `node_modules` and `packages/`, so a one-shot Prisma bootstrap can likely reuse the API image without adding a new Dockerfile.
- The node stack already tolerates dashboard outages at runtime, but its compose default still points at a placeholder URL, which weakens testability.

## Requirements
- Functional: dashboard stack must bring up Postgres, Redis, schema init, API, worker, and web in a deterministic order.
- Functional: browser calls from the production web container must reach the API without relying on browser-local `localhost`.
- Functional: node compose must remain bootable and expose a clear contract for dashboard connectivity.
- Non-functional: keep changes minimal, reuse current ports, and avoid broad image optimization work in this slice.

## Architecture
- Dashboard data flow: browser -> web nginx -> `/api/*` proxy -> API -> Postgres/Redis.
- Bootstrap flow: `postgres` healthy -> `db-init` applies schema and optional seed -> `api` and `worker` start -> `web` waits for API health.
- Node flow: trap-core control plane -> dashboard API via `LLMTRAP_DASHBOARD_URL`; local Redis buffers captures if sync fails.
- Backwards compatibility: preserve existing ports, API routes, `VITE_API_BASE_URL` override, and optional seed envs.

## Related Code Files
- Modify: `docker/docker-compose.dashboard.yml`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `docker/Dockerfile.web`
- Modify: `docker/docker-compose.node.yml`
- Create: `docker/nginx.web.conf`
- Likely unchanged: `docker/Dockerfile.api`, `docker/Dockerfile.worker`, `docker/Dockerfile.node`

## Implementation Steps
1. Add an image-sharing contract in `docker/docker-compose.dashboard.yml` so `api` and a new `db-init` service can reuse the same built image tag.
2. Add `db-init` as a one-shot service that waits for Postgres, runs `prisma db push --schema packages/db/prisma/schema.prisma`, then runs `tsx packages/db/prisma/seed.ts` when seed envs are present.
3. Gate `api` and `worker` on `db-init` success plus existing Postgres/Redis health.
4. Tighten `web` startup to depend on API health rather than `service_started`; add a simple web health check if nginx tooling is available.
5. Change the web client fallback base URL from `http://localhost:4000/api/v1` to `/api/v1`; keep `VITE_API_BASE_URL` as an override for local Vite dev or cross-origin deployments.
6. Add `docker/nginx.web.conf` with SPA fallback and `/api/` proxying to `http://api:4000` on the backend network.
7. Update `docker/Dockerfile.web` to copy the custom nginx config into the runtime image.
8. In `docker/docker-compose.node.yml`, remove the misleading placeholder default for `LLMTRAP_DASHBOARD_URL` or replace it with an explicitly documented required value; keep current health checks and port mappings intact.

## Todo List
- [ ] Add one-shot DB bootstrap to dashboard compose.
- [ ] Gate API and worker startup on schema readiness.
- [ ] Make web use same-origin API calls by default.
- [ ] Add nginx proxy config for `/api/`.
- [ ] Clarify node compose dashboard URL contract.
- [ ] Smoke-test both compose files with the recommended sequence.

## Success Criteria
- `docker compose -f docker/docker-compose.dashboard.yml config` resolves without errors.
- `db-init` exits successfully on a clean Postgres volume and leaves API tables present.
- `api`, `worker`, `postgres`, and `redis` become healthy; `web` serves the SPA and proxies `/api/v1/health` successfully.
- The browser can load the web app from a non-localhost host and still reach the API.
- `docker compose -f docker/docker-compose.node.yml up -d` boots the node stack with an explicit dashboard URL and a healthy control-plane endpoint.

## Risk Assessment
- High: `prisma db push` is stateful but not migration-audited. Mitigation: use it only as the minimum bootstrap path; switch to baseline migrations if production change control is required.
- Medium: Compose implementations differ on `service_completed_successfully`. Mitigation: validate on the project target version first; fallback to entrypoint bootstrap if needed.
- Medium: nginx proxy misconfiguration could hide API failures behind 502s. Mitigation: validate direct API health and proxied API health separately.
- Low: node compose default removal may break ad hoc local runs that relied on a fake placeholder. Mitigation: add a clear `.env` example or README note during implementation if needed.

## Test Matrix
- Unit: none required for compose wiring; the only code change is a trivial web fallback constant.
- Integration: `pnpm build`; dashboard compose `config`, `build`, clean-volume `up`; direct and proxied health probes; schema presence check.
- End-to-end: register/login through the proxied web app against the dockerized API; optional node registration smoke once a real dashboard URL is supplied.

## Rollback Plan
- Revert `docker/docker-compose.dashboard.yml` to remove `db-init` and startup gating.
- Revert the web client fallback and remove the custom nginx proxy config.
- Revert `docker/docker-compose.node.yml` env contract changes if they block current local workflows.
- Destroy test volumes with `docker compose down -v` to return to a clean pre-bootstrap state.

## Security Considerations
- Do not bake secrets into Dockerfiles; keep JWT, DB, and seed credentials in compose env or env files.
- Keep the API proxied on the internal Docker network; avoid exposing worker internals unless needed for debug.
- Treat seed admin credentials as optional bootstrap-only inputs, never hardcoded defaults.

## Phase 2: Web Production Connectivity
- Primary files: `apps/web/src/lib/api-client.ts`, `docker/Dockerfile.web`, `docker/nginx.web.conf`, `docker/docker-compose.dashboard.yml`.
- Failure mode addressed: deployed SPA calling the end user's own `localhost` instead of the containerized API.
- Done when: direct API and proxied API both respond, and the SPA can authenticate without a host-specific API URL override.

## Phase 3: Node Compose Env Hygiene
- Primary file: `docker/docker-compose.node.yml`.
- Failure mode addressed: false-positive startup using a placeholder dashboard URL that will never register successfully.
- Done when: the compose file makes the dashboard dependency explicit, while the node control plane still reaches a healthy state and logs sync failures instead of crashing.

## Next Steps
1. Implement Phase 1 and validate `db-init` on a clean Postgres volume before touching the web image.
2. Implement Phase 2 and verify proxied API calls from the browser.
3. Apply the small node compose cleanup and run the final dual-compose smoke test.

## Unresolved Questions
- Does the target deployment environment guarantee a Docker Compose version that supports `service_completed_successfully`?
- Should the first production-ready slice accept `prisma db push`, or is a baseline Prisma migration required immediately?

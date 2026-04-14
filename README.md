# LLMTrap

LLMTrap is an open-source multi-protocol AI honeypot for security research. It is designed to emulate attractive AI infrastructure targets, capture malicious or opportunistic traffic, and give the operator a dashboard for reviewing sessions, nodes, and captured requests.

The repository currently ships the Phase 1 to Phase 4 slice, with partial Phase 5 and Phase 6 work:

- a dashboard stack built with NestJS, React, PostgreSQL, Redis, and a worker process
- a honeypot node that registers with the dashboard, syncs config, sends heartbeats, and uploads captures
- AI-facing listeners for Ollama, OpenAI-compatible, Anthropic-compatible, LM Studio, text-generation-webui, LangServe, llama.cpp, vLLM, and AutoGPT
- MCP and IDE/config bait surfaces, RAG bait services, homelab bait services, and traditional listeners for SSH, FTP, SMTP, DNS, SMB, and Telnet
- Node-side response strategy execution, manual backfeed/template review queue, approved runtime template sync, and filterable threat-intel controls
- Prisma migrations, Docker Compose bootstrap, and focused Vitest coverage for key API and node services

Phase 5 and Phase 6 work on proxy routing, alert delivery, cold storage, and deeper operator automation is ongoing.

## Current status

- Phase 1: complete
- Phase 2: complete
- Phase 3: complete
- Phase 4: complete
- Phase 5: in progress (response strategies + backfeed landed)
- Phase 6: in progress (threat-intel, alerts, live feed, archives, and smoke harness landed)

## Feature map by phase

| Phase | Status | Shipped outcome |
|---|---|---|
| 1 | Complete | Monorepo, shared packages, Prisma schema, and Docker Compose baseline |
| 2 | Complete | Dashboard auth, node lifecycle APIs, operator shell, and the public web entry split |
| 3 | Complete | Node registration, capture buffering, config sync, and initial AI protocol listeners |
| 4 | Complete | Expanded AI, MCP, IDE bait, RAG, homelab, and traditional protocol coverage |
| 5 | In progress | Response strategies, personas, actors, backfeed, and response-engine workflows |
| 6 | In progress | Threat intel, alerts, live feed, archive retrieval, export tooling, and smoke automation |

What is implemented today:

- dashboard auth, users, nodes, capture, audit, and health modules
- dashboard UI with a public landing page at `/`, a multi-page public docs area under `/docs`, operator login at `/login`, overview at `/overview`, plus nodes, sessions, actors, personas, alerts, threat intel, export, live feed, and settings
- node registration, config refresh, REST heartbeat, and capture batching
- Redis-backed local capture spooling on the node
- protocol-shaped responses for the AI HTTP surfaces plus MCP/IDE bait, RAG bait, homelab bait, and traditional protocol traps
- node-side response strategy routing (smart, fixed_n, budget) with template fallback and approved runtime template sync
- API-side template review queue and Response Engine dashboard route
- filterable threat-intel endpoints and dashboard controls for blocklist, IOC, MITRE, and STIX export
- webhook alert delivery with configurable timeout and HTTP status tracking
- websocket live-feed transport (namespace: `/live-feed`) with Redis-backed multi-instance fan-out, polling fallback, and filter support
- cold-storage archive manifests, S3-compatible retrieval endpoints, and archive preview inside the dashboard export route
- repository-owned smoke scripts for live-feed WebSocket delivery, webhook alert delivery, and archive retrieval
- local dashboard Docker bootstrap with MinIO-backed archive storage and a host-routable webhook smoke target

What is not implemented yet:

- durable budget accounting for proxy routing beyond the current in-memory guard
- external alert delivery (Telegram, Discord, email beyond webhook)
- richer dashboard analytics and invite workflows
- repository-owned browser e2e automation for the expanded listener matrix

## Architecture

LLMTrap is split into two Docker Compose stacks:

1. Dashboard stack
	 Includes the API, web UI, worker, PostgreSQL, Redis, MinIO, and one-shot bootstrap containers for DB and bucket setup.
2. Node stack
	 Includes the honeypot runtime plus local Redis for capture buffering when the dashboard is unavailable.

Current control-plane flow:

- the node registers with the dashboard using a node key
- the dashboard approves the node and serves node config
- the node exposes protocol listeners, captures requests, and uploads batches back to the dashboard
- the dashboard groups captures into sessions for operator review

## Repository layout

```text
apps/
	api/       NestJS dashboard API
	web/       React/Vite public landing, docs home, and dashboard UI
	worker/    worker bootstrap and future background jobs
	node/      honeypot runtime
packages/
	shared/            shared contracts, schemas, utilities
	db/                Prisma schema, migrations, seed
	response-engine/   response routing/templates
	persona-engine/    persona helpers
docker/
	docker-compose.dashboard.yml
	docker-compose.node.yml
docs/
plans/
tests/
templates/
personas/
```

## Repository surfaces

### Deployable apps

- `apps/api` runs the NestJS control-plane API for auth, node lifecycle, capture ingest, exports, alerts, threat intel, and archives.
- `apps/web` serves the React/Vite web app: public landing at `/`, public docs home plus in-app walkthrough pages under `/docs`, login at `/login`, and the protected dashboard at `/overview` and below.
- `apps/worker` runs background processing for alert delivery, archive creation, and future enrichment-style workloads.
- `apps/node` hosts the honeypot runtime that exposes bait protocols, captures requests, and syncs with the dashboard.

### Shared packages

- `packages/shared` contains shared DTOs, schemas, constants, and utilities used across the monorepo.
- `packages/db` owns the Prisma schema, migrations, and database exports.
- `packages/response-engine` provides the template and response-routing primitives used by the node runtime.
- `packages/persona-engine` keeps persona-specific hardware, model, and uptime claims internally consistent.

### Supporting directories

- `docker/` contains the Dockerfiles, compose stacks, env templates, and bootstrap scripts for dashboard and node deployments.
- `templates/` contains shipped starter response templates.
- `personas/` contains built-in personas such as `homelabber`, `researcher`, and `startup`.
- `tests/` contains smoke coverage today and the future browser e2e surface.
- `docs/` contains the architecture reference, roadmap, changelog, and shipped-app walkthrough.
- `plans/` contains implementation plans and research reports for shipped and in-flight work.

## Prerequisites

For local work you should have:

- Node.js 22+
- pnpm 10.10.0+
- Docker Desktop or Docker Engine with modern Compose support

Useful ports in the default setup:

- `3000` dashboard web UI
- `4000` dashboard API
- `11434` Ollama-compatible node endpoint
- `1234` LM Studio listener
- `8080` OpenAI-compatible node endpoint
- `8081` Anthropic-compatible node endpoint
- `6333` Qdrant bait endpoint
- `3002` Grafana bait endpoint
- `9001` MinIO S3 API
- `9002` MinIO console
- `19530` Milvus HTTP bait endpoint
- `20021`, `20022`, `20023`, `20025`, `20053/udp`, `20445`, `20587` traditional Docker host remaps for FTP, SSH, Telnet, SMTP, DNS, SMB, and SMTP submission

## Quick start with Docker

For the full current walkthrough, including Windows, macOS, and Linux commands for provisioning a node, generating representative traffic, and verifying the shipped dashboard routes, use the in-app docs area under `/docs` alongside [docs/shipped-app-testing-walkthrough.md](docs/shipped-app-testing-walkthrough.md).

### 1. Start the dashboard stack

For local development, the shortest path is the committed local env file:

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build
```

That file seeds a local bootstrap admin for Docker-only testing:

- Email: `admin@llmtrap.local`
- Password: `ChangeMe123456!`

After startup, verify:

- Web UI: `http://localhost:3000`
- Public landing: `http://localhost:3000/`
- Public docs: `http://localhost:3000/docs`
- Operator login: `http://localhost:3000/login`
- Operator overview: `http://localhost:3000/overview`
- API health: `http://localhost:4000/api/v1/health`
- Proxied API health: `http://localhost:3000/api/v1/health`

Notes:

- `docker/dashboard-compose.env.example` is a reference template, not the recommended local quickstart
- the example env intentionally does not seed an admin user
- `JWT_SECRET` is required for any non-local deployment
- the committed local env also provisions a MinIO bucket for archive smoke and targets `http://host.docker.internal:7780/smoke-alert` for webhook smoke; the worker compose service maps that hostname to the host gateway for same-host Linux testing

### Public web entry points

The shipped web app now exposes two public routes before the authenticated dashboard:

- `/` for the product landing page and shipped feature summary
- `/docs` for the docs home and runbook index

The public docs area then splits into dedicated pages for the main local tasks:

- `/docs/getting-started` for prerequisites, ports, credentials, and route map
- `/docs/deploy-dashboard` for dashboard compose boot and health checks
- `/docs/enroll-node` for node creation, approval, and runtime startup
- `/docs/smoke-tests` for probes, dashboard verification, smoke scripts, and teardown

Protected operator routes remain under the dashboard shell:

- `/login` for authentication
- `/overview` for the operator dashboard home after sign-in

### 2. Create a node in the dashboard

After logging into the web UI:

1. Open the Nodes view.
2. Create a node record.
3. Copy the returned `nodeKey`.
4. Approve the pending node in the dashboard. The local walkthrough uses immediate approval before the first connect to shorten setup, but approving after first connect also works unless you have explicitly enabled auto-approval.

You will use that key to start the honeypot node stack.

### 3. Start the node stack

For same-host Docker Desktop testing on Windows, the dashboard URL should usually point at `host.docker.internal`:

```powershell
$env:LLMTRAP_DASHBOARD_URL='http://host.docker.internal:4000'
$env:LLMTRAP_NODE_KEY='replace-with-issued-node-key'
docker compose -f docker/docker-compose.node.yml up -d --build
```

Or use your own env file derived from `docker/node-compose.env.example`.

If you want a command-driven node provisioning flow instead of clicking through the UI, the same steps are now rendered in-app under `/docs/enroll-node` and remain mirrored in [docs/shipped-app-testing-walkthrough.md](docs/shipped-app-testing-walkthrough.md).

Important:

- nodes default to `PENDING`
- the node runtime only continues into config refresh, heartbeats, and capture upload after the node is approved and becomes `ONLINE`
- if you want fully automatic approval in non-local environments, configure that intentionally rather than assuming it is the default

After startup, verify:

- Node health: `http://localhost:11434/internal/health`
- Ollama-compatible version: `http://localhost:11434/api/version`
- OpenAI-compatible models: `http://localhost:8080/v1/models`
- Qdrant bait collections: `http://localhost:6333/collections`
- Grafana bait health: `http://localhost:3002/api/health`

For local Windows Docker validation, the traditional listeners publish through the `HOST_*` remaps from `docker/node-compose.env.example` by default:

- SSH: `localhost:20022`
- FTP: `localhost:20021`
- SMTP: `localhost:20025`
- SMTP submission: `localhost:20587`
- Telnet: `localhost:20023`
- SMB: `localhost:20445`
- DNS: `localhost:20053/udp`

For server or multi-host deployment, set `LLMTRAP_DASHBOARD_URL` to the reachable dashboard origin instead of `host.docker.internal`.

## Local development

Install dependencies:

```powershell
pnpm install
```

Useful workspace commands:

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm run test:smoke:live-feed
pnpm run test:smoke:alerts
pnpm run test:smoke:archive
```

Repository-level scripts are orchestrated through Turborepo from the root `package.json`.

## Testing and validation

The current repo includes focused automated coverage for key API and node services using Vitest, including the Phase 4 runtime config inventory plus representative shell, RAG, and homelab helper coverage in `apps/node`.

For a current end-to-end operator walkthrough of the shipped slice, including dashboard login, node approval, probe traffic, and route checks, use [docs/shipped-app-testing-walkthrough.md](docs/shipped-app-testing-walkthrough.md).

Validated commands for the current shipped slice:

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

The current real automated coverage is concentrated in the API and node packages, especially around:

- auth session and rate-limit behavior
- capture ingestion de-duplication and session grouping
- node runtime state
- node dashboard API client request/envelope handling
- node lifecycle registration, config, heartbeat, and flush behavior
- Phase 4 config inventory, shell bait rendering, and representative RAG/homelab payload shaping

The worker package now has focused Vitest coverage; the web package is the only remaining placeholder test script in the workspace.

Repository-owned smoke scripts now live in `tests/smoke/` and assume the compose-backed dashboard and node walkthrough is already running. The alert smoke script starts its own local receiver on port `7780`; keep that port free when invoking it.

Recent Docker smoke for the shipped Phase 4 slice validated:

- Qdrant `/collections`
- Grafana `/api/health`
- Milvus bait `/v1/vector/collections`
- SSH `20022`, FTP `20021`, SMTP `20025`, SMTP submission `20587`, Telnet `20023`, SMB `20445`, DNS `20053/udp`

## Shutdown and reset

Stop both stacks:

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down --remove-orphans
docker compose --env-file path-to-your-node-compose.env -f docker/docker-compose.node.yml down --remove-orphans
```

For the node stack, reuse the same env file or exported variables that you used for `up` so Compose can still resolve `LLMTRAP_DASHBOARD_URL` and `LLMTRAP_NODE_KEY`.

Reset local Docker data, including Postgres volume state:

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down -v --remove-orphans
docker compose --env-file path-to-your-node-compose.env -f docker/docker-compose.node.yml down -v --remove-orphans
```

## Documentation

For deeper project context:

- `LLMTrap-Requirements.md` at the repo root for broader product direction and future intent
- `docs/shipped-app-testing-walkthrough.md` for the current Windows, macOS, and Linux local test flow
- `docs/system-architecture.md` for the as-built architecture overview
- `docs/development-roadmap.md` for milestone status
- `docs/project-changelog.md` for shipped changes and validation history
- `plans/260413-0930-llmtrap-implementation/` for the phase plans

## Roadmap

The next milestones are the remaining Phase 5 and Phase 6 slices: response routing hardening, richer classification/persona workflows, additional external alert channels, and repository-owned browser e2e coverage for the expanded protocol matrix.


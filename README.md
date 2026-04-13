# LLMTrap

LLMTrap is an open-source multi-protocol AI honeypot for security research. It is designed to emulate attractive AI infrastructure targets, capture malicious or opportunistic traffic, and give the operator a dashboard for reviewing sessions, nodes, and captured requests.

The repository currently ships the Phase 1 to Phase 3 core slice:

- a dashboard stack built with NestJS, React, PostgreSQL, Redis, and a worker process
- a honeypot node that registers with the dashboard, syncs config, sends heartbeats, and uploads captures
- Ollama-compatible, OpenAI-compatible, and Anthropic-compatible HTTP listeners
- Prisma migrations, Docker Compose bootstrap, and focused Vitest coverage for key API and node services

Broader protocol coverage, intelligence/backfeed, alerts, and richer operator analytics are planned for later phases.

## Current status

- Phase 1: complete
- Phase 2: complete
- Phase 3: complete
- Phase 4 to 6: planned

What is implemented today:

- dashboard auth, users, nodes, capture, audit, and health modules
- dashboard UI for login, overview, nodes, and settings
- node registration, config refresh, REST heartbeat, and capture batching
- Redis-backed local capture spooling on the node
- protocol-shaped responses for Ollama, OpenAI-compatible, and Anthropic-compatible surfaces

What is not implemented yet:

- SSH, FTP, SMTP, DNS, SMB, MCP, IDE, and RAG full coverage
- richer dashboard analytics and invite workflows
- full threat-intel, backfeed, alerting, and cold-storage automation

## Architecture

LLMTrap is split into two Docker Compose stacks:

1. Dashboard stack
	 Includes the API, web UI, worker, PostgreSQL, Redis, and a one-shot `db-init` bootstrap container.
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
	web/       React/Vite dashboard UI
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
templates/
personas/
```

## Prerequisites

For local work you should have:

- Node.js 22+
- pnpm 10.10.0+
- Docker Desktop or Docker Engine with modern Compose support

Useful ports in the default setup:

- `3000` dashboard web UI
- `4000` dashboard API
- `11434` Ollama-compatible node endpoint
- `8080` OpenAI-compatible node endpoint
- `8081` Anthropic-compatible node endpoint

## Quick start with Docker

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
- API health: `http://localhost:4000/api/v1/health`
- Proxied API health: `http://localhost:3000/api/v1/health`

Notes:

- `docker/dashboard-compose.env.example` is a reference template, not the recommended local quickstart
- the example env intentionally does not seed an admin user
- `JWT_SECRET` is required for any non-local deployment

### 2. Create a node in the dashboard

After logging into the web UI:

1. Open the Nodes view.
2. Create a node record.
3. Copy the returned `nodeKey`.
4. After the node first connects, approve it in the dashboard unless you have explicitly enabled auto-approval.

You will use that key to start the honeypot node stack.

### 3. Start the node stack

For same-host Docker Desktop testing on Windows, the dashboard URL should usually point at `host.docker.internal`:

```powershell
$env:LLMTRAP_DASHBOARD_URL='http://host.docker.internal:4000'
$env:LLMTRAP_NODE_KEY='replace-with-issued-node-key'
docker compose -f docker/docker-compose.node.yml up -d --build
```

Or use your own env file derived from `docker/node-compose.env.example`.

Important:

- nodes default to `PENDING`
- the node runtime only continues into config refresh, heartbeats, and capture upload after the node is approved and becomes `ONLINE`
- if you want fully automatic approval in non-local environments, configure that intentionally rather than assuming it is the default

After startup, verify:

- Node health: `http://localhost:11434/internal/health`
- Ollama-compatible version: `http://localhost:11434/api/version`
- OpenAI-compatible models: `http://localhost:8080/v1/models`

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
```

Repository-level scripts are orchestrated through Turborepo from the root `package.json`.

## Testing and validation

The current repo includes focused automated coverage for key API and node services using Vitest.

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

The web and worker packages still use placeholder test scripts.

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

- `LLMTrap-Requirements.md` for the broader product direction
- `docs/system-architecture.md` for the as-built architecture overview
- `docs/development-roadmap.md` for milestone status
- `plans/260413-0930-llmtrap-implementation/` for the phase plans

## Roadmap

The next planned milestone is Phase 4: full protocol coverage. That work is intentionally not folded into the current README claims, because the current repository only ships the core Phase 1 to Phase 3 slice.


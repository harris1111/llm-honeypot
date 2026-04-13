# llm-honeypot

## Docker Compose

### Dashboard stack

The dashboard stack builds the API, web UI, worker, Postgres, and Redis. It also runs a one-shot `db-init` container that applies the Prisma schema and optionally seeds an admin account before the app services start.
At this phase, Redis is also the only queue backend in the Docker infra surface. There is no separate RabbitMQ or Kafka service in the repo yet.

The schema bootstrap now uses committed Prisma migrations via `prisma migrate deploy`.
If you already initialized a persistent Postgres volume with the older `prisma db push` flow, the new bootstrap path will baseline that schema before continuing.

`JWT_SECRET` is required. Do not rely on a compose default for production.

For a clean local Docker-only startup with a working admin login, use `docker/dashboard-compose.local.env`.

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build
```

Local bootstrap credentials from that file:

- Email: `admin@llmtrap.local`
- Password: `ChangeMe123456!`

The env templates at `docker/dashboard-compose.env.example` and `docker/node-compose.env.example` are references. Replace every placeholder before using those values in a real env file or shell session.
In particular, `docker/dashboard-compose.env.example` intentionally leaves `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` blank, so a fresh database started with that file will expose the dashboard but will not create a loginable bootstrap admin.

```powershell
$env:POSTGRES_DB='llmtrap'
$env:POSTGRES_USER='postgres'
$env:POSTGRES_PASSWORD='postgres'
$env:JWT_SECRET='12345678901234567890123456789012'
$env:SEED_ADMIN_EMAIL='admin@llmtrap.local'
$env:SEED_ADMIN_PASSWORD='ChangeMe123456!'
docker compose -f docker/docker-compose.dashboard.yml up -d --build
```

You can also put those values in your own env file derived from `docker/dashboard-compose.env.example`.

Validated endpoints:

- Web UI: `http://localhost:3000`
- API health: `http://localhost:4000/api/v1/health`
- Proxied API health: `http://localhost:3000/api/v1/health`

To obtain a node key for the separate honeypot stack, sign in to the dashboard, create a node record, and use the returned `nodeKey` value for the node env file.

### Honeypot node stack

Create a node in the dashboard first to get a `nodeKey`, then start the node stack against the dashboard origin.

The `host.docker.internal:4000` example below is for same-host Docker Desktop testing. For server or multi-host deployment, point `LLMTRAP_DASHBOARD_URL` at the reachable dashboard origin instead.

```powershell
$env:LLMTRAP_DASHBOARD_URL='http://host.docker.internal:4000'
$env:LLMTRAP_NODE_KEY='replace-with-issued-node-key'
docker compose -f docker/docker-compose.node.yml up -d --build
```

Before starting the node stack, replace `LLMTRAP_NODE_KEY` with the real key issued by the dashboard. You can also keep those values in your own env file derived from `docker/node-compose.env.example`.

Validated endpoints:

- Node health: `http://localhost:11434/internal/health`
- Ollama-compatible version: `http://localhost:11434/api/version`
- OpenAI-compatible models: `http://localhost:8080/v1/models`

### Shutdown

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down --remove-orphans
docker compose -f docker/docker-compose.node.yml down --remove-orphans
```

### Reset local data

Use this only when you want to wipe the local Postgres volume and start from a clean database again.

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down -v --remove-orphans
docker compose -f docker/docker-compose.node.yml down -v --remove-orphans
```


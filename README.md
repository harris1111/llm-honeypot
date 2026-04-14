# LLMTrap

Open-source AI honeypot platform. Deploy fake AI infrastructure, capture attacker traffic, analyze it in a dashboard.

## What it does

LLMTrap emulates the AI endpoints attackers probe for — Ollama, OpenAI, Anthropic, vLLM, LM Studio, vector databases, MCP servers, and more — alongside traditional services like SSH, FTP, SMTP, and DNS. Every request is captured, grouped into sessions, and surfaced in an operator dashboard.

## Architecture

Two Docker Compose stacks on a single server:

```
┌─────────────────────────────────────────────────┐
│ Dashboard Stack                                 │
│  API (NestJS) + Web UI (React) + Worker         │
│  PostgreSQL + Redis + MinIO                     │
└────────────────────┬────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────┐
│ Node Stack                                      │
│  9 AI surfaces + MCP/IDE bait + RAG bait        │
│  Homelab bait + SSH/FTP/SMTP/DNS/SMB/Telnet     │
│  Local Redis buffer                             │
└─────────────────────────────────────────────────┘
```

## Quick start

### 1. Start the dashboard

```bash
docker compose --env-file dashboard.env -f docker/docker-compose.dashboard.yml up -d --build
```

### 2. Create and approve a node

```bash
# Login
TOKEN=$(curl -s -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@llmtrap.local","password":"YOUR_PASSWORD"}' \
  | jq -r '.data.tokens.accessToken')

# Create
curl -s -X POST http://127.0.0.1:4000/api/v1/nodes \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"prod-node-1","config":{}}'

# Approve (use the node ID from the response)
curl -s -X POST http://127.0.0.1:4000/api/v1/nodes/NODE_ID/approve \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Start the node

The node uses host networking so it can see real attacker IPs on incoming connections. On the same host, point `LLMTRAP_DASHBOARD_URL` at `http://127.0.0.1:4000`.

```bash
docker compose --env-file node.env -f docker/docker-compose.node.yml up -d --build
```

### 4. Verify

```bash
curl http://127.0.0.1:4000/api/v1/health   # API
curl http://127.0.0.1:3000                   # Web UI
curl http://127.0.0.1:11434/api/version      # Fake Ollama
```

## Bait surfaces

| Port | Protocol | What attackers see |
|------|----------|-------------------|
| 11434 | Ollama | `/api/chat`, `/api/generate`, `/api/version` |
| 8080 | OpenAI | `/v1/models`, `/v1/chat/completions` |
| 8081 | Anthropic | `/v1/messages` |
| 1234 | LM Studio | LM Studio-compatible API |
| 6333 | Qdrant | Vector database collections |
| 3002 | Grafana | Monitoring dashboard |
| 19530 | Milvus | Vector DB bait |
| 20022 | SSH | Interactive fake shell |
| 20021 | FTP | FTP server |
| 20025 | SMTP | Mail server |
| 20023 | Telnet | Telnet shell |
| 20053/udp | DNS | DNS resolver |
| 20445 | SMB | File share |

Plus: vLLM (8083), llama.cpp (8082), LangServe (8000), AutoGPT (8084), text-generation-webui (5000), MCP/IDE config bait, homelab services (Portainer, Home Assistant, Plex, Sonarr, Radarr, etc.)

## Dashboard

| Route | Description |
|-------|-------------|
| `/` | Public landing page |
| `/docs` | Setup documentation |
| `/login` | Operator authentication |
| `/overview` | Node, session, capture stats |
| `/nodes` | Node management and approval |
| `/sessions` | Captured interaction timelines |
| `/actors` | Correlated scanners and repeat visitors |
| `/personas` | Fake identity presets |
| `/response-engine` | Template review and backfeed |
| `/alerts` | Alert rules and delivery history |
| `/threat-intel` | IOC export, MITRE mapping, STIX, blocklists |
| `/live-feed` | Real-time capture stream |
| `/export` | Markdown, JSON, CSV exports + cold storage |
| `/settings` | Theme, TOTP, configuration |

Three themes: Light, Dark, Hacker.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript |
| Frontend | React + Vite + Tailwind CSS |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Queue | BullMQ |
| Storage | S3-compatible (MinIO) |
| Deploy | Docker Compose |
| Testing | Vitest + Supertest |
| Monorepo | pnpm workspaces + Turborepo |

## Repository layout

```
apps/
  api/       Dashboard API (NestJS)
  web/       Dashboard UI (React/Vite)
  worker/    Background jobs
  node/      Honeypot runtime
packages/
  shared/    DTOs, schemas, utilities
  db/        Prisma schema and migrations
  response-engine/   Template matching and routing
  persona-engine/    Identity consistency
docker/      Compose files, Dockerfiles, env templates
```

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Configuration

### Dashboard env (required)

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password |
| `JWT_SECRET` | 32+ character secret for auth tokens |
| `SEED_ADMIN_EMAIL` | Bootstrap admin email |
| `SEED_ADMIN_PASSWORD` | Bootstrap admin password |

### Node env (required)

| Variable | Description |
|----------|-------------|
| `LLMTRAP_DASHBOARD_URL` | Must be reachable from the node. Same-host: `http://127.0.0.1:4000` (node uses host networking). Multi-host: the dashboard origin URL. |
| `LLMTRAP_NODE_KEY` | Key issued when creating a node |

See `docker/dashboard-compose.env.example` and `docker/node-compose.env.example` for full reference.

## Networking

The node container runs with `network_mode: host` so that `socket.remoteAddress` returns real attacker IPs instead of the Docker gateway. Ports configured in the environment are bound directly on the host. On the same host, the dashboard API is bound to `127.0.0.1:4000`, which the node reaches as `http://127.0.0.1:4000`. Redis is published to `127.0.0.1:6379`.

## Security notes

- Dashboard (ports 3000, 4000) bound to `127.0.0.1` — use nginx or SSH port-forward for operator access
- Bait ports are intentionally exposed on `0.0.0.0` — that's the honeypot
- Honeypot services are sandboxed — no real shell, no real filesystem
- All credentials in env files are for the operator, not the honeypot
- Never commit real API keys or `.env` files

## License

Open source. See LICENSE file.

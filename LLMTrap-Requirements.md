# LLMTrap — Product Requirements Document

**Version:** 1.0
**Date:** April 14, 2026
**License:** MIT or Apache 2.0 (open source from day 1)
**Status:** Draft — Pending Review

This document captures product direction and the target shape of the platform. For current shipped behavior, use `README.md`, `docs/development-roadmap.md`, and `docs/project-changelog.md`.

---

## 1. Executive Summary

LLMTrap is an open-source, multi-protocol AI honeypot platform designed for security research and threat intelligence. It emulates a full AI infrastructure stack — LLM inference endpoints, MCP servers, AI IDE configs, RAG databases, and traditional homelab services — to attract, capture, and analyze malicious and opportunistic activity targeting AI systems.

The platform consists of two main components:

- **Honeypot Nodes** — lightweight Docker containers deployed on VPS instances, each impersonating a believable AI-enabled homelab or startup server
- **Central Dashboard** — a separate web application with a public landing page, a public docs home, and a protected operator dashboard for managing nodes, analyzing captured traffic, and exporting threat intelligence

**Primary Goals:**
1. Research & publish findings about real-world AI infrastructure attacks
2. Personal learning and security skill development
3. Generate exportable datasets suitable for feeding into LLMs to draft research articles
4. (Future) Produce blocklists and threat intel feeds for community use

---

## 2. Architecture Overview

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                   CENTRAL DASHBOARD                      │
│            (NestJS + React + PostgreSQL)                  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │ Auth &   │ │ Analytics│ │  Alert    │ │  Export   │ │
│  │ User Mgmt│ │ Engine   │ │  Engine   │ │  Engine   │ │
│  └──────────┘ └──────────┘ └───────────┘ └───────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │ Node     │ │ Response │ │ Backfeed  │ │ Threat    │ │
│  │ Manager  │ │ Config   │ │ Queue     │ │ Intel Gen │ │
│  └──────────┘ └──────────┘ └───────────┘ └───────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ Secure API (mTLS / API Key)
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  Node "A"   │ │  Node "B"   │ │  Node "C"   │
   │  Persona:   │ │  Persona:   │ │  Persona:   │
   │  Homelabber │ │  Startup    │ │  Researcher │
   │  RTX 5090   │ │  H100 box   │ │  A6000 rig  │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### 2.2 Tech Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS (TypeScript) |
| Frontend Web App | React (TypeScript) + Vite |
| Database | PostgreSQL (primary), Redis (caching, pub/sub for real-time) |
| Cold Storage | S3-compatible (MinIO, AWS S3, Backblaze B2) |
| Deployment | Docker Compose (per-component containers) |
| Node ↔ Dashboard Comms | Authenticated REST API + WebSocket heartbeat |
| Real-time Streaming | WebSocket (Socket.IO) with toggle on/off |

### 2.3 Open-Source Entry Surface

The shipped web app should expose a clear public entry surface before operators authenticate:

- `/` — public landing page with feature highlights and architecture summary
- `/docs` — public docs home and runbook index
- `/docs/getting-started`, `/docs/deploy-dashboard`, `/docs/enroll-node`, `/docs/smoke-tests` — dedicated in-app walkthrough pages for the local operator flow
- `/login` — operator authentication route
- `/overview` — protected operator dashboard home after sign-in

This keeps the project legible to first-time contributors while preserving a separate authenticated workflow for operators.

---

## 3. Honeypot Node — Emulated Services

Each node runs as a single Docker Compose stack. All services below are **fake emulations** — no real inference, no real data.

### 3.1 LLM Inference Endpoints (Primary Lure)

All endpoints are configurable per-node in the dashboard UI.

| Protocol | Endpoints to Emulate | Port (default) |
|---|---|---|
| **Ollama** | `GET /api/tags`, `GET /api/version`, `POST /api/generate`, `POST /api/chat`, `POST /api/pull`, `GET /api/ps`, `POST /api/show` | 11434 |
| **OpenAI-compatible** | `GET /v1/models`, `POST /v1/chat/completions`, `POST /v1/completions`, `POST /v1/embeddings` | 8080 |
| **Anthropic-compatible** | `POST /v1/messages`, `POST /anthropic/v1/messages`, `GET /v1/models` | 8081 |
| **LM Studio** | `GET /v1/models`, `POST /v1/chat/completions`, `GET /lmstudio/models/list` | 1234 |
| **text-generation-webui** | `POST /api/v1/generate`, `POST /api/v1/chat`, `GET /api/v1/model` | 5000 |
| **LangServe** | `POST /invoke`, `POST /batch`, `POST /stream`, `GET /input_schema`, `GET /output_schema` | 8000 |
| **llama.cpp** | `GET /health`, `POST /completion`, `POST /tokenize`, `GET /slots` | 8082 |
| **vLLM** | `GET /v1/models`, `POST /v1/completions`, `POST /v1/chat/completions`, `GET /health` | 8083 |
| **AutoGPT / AgentGPT** | `POST /api/agent/start`, `GET /api/agent/status` | 8084 |

### 3.2 MCP & Agent Discovery Endpoints

| Path | Purpose |
|---|---|
| `GET /.well-known/mcp.json` | MCP server manifest |
| `POST /mcp` | MCP JSON-RPC handler |
| `GET /sse` | MCP SSE transport |
| `POST /messages` | MCP messages endpoint |
| `GET /.well-known/agent.json` | Agent capability manifest |
| `GET /.well-known/ai-plugin.json` | ChatGPT plugin manifest |
| `GET /openapi.json` | OpenAPI spec (fake) |
| `GET /swagger.json` | Swagger spec (fake) |

**Fake MCP Tools** exposed in manifest:
- `get_credentials` — returns fake credential JSON
- `execute_command` — returns fake shell output
- `query_database` — returns fake DB results
- `read_file` — returns fake file contents
- `list_tools` — returns the tool manifest

### 3.3 AI IDE Config File Honeypots

Serve realistic fake config files at these paths (at minimum — the list should be updatable via dashboard):

| Path | Framework |
|---|---|
| `/.cursor/rules` | Cursor (legacy) |
| `/.cursorrules` | Cursor (current) |
| `/.cursor/mcp.json` | Cursor MCP config |
| `/.claude/settings.json` | Claude Code |
| `/.claude/CLAUDE.md` | Claude Code project file |
| `/.cline/memory.json` | Cline |
| `/.cline/mcp_settings.json` | Cline MCP config |
| `/.aider.conf.yml` | Aider |
| `/.continue/config.json` | Continue |
| `/.copilot/config.json` | GitHub Copilot |
| `/.codex/config.json` | OpenAI Codex CLI |
| `/.roo/rules` | Roo Code |
| `/.windsurf/rules` | Windsurf |
| `/.bolt/config.json` | Bolt |
| `/.v0/config.json` | Vercel v0 |
| `/.streamlit/secrets.toml` | Streamlit |
| `/.huggingface/token` | HuggingFace CLI |
| `/openai_config.py` | OpenAI Python config |
| `/gcp_credentials.json` | GCP service account |
| `/terraform.tfstate` | Terraform state |

The dashboard must allow **adding new paths** as new frameworks emerge.

### 3.4 Fake RAG / Vector Database Endpoints

| Service | Endpoints | Port |
|---|---|---|
| **Qdrant** | `GET /collections`, `POST /collections/{name}/points/search` | 6333 |
| **ChromaDB** | `GET /api/v1/collections`, `POST /api/v1/collections/{name}/query` | 8085 |
| **Neo4j** | `POST /db/neo4j/tx/commit` (Cypher endpoint) | 7474 |
| **Weaviate** | `GET /v1/schema`, `POST /v1/graphql` | 8086 |
| **Milvus** | `GET /v1/vector/collections`, `POST /v1/vector/search` | 19530 |

### 3.5 Fake Homelab Services (Set Dressing)

| Service | Key Endpoints | Port |
|---|---|---|
| **Plex** | `/web/index.html`, `/identity`, `/status/sessions` | 32400 |
| **Sonarr** | `/api/v3/series`, `/api/v3/system/status` | 8989 |
| **Radarr** | `/api/v3/movie`, `/api/v3/system/status` | 7878 |
| **Prowlarr** | `/api/v1/indexer` | 9696 |
| **Portainer** | `/api/endpoints`, `/api/stacks` | 9000 |
| **Home Assistant** | `/api/states`, `/api/config` | 8123 |
| **Gitea** | `/api/v1/repos/search`, `/api/v1/user` | 3000 |
| **Grafana** | `/api/dashboards`, `/api/datasources` | 3001 |
| **Prometheus** | `/metrics`, `/api/v1/query` | 9090 |
| **Uptime Kuma** | `/api/status-page` | 3002 |

### 3.6 Traditional Honeypot Services

| Service | Behavior | Port |
|---|---|---|
| **SSH** | Fake shell with command capture. Accept any credentials, log them. Simulate common commands (`ls`, `cat`, `whoami`, `uname`) with fake output matching the persona. | 22 |
| **HTTP/HTTPS** | Fake login pages for Portainer, Gitea, Grafana, etc. Capture submitted credentials. | 80/443 |
| **FTP** | Accept logins, log credentials, serve fake directory listings. | 21 |
| **SMB** | Fake share listings, capture auth attempts. | 445 |
| **Telnet** | Banner grab + credential capture. | 23 |
| **DNS** | Log all DNS queries received. Respond with fake records. | 53 |
| **SMTP** | Open relay appearance. Capture email content and auth attempts. | 25/587 |

### 3.7 Credential & Sensitive File Honeytokens

Scattered across all fake services — realistic but trackable fake credentials:

- `.env` files with fake API keys (OpenAI, Anthropic, AWS, Stripe format)
- `gcp_credentials.json` with fake service account
- `.huggingface/token` with fake HF token
- SSH private keys (generated, not real)
- Database connection strings in config files
- `.bash_history` with fake command history showing model downloads, API calls

All honeytoken values must be **unique per node** and logged when accessed so we can correlate if they show up elsewhere.

---

## 4. Response Engine

The response engine determines how the honeypot replies to LLM inference requests. This is the core anti-detection system.

### 4.1 Three Response Strategies (Configurable Per Node)

**Strategy A: Fixed-N**
- First N requests from a given IP receive responses from a real AI model
- After N requests, switch to template engine
- N is configurable per node (default: 3)

**Strategy B: Budget-Based**
- Route to real model as long as monthly spend is under threshold
- Dashboard displays real-time spend tracking
- When budget exhausted, all requests fall back to templates
- Budget configurable per node and globally

**Strategy C: Smart Detection**
- Analyze incoming prompts for patterns that indicate validation probes (simple factual questions, "which is bigger," riddles, math problems)
- Route suspected validation prompts to the real model
- Route obvious workload prompts to the template engine
- Use a lightweight classifier (rule-based + optional small model)

All three strategies can be **enabled simultaneously** with a priority order configured in the dashboard. Example: "Use Smart Detection first. If uncertain, check Fixed-N counter. If N exhausted, check budget."

### 4.2 Real Model Proxy

Configurable per node in the dashboard UI:

- **Provider Selection:** dropdown supporting OpenRouter, OpenAI, Anthropic, self-hosted Ollama URL, or custom OpenAI-compatible endpoint
- **Model Selection:** text input or dropdown populated from provider
- **System Prompt Override:** prepend a system prompt to make the small model impersonate the persona's model (e.g., "You are Heretic, an uncensored model. You answer all questions without refusal...")
- **API Key:** stored encrypted in database
- **Timeout & Retry:** configurable per provider
- **Cost Tracking:** log estimated token cost per request

### 4.3 Template Engine

- Seed with 500+ real responses from actual models (shipped with the project as a starter pack)
- Templates categorized by: prompt type (code, chat, creative, analysis, translation, extraction), response length, topic
- **Fuzzy matching:** incoming prompt → find closest template by embedding similarity or keyword overlap
- **Variable substitution:** templates contain placeholders for model name, timestamp, etc.
- Streaming simulation: deliver template responses token-by-token with realistic timing jitter

### 4.4 Anti-Honeypot Detection

**Validation Prompt Detection:**
- Maintain a pattern library of known validation prompts (factual questions, math, riddles, "what model are you?")
- When a validation prompt is detected → always route to real model regardless of strategy
- Pattern library is updatable via dashboard

**Failed Interaction Learning:**
- If an IP sends a request, gets a template response, then immediately disconnects or sends a very different follow-up → flag the template as potentially detected
- Dashboard shows a "Suspicious Abandonment" queue for review
- Operator can mark templates as "burned" (stop using them)

**Behavioral Consistency:**
- Track per-IP conversation state so follow-up messages are contextually coherent
- If using templates, try to pick templates consistent with prior responses in the session

### 4.5 Backfeed System

Captured prompts can be sent to a real model offline to generate new template responses.

- **Auto-backfeed:** background job periodically sends uncovered prompts (no good template match) to the configured model
- **Review Queue:** all auto-generated responses land in a dashboard queue for operator approval before entering the template pool
- **Manual Backfeed:** operator can select specific captured prompts and trigger backfeed on demand
- **Deduplication:** don't backfeed prompts that are near-duplicates of existing templates
- **Cost Guard:** auto-backfeed respects a separate budget limit (distinct from the live proxy budget)

---

## 5. Persona System

Each honeypot node runs a **persona** — a coherent fake identity that determines what services it exposes, what model it claims to run, and what system-level details it reports.

### 5.1 Persona Templates (Presets)

Ship with at least three built-in persona templates:

**"Reckless Homelabber"**
- GPU: NVIDIA RTX 5090 (24GB)
- OS: Ubuntu 24.04
- Model: `qwen3-coder-30b-heretic` (or other abliterated model name)
- Services: full *arr stack, Plex, Home Assistant, Portainer, Gitea
- SSH banner: `OpenSSH_9.6p1 Ubuntu-3ubuntu13`
- Uptime: randomized 30-180 days
- `.bash_history`: shows `ollama pull`, `pip install`, `docker compose up`

**"Scrappy AI Startup"**
- GPU: 2× NVIDIA A100 (80GB)
- OS: Ubuntu 22.04
- Model: `llama-3.3-70b`, `mistral-large-2411`
- Services: Grafana, Prometheus, Portainer, custom API endpoints
- `.env` files with Stripe, SendGrid, Twilio keys
- Uptime: 7-30 days (frequent redeploys)

**"University Researcher"**
- GPU: NVIDIA A6000 (48GB)
- OS: Rocky Linux 9
- Model: `deepseek-r1-32b`, `qwen2.5-72b`
- Services: JupyterHub endpoint, MLflow, MinIO, Gitea
- Config files: HuggingFace token, wandb config
- Uptime: 60-365 days

### 5.2 Custom Personas

All persona fields are editable per node in the dashboard:

- **Identity:** hostname, OS fingerprint, SSH banner, kernel version
- **Hardware:** GPU model, VRAM, CPU, RAM, disk (reported in API responses and `/metrics`)
- **Models:** list of model names/sizes to report in `/api/tags` and `/v1/models`
- **Services:** toggle which fake services are active on this node
- **Config Files:** toggle which IDE/tool config paths are served
- **Timing:** fake uptime range, load averages, GPU utilization %
- **Credentials:** honeytoken API keys, passwords, tokens scattered in configs

### 5.3 Dynamic Consistency

The persona engine must ensure all endpoints tell the same story:
- GPU reported in `nvidia-smi` output matches `/api/ps` VRAM usage
- Model sizes in `/api/tags` match the claimed GPU VRAM
- Prometheus `/metrics` reflect consistent fake load
- Uptime in SSH, `/api/version`, and Portainer all agree

---

## 6. Data Capture & Storage

### 6.1 What Gets Captured (Every Request)

| Field | Description |
|---|---|
| `timestamp` | UTC, microsecond precision |
| `source_ip` | Attacker IP |
| `source_port` | Attacker ephemeral port |
| `node_id` | Which honeypot node |
| `protocol` | HTTP, SSH, FTP, SMTP, DNS, SMB, Telnet |
| `service` | Which emulated service (Ollama, MCP, SSH, etc.) |
| `method` | HTTP method or protocol-specific action |
| `path` | Full request path |
| `headers` | Full HTTP headers (for HTTP requests) |
| `header_hash` | SHA-256 of ordered header names (for fingerprinting) |
| `user_agent` | Extracted UA string |
| `request_body` | Full request body (for POST/PUT) |
| `response_code` | What we returned |
| `response_body` | What we returned (full) |
| `response_strategy` | `real_model` / `template` / `static` |
| `tls_fingerprint` | JA3/JA4 hash if TLS |
| `session_id` | Correlated session identifier |
| `classification` | Auto-assigned category (see §7.1) |
| `geo` | Country, city, ASN (enriched async) |

### 6.2 Storage Tiers

**Hot Tier (PostgreSQL) — 0-30 days:**
- Full detail: all fields above including complete request/response bodies
- Indexed for fast dashboard queries
- Partitioned by date for efficient retention management

**Cold Tier (S3-compatible) — 30+ days:**
- Nightly job: export day-31 partition → compress (gzip) → upload to S3 bucket → drop partition from Postgres
- File format: JSONL (one JSON object per request, gzipped)
- Naming convention: `llmtrap/{node_id}/{YYYY}/{MM}/{DD}.jsonl.gz`
- Dashboard can trigger on-demand download, decompress, and display of archived data
- Configurable: retention bucket, prefix, credentials — all in dashboard settings

**Storage Estimates:**
- ~100k requests/month at ~2KB average = ~200MB/month hot
- Compressed cold storage: ~40-60MB/month
- Budget: negligible for S3-class storage

### 6.3 Session Reconstruction

Requests are grouped into **sessions** by:
- Same source IP + same target service + requests within 5-minute gap
- SSH connections = 1 session per TCP connection
- HTTP: same IP + same User-Agent + requests within 5 min

Each session gets a UUID. The session view in the dashboard shows a chronological timeline of all requests in that session.

---

## 7. Analysis Engine

### 7.1 Auto-Classification

Every session is automatically classified into one of these categories:

| Category | Criteria |
|---|---|
| **Free-Rider** | Sends inference requests (generate/chat/completions), does not probe other services, no credential theft attempts, uses proper API formatting |
| **Scanner** | Hits multiple discovery endpoints (tags, models, version) across multiple services, short-lived sessions, may self-identify via User-Agent |
| **Config Hunter** | Probes AI IDE config paths, `.env` files, credential files. Identified by path patterns. |
| **Attacker** | Attempts credential theft, shell access, lateral movement, payload delivery, prototype pollution, or exploitation |
| **MCP Prober** | Specifically targets MCP/agent discovery endpoints |
| **Validator** | Sends known validation prompts (factual questions to test if model is real) |
| **Unknown** | Doesn't match other patterns |

Classification is rule-based with configurable rules in the dashboard. Each rule is a set of conditions (path patterns, header patterns, behavioral patterns) mapping to a category.

### 7.2 IP Reputation Enrichment

For every unique IP, asynchronously enrich with:

- **GeoIP:** country, city, region (MaxMind GeoLite2 or ip-api.com)
- **ASN:** AS number, organization name, ISP type (residential, datacenter, mobile)
- **Reverse DNS:** rDNS lookup
- **Known-Bad Lists:** check against AbuseIPDB, Shodan InternetDB, or configurable blocklists
- **Cloud Provider Detection:** identify AWS, GCP, Azure, DigitalOcean, Vultr, OVH, Hetzner, etc.
- **Tor/VPN Detection:** flag known Tor exit nodes and commercial VPN endpoints

Results cached in database. Re-enrichment configurable (default: every 7 days per IP).

### 7.3 Session Replay

The dashboard provides a **step-by-step session replay** view:

- Timeline visualization showing each request/response in chronological order
- For LLM sessions: render the conversation as a chat-like UI (user prompt → model response)
- For SSH sessions: render as a terminal replay
- For HTTP scanning sessions: show requests as a table with expandable details
- Highlight interesting moments (credential access, config file probes, validation prompts)
- Export individual session replays as Markdown or HTML for use in articles

### 7.4 Fingerprinting & Actor Tracking

Track the same actor across IP changes using multiple signals:

| Signal | Method |
|---|---|
| **Header Fingerprint** | SHA-256 of ordered HTTP header names (stable across IP changes) |
| **TLS Fingerprint** | JA3/JA4 hash |
| **Behavioral Fingerprint** | Sequence of endpoints hit, timing patterns, prompt patterns |
| **User-Agent Clustering** | Group by UA string or UA anomalies (e.g., `live Gecko` typo from the article) |
| **Pipeline Fingerprint** | Specific API calling patterns (system prompt style, JSON schema structure, polling behavior) |

The dashboard shows an **Actors** view where suspected-same actors are grouped. Operator can manually merge/split actor groups.

---

## 8. Dashboard — Feature Specification

### 8.1 Authentication & Security

- **Registration:** first user becomes admin; subsequent users require admin invite
- **Login:** email + password with bcrypt hashing
- **2FA:** TOTP-based (Google Authenticator, Authy compatible)
- **Sessions:** JWT with refresh tokens, configurable expiry
- **Roles:** Admin (full access), Analyst (read + export, no config changes), Viewer (read-only)
- **Audit Log:** all config changes and logins are logged

### 8.2 Pages & Views

**Overview Dashboard (Home)**
- Total requests (24h / 7d / 30d / all-time)
- Requests per node (bar chart)
- Classification breakdown (pie/donut chart)
- Geographic heatmap of source IPs
- Top 10 probed paths
- Top 10 User-Agents
- Active sessions count
- Budget spend (current month vs limit)
- Node health status (up/down, last heartbeat)

**Live Feed**
- Real-time WebSocket stream of incoming requests (default: OFF, toggle ON)
- When OFF: auto-refresh every 30 seconds
- Filterable by: node, service, classification, IP, path
- Each row expandable to show full request/response
- Pause/resume stream button
- Sound/visual alert for high-severity events (configurable)

**Sessions**
- Paginated table of all sessions
- Columns: timestamp, source IP, geo, classification, service, request count, duration
- Filters: date range, classification, node, service, IP, country, ASN
- Click to open Session Replay view (§7.3)

**Actors**
- Grouped view of suspected-same actors (§7.4)
- Shows: fingerprint(s), IP history, session count, date range, classification
- Merge/split controls
- Timeline of an actor's activity across IPs

**Nodes Management**
- List of all honeypot nodes with status
- Add/remove/edit nodes
- Per-node configuration:
  - Persona editor (all fields from §5.2)
  - Service toggles (which fake services are active)
  - Response engine config (strategy, provider, model, budget)
  - Port assignments
  - Config file path editor (add/remove/edit fake config paths)

**Response Engine**
- Template library browser: view, search, add, edit, delete templates
- Backfeed review queue: approve/reject auto-generated templates
- Suspicious Abandonment queue: review potentially burned templates
- Validation prompt pattern editor
- Provider & model configuration (API keys, endpoints)
- Budget dashboard: spend tracking per node and global, with charts

**Threat Intelligence**
- Blocklist generator: configure criteria, preview, export
- IOC feed viewer: IPs, User-Agents, fingerprints, paths
- MITRE ATT&CK mapping view (see §9.3)
- STIX/TAXII export configuration

**Export & Reports**
- Export filtered data as: JSON, CSV/Excel, Markdown, HTML
- Report generator: select date range + filters → generate Markdown/HTML report with charts and tables, suitable for blog posts
- Full database dump (for feeding into LLMs to write articles)
- Scheduled exports (daily/weekly email or webhook)

**Settings**
- Alert channel configuration (Telegram bot token, Discord webhook, email SMTP, generic webhook URL)
- Alert rules: define conditions that trigger alerts (e.g., "new actor classified as Attacker", "MCP probe from non-scanner IP", "budget 80% consumed")
- S3 cold storage configuration
- IP enrichment provider configuration
- Data retention settings
- User management (admin only)
- System health: Postgres size, cold storage usage, node connectivity

### 8.3 Real-Time Toggle Behavior

- Default state: **periodic refresh** (every 30 seconds via REST polling)
- Toggle button in the Live Feed header: "Enable Real-Time"
- When enabled: opens WebSocket connection, streams events as they arrive
- Bandwidth indicator: shows events/second rate
- Auto-disable after 30 minutes of inactivity (tab hidden) to save resources
- When WebSocket disconnects: graceful fallback to polling with a reconnect banner

---

## 9. Threat Intelligence Output

### 9.1 Blocklist Generation

Auto-generated and manually curated IP/indicator blocklists:

- **Format:** plain text (one IP per line), JSON, CSV
- **GitHub-publishable:** auto-commit to a configurable Git repo on schedule
- **Criteria configurable:** e.g., "all IPs classified as Scanner with >50 requests in 7 days"
- **Allowlisting:** exclude known-good IPs (your own, research partners)

### 9.2 IOC Feed

Indicators of Compromise exported as structured data:

- IP addresses with metadata (ASN, geo, classification, first/last seen)
- User-Agent strings (especially custom scanner UAs)
- Header fingerprints
- Paths probed (unique wordlists per actor)
- TLS fingerprints
- Prompt patterns (for LLM-specific IOCs)

### 9.3 MITRE ATT&CK Mapping

Map observed behaviors to MITRE ATT&CK techniques:

| Observed Behavior | ATT&CK Technique |
|---|---|
| Shodan/Censys-discovered endpoint → probe | T1595 — Active Scanning |
| `/api/tags`, `/v1/models` enumeration | T1046 — Network Service Discovery |
| Config file probing (`.env`, IDE configs) | T1083 — File and Directory Discovery |
| Credential extraction from config files | T1552.001 — Credentials in Files |
| SSH brute force / credential stuffing | T1110 — Brute Force |
| LLMjacking (proxying API calls) | T1496 — Resource Hijacking |
| MCP tool invocation | T1059 — Command and Scripting Interpreter |
| Prototype pollution payloads | T1190 — Exploit Public-Facing Application |
| Free-riding on inference | T1496 — Resource Hijacking |

Dashboard view shows ATT&CK matrix with heatmap of observed technique frequency.

### 9.4 STIX/TAXII Export

- Generate STIX 2.1 bundles from captured data
- Optional TAXII 2.1 server endpoint for automated feed consumers
- Configurable in dashboard: which data to include, update frequency

---

## 10. Alert System

### 10.1 Channels

| Channel | Configuration |
|---|---|
| **Telegram** | Bot token + chat ID |
| **Discord** | Webhook URL |
| **Email** | SMTP server, from address, recipient list |
| **Generic Webhook** | URL + optional auth header + payload template |

### 10.2 Alert Rules (Configurable in UI)

Each rule has: name, conditions, severity (info/warning/critical), channels, cooldown (don't re-fire for N minutes).

**Built-in rules (enabled by default):**
- New attacker classification detected → warning
- SSH brute force (>20 attempts from one IP in 5 min) → critical
- MCP tool invocation attempt → warning
- Budget threshold crossed (80%, 95%, 100%) → warning/critical
- Node heartbeat missed (>5 min) → critical
- New scanner User-Agent detected → info
- Honeytoken credential used in a new context → critical

**Custom rules:** operator defines conditions using field + operator + value logic (e.g., `path CONTAINS ".env" AND classification = "config_hunter" AND geo.country != "US"`)

---

## 11. Deployment & Operations

### 11.1 Docker Compose Structure

**Dashboard Stack** (`docker-compose.dashboard.yml`):
```
services:
  api:         # NestJS backend
  frontend:    # React (nginx-served build)
  postgres:    # PostgreSQL
  redis:       # Redis for caching + pub/sub
  worker:      # Background jobs (backfeed, enrichment, archival, alerts)
```

**Honeypot Node Stack** (`docker-compose.node.yml`):
```
services:
  trap-core:   # Main HTTP/HTTPS honeypot (all LLM + web endpoints)
  trap-ssh:    # SSH honeypot
  trap-ftp:    # FTP honeypot
  trap-smtp:   # SMTP honeypot
  trap-dns:    # DNS honeypot
  trap-smb:    # SMB honeypot
  trap-telnet: # Telnet honeypot
```

### 11.2 Node Registration

1. Deploy node stack on a VPS
2. Set environment variable: `LLMTRAP_DASHBOARD_URL` and `LLMTRAP_NODE_KEY`
3. Node registers with dashboard on first boot
4. Dashboard admin approves or auto-approves (configurable)
5. Node pulls its persona config and begins operating

### 11.3 Configuration Hierarchy

1. **Dashboard UI** — primary source of truth for all config
2. **Environment variables** — bootstrap only (dashboard URL, node key, DB connection)
3. **Config files** — fallback for air-gapped scenarios (YAML)

### 11.4 Resource Estimates (Per Node)

| Resource | Estimated Usage |
|---|---|
| RAM | 256-512 MB |
| CPU | 1 vCPU (mostly idle, spikes on request) |
| Disk | 1-5 GB (logs before sync to dashboard) |
| Network | Varies; 100k requests/month ≈ 2-5 GB |

Recommended VPS: $5-10/month tier (1 vCPU, 1GB RAM, 25GB SSD).

---

## 12. Non-Functional Requirements

### 12.1 Performance
- Dashboard must handle 500 concurrent WebSocket connections
- Node must handle 100 concurrent HTTP requests without dropping
- API response latency: <200ms for dashboard queries (hot data)
- Cold data retrieval: <30s for download + decompress + display

### 12.2 Security (of the Honeypot Itself)
- Dashboard accessible only via HTTPS
- Node-to-dashboard communication authenticated (API key + optional mTLS)
- Honeypot services must be **sandboxed** — no real shell, no real filesystem access, no route to the dashboard or internal network
- Rate limiting on dashboard login (prevent brute force of the admin panel)
- All secrets (API keys, DB passwords) stored encrypted at rest
- Regular dependency audits (npm audit, Snyk)

### 12.3 Reliability
- Node operates independently if dashboard is unreachable (buffers logs locally, syncs on reconnection)
- Dashboard auto-recovers from worker crashes (process manager / Docker restart policy)
- PostgreSQL: daily backups (pg_dump) to S3

### 12.4 Observability
- Structured logging (JSON) for all components
- Internal Prometheus metrics endpoint on dashboard (not exposed to honeypot ports)
- Health check endpoints for Docker orchestration

---

## 13. Development Phases

### Phase 1 — Foundation (MVP)
- [ ] NestJS backend with auth (login, sessions, 2FA)
- [ ] PostgreSQL schema and migrations
- [ ] React dashboard shell (overview, live feed, settings)
- [ ] Single-node honeypot: Ollama + OpenAI-compatible endpoints
- [ ] Template response engine with 100 starter templates
- [ ] Basic request logging and session grouping
- [ ] Docker Compose for both stacks

### Phase 2 — Full Protocol Coverage
- [ ] All LLM protocols (Anthropic, LM Studio, vLLM, llama.cpp, LangServe, text-gen-webui)
- [ ] MCP & agent discovery endpoints
- [ ] AI IDE config file honeypots
- [ ] Fake RAG database endpoints
- [ ] Fake homelab services
- [ ] Traditional honeypot services (SSH, FTP, SMTP, DNS, SMB, Telnet)

### Phase 3 — Intelligence & Response Engine
- [ ] Real model proxy with configurable provider/model
- [ ] Hybrid response strategies (Fixed-N, Budget, Smart)
- [ ] Anti-honeypot detection (validation prompt routing)
- [ ] Backfeed system with review queue
- [ ] Auto-classification engine
- [ ] IP reputation enrichment
- [ ] Session replay view

### Phase 4 — Multi-Node & Personas
- [ ] Multi-node management from central dashboard
- [ ] Persona system with templates and custom editor
- [ ] Dynamic consistency engine
- [ ] Node registration and health monitoring

### Phase 5 — Threat Intel & Export
- [ ] Fingerprinting & actor tracking
- [ ] Blocklist generation + GitHub auto-publish
- [ ] MITRE ATT&CK mapping
- [ ] STIX/TAXII export
- [ ] Report generator (Markdown/HTML for articles)
- [ ] All export formats (JSON, CSV, Excel, Markdown, HTML)
- [ ] Cold storage archival (S3 + on-demand retrieval)

### Phase 6 — Alerts & Polish
- [ ] Alert system (all channels + custom rules)
- [ ] Failed interaction learning
- [ ] Real-time WebSocket toggle
- [ ] Audit logging
- [ ] Documentation & README for open-source release
- [ ] CI/CD pipeline
- [ ] First public release

---

## 14. Open Questions & Future Considerations

1. **Legal:** Should the project include a legal disclaimer template about honeypot operation in various jurisdictions?
2. **Ethical backfeed:** When auto-backfeeding captured prompts to a real model, should there be content filtering to avoid sending harmful prompts?
3. **Community templates:** Should there be a mechanism for operators to share persona templates or response templates with the community?
4. **Multi-tenant:** Should the dashboard support multiple independent operators (for a hosted version), or is single-tenant sufficient?
5. **Mobile app:** Is a companion mobile app for alerts worth considering, or are Telegram/Discord bots sufficient?
6. **Deception depth:** Should the SSH honeypot simulate a full filesystem (like Cowrie), or is a shallow command capture sufficient?
7. **Canary tokens:** Integrate with Thinkst Canary or similar for honeytoken tracking beyond the honeypot itself?

---

*End of requirements document. Ready for review and refinement.*

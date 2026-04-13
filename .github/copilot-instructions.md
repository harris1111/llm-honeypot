# LLMTrap

## Project Overview
Open-source, multi-protocol AI honeypot platform for security research. Emulates LLM inference endpoints (Ollama, OpenAI, Anthropic, vLLM, etc.), MCP servers, AI IDE configs, RAG databases, and traditional services (SSH, FTP, SMTP, DNS, SMB) to capture/analyze malicious activity.

## Architecture
- **Dashboard Stack**: NestJS API + React/Vite frontend + PostgreSQL + Redis + Worker
- **Honeypot Node Stack**: Docker containers emulating multiple protocols per node
- **Communication**: REST API (mTLS/API key) + WebSocket heartbeat between nodes and dashboard

## Tech Stack
| Layer | Technology |
|---|---|
| Backend API | NestJS (TypeScript, strict mode) |
| Frontend | React (TypeScript) + Vite + Tailwind + shadcn/ui |
| Database | PostgreSQL (primary) + Redis (cache, pub/sub) |
| ORM | Prisma |
| Job Queue | BullMQ (Redis-backed) |
| Cold Storage | S3-compatible (MinIO / AWS S3 / Backblaze B2) |
| Deployment | Docker Compose (per-component containers) |
| Testing | Vitest (unit) + Supertest (integration) + Playwright (e2e) |
| Monorepo | pnpm workspaces + Turborepo |

## Repository Structure
```
llm-honeypot/
├── apps/
│   ├── api/                    # NestJS backend (dashboard API)
│   ├── web/                    # React frontend (dashboard UI)
│   ├── worker/                 # Background jobs (backfeed, enrichment, archival, alerts)
│   └── node/                   # Honeypot node (all trap services)
├── packages/
│   ├── shared/                 # Shared types, DTOs, constants, utils
│   ├── db/                     # Prisma schema, migrations, seed
│   ├── persona-engine/         # Persona consistency engine
│   └── response-engine/        # Template matching + proxy routing + streaming
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   ├── Dockerfile.node
│   ├── docker-compose.dashboard.yml
│   └── docker-compose.node.yml
├── templates/                  # 500+ starter response templates (shipped)
├── personas/                   # Built-in persona presets (JSON)
├── scripts/                    # Dev/ops scripts
├── docs/                       # Project documentation
├── plans/                      # Implementation plans
└── tests/
    ├── e2e/                    # Playwright e2e tests
    └── smoke/                  # Protocol smoke tests
```

## Development Workflow

### Git Workflow (MANDATORY per phase/fix/feature)
1. Create branch: `git checkout -b <type>/<scope>/<description>`
2. Implement changes
3. Lint: `pnpm lint`
4. Build: `pnpm build`
5. Unit tests: `pnpm test`
6. E2E/smoke tests: `pnpm test:e2e` and `pnpm test:smoke`
7. Commit (conventional): `git commit -m "<type>(<scope>): <description>"`
8. Push: `git push -u origin <branch>`
9. Create PR: `gh pr create --title "..." --body "..."`
10. Auto-merge squash: `gh pr merge --squash --auto`

**Spawn subagents for testing steps (lint, build, test, e2e) in parallel where possible.**

### Branch Naming
- `feat/<scope>/<desc>` | `fix/<scope>/<desc>` | `refactor/<scope>/<desc>`
- `docs/<desc>` | `test/<desc>` | `devops/<desc>`
- Scopes: `api`, `web`, `node`, `worker`, `db`, `shared`, `persona`, `response-engine`, `docker`

### Conventional Commits
`feat(api):`, `fix(node):`, `refactor(web):`, `test(e2e):`, `docs:`, `chore:`, `devops:`

## Code Standards

### TypeScript (All packages)
- Strict mode (`strict: true` in tsconfig)
- No `any` — use proper typing, generics, discriminated unions
- Zod for runtime validation (DTOs, env vars, API inputs)
- Structured JSON logging via Pino
- Error handling: try/catch at service boundaries, custom exception filters

### NestJS Backend (`apps/api`)
- Module-per-domain: auth, nodes, sessions, analytics, alerts, export, response-config, threat-intel
- DTOs with Zod + `@anatine/zod-nestjs`
- Guards (auth), Interceptors (logging, timing), Pipes (validation)
- Repository/service pattern — services call Prisma, controllers call services
- BullMQ processors in `apps/worker` (separate process)

### React Frontend (`apps/web`)
- Functional components, no class components
- TanStack Query for server state, Zustand for client state
- TanStack Router for routing
- shadcn/ui + Tailwind CSS for UI
- Recharts for charts/visualizations
- Socket.IO client for real-time (toggle on/off)

### Honeypot Node (`apps/node`)
- NestJS for HTTP protocol emulation (same framework as dashboard API, unified DI/decorators)
- Each protocol emulator is a separate NestJS module with its own controller
- Fake responses must be persona-consistent (GPU, model, uptime all match)
- All requests logged with full capture (headers, body, TLS fingerprint)
- Local buffer when dashboard unreachable, sync on reconnect

### Testing Strategy
- **Unit**: Vitest — services, utils, response engine, persona engine
- **Integration**: Vitest + Supertest — API endpoints, DB operations
- **E2E**: Playwright — dashboard UI flows (login, node management, session replay)
- **Smoke**: Custom scripts — verify each protocol emulator responds correctly
- **Coverage target**: >80% on critical paths (response engine, auth, session tracking)

## Codebase Navigation — GitNexus (MANDATORY)

Use GitNexus (KuzuDB graph DB + MCP) instead of grep for code navigation. It pre-computes structure (functions, classes, imports, call chains) into a knowledge graph, exposing 16 MCP tools.

### Setup (One-Time)
```bash
# 1. Index the monorepo (from repo root)
npx gitnexus analyze

# 2. Configure MCP for Claude Code (global, one-time)
npx gitnexus setup
# Or manually:
# claude mcp add gitnexus -- npx -y gitnexus@latest mcp

# 3. Restart Claude Code

# 4. .gitnexus/ is in .gitignore — never commit it
```

### Reindexing
- **Auto**: After git commits (Claude Code hooks auto-reindex)
- **Manual**: Run `npx gitnexus analyze` after major refactors, new packages, or schema changes
- **Full rebuild**: `npx gitnexus clean && npx gitnexus analyze`

### MCP Tools Reference (16 tools)

| Tool | When to Use |
|------|-------------|
| `query(q)` | Semantic search: "Find all auth middleware", "password validation logic" |
| `context(symbol)` | 360° view: callers, callees, imports, exports of a symbol |
| `impact(changes)` | Blast radius: "What breaks if I rename/remove this?" |
| `detect_changes(range)` | Git diff impact: "What call chains changed in this PR?" |
| `rename(old, new)` | Coordinated multi-file refactoring (better than find-replace) |
| `go_to_definition(symbol)` | Jump to definition across packages |
| `find_usages(symbol)` | All references with context |
| `cluster_info(id)` | Functional grouping: cohesion score, related symbols |
| `trace_execution(entry)` | Call chain from entry point |
| `architecture_map()` | High-level module relationship graph |
| `incremental_index()` | Update index after commits |
| `list_repositories()` | All indexed repos |
| `cross_repo_imports()` | Inter-repo dependencies |
| `cross_repo_impact()` | Impact analysis across repos |
| `compare_architectures()` | API compatibility check |
| `merge_indexes()` | Combine indexes for cross-repo analysis |

### Rules of Engagement
1. **ALWAYS** run `impact()` before large refactors or renaming
2. **ALWAYS** run `context()` to understand a function before modifying it
3. **USE** `rename()` instead of grep-based find-replace for coordinated changes
4. **USE** `query()` for semantic discovery (not just text matching)
5. **USE** `detect_changes()` after pulling PRs to understand what changed
6. **USE** `trace_execution()` to debug call chains
7. **USE** `architecture_map()` before adding new modules (understand existing structure)
8. **TRUST** confidence scores in impact analysis; low confidence = missing context, investigate manually
9. **REINDEX** after adding new packages, major refactors, or Prisma schema changes
10. **NEVER** commit `.gitnexus/` directory

### When GitNexus vs Grep
| Scenario | Use |
|----------|-----|
| Find a specific string/regex | Grep |
| Find a file by name | Glob |
| Understand who calls a function | GitNexus `context()` |
| Rename across monorepo | GitNexus `rename()` |
| Assess change impact | GitNexus `impact()` |
| Explore unfamiliar code | GitNexus `query()` + `cluster_info()` |
| Debug call chain | GitNexus `trace_execution()` |
| Simple file content search | Grep |

### Gotchas
- Dynamic imports (`require(variable)`) not resolved — document manually
- Barrel re-exports can confuse clustering — verify with `context()`
- After Prisma generate or codegen: reindex with `npx gitnexus analyze`
- KuzuDB is in-memory; practical limit ~50K symbols per repo (fine for this project)

## Security Rules
- NEVER commit real API keys, tokens, or credentials
- Honeytoken values: realistic format but clearly fake (unique per node, logged on access)
- Honeypot services: sandboxed — no real shell, no real FS, no route to dashboard/internal network
- Dashboard: HTTPS only in production, rate-limited login
- Secrets: encrypted at rest (AES-256), never logged in plaintext
- Run `pnpm audit` regularly

## Docker Rules
- Multi-stage builds (builder → runner)
- Non-root user in all containers
- Health check endpoints for orchestration
- Resource limits (CPU, memory) per container
- `.dockerignore` to exclude node_modules, .env, .git

## Important Sync Rule
> **`CLAUDE.md` and `.github/copilot-instructions.md` MUST stay in sync.**
> When editing one file, apply the same edit to the other.

## Walkthrough Maintenance Rule
- `docs/shipped-app-testing-walkthrough.md` is the canonical local walkthrough for testing the currently shipped app.
- When a change adds or changes user-testable functionality, ports, env vars, compose steps, node enrollment flow, dashboard routes, or representative protocol probes, update that walkthrough in the same change.
- Keep `README.md` aligned with the walkthrough through links and short summaries instead of creating a second conflicting full guide.

## Error Tracking
Distill encountered errors into bullets below. Each bullet = a lesson learned.
<!-- ERRORS START -->
- Shell scripts copied into Alpine images from a Windows worktree can fail with exit 127; strip CRLF line endings inside the image before executing them.
<!-- ERRORS END -->

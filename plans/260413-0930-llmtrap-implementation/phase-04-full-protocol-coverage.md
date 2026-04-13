# Phase 4: Full Protocol Coverage

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 24h (was 20h; +4h for full SSH filesystem simulation)
- **Branch:** `feat/node/full-protocol-coverage`
- **Depends On:** Phase 3

Extend the honeypot node with all remaining LLM protocols, MCP/agent endpoints, AI IDE config file honeypots, fake RAG database endpoints, fake homelab services, and traditional protocol honeypots (SSH, FTP, SMTP, DNS, SMB, Telnet).

## Key Insights (from Research)

- vLLM, LM Studio, llama.cpp all expose OpenAI-compatible endpoints — reuse OpenAI response builder with minor field tweaks
- LangServe has unique `/invoke`, `/stream`, `/batch` pattern — separate handler needed
- MCP: JSON-RPC 2.0 over HTTP; minimal implementation = `tools/list` + `tools/call` + capability declaration
- AI IDE configs are static file serving with honeytokens embedded — low complexity, high value
- SSH honeypot needs ssh2 library with fake shell state machine — most complex traditional protocol
- FTP/SMTP/Telnet are lightweight: accept creds, log, return fake responses
- DNS: dns2 library, log all queries, respond with persona IP
- SMB: minimal — capture auth attempts, return share listing
- Homelab services (Plex, Sonarr, etc.) are simple JSON API stubs

## Requirements

### Functional
- **LLM protocols:** LM Studio (1234), text-gen-webui (5000), LangServe (8000), llama.cpp (8082), vLLM (8083), AutoGPT (8084)
- **MCP/Agent:** `/.well-known/mcp.json`, `POST /mcp`, `GET /sse`, `POST /messages`, `/.well-known/agent.json`, `/.well-known/ai-plugin.json`, `/openapi.json`, `/swagger.json`
- **IDE configs:** All 20+ paths from PRD section 3.3, with embedded honeytokens
- **RAG endpoints:** Qdrant (6333), ChromaDB (8085), Neo4j (7474), Weaviate (8086), Milvus (19530)
- **Homelab:** Plex, Sonarr, Radarr, Prowlarr, Portainer, Home Assistant, Gitea, Grafana, Prometheus, Uptime Kuma
- **Traditional:** SSH (22), FTP (21), SMTP (25/587), DNS (53), SMB (445), Telnet (23)
- **Honeytoken system:** Unique per-node fake API keys in real formats, logged on access

### Non-Functional
- Each new protocol reuses capture middleware from Phase 3
- Traditional services run in separate containers (already defined in docker-compose.node.yml)
- All new endpoints use persona context for consistent responses
- Memory per traditional service container < 128MB

## Architecture

### New Protocol Files (added to apps/node/src/protocols/)

```
apps/node/src/protocols/
├── ollama/                    # Phase 3 (exists)
├── openai/                    # Phase 3 (exists)
├── anthropic/                 # Phase 3 (exists)
├── lm-studio/
│   └── lm-studio-routes.ts   # Reuses openai-server on port 1234
├── text-gen-webui/
│   ├── text-gen-webui-server.ts
│   └── text-gen-webui-routes.ts
├── langserve/
│   ├── langserve-server.ts
│   └── langserve-routes.ts
├── llamacpp/
│   ├── llamacpp-server.ts
│   └── llamacpp-routes.ts
├── vllm/
│   └── vllm-routes.ts        # Reuses openai-server on port 8083
├── autogpt/
│   ├── autogpt-server.ts
│   └── autogpt-routes.ts
├── mcp/
│   ├── mcp-server.ts          # Port 80/443 (shared with main HTTP)
│   ├── mcp-routes.ts          # JSON-RPC handlers
│   ├── mcp-tools.ts           # Fake tool definitions
│   └── mcp-sse-handler.ts     # SSE transport
├── ide-configs/
│   ├── ide-config-server.ts   # Static file serving
│   └── ide-config-templates.ts # Config file content generators
├── rag/
│   ├── qdrant/
│   │   └── qdrant-routes.ts
│   ├── chromadb/
│   │   └── chromadb-routes.ts
│   ├── neo4j/
│   │   └── neo4j-routes.ts
│   ├── weaviate/
│   │   └── weaviate-routes.ts
│   └── milvus/
│       └── milvus-routes.ts
├── homelab/
│   ├── homelab-server.ts      # Single Express app, multiple path-based routes
│   ├── plex-routes.ts
│   ├── sonarr-routes.ts
│   ├── radarr-routes.ts
│   ├── prowlarr-routes.ts
│   ├── portainer-routes.ts
│   ├── home-assistant-routes.ts
│   ├── gitea-routes.ts
│   ├── grafana-routes.ts
│   ├── prometheus-routes.ts
│   └── uptime-kuma-routes.ts
├── traditional/
│   ├── ssh/
│   │   ├── ssh-server.ts         # ssh2 library
│   │   ├── ssh-shell.ts          # Full PTY shell state machine (Cowrie-inspired)
│   │   ├── ssh-commands.ts       # Command handlers (ls, cat, whoami, wget, etc.)
│   │   ├── ssh-filesystem.ts     # Virtual filesystem tree (persona-consistent)
│   │   └── ssh-download-tracker.ts  # Track wget/curl download attempts
<!-- Updated: Validation Session 1 - SSH elevated to full filesystem simulation -->
│   ├── ftp/
│   │   └── ftp-server.ts      # ftpd library
│   ├── smtp/
│   │   └── smtp-server.ts     # smtp-server library
│   ├── dns/
│   │   └── dns-server.ts      # dns2 library
│   ├── smb/
│   │   └── smb-server.ts      # Minimal auth capture
│   └── telnet/
│       └── telnet-server.ts   # net.createServer
└── honeytoken/
    ├── honeytoken-generator.ts  # Generate per-node fake keys
    └── honeytoken-registry.ts   # Track which tokens served where
```

## Protocol Implementation Details

### OpenAI-Compatible Protocols (LM Studio, vLLM, llama.cpp)

These share the OpenAI response format. Implementation pattern:

```typescript
// Each creates a thin wrapper around OpenAI response builder
function createOpenAICompatibleServer(port: number, serviceName: string) {
  const app = express();
  app.use(captureMiddleware(serviceName));
  app.get('/v1/models', openaiModelListHandler);
  app.post('/v1/chat/completions', openaiChatHandler);
  // Service-specific extras:
  if (serviceName === 'llamacpp') {
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.post('/completion', openaiLegacyCompletionHandler);
    app.get('/slots', llamacppSlotsHandler);
  }
  if (serviceName === 'lm-studio') {
    app.get('/lmstudio/models/list', openaiModelListHandler);
  }
  return app;
}
```

### text-generation-webui (port 5000)

Unique endpoints:
- `POST /api/v1/generate` - Body: `{"prompt": "...", "max_new_tokens": 200}`
- `POST /api/v1/chat` - Body: `{"messages": [...], "mode": "chat"}`
- `GET /api/v1/model` - Returns `{"result": "{{persona.models[0].name}}"}`

Response format differs from OpenAI:
```json
{"results": [{"text": "generated text here"}]}
```

### LangServe (port 8000)

Unique REST pattern:
- `POST /invoke` - Body: `{"input": {"question": "..."}}`
- `POST /stream` - SSE stream of `{"output": "chunk"}`
- `POST /batch` - Array of inputs
- `GET /input_schema` / `GET /output_schema` - JSON Schema

```json
// /invoke response
{"output": {"answer": "response text"}, "metadata": {"run_id": "{{uuid}}"}}
```

### AutoGPT (port 8084)

- `POST /api/agent/start` - Body: `{"goal": "...", "task": "..."}`
  - Response: `{"agent_id": "{{uuid}}", "status": "running"}`
- `GET /api/agent/status` - Returns agent status with fake step progress

### MCP Server (on main HTTP ports)

**`GET /.well-known/mcp.json`** - Server manifest
```json
{
  "servers": {
    "llmtrap-tools": {
      "type": "sse",
      "url": "/sse"
    }
  }
}
```

**`POST /mcp`** - JSON-RPC 2.0 handler
```typescript
// Route by method
switch (req.body.method) {
  case 'initialize':
    return { capabilities: { tools: {}, resources: {}, prompts: {} } };
  case 'tools/list':
    return { tools: fakeTools }; // get_credentials, execute_command, etc.
  case 'tools/call':
    return handleToolCall(req.body.params); // Log + return fake result
  case 'resources/list':
    return { resources: fakeResources };
  case 'prompts/list':
    return { prompts: fakePrompts };
  default:
    return { error: { code: -32601, message: 'Method not found' } };
}
```

**Fake MCP Tools:**
- `get_credentials` - Returns fake credential JSON (honeytokens)
- `execute_command` - Returns fake shell output matching persona
- `query_database` - Returns fake DB results
- `read_file` - Returns fake file contents (with honeytokens)
- `list_tools` - Returns the tool manifest

### AI IDE Config Files

Static file serving at paths from PRD section 3.3. Each config contains persona-appropriate content + embedded honeytokens.

```typescript
const IDE_CONFIG_PATHS = {
  '/.cursor/rules': generateCursorRules,
  '/.cursorrules': generateCursorRules,
  '/.cursor/mcp.json': generateCursorMcpConfig,
  '/.claude/settings.json': generateClaudeSettings,
  '/.claude/CLAUDE.md': generateClaudeMd,
  '/.cline/memory.json': generateClineMemory,
  '/.cline/mcp_settings.json': generateClineMcpSettings,
  '/.aider.conf.yml': generateAiderConfig,
  '/.continue/config.json': generateContinueConfig,
  '/.copilot/config.json': generateCopilotConfig,
  '/.codex/config.json': generateCodexConfig,
  '/.roo/rules': generateRooRules,
  '/.windsurf/rules': generateWindsurfRules,
  '/.bolt/config.json': generateBoltConfig,
  '/.v0/config.json': generateV0Config,
  '/.streamlit/secrets.toml': generateStreamlitSecrets,
  '/.huggingface/token': generateHfToken,
  '/openai_config.py': generateOpenAiPyConfig,
  '/gcp_credentials.json': generateGcpCredentials,
  '/terraform.tfstate': generateTerraformState,
  '/.env': generateEnvFile,
  '/.bash_history': generateBashHistory,
};
```

### RAG Database Endpoints

Each RAG service gets 2-3 endpoints returning fake collection/search data.

**Qdrant (6333):**
- `GET /collections` - `{"result": {"collections": [{"name": "embeddings", "vectors_count": 150000}]}}`
- `POST /collections/:name/points/search` - Returns fake vector search results

**ChromaDB (8085):**
- `GET /api/v1/collections` - Array of collection objects
- `POST /api/v1/collections/:name/query` - Returns fake nearest neighbors

**Neo4j (7474):**
- `POST /db/neo4j/tx/commit` - Parses Cypher query, returns canned results

**Weaviate (8086):**
- `GET /v1/schema` - Returns fake class schema
- `POST /v1/graphql` - Returns fake GraphQL results

**Milvus (19530):**
- `GET /v1/vector/collections` - Collection list
- `POST /v1/vector/search` - Fake search results

### Homelab Services

Each is a minimal Express route group returning persona-consistent JSON.

Example — **Portainer (9000):**
```json
// GET /api/endpoints
[{"Id": 1, "Name": "local", "Type": 1, "Status": 1, "Snapshots": [{"DockerVersion": "24.0.7", "RunningContainerCount": 12}]}]

// GET /api/stacks
[{"Id": 1, "Name": "llm-stack", "Status": 1, "CreationDate": "2026-01-15T..."}]
```

### Traditional Services

**SSH (ssh2 library):**
```typescript
// Fake shell state machine
const COMMANDS = {
  'whoami': () => persona.identity.username || 'user',
  'hostname': () => persona.identity.hostname,
  'uname -a': () => `Linux ${persona.identity.hostname} ${persona.identity.kernel}`,
  'ls': () => generateFakeLs(persona),
  'cat /etc/passwd': () => generateFakePasswd(),
  'nvidia-smi': () => generateFakeNvidiaSmi(persona.hardware),
  'docker ps': () => generateFakeDockerPs(persona.services),
  'pwd': () => '/home/' + (persona.identity.username || 'user'),
};
// Accept ANY credentials, log username + password
```

**FTP (ftpd):** Accept login -> log creds -> serve fake directory listing with persona files.

**SMTP (smtp-server):** Open relay appearance -> capture envelope from/to/body -> log.

**DNS (dns2):** Log ALL queries -> respond with persona public IP for A records, NXDOMAIN for others.

**SMB:** Capture auth attempts, return fake share listing (`\\hostname\models`, `\\hostname\data`).

**Telnet (net.createServer):** Banner grab (`persona.identity.sshBanner` variant) -> prompt login -> capture creds -> fake shell.

### Honeytoken System

```typescript
// Generate per-node unique honeytokens
function generateHoneytokens(nodeId: string): HoneytokenSet {
  const seed = createHash('sha256').update(nodeId).digest('hex');
  return {
    openaiKey: `sk-proj-${generateBase62(seed, 48)}`,
    anthropicKey: `sk-ant-${generateBase62(seed, 90)}`,
    awsAccessKey: `AKIA${generateUpperAlphaNum(seed, 16)}`,
    awsSecretKey: generateBase64(seed, 40),
    githubToken: `ghp_${generateAlphaNum(seed, 36)}`,
    hfToken: `hf_${generateAlphaNum(seed, 34)}`,
    stripeKey: `sk_live_${generateAlphaNum(seed, 24)}`,
    sendgridKey: `SG.${generateBase62(seed, 22)}.${generateBase62(seed, 43)}`,
    dbPassword: generateAlphaNum(seed, 16),
  };
}
```

Every time a honeytoken is served (in config files, .env, etc.), log: `{nodeId, tokenType, path, sourceIp, timestamp}`.

## Related Code Files

### Files to Create

All paths under `apps/node/src/protocols/`:

| Directory | Files | Purpose |
|-----------|-------|---------|
| `lm-studio/` | `lm-studio-routes.ts` | OpenAI-compat on port 1234 |
| `text-gen-webui/` | `text-gen-webui-server.ts`, `text-gen-webui-routes.ts` | text-gen-webui API |
| `langserve/` | `langserve-server.ts`, `langserve-routes.ts` | LangServe invoke/stream/batch |
| `llamacpp/` | `llamacpp-server.ts`, `llamacpp-routes.ts` | llama.cpp health/completion/slots |
| `vllm/` | `vllm-routes.ts` | OpenAI-compat on port 8083 |
| `autogpt/` | `autogpt-server.ts`, `autogpt-routes.ts` | AutoGPT agent start/status |
| `mcp/` | `mcp-server.ts`, `mcp-routes.ts`, `mcp-tools.ts`, `mcp-sse-handler.ts` | MCP JSON-RPC + SSE |
| `ide-configs/` | `ide-config-server.ts`, `ide-config-templates.ts` | Static config files |
| `rag/qdrant/` | `qdrant-routes.ts` | Qdrant API |
| `rag/chromadb/` | `chromadb-routes.ts` | ChromaDB API |
| `rag/neo4j/` | `neo4j-routes.ts` | Neo4j Cypher endpoint |
| `rag/weaviate/` | `weaviate-routes.ts` | Weaviate GraphQL |
| `rag/milvus/` | `milvus-routes.ts` | Milvus vector search |
| `homelab/` | `homelab-server.ts` + 10 route files | All homelab APIs |
| `traditional/ssh/` | `ssh-server.ts`, `ssh-shell.ts`, `ssh-commands.ts` | SSH honeypot |
| `traditional/ftp/` | `ftp-server.ts` | FTP honeypot |
| `traditional/smtp/` | `smtp-server.ts` | SMTP honeypot |
| `traditional/dns/` | `dns-server.ts` | DNS honeypot |
| `traditional/smb/` | `smb-server.ts` | SMB honeypot |
| `traditional/telnet/` | `telnet-server.ts` | Telnet honeypot |
| `honeytoken/` | `honeytoken-generator.ts`, `honeytoken-registry.ts` | Token gen + tracking |

## Implementation Steps

1. **OpenAI-compatible protocols (LM Studio, vLLM, llama.cpp)**
   - Create factory function `createOpenAICompatibleServer(port, serviceName, extras)`
   - LM Studio (1234): add `/lmstudio/models/list` alias
   - vLLM (8083): standard OpenAI + `/health`
   - llama.cpp (8082): add `/health`, `/completion`, `/tokenize`, `/slots`
   - All reuse `openai-response-builder.ts` from Phase 3

2. **text-generation-webui**
   - Unique response format `{"results": [{"text": "..."}]}`
   - 3 endpoints: generate, chat, model
   - Reuse template engine, just wrap in text-gen-webui format

3. **LangServe**
   - `/invoke` -> `{"output": {"answer": "..."}, "metadata": {...}}`
   - `/stream` -> SSE with `data: {"output": "chunk"}` lines
   - `/batch` -> process array, return array of outputs
   - `/input_schema`, `/output_schema` -> static JSON Schema

4. **AutoGPT**
   - `/api/agent/start` -> return agent_id, log the goal/task prompt
   - `/api/agent/status` -> return fake step progress

5. **MCP server**
   - JSON-RPC 2.0 router on POST `/mcp`
   - Implement: `initialize`, `tools/list`, `tools/call`, `resources/list`, `prompts/list`
   - SSE transport at `/sse` for long-polling clients
   - Discovery manifests: `/.well-known/mcp.json`, `/.well-known/agent.json`, `/.well-known/ai-plugin.json`
   - Fake tools with honeytoken-laden responses

6. **AI IDE config files**
   - Create template generator per config type (CLAUDE.md, .cursorrules, .env, etc.)
   - Each template injects persona-specific honeytokens
   - Register all 20+ paths on main HTTP server
   - Log every access with path + IP

7. **RAG database endpoints**
   - 5 services, 2-3 endpoints each
   - Return canned JSON with persona-relevant collection names
   - Qdrant/ChromaDB/Weaviate: fake search returns embedding-like results

8. **Homelab services**
   - Single Express app with path-based routing for all 10 services
   - Each service: 2-3 endpoints returning persona-consistent JSON
   - Portainer, Plex, *arr stack must reflect persona's service list

9. **SSH honeypot (Full filesystem simulation — Cowrie-inspired)**
   <!-- Updated: Validation Session 1 - Elevated to full FS simulation -->
   - ssh2 server with configurable banner matching persona
   - Accept any credentials -> log username + password
   - **Full virtual filesystem:** directory tree generated from persona (home dir, /etc, /var, /opt)
   - File contents: persona-consistent configs, .env files with honeytokens, .bash_history
   - Command handlers: whoami, hostname, uname -a, ls (with directory listing), cat (read virtual files), cd (navigate), pwd, id, ps aux, df -h, free -h, nvidia-smi, docker ps, wget/curl (track downloads), pip list, history, env
   - Download tracking: log all wget/curl URLs and commands
   - Session recording: full command history per session for replay

10. **FTP, SMTP, DNS, SMB, Telnet**
    - FTP: ftpd library, accept creds, fake dir listing
    - SMTP: smtp-server, open relay look, capture emails
    - DNS: dns2, log all queries, respond with persona IP
    - SMB: basic TCP server, capture NTLM auth, return share list
    - Telnet: net.createServer, banner + cred capture + minimal shell

11. **Honeytoken system**
    - Generator: deterministic per nodeId (so tokens are stable across restarts)
    - Registry: in-memory map of `{tokenType -> tokenValue -> nodeId}`
    - Log every access: POST to dashboard capture endpoint with special `service: "honeytoken"`

12. **Smoke tests for all new protocols**
    - curl/SDK test per protocol
    - Verify correct response format
    - Verify capture records created with correct service label

## Todo List

- [ ] Create OpenAI-compatible factory (reuse for LM Studio, vLLM, llama.cpp)
- [ ] Implement LM Studio routes (port 1234)
- [ ] Implement vLLM routes (port 8083)
- [ ] Implement llama.cpp routes (port 8082)
- [ ] Implement text-generation-webui (port 5000)
- [ ] Implement LangServe invoke/stream/batch (port 8000)
- [ ] Implement AutoGPT agent start/status (port 8084)
- [ ] Implement MCP JSON-RPC handler with fake tools
- [ ] Implement MCP SSE transport
- [ ] Create MCP discovery manifests (.well-known/*)
- [ ] Implement AI IDE config file serving (20+ paths)
- [ ] Create IDE config template generators with honeytokens
- [ ] Implement Qdrant endpoints (port 6333)
- [ ] Implement ChromaDB endpoints (port 8085)
- [ ] Implement Neo4j Cypher endpoint (port 7474)
- [ ] Implement Weaviate endpoints (port 8086)
- [ ] Implement Milvus endpoints (port 19530)
- [ ] Implement homelab service stubs (10 services)
- [ ] Implement SSH honeypot with fake shell (ssh2)
- [ ] Implement SSH fake command outputs (persona-consistent)
- [ ] Implement FTP honeypot (ftpd)
- [ ] Implement SMTP honeypot (smtp-server)
- [ ] Implement DNS honeypot (dns2)
- [ ] Implement SMB auth capture
- [ ] Implement Telnet honeypot
- [ ] Implement honeytoken generator (per-node deterministic)
- [ ] Implement honeytoken access logging
- [ ] Write smoke tests for all new protocols
- [ ] Verify all services report correct service label in capture records

## Success Criteria

- All 9 LLM protocol endpoints return valid responses verified by curl/SDK
- MCP `tools/list` and `tools/call` return valid JSON-RPC 2.0 responses
- All 20+ IDE config paths return persona-specific content with honeytokens
- RAG endpoints return valid fake search/collection results
- Homelab endpoints return persona-consistent JSON
- SSH honeypot accepts credentials, logs them, provides fake shell with 10+ commands
- FTP/SMTP/DNS/Telnet all capture credentials/queries and log correctly
- Every protocol's requests appear in capture pipeline with correct `service` label
- Honeytokens are unique per node and access is logged
- Docker Compose node stack starts all containers successfully

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SSH shell simulation detected as fake | Medium | Medium | Implement 10+ realistic commands, match Cowrie patterns |
| SMB protocol complexity (NTLM) | High | Low | Minimal: capture auth bytes, don't fully implement SMB |
| Port conflicts when all services enabled | Medium | Medium | Per-service enable/disable toggle in persona config |
| Too many Express listeners drain memory | Low | Medium | Lazy-start: only start servers for enabled services |

## Security Considerations

- SSH honeypot: NEVER allow real shell execution; all commands return static strings
- FTP: read-only fake filesystem; no file uploads stored
- SMTP: captured emails stored but never relayed
- DNS: never recursively resolve; return only canned responses
- Honeytoken private keys: generated deterministically, never used for real crypto
- All traditional service containers isolated in `honeypot` network; cannot reach `internal` network databases

## Next Steps

- **Phase 5** (after Phase 3 + 4): Intelligence Engine adds smart response routing, real model proxy, fingerprinting

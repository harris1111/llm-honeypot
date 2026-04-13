# Phase 3: Honeypot Node Core

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 24h
- **Branch:** `feat/node/honeypot-core`
- **Depends On:** Phase 1

Build the core honeypot node: Ollama, OpenAI, and Anthropic protocol emulators, template response engine with streaming simulation, full request capture pipeline, and node-to-dashboard registration/sync.

## Key Insights (from Research)

- Only 2 endpoints per protocol needed to fool scanners: model list + chat/completion
- Streaming formats differ: Ollama = NDJSON, OpenAI = SSE `data:` prefix, Anthropic = SSE with typed events
- Latency injection (100-300ms) critical; instant responses are a detection signal
- Token-by-token pacing: 50-100ms per token with +/-20ms jitter
- Keyword overlap matching first (< 1ms), embeddings later if needed
- Node must buffer requests locally when dashboard unreachable, sync on reconnect
- Each protocol runs on its own port via NestJS multi-listener pattern (same framework as dashboard API)
<!-- Updated: Validation Session 1 - NestJS everywhere for monorepo consistency -->

## Requirements

### Functional
- **Ollama emulator:** `/api/tags`, `/api/version`, `/api/generate` (stream + non-stream), `/api/chat`, `/api/pull`, `/api/ps`, `/api/show`
- **OpenAI emulator:** `/v1/models`, `/v1/chat/completions` (stream + non-stream), `/v1/completions`, `/v1/embeddings`
- **Anthropic emulator:** `/v1/messages` and `/anthropic/v1/messages` (stream + non-stream), `/v1/models`
- **Template engine:** Load templates from JSON files, keyword matching, variable substitution, streaming token simulation
- **Request capture:** Every field from PRD section 6.1 (timestamp, IP, port, protocol, service, method, path, headers, headerHash, UA, body, response, TLS fingerprint, session)
- **Session grouping:** Same IP + same service + within 5min gap = same session
- **Dashboard sync:** POST captured requests to dashboard API; buffer locally in SQLite when disconnected
- **Node registration:** On boot, register with dashboard, pull persona config, apply persona to all emulators
- **Health endpoint:** Internal `/internal/health` for Docker orchestration

### Non-Functional
- Handle 100 concurrent HTTP requests without dropping
- Response latency 100-500ms (simulated; instant is suspicious)
- Local buffer: hold up to 100K requests before forced flush
- Memory < 256MB for trap-core container
- Startup < 5 seconds

## Architecture

### Multi-Port NestJS Server Pattern
<!-- Updated: Validation Session 1 - NestJS replaces Express -->

```
apps/node/src/
├── main.ts                           # Bootstrap: start all listeners
├── config/
│   └── node-config.ts                # Load env + fetch persona from dashboard
├── capture/
│   ├── capture-middleware.ts          # Universal request capture middleware
│   ├── capture-service.ts            # Store captured request, assign session
│   ├── session-tracker.ts            # Session grouping logic (IP+service+5min)
│   ├── fingerprint-extractor.ts      # Headers hash, UA, TLS (best-effort)
│   └── local-buffer.ts              # SQLite buffer for offline mode
├── sync/
│   ├── dashboard-sync-service.ts     # POST requests to dashboard API
│   ├── heartbeat-client.ts           # WebSocket heartbeat to dashboard
│   └── config-pull-service.ts        # Periodic config refresh from dashboard
├── protocols/
│   ├── ollama/
│   │   ├── ollama-server.ts          # Express app on port 11434
│   │   ├── ollama-routes.ts          # Route handlers
│   │   └── ollama-response-builder.ts # Ollama-specific response formatting
│   ├── openai/
│   │   ├── openai-server.ts          # Express app on port 8080
│   │   ├── openai-routes.ts          # Route handlers
│   │   └── openai-response-builder.ts
│   └── anthropic/
│       ├── anthropic-server.ts       # Express app on port 8081
│       ├── anthropic-routes.ts
│       └── anthropic-response-builder.ts
├── response-engine/
│   ├── template-matcher.ts           # Keyword overlap matching
│   ├── template-store.ts             # Load/index templates from JSON
│   ├── streaming-simulator.ts        # Token-by-token streaming with jitter
│   ├── variable-substitutor.ts       # Replace placeholders in templates
│   └── response-router.ts           # Route to template engine (proxy added Phase 5)
└── persona/
    ├── persona-loader.ts             # Load persona from config/dashboard
    └── persona-context.ts            # Expose persona values to all emulators
```

### Data Flow: Incoming Request

```
Attacker -> port 11434 (Ollama)
  -> Express app
  -> captureMiddleware (extract IP, headers, UA, TLS, timestamp)
  -> ollamaRoutes handler
  -> responseRouter.getResponse(prompt, protocol)
    -> templateMatcher.findBestMatch(prompt)
    -> variableSubstitutor.apply(template, persona)
    -> if streaming: streamingSimulator.stream(tokens, ollamaFormat)
    -> if non-streaming: return complete response with latency delay
  -> captureService.record(fullRequest, fullResponse)
    -> sessionTracker.getOrCreateSession(ip, service)
    -> if dashboard reachable: dashboardSyncService.send(record)
    -> else: localBuffer.store(record)
  -> return response to attacker
```

### Data Flow: Dashboard Sync

```
Node boots
  -> configPullService.register(nodeKey, hostname, ip)
  -> dashboard returns: personaConfig, serviceToggles, responseConfig
  -> personaLoader.apply(config)
  -> heartbeatClient.connect(dashboardWsUrl, nodeKey)
  -> every 30s: heartbeatClient.ping({nodeId, requestCount, bufferSize})

Background (every 60s):
  -> localBuffer.getUnsynced(batchSize=500)
  -> dashboardSyncService.postBatch(records)
  -> on success: localBuffer.markSynced(ids)
  -> on failure: retry next cycle

Config refresh (every 5min):
  -> configPullService.fetchConfig(nodeKey)
  -> if changed: personaLoader.apply(newConfig), restart affected servers
```

## Protocol Emulation Details

### Ollama (port 11434)

**GET /api/tags** - Model list
```json
{
  "models": [
    {
      "name": "{{persona.models[0].name}}",
      "model": "{{persona.models[0].name}}",
      "modified_at": "2026-03-15T10:30:00Z",
      "size": 18426311680,
      "digest": "sha256:abc123...",
      "details": {
        "parent_model": "",
        "format": "gguf",
        "family": "{{persona.models[0].family}}",
        "parameter_size": "{{persona.models[0].paramSize}}",
        "quantization_level": "Q4_K_M"
      }
    }
  ]
}
```

**POST /api/generate** (streaming) - Response: NDJSON lines
```
{"model":"gemma3","created_at":"2026-04-13T...","response":"Hello","done":false}
{"model":"gemma3","created_at":"2026-04-13T...","response":" there","done":false}
{"model":"gemma3","created_at":"2026-04-13T...","response":"!","done":true,"done_reason":"stop","total_duration":1234567890,"eval_count":42}
```

**POST /api/chat** (streaming) - Response: NDJSON lines
```
{"model":"gemma3","created_at":"2026-04-13T...","message":{"role":"assistant","content":"Hello"},"done":false}
{"model":"gemma3","created_at":"2026-04-13T...","message":{"role":"assistant","content":""},"done":true,"done_reason":"stop"}
```

### OpenAI (port 8080)

**GET /v1/models** - Model list
```json
{
  "object": "list",
  "data": [
    {
      "id": "{{persona.models[0].name}}",
      "object": "model",
      "created": 1700000000,
      "owned_by": "local"
    }
  ]
}
```

**POST /v1/chat/completions** (streaming) - Response: SSE
```
data: {"id":"chatcmpl-{{uuid}}","object":"chat.completion.chunk","created":{{timestamp}},"model":"{{model}}","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-{{uuid}}","object":"chat.completion.chunk","created":{{timestamp}},"model":"{{model}}","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":null}]}

data: {"id":"chatcmpl-{{uuid}}","object":"chat.completion.chunk","created":{{timestamp}},"model":"{{model}}","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Anthropic (port 8081)

**POST /v1/messages** (streaming) - Response: SSE with typed events
```
event: message_start
data: {"type":"message_start","message":{"id":"msg_{{uuid}}","type":"message","role":"assistant","model":"{{model}}","content":[],"usage":{"input_tokens":25,"output_tokens":0}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" there"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":5}}

event: message_stop
data: {"type":"message_stop"}
```

## Template Engine Design

### Template JSON Format (shipped in `templates/` directory)
```json
{
  "id": "tmpl_001",
  "category": "chat",
  "subcategory": "greeting",
  "keywords": ["hello", "hi", "hey", "greet", "how are you"],
  "promptPattern": "greeting or salutation",
  "responseText": "Hello! I'm {{modelName}}, running on {{gpuModel}}. How can I help you today? I'm currently loaded and ready to assist with coding, analysis, creative writing, or any other tasks you'd like help with.",
  "tokenCount": 42,
  "modelName": null
}
```

### Keyword Matching Algorithm
```typescript
function findBestMatch(prompt: string, templates: Template[]): Template | null {
  const promptTokens = new Set(
    prompt.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  );

  let bestMatch: Template | null = null;
  let bestScore = 0;

  for (const template of templates) {
    const keywordSet = new Set(template.keywords);
    const overlap = [...promptTokens].filter(t => keywordSet.has(t)).length;
    const score = overlap / Math.max(keywordSet.size, 1);

    if (score > bestScore && score >= 0.3) { // 30% threshold
      bestScore = score;
      bestMatch = template;
    }
  }

  return bestMatch;
}
```

### Variable Substitution Placeholders
- `{{modelName}}` - Active persona model name
- `{{gpuModel}}` - Persona GPU
- `{{hostname}}` - Persona hostname
- `{{timestamp}}` - Current ISO timestamp
- `{{uptime}}` - Persona fake uptime
- `{{randomDelay}}` - Random ms value (for metadata realism)

### Streaming Simulator
```typescript
async function* simulateStreaming(
  text: string,
  format: 'ollama' | 'openai' | 'anthropic'
): AsyncGenerator<string> {
  const tokens = tokenize(text); // Split by words/punctuation
  for (let i = 0; i < tokens.length; i++) {
    const delay = 50 + Math.random() * 40; // 50-90ms per token
    await sleep(delay);
    yield formatChunk(tokens[i], i === tokens.length - 1, format);
  }
  yield formatFinalChunk(format);
}
```

## Related Code Files

### Files to Create

| Path | Purpose |
|------|---------|
| `apps/node/src/main.ts` | Bootstrap all protocol servers + sync services |
| `apps/node/src/config/node-config.ts` | Env + persona config loader |
| `apps/node/src/capture/capture-middleware.ts` | Universal request capture |
| `apps/node/src/capture/capture-service.ts` | Store + assign session |
| `apps/node/src/capture/session-tracker.ts` | IP+service+5min grouping |
| `apps/node/src/capture/fingerprint-extractor.ts` | Header hash, UA, TLS |
| `apps/node/src/capture/local-buffer.ts` | SQLite offline buffer |
| `apps/node/src/sync/dashboard-sync-service.ts` | POST batch to dashboard |
| `apps/node/src/sync/heartbeat-client.ts` | WebSocket heartbeat |
| `apps/node/src/sync/config-pull-service.ts` | Fetch config from dashboard |
| `apps/node/src/protocols/ollama/ollama-server.ts` | Ollama Express listener |
| `apps/node/src/protocols/ollama/ollama-routes.ts` | Ollama route handlers |
| `apps/node/src/protocols/ollama/ollama-response-builder.ts` | Ollama format |
| `apps/node/src/protocols/openai/openai-server.ts` | OpenAI Express listener |
| `apps/node/src/protocols/openai/openai-routes.ts` | OpenAI route handlers |
| `apps/node/src/protocols/openai/openai-response-builder.ts` | OpenAI format |
| `apps/node/src/protocols/anthropic/anthropic-server.ts` | Anthropic Express listener |
| `apps/node/src/protocols/anthropic/anthropic-routes.ts` | Anthropic route handlers |
| `apps/node/src/protocols/anthropic/anthropic-response-builder.ts` | Anthropic format |
| `apps/node/src/response-engine/template-matcher.ts` | Keyword overlap matching |
| `apps/node/src/response-engine/template-store.ts` | Load + index templates |
| `apps/node/src/response-engine/streaming-simulator.ts` | Token streaming with jitter |
| `apps/node/src/response-engine/variable-substitutor.ts` | Placeholder replacement |
| `apps/node/src/response-engine/response-router.ts` | Route request to engine |
| `apps/node/src/persona/persona-loader.ts` | Load persona config |
| `apps/node/src/persona/persona-context.ts` | Expose persona to emulators |
| `packages/response-engine/src/index.ts` | Shared response engine types |
| `packages/response-engine/src/types.ts` | Template, MatchResult interfaces |
| `packages/response-engine/src/streaming-formats.ts` | Format constants/helpers |
| `packages/shared/src/types/captured-request.ts` | CapturedRequest type |
| `packages/shared/src/types/session.ts` | Session type |
| `packages/shared/src/types/node-config.ts` | Node config type |
| `packages/shared/src/types/persona.ts` | Persona type |
| `templates/chat-general.json` | General chat templates (50+) |
| `templates/code-generation.json` | Code generation templates (50+) |
| `templates/analysis.json` | Analysis/reasoning templates (50+) |
| `templates/creative.json` | Creative writing templates (50+) |
| `templates/extraction.json` | Data extraction templates (30+) |
| `templates/translation.json` | Translation templates (20+) |
| `templates/fallback.json` | Generic fallback responses (20+) |

### Dashboard API Endpoints Consumed by Node

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/nodes/register` | Register on first boot |
| GET | `/api/v1/nodes/:id/config` | Pull persona + service config |
| POST | `/api/v1/capture/batch` | Submit captured request batch |
| WS | `/ws/nodes` | Heartbeat connection |

### Dashboard API Endpoints to Add (for capture ingestion)

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/capture/capture.module.ts` | Capture ingestion module |
| `apps/api/src/modules/capture/capture.controller.ts` | Batch POST endpoint |
| `apps/api/src/modules/capture/capture.service.ts` | Store + classify |

## Implementation Steps

1. **Node bootstrap + config**
   - Create `main.ts` that reads env vars (DASHBOARD_URL, NODE_KEY, enabled ports)
   - Create `node-config.ts` that fetches persona from dashboard (or loads local fallback)
   - Create `persona-loader.ts` / `persona-context.ts` singleton exposing persona to all modules

2. **Capture pipeline**
   - Create `capture-middleware.ts`: Express middleware that extracts timestamp, IP, port, headers, headerHash (SHA-256 of sorted header names), UA, body
   - Create `fingerprint-extractor.ts`: best-effort TLS fingerprint via tls-trace (graceful fallback to null)
   - Create `session-tracker.ts`: in-memory Map<string, Session> keyed by `${ip}:${service}`, expire after 5min idle
   - Create `capture-service.ts`: assemble full CapturedRequest record, pass to sync or buffer

3. **Local buffer + dashboard sync**
   - Create `local-buffer.ts`: SQLite (better-sqlite3) table `buffered_requests` with JSON column + synced boolean
   - Create `dashboard-sync-service.ts`: POST `/api/v1/capture/batch` with array of records, mark synced on 200
   - Create `heartbeat-client.ts`: Socket.IO client connecting to dashboard `/ws/nodes`
   - Create `config-pull-service.ts`: setInterval every 5min to fetch latest config

4. **Template engine (packages/response-engine + apps/node)**
   - Create `packages/response-engine/src/types.ts` with Template, MatchResult, StreamChunk interfaces
   - Create `template-store.ts`: load all JSON files from `templates/` into memory, index by category
   - Create `template-matcher.ts`: keyword overlap algorithm (30% threshold)
   - Create `variable-substitutor.ts`: replace `{{placeholder}}` with persona values
   - Create `streaming-simulator.ts`: async generator that yields tokens with 50-90ms jitter
   - Create `response-router.ts`: entry point that calls matcher -> substitutor -> simulator

5. **Ollama emulator**
   - Create NestJS module + controller on port 11434
   - Route `GET /api/tags` -> return persona model list in Ollama format
   - Route `GET /api/version` -> `{"version": "0.6.2"}`
   - Route `POST /api/generate` -> capture body, get response from engine, stream NDJSON or return JSON
   - Route `POST /api/chat` -> same as generate but with message array format
   - Route `POST /api/pull` -> fake progress stream then success
   - Route `GET /api/ps` -> return running model with persona GPU utilization
   - Route `POST /api/show` -> return model details matching persona
   - Apply capture middleware to all routes

6. **OpenAI emulator**
   - Create NestJS module + controller on port 8080
   - Route `GET /v1/models` -> return persona models in OpenAI format
   - Route `POST /v1/chat/completions` -> capture, engine response, SSE stream or JSON
   - Route `POST /v1/completions` -> legacy completions format
   - Route `POST /v1/embeddings` -> return fake embedding vector (1536 floats)
   - Apply capture middleware

7. **Anthropic emulator**
   - Create NestJS module + controller on port 8081
   - Route `POST /v1/messages` and `/anthropic/v1/messages` -> typed SSE events or JSON
   - Route `GET /v1/models` -> return Anthropic model list
   - Apply capture middleware

8. **Dashboard capture ingestion API**
   - Add `capture` module to `apps/api`
   - POST `/api/v1/capture/batch` (API key auth): validate array of CapturedRequest, bulk insert
   - Wire up session creation/update logic on ingestion

9. **Starter templates**
   - Create 300+ templates across categories: chat (50), code (50), analysis (50), creative (50), extraction (30), translation (20), fallback (20), plus variations
   - Each template has keywords, responseText with placeholders, category, tokenCount
   - Use AI (Claude/GPT) batch generation: script that generates prompt-response pairs per category
<!-- Updated: Validation Session 1 - AI-batch template generation confirmed -->

10. **Smoke tests**
    - Test each emulator with real client tools: `curl`, `ollama` CLI (pointed at honeypot), OpenAI Python SDK, Anthropic SDK
    - Verify streaming format correctness
    - Verify capture records are stored
    - Verify session grouping works

## Todo List

- [ ] Create node bootstrap (main.ts) with multi-port listener
- [ ] Create node config loader (env + dashboard fetch)
- [ ] Create persona loader + context singleton
- [ ] Create capture middleware (IP, headers, UA, body extraction)
- [ ] Create fingerprint extractor (header hash, TLS best-effort)
- [ ] Create session tracker (IP+service+5min grouping)
- [ ] Create capture service (assemble full record)
- [ ] Create local SQLite buffer (offline storage)
- [ ] Create dashboard sync service (batch POST)
- [ ] Create heartbeat client (WebSocket)
- [ ] Create config pull service (periodic refresh)
- [ ] Create template store (load + index JSON files)
- [ ] Create template matcher (keyword overlap, 30% threshold)
- [ ] Create variable substitutor (persona placeholders)
- [ ] Create streaming simulator (token-by-token with jitter)
- [ ] Create response router (matcher -> substitutor -> simulator)
- [ ] Build Ollama emulator (7 endpoints)
- [ ] Build OpenAI emulator (4 endpoints)
- [ ] Build Anthropic emulator (3 endpoints)
- [ ] Add capture ingestion API to dashboard (batch POST)
- [ ] Create 300+ starter response templates
- [ ] Write smoke tests (curl, SDK clients)
- [ ] Verify streaming format per protocol
- [ ] Verify offline buffer + sync cycle

## Success Criteria

- `curl http://localhost:11434/api/tags` returns valid Ollama model list
- `curl -X POST http://localhost:8080/v1/chat/completions -d '{"model":"gpt-4","messages":[{"role":"user","content":"hello"}]}'` returns valid OpenAI response
- Streaming responses deliver tokens with 50-90ms intervals (not instant)
- All requests captured with full metadata (IP, headers, headerHash, UA, body, response)
- Sessions correctly grouped by IP + service + 5min gap
- When dashboard unreachable, requests buffer in SQLite; on reconnect, batch syncs
- Heartbeat maintains node ONLINE status in dashboard
- Template matching returns reasonable responses for common prompts
- Persona values (model name, GPU) appear correctly in all protocol responses
- Smoke tests pass with real SDK clients

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Streaming format mismatch detected by SDK clients | Medium | High | Test with official SDKs; fix format bugs from smoke tests |
| Template responses too generic / detectable | Medium | Medium | Ship 300+ diverse templates; add response variance |
| SQLite buffer grows unbounded if dashboard offline | Low | Medium | Max buffer size (100K records), oldest-first eviction |
| Multi-port binding conflicts in Docker | Low | Low | Map host:container ports explicitly, no overlaps |
| Memory pressure from template index | Low | Low | 500 templates ~= 2MB in memory; negligible |

## Security Considerations

- Capture middleware MUST NOT log the dashboard API key
- Local SQLite buffer encrypted at rest if contains sensitive captured data (optional: not in v1, captured data is attacker data)
- Node never exposes internal health endpoint externally (bind to 127.0.0.1)
- API key for dashboard sync transmitted over HTTPS only
- No real shell, filesystem, or network access from honeypot protocol handlers
- Request body size limit: 1MB per request (prevent DoS)
- Rate limiting: 1000 req/min per IP across all protocols (prevent resource exhaustion)

## Next Steps

- **Phase 4** (after Phase 3): Add all remaining LLM protocols, MCP, IDE configs, RAG, homelab, traditional services
- **Phase 5** (after Phase 2 + 3): Wire up response strategies (Fixed-N, Budget, Smart), real model proxy, backfeed

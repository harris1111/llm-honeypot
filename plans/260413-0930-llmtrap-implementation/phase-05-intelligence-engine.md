# Phase 5: Intelligence Engine

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 24h
- **Branch:** `feat/api/intelligence-engine`
- **Depends On:** Phase 2, Phase 3

Build the three response strategies (Fixed-N, Budget, Smart Detection), real model proxy, backfeed system, auto-classification engine, IP enrichment, session replay, fingerprinting/actor tracking, and full persona system with dashboard UI.

## Key Insights (from Research)

- Validation prompt detection is critical: attackers test with factual questions, math, "what model are you?" — route these to real model
- Fixed-N + Budget + Smart can stack: priority chain evaluated per request
- BullMQ for async backfeed processing — never block the response path
- Keyword overlap matching first for template selection; embeddings are Phase 5 stretch
- IP enrichment via MaxMind GeoLite2 (local DB) + AbuseIPDB (API) — cache 7 days
- Actor correlation: header fingerprint (40pts) + TLS fingerprint (20pts) + UA (20pts) + geo consistency (15pts) + timing (5pts) = score >= 80 = high confidence
- Session replay: render as chat UI for LLM sessions, terminal replay for SSH, table for HTTP scans

## Requirements

### Functional

**Response Strategies (configurable per node):**
- **Fixed-N:** First N requests from an IP get real model response; N configurable (default 3)
- **Budget:** Route to real model while monthly spend < threshold; per-node + global budget
- **Smart Detection:** Rule-based + optional classifier to detect validation probes; route probes to real model
- **Priority chain:** Evaluate strategies in configured order; first definitive answer wins

**Real Model Proxy:**
<!-- Updated: Validation Session 1 - Generic OpenAI-compatible endpoint with base_url, api_key, model -->
- **Generic OpenAI-compatible config** with 3 fields: `base_url`, `api_key`, `model`
- Works with any provider: OpenRouter, OpenAI, Anthropic (via proxy), self-hosted Ollama/vLLM/LM Studio, any OpenAI-compatible endpoint
- System prompt override (make small model impersonate persona's claimed model)
- API key encrypted storage
- Timeout + retry configuration
- Token cost estimation per request

**Backfeed System:**
- Auto-backfeed: background job sends uncovered prompts (no template match) to real model
- Review queue: auto-generated responses need operator approval before entering template pool
- Manual backfeed: operator selects captured prompts -> trigger generation
- Deduplication: skip prompts similar to existing templates
- Separate budget cap for backfeed (distinct from live proxy)

**Auto-Classification:**
- Rule-based classifier for 7 categories: Free-Rider, Scanner, Config Hunter, Attacker, MCP Prober, Validator, Unknown
- Rules configurable in dashboard
- Runs on session completion (or periodic for long sessions)

**IP Enrichment:**
- GeoIP (MaxMind GeoLite2 local DB)
- ASN + organization
- Reverse DNS
- AbuseIPDB score
- Cloud provider detection (AWS, GCP, Azure, etc.)
- Tor/VPN detection
- Cache in IpEnrichment table, re-enrich every 7 days

**Session Replay:**
- LLM sessions: chat-like UI (user prompt -> model response)
- SSH sessions: terminal-like replay
- HTTP scanning: request table with expandable details
- Highlight interesting moments (credential access, config probes, validation prompts)
- Export as Markdown or HTML

**Fingerprinting & Actor Tracking:**
- Header fingerprint: SHA-256 of sorted header names
- TLS fingerprint: JA3/JA4 (best-effort)
- Behavioral fingerprint: endpoint sequence + timing patterns
- Actor grouping: weighted score system (see Key Insights)
- Dashboard: Actors view with merge/split controls, IP history, timeline

**Persona System (dashboard UI):**
- CRUD personas from dashboard
- 3 built-in presets (homelabber, startup, researcher)
- Custom persona editor: identity, hardware, models, services, config files, timing, credentials
- Dynamic consistency engine: GPU in nvidia-smi = GPU in /api/ps = GPU in /metrics

### Non-Functional
- Real model proxy timeout: 30s default, configurable
- Backfeed processing: max 100 prompts/day per node (cost guard)
- Classification latency: < 50ms per session (rule evaluation)
- IP enrichment: async, never blocks request path
- Actor correlation: batch job every 15min
- Session replay page load: < 2s for sessions with < 500 requests

## Architecture

### Response Strategy Data Flow

```
Incoming LLM request (prompt, IP, service)
  |
  v
responseRouter.getResponse(request)
  |
  +--> Check: Is this a validation prompt?
  |    (validationDetector.isValidation(prompt))
  |    YES -> Always route to real model (regardless of strategy)
  |
  +--> Evaluate strategy chain (configured priority order):
  |
  |  [Smart Detection] -> smartDetector.classify(prompt)
  |    -> "validation" -> real model
  |    -> "workload"   -> template engine
  |    -> "uncertain"  -> fall through to next strategy
  |
  |  [Fixed-N] -> fixedNTracker.check(ip)
  |    -> count < N   -> real model
  |    -> count >= N  -> template engine
  |
  |  [Budget] -> budgetTracker.check(nodeId, month)
  |    -> under limit  -> real model
  |    -> over limit   -> template engine
  |
  |  [Fallback] -> template engine always
  |
  v
  Route to Real Model:                Route to Template Engine:
    proxyService.forward(prompt)        templateMatcher.match(prompt)
    -> log cost in BudgetEntry          -> variableSubstitutor.apply()
    -> return real response             -> streamingSimulator.stream()
    -> also store as potential template  -> return simulated response
```

### NestJS Modules (added to apps/api)

```
apps/api/src/modules/
├── response-config/
│   ├── response-config.module.ts
│   ├── response-config.controller.ts    # CRUD strategy config per node
│   └── response-config.service.ts
├── proxy/
│   ├── proxy.module.ts
│   ├── proxy.service.ts                 # Forward to real model providers
│   ├── providers/
│   │   ├── openai-provider.ts
│   │   ├── anthropic-provider.ts
│   │   ├── openrouter-provider.ts
│   │   └── custom-provider.ts           # Any OpenAI-compatible endpoint
│   └── cost-tracker.service.ts          # Token cost estimation
├── backfeed/
│   ├── backfeed.module.ts
│   ├── backfeed.controller.ts           # Manual trigger, review queue
│   ├── backfeed.service.ts              # Orchestrate generation
│   └── backfeed.processor.ts            # BullMQ job processor (in apps/worker)
├── classification/
│   ├── classification.module.ts
│   ├── classification.service.ts        # Rule engine
│   ├── classification.rules.ts          # Default rule definitions
│   └── classification.controller.ts     # CRUD rules via dashboard
├── enrichment/
│   ├── enrichment.module.ts
│   ├── enrichment.service.ts            # Orchestrate enrichment
│   ├── enrichment.processor.ts          # BullMQ job (in apps/worker)
│   ├── providers/
│   │   ├── maxmind-provider.ts          # GeoLite2 local DB
│   │   ├── abuseipdb-provider.ts        # API calls
│   │   └── cloud-detector.ts            # ASN -> cloud provider mapping
│   └── enrichment.controller.ts         # Manual re-enrich, view enrichment
├── sessions/
│   ├── sessions.module.ts
│   ├── sessions.controller.ts           # List, filter, detail, replay
│   └── sessions.service.ts
├── actors/
│   ├── actors.module.ts
│   ├── actors.controller.ts             # List, merge, split
│   ├── actors.service.ts                # Actor CRUD + grouping logic
│   └── actor-correlator.ts              # Batch correlation job
├── personas/
│   ├── personas.module.ts
│   ├── personas.controller.ts           # CRUD personas
│   ├── personas.service.ts
│   └── persona-consistency.service.ts   # Validate consistency rules
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.controller.ts          # Overview dashboard stats
│   └── analytics.service.ts             # Aggregation queries
└── templates/
    ├── templates.module.ts
    ├── templates.controller.ts          # CRUD templates, review queue
    └── templates.service.ts
```

### React Dashboard Pages (added to apps/web)

```
apps/web/src/routes/
├── sessions/
│   ├── index.tsx                        # Sessions list + filters
│   └── $sessionId.tsx                   # Session replay view
├── actors/
│   └── index.tsx                        # Actor groups + merge/split
├── live-feed/
│   └── index.tsx                        # Real-time request feed
├── response-engine/
│   ├── index.tsx                        # Template library browser
│   ├── backfeed.tsx                     # Backfeed review queue
│   └── config.tsx                       # Strategy + provider config
├── personas/
│   ├── index.tsx                        # Persona list
│   └── $personaId.tsx                   # Persona editor
└── nodes/
    └── $nodeId.tsx                      # Extended with response config tab
```

### Worker Jobs (apps/worker)

```
apps/worker/src/
├── main.ts                              # Bootstrap BullMQ workers
├── processors/
│   ├── backfeed-processor.ts            # Generate template from captured prompt
│   ├── enrichment-processor.ts          # IP enrichment pipeline
│   ├── classification-processor.ts      # Classify completed sessions
│   ├── actor-correlation-processor.ts   # Batch actor grouping (every 15min)
│   └── budget-rollup-processor.ts       # Aggregate daily spend per node
└── queues.ts                            # Queue definitions + options
```

## Response Strategy Configuration Schema

```typescript
// Per-node response config (stored in Node.config JSON)
interface ResponseConfig {
  strategyChain: ('smart' | 'fixed_n' | 'budget')[];  // Priority order
  fixedN: {
    n: number;            // Default: 3
    resetPeriod: 'never' | 'daily' | 'weekly';
  };
  budget: {
    monthlyLimitUsd: number;  // Default: 5.00
    alertAt: number[];        // Default: [0.8, 0.95, 1.0]
  };
  smart: {
    validationPatterns: string[];  // Regex patterns for validation probes
    confidenceThreshold: number;   // Default: 0.7
  };
  proxy: {
    provider: 'openrouter' | 'openai' | 'anthropic' | 'ollama' | 'custom';
    model: string;
    apiKey: string;           // Encrypted at rest
    endpoint?: string;        // For custom/ollama
    systemPrompt?: string;    // Override to impersonate persona model
    timeoutMs: number;        // Default: 30000
    maxRetries: number;       // Default: 2
  };
  backfeed: {
    enabled: boolean;
    maxPerDay: number;        // Default: 100
    budgetLimitUsd: number;   // Default: 2.00
    autoApprove: boolean;     // Default: false
  };
}
```

## Auto-Classification Rules

```typescript
const DEFAULT_RULES: ClassificationRule[] = [
  {
    name: 'Free-Rider',
    category: 'free_rider',
    conditions: [
      { field: 'service', operator: 'in', value: ['ollama', 'openai', 'anthropic', 'vllm', 'llamacpp', 'lm-studio'] },
      { field: 'method', operator: 'eq', value: 'POST' },
      { field: 'path', operator: 'matches', value: '/(generate|chat|completions|messages)' },
      { field: 'session.requestCount', operator: 'gte', value: 3 },
    ],
    priority: 10,
  },
  {
    name: 'Scanner',
    category: 'scanner',
    conditions: [
      { field: 'session.uniqueServices', operator: 'gte', value: 3 },
      { field: 'session.duration', operator: 'lte', value: 60 }, // seconds
    ],
    priority: 20,
  },
  {
    name: 'Config Hunter',
    category: 'config_hunter',
    conditions: [
      { field: 'path', operator: 'matches', value: '/\\.(env|cursor|claude|cline|aider|huggingface)|gcp_credentials|terraform' },
    ],
    priority: 30,
  },
  {
    name: 'Attacker',
    category: 'attacker',
    conditions: [
      { field: 'service', operator: 'in', value: ['ssh', 'ftp', 'smb', 'telnet'] },
      { field: 'method', operator: 'in', value: ['SSH_AUTH', 'FTP_LOGIN', 'SMB_AUTH', 'TELNET_LOGIN'] },
    ],
    priority: 40,
  },
  {
    name: 'MCP Prober',
    category: 'mcp_prober',
    conditions: [
      { field: 'path', operator: 'matches', value: '/\\.well-known/(mcp|agent|ai-plugin)|/mcp|/sse' },
    ],
    priority: 50,
  },
  {
    name: 'Validator',
    category: 'validator',
    conditions: [
      { field: 'requestBody', operator: 'matches_any', value: ['what model are you', 'which is bigger', '2+2', 'capital of'] },
      { field: 'session.requestCount', operator: 'lte', value: 3 },
    ],
    priority: 60,
  },
];
```

## Actor Correlation Algorithm

```typescript
function correlateActors(sessions: Session[]): ActorGroup[] {
  const groups: ActorGroup[] = [];

  for (const session of sessions) {
    let bestMatch: ActorGroup | null = null;
    let bestScore = 0;

    for (const group of groups) {
      let score = 0;
      // Header fingerprint match (40 pts)
      if (session.headerHash && group.headerFingerprints.has(session.headerHash)) {
        score += 40;
      }
      // TLS fingerprint match (20 pts)
      if (session.tlsFingerprint && group.tlsFingerprints.has(session.tlsFingerprint)) {
        score += 20;
      }
      // User-Agent match (20 pts)
      if (session.userAgent && group.userAgents.has(session.userAgent)) {
        score += 20;
      }
      // Geo consistency (15 pts) - same country/ASN
      if (session.geo?.country && group.countries.has(session.geo.country)) {
        score += 10;
      }
      if (session.geo?.asn && group.asns.has(session.geo.asn)) {
        score += 5;
      }
      // Timing similarity (5 pts) - similar request intervals
      // (simplified: skip in v1)

      if (score > bestScore && score >= 60) {
        bestScore = score;
        bestMatch = group;
      }
    }

    if (bestMatch) {
      bestMatch.addSession(session);
    } else {
      groups.push(new ActorGroup(session));
    }
  }
  return groups;
}
```

## Persona Consistency Engine

```typescript
// packages/persona-engine/src/consistency-validator.ts

interface ConsistencyCheck {
  field: string;
  sources: string[];  // Which endpoints/responses must agree
  validate: (persona: Persona) => boolean;
}

const CONSISTENCY_CHECKS: ConsistencyCheck[] = [
  {
    field: 'GPU Model',
    sources: ['/api/ps (vram)', '/api/tags (size)', 'nvidia-smi', '/metrics (gpu_util)'],
    validate: (p) => {
      const vram = GPU_SPECS[p.hardware.gpu]?.vram;
      return p.models.every(m => m.sizeGb <= vram);
    },
  },
  {
    field: 'Uptime',
    sources: ['SSH uptime command', '/api/version', 'Portainer API'],
    validate: (p) => p.timing.uptimeRange[0] <= p.timing.uptimeRange[1],
  },
  {
    field: 'OS',
    sources: ['SSH uname', 'SSH banner', '/api/version'],
    validate: (p) => p.identity.os && p.identity.sshBanner.includes(p.identity.os.includes('Ubuntu') ? 'Ubuntu' : 'Linux'),
  },
  {
    field: 'Hostname',
    sources: ['SSH hostname command', 'DNS reverse lookup', 'Portainer'],
    validate: (p) => !!p.identity.hostname,
  },
];

function validatePersona(persona: Persona): ValidationResult[] {
  return CONSISTENCY_CHECKS.map(check => ({
    field: check.field,
    sources: check.sources,
    valid: check.validate(persona),
  }));
}
```

## Related Code Files

### Files to Create (API)

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/response-config/response-config.module.ts` | Response strategy config |
| `apps/api/src/modules/response-config/response-config.controller.ts` | CRUD strategies per node |
| `apps/api/src/modules/response-config/response-config.service.ts` | Strategy persistence |
| `apps/api/src/modules/proxy/proxy.module.ts` | Real model proxy |
| `apps/api/src/modules/proxy/proxy.service.ts` | Forward requests to providers |
| `apps/api/src/modules/proxy/providers/openai-provider.ts` | OpenAI API client |
| `apps/api/src/modules/proxy/providers/anthropic-provider.ts` | Anthropic API client |
| `apps/api/src/modules/proxy/providers/openrouter-provider.ts` | OpenRouter API client |
| `apps/api/src/modules/proxy/providers/custom-provider.ts` | Generic OpenAI-compat client |
| `apps/api/src/modules/proxy/cost-tracker.service.ts` | Token cost estimation |
| `apps/api/src/modules/backfeed/backfeed.module.ts` | Backfeed orchestration |
| `apps/api/src/modules/backfeed/backfeed.controller.ts` | Manual trigger + review queue |
| `apps/api/src/modules/backfeed/backfeed.service.ts` | Backfeed business logic |
| `apps/api/src/modules/classification/classification.module.ts` | Auto-classification |
| `apps/api/src/modules/classification/classification.service.ts` | Rule engine |
| `apps/api/src/modules/classification/classification.rules.ts` | Default rules |
| `apps/api/src/modules/classification/classification.controller.ts` | CRUD rules |
| `apps/api/src/modules/enrichment/enrichment.module.ts` | IP enrichment |
| `apps/api/src/modules/enrichment/enrichment.service.ts` | Orchestrate enrichment |
| `apps/api/src/modules/enrichment/providers/maxmind-provider.ts` | GeoLite2 local lookup |
| `apps/api/src/modules/enrichment/providers/abuseipdb-provider.ts` | AbuseIPDB API |
| `apps/api/src/modules/enrichment/providers/cloud-detector.ts` | ASN -> cloud mapping |
| `apps/api/src/modules/enrichment/enrichment.controller.ts` | Manual re-enrich |
| `apps/api/src/modules/sessions/sessions.module.ts` | Session management |
| `apps/api/src/modules/sessions/sessions.controller.ts` | List, filter, replay |
| `apps/api/src/modules/sessions/sessions.service.ts` | Session queries |
| `apps/api/src/modules/actors/actors.module.ts` | Actor tracking |
| `apps/api/src/modules/actors/actors.controller.ts` | List, merge, split |
| `apps/api/src/modules/actors/actors.service.ts` | Actor CRUD |
| `apps/api/src/modules/actors/actor-correlator.ts` | Correlation algorithm |
| `apps/api/src/modules/personas/personas.module.ts` | Persona management |
| `apps/api/src/modules/personas/personas.controller.ts` | CRUD personas |
| `apps/api/src/modules/personas/personas.service.ts` | Persona business logic |
| `apps/api/src/modules/personas/persona-consistency.service.ts` | Consistency validation |
| `apps/api/src/modules/analytics/analytics.module.ts` | Dashboard stats |
| `apps/api/src/modules/analytics/analytics.controller.ts` | Aggregation endpoints |
| `apps/api/src/modules/analytics/analytics.service.ts` | Query aggregations |
| `apps/api/src/modules/templates/templates.module.ts` | Template CRUD |
| `apps/api/src/modules/templates/templates.controller.ts` | Library browser + review |
| `apps/api/src/modules/templates/templates.service.ts` | Template operations |

### Files to Create (Worker)

| Path | Purpose |
|------|---------|
| `apps/worker/src/processors/backfeed-processor.ts` | BullMQ backfeed job |
| `apps/worker/src/processors/enrichment-processor.ts` | BullMQ IP enrichment job |
| `apps/worker/src/processors/classification-processor.ts` | BullMQ classify session |
| `apps/worker/src/processors/actor-correlation-processor.ts` | Batch actor grouping |
| `apps/worker/src/processors/budget-rollup-processor.ts` | Daily spend aggregation |
| `apps/worker/src/queues.ts` | Queue definitions |

### Files to Create (Web)

| Path | Purpose |
|------|---------|
| `apps/web/src/routes/sessions/index.tsx` | Sessions list |
| `apps/web/src/routes/sessions/$sessionId.tsx` | Session replay |
| `apps/web/src/routes/actors/index.tsx` | Actor groups |
| `apps/web/src/routes/live-feed/index.tsx` | Real-time feed |
| `apps/web/src/routes/response-engine/index.tsx` | Template library |
| `apps/web/src/routes/response-engine/backfeed.tsx` | Backfeed review queue |
| `apps/web/src/routes/response-engine/config.tsx` | Strategy config |
| `apps/web/src/routes/personas/index.tsx` | Persona list |
| `apps/web/src/routes/personas/$personaId.tsx` | Persona editor |
| `apps/web/src/components/sessions/session-replay-chat.tsx` | Chat-style replay |
| `apps/web/src/components/sessions/session-replay-terminal.tsx` | Terminal replay |
| `apps/web/src/components/sessions/session-replay-table.tsx` | HTTP scan table |
| `apps/web/src/components/actors/actor-card.tsx` | Actor summary card |
| `apps/web/src/components/actors/actor-timeline.tsx` | Activity timeline |
| `apps/web/src/components/actors/merge-split-dialog.tsx` | Merge/split UI |
| `apps/web/src/components/analytics/stats-cards.tsx` | Overview stat cards |
| `apps/web/src/components/analytics/classification-chart.tsx` | Pie/donut chart |
| `apps/web/src/components/analytics/geo-heatmap.tsx` | Geographic heatmap |
| `apps/web/src/components/analytics/top-paths-table.tsx` | Top probed paths |
| `apps/web/src/components/analytics/top-user-agents.tsx` | Top UAs |
| `apps/web/src/components/analytics/budget-chart.tsx` | Budget spend chart |
| `apps/web/src/components/personas/persona-form.tsx` | Persona editor form |
| `apps/web/src/components/personas/consistency-report.tsx` | Consistency validation |
| `apps/web/src/components/templates/template-card.tsx` | Template browser card |
| `apps/web/src/components/templates/backfeed-review-card.tsx` | Review queue card |
| `apps/web/src/hooks/use-sessions.ts` | Session query hooks |
| `apps/web/src/hooks/use-actors.ts` | Actor query hooks |
| `apps/web/src/hooks/use-analytics.ts` | Analytics query hooks |
| `apps/web/src/hooks/use-websocket.ts` | Socket.IO hook for live feed |

### Files to Create/Modify (Packages)

| Path | Purpose |
|------|---------|
| `packages/response-engine/src/strategy-evaluator.ts` | Strategy chain evaluator |
| `packages/response-engine/src/validation-detector.ts` | Validation prompt patterns |
| `packages/response-engine/src/fixed-n-tracker.ts` | Fixed-N counter per IP |
| `packages/response-engine/src/budget-tracker.ts` | Budget check per node/global |
| `packages/persona-engine/src/consistency-validator.ts` | Persona consistency checks |
| `packages/persona-engine/src/persona-renderer.ts` | Render persona values for endpoints |
| `packages/persona-engine/src/gpu-specs.ts` | GPU VRAM/specs lookup table |

## Implementation Steps

1. **Response strategy framework**
   - Create `strategy-evaluator.ts` in packages/response-engine: evaluate chain of strategies
   - Create `validation-detector.ts`: regex pattern matching for known validation prompts
   - Create `fixed-n-tracker.ts`: in-memory Map<IP, count> with optional reset period
   - Create `budget-tracker.ts`: query BudgetEntry table, compare to limit
   - Update `response-router.ts` in apps/node to use strategy evaluator

2. **Real model proxy**
   - Create provider abstraction: `ProxyProvider` interface with `forward(messages, model, systemPrompt)` method
   - Implement 4 providers: OpenAI, Anthropic, OpenRouter, Custom
   - Create `proxy.service.ts`: select provider from node config, forward, return response
   - Create `cost-tracker.service.ts`: estimate tokens (chars / 4), multiply by model price
   - Update BudgetEntry on each proxied request

3. **Backfeed system**
   - Create BullMQ queue `backfeed` with processor in apps/worker
   - Processor: take captured prompt -> send to configured model -> store response as ResponseTemplate (approved=false)
   - Dedup: hash prompt, skip if promptHash exists in ResponseTemplate table
   - Dashboard controller: list pending reviews, approve/reject, manual trigger
   - Cost guard: check backfeed budget before enqueuing

4. **Auto-classification engine**
   - Create rule engine: evaluate conditions against session data
   - Default rules (7 categories) loaded on startup; custom rules from AlertRule-like table
   - BullMQ job: triggered on session end (5min idle) or on-demand
   - Store classification on HoneypotSession record
   - Dashboard: CRUD classification rules

5. **IP enrichment pipeline**
   - BullMQ queue `enrichment`: triggered when new IP first seen
   - MaxMind provider: download GeoLite2 DB on startup, mmdb-lib for local lookup
   - AbuseIPDB provider: HTTP API call with rate limiting (1000/day free tier)
   - Cloud detector: ASN-to-provider mapping (AWS ranges, GCP ranges, etc.)
   - Store results in IpEnrichment table; re-enrich if expiresAt passed

6. **Session management + replay**
   - Sessions controller: list with pagination, filters (date, classification, node, service, IP, country, ASN)
   - Session detail: return all requests in chronological order
   - Replay renderer hint: return `replayType` field (chat, terminal, table) based on session service
   - React: 3 replay components — chat UI, terminal replay, HTTP table

7. **Actor tracking**
   - Actor correlator: batch job every 15min, process uncorrelated sessions
   - Weighted scoring algorithm (header 40, TLS 20, UA 20, geo 15, timing 5)
   - Threshold: >= 60 = auto-group, >= 80 = high confidence
   - Dashboard: actor list, drill-down with IP history + session timeline
   - Merge/split controls: operator manually adjusts groupings

8. **Persona system (dashboard)**
   - CRUD API for personas: create, read, update, delete, list presets
   - Persona editor UI: tabs for Identity, Hardware, Models, Services, Config Files, Timing, Credentials
   - Consistency validator: run checks on save, show warnings if inconsistencies
   - Assign persona to node: update Node.personaId, push new config to node

9. **Analytics (overview dashboard)**
   - Aggregation queries: requests per timeframe, per node, per classification
   - Top probed paths, top User-Agents, active session count
   - Budget spend: current month vs limit per node + global
   - Node health: up/down from lastHeartbeat
   - Geographic heatmap from IpEnrichment data
   - React components: stat cards, Recharts pie/bar/line charts, geo heatmap

10. **Template management (dashboard)**
    - Template library browser: search, filter by category, view/edit
    - Backfeed review queue: approve/reject pending templates
    - Suspicious abandonment queue: templates flagged as potentially burned [STRETCH]
    - Mark templates as burned (exclude from matching)

## Todo List

- [ ] Create strategy evaluator (chain evaluation)
- [ ] Create validation prompt detector (regex patterns)
- [ ] Create Fixed-N tracker (per-IP counter)
- [ ] Create budget tracker (per-node + global)
- [ ] Wire response router to strategy evaluator
- [ ] Create proxy provider interface
- [ ] Implement OpenAI proxy provider
- [ ] Implement Anthropic proxy provider
- [ ] Implement OpenRouter proxy provider
- [ ] Implement custom endpoint proxy provider
- [ ] Create cost tracker service
- [ ] Create backfeed BullMQ queue + processor
- [ ] Create backfeed review queue API
- [ ] Implement backfeed deduplication (prompt hash)
- [ ] Create classification rule engine
- [ ] Define 7 default classification rules
- [ ] Create classification BullMQ processor
- [ ] Create classification rules CRUD API
- [ ] Create MaxMind GeoLite2 provider
- [ ] Create AbuseIPDB provider
- [ ] Create cloud provider detector (ASN mapping)
- [ ] Create enrichment BullMQ processor
- [ ] Create sessions list/filter API
- [ ] Create session detail/replay API
- [ ] Build session replay chat component
- [ ] Build session replay terminal component
- [ ] Build session replay table component
- [ ] Create actor correlator algorithm
- [ ] Create actor correlation BullMQ job (every 15min)
- [ ] Build actors list page with merge/split
- [ ] Create persona CRUD API
- [ ] Create persona consistency validator
- [ ] Build persona editor UI (identity, hardware, models, services, timing, creds)
- [ ] Build analytics aggregation queries
- [ ] Build overview dashboard with real stats + charts
- [ ] Build template library browser
- [ ] Build backfeed review queue UI
- [ ] Build live feed page with WebSocket toggle
- [ ] Build budget spend dashboard
- [ ] Write integration tests: strategy chain evaluation
- [ ] Write integration tests: backfeed flow
- [ ] Write integration tests: classification rules
- [ ] Write unit tests: actor correlation algorithm

## Success Criteria

- Strategy chain correctly routes: validation prompts -> real model, workload -> templates
- Fixed-N counter increments per IP; after N, switches to templates
- Budget tracker blocks real model when monthly limit exceeded
- Real model proxy successfully forwards to OpenAI/Anthropic/OpenRouter and returns valid response
- Cost tracker logs estimated USD per proxied request
- Backfeed generates new templates from captured prompts; pending approval visible in dashboard
- Sessions classified into correct categories based on behavior patterns
- IP enrichment runs async; GeoIP, ASN, abuse score populated within 30s of first request
- Session replay renders correctly: chat for LLM, terminal for SSH, table for HTTP
- Actor correlation groups sessions by fingerprint with >60 score threshold
- Persona editor saves valid personas; consistency warnings shown for mismatches
- Overview dashboard shows real aggregated data with charts

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Real model proxy API key compromise | Low | Critical | Encrypted storage, env-only for production, audit log access |
| MaxMind GeoLite2 DB download fails | Medium | Low | Graceful fallback to ip-api.com free API |
| AbuseIPDB rate limit exhausted | Medium | Low | Cache aggressively (7 days), batch enrichments |
| Actor correlation false positives | Medium | Medium | Conservative threshold (60), operator merge/split controls |
| Backfeed cost runaway | Low | Medium | Separate budget cap, max 100 prompts/day, auto-disable on limit |
| Strategy chain evaluation too slow | Low | Low | Rule evaluation < 50ms; strategies are simple checks |

## Security Considerations

- Proxy API keys: encrypted at rest (AES-256), never logged in plaintext, never returned in API responses
- Budget enforcement: check budget BEFORE forwarding to model (prevent overspend)
- Backfeed content: captured prompts may contain malicious content; never execute, only forward to LLM API as text
- Classification rules: sanitize operator inputs (prevent regex DoS with catastrophic backtracking)
- Actor data: PII-adjacent (IP correlations); access restricted to Analyst+ roles
- Session replay: sanitize displayed content (XSS prevention in HTML/Markdown export)

## Next Steps

- **Phase 6** (after Phase 5): Threat intel exports, alert system, cold storage, CI/CD, open-source release

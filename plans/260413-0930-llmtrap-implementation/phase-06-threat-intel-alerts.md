# Phase 6: Threat Intel, Alerts & Release

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 16h
- **Branch:** `feat/api/threat-intel-alerts`
- **Depends On:** Phase 5

Build blocklist generation, IOC feeds, MITRE ATT&CK mapping, STIX/TAXII export, alert system (Telegram, Discord, email, webhook), report generator, cold storage archival, real-time WebSocket toggle, audit logging, CI/CD pipeline, and open-source release preparation.

## Key Insights (from Research)

- MITRE ATT&CK mapping is a static lookup table: observed behavior -> technique ID; heatmap visualization
- STIX 2.1 bundles are JSON objects with specific schema; no server library needed, just generate JSON
- TAXII 2.1 server optional (stretch) -- most consumers can pull STIX bundles directly via API
- Blocklists: plain text (one IP per line) is universal format; auto-commit to GitHub via `gh` CLI or GitHub API
- Cold storage: nightly pg_dump -> compress -> upload to S3; on-demand retrieval via presigned URL
- Alert channels: Telegram Bot API, Discord webhooks, nodemailer SMTP, generic HTTP webhook -- all < 50 LOC each
- Failed interaction learning (suspicious abandonment detection) is stretch -- rule: if IP disconnects within 2s of template response, flag the template

## Requirements

### Functional

**Blocklist Generation:**
- Configurable criteria: classification + request count + time window + exclusions
- Output formats: plain text (IP-per-line), JSON, CSV
- GitHub auto-publish: commit to configurable repo on schedule (daily/weekly)
- Allowlisting: exclude IPs (own, research partners)
- Preview before export

**IOC Feed:**
- IPs with metadata (ASN, geo, classification, first/last seen)
- User-Agent strings (scanner-specific)
- Header fingerprints
- Paths probed per actor
- TLS fingerprints
- Prompt patterns (LLM-specific IOCs)

**MITRE ATT&CK Mapping:**
- Static mapping table: behavior -> technique ID + name
- Dashboard view: ATT&CK matrix heatmap showing observed technique frequency
- Per-session: list matched ATT&CK techniques

**STIX/TAXII Export:**
- Generate STIX 2.1 bundles from filtered data
- STIX objects: Indicator, ObservedData, ThreatActor, Infrastructure
- [STRETCH] TAXII 2.1 server endpoint for automated consumers

**Alert System:**
- 4 channels: Telegram, Discord, Email (SMTP), Generic Webhook
- Alert rules: name, conditions (field + operator + value), severity (info/warning/critical), channels, cooldown
- 7 built-in rules (from PRD section 10.2)
- Custom rules via dashboard UI
- Alert log with delivery status

**Report Generator:**
- Select date range + filters -> generate report
- Output: Markdown, HTML (suitable for blog posts)
- Content: summary stats, classification breakdown, top actors, notable sessions, charts
- Full database dump export (JSON) for LLM article drafting

**Cold Storage Archival:**
- Nightly job: export data older than 30 days -> compress (gzip) -> upload to S3
- Format: JSONL per day, gzipped
- Naming: `llmtrap/{node_id}/{YYYY}/{MM}/{DD}.jsonl.gz`
- On-demand retrieval via dashboard (download, decompress, display)
- Configurable: S3 bucket, prefix, credentials

**Real-Time WebSocket Toggle:**
- Default: OFF (polling every 30s)
- Toggle ON: Socket.IO stream of live events
- Filterable: node, service, classification, IP
- Auto-disable after 30min inactive tab
- Bandwidth indicator (events/second)
- Graceful fallback on disconnect (reconnect banner + polling)

**Audit Logging:**
- All config changes logged (who, what, when, from where)
- All login events
- All data exports
- Immutable (no UPDATE/DELETE on AuditLog)

**CI/CD Pipeline:**
- GitHub Actions: lint -> typecheck -> build -> test -> Docker build
- On PR to main: full pipeline
- On merge to main: Docker push to registry (GHCR)
- [STRETCH] Semantic versioning via changesets

**Open-Source Release:**
- README.md with architecture diagram, quick start, screenshots
- CONTRIBUTING.md
- LICENSE (MIT or Apache 2.0)
- docker-compose examples for both stacks
- Environment variable documentation
- First release tag (v0.1.0)

### Non-Functional
- Alert delivery latency: < 5s from trigger event
- Cold storage upload: nightly job completes within 10min for < 500K records
- Report generation: < 30s for 30-day range
- STIX bundle generation: < 10s for 1000 indicators
- WebSocket: support 500 concurrent connections

## Architecture

### NestJS Modules (added to apps/api)

```
apps/api/src/modules/
├── threat-intel/
│   ├── threat-intel.module.ts
│   ├── blocklist/
│   │   ├── blocklist.controller.ts       # Generate, preview, export
│   │   └── blocklist.service.ts          # Query + format + publish
│   ├── ioc/
│   │   ├── ioc.controller.ts             # IOC feed endpoints
│   │   └── ioc.service.ts               # Aggregate IOCs
│   ├── mitre/
│   │   ├── mitre.controller.ts           # ATT&CK mapping endpoints
│   │   ├── mitre.service.ts              # Mapping logic
│   │   └── mitre-mappings.ts             # Static behavior->technique table
│   └── stix/
│       ├── stix.controller.ts            # STIX bundle generation
│       └── stix.service.ts              # Build STIX 2.1 objects
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts              # CRUD alert rules, view logs
│   ├── alerts.service.ts                 # Rule evaluation + dispatch
│   ├── alert-evaluator.ts               # Match events against rules
│   ├── channels/
│   │   ├── telegram-channel.ts
│   │   ├── discord-channel.ts
│   │   ├── email-channel.ts
│   │   └── webhook-channel.ts
│   └── alert-processor.ts               # BullMQ processor (in worker)
├── export/
│   ├── export.module.ts
│   ├── export.controller.ts              # Export data as JSON/CSV/Excel/Markdown/HTML
│   ├── export.service.ts
│   └── report-generator.service.ts       # Generate formatted reports
├── cold-storage/
│   ├── cold-storage.module.ts
│   ├── cold-storage.service.ts           # S3 upload/download
│   ├── cold-storage.controller.ts        # Config, trigger, retrieve
│   └── archival-processor.ts             # BullMQ nightly job (in worker)
├── live-feed/
│   ├── live-feed.module.ts
│   └── live-feed.gateway.ts              # Socket.IO gateway for real-time
└── settings/
    ├── settings.module.ts
    ├── settings.controller.ts            # Alert channels, S3 config, enrichment config, retention
    └── settings.service.ts
```

### Worker Processors (added to apps/worker)

```
apps/worker/src/processors/
├── alert-processor.ts                    # Evaluate + dispatch alerts
├── archival-processor.ts                 # Nightly cold storage job
├── blocklist-publish-processor.ts        # Scheduled blocklist GitHub push
└── report-processor.ts                   # Async report generation
```

### React Dashboard Pages (added to apps/web)

```
apps/web/src/routes/
├── threat-intel/
│   ├── blocklist.tsx                     # Blocklist generator
│   ├── ioc.tsx                           # IOC feed viewer
│   ├── mitre.tsx                         # MITRE ATT&CK heatmap
│   └── stix.tsx                          # STIX export config
├── alerts/
│   ├── index.tsx                         # Alert rules list
│   └── logs.tsx                          # Alert delivery log
├── export/
│   └── index.tsx                         # Export & report generator
└── settings/
    └── index.tsx                         # Extended with all config sections
```

## MITRE ATT&CK Mapping Table

```typescript
// apps/api/src/modules/threat-intel/mitre/mitre-mappings.ts

interface MitreMapping {
  behavior: string;           // Observable pattern
  techniqueId: string;        // ATT&CK ID
  techniqueName: string;      // Human-readable
  tactic: string;             // ATT&CK tactic
  detectionRule: {
    field: string;
    operator: string;
    value: string | string[];
  }[];
}

const MITRE_MAPPINGS: MitreMapping[] = [
  {
    behavior: 'Shodan/Censys discovery scan',
    techniqueId: 'T1595',
    techniqueName: 'Active Scanning',
    tactic: 'Reconnaissance',
    detectionRule: [
      { field: 'classification', operator: 'eq', value: 'scanner' },
      { field: 'session.uniqueServices', operator: 'gte', value: '3' },
    ],
  },
  {
    behavior: 'Model/service enumeration',
    techniqueId: 'T1046',
    techniqueName: 'Network Service Discovery',
    tactic: 'Discovery',
    detectionRule: [
      { field: 'path', operator: 'matches', value: '/(api/tags|v1/models|api/version|health)' },
    ],
  },
  {
    behavior: 'Config file probing',
    techniqueId: 'T1083',
    techniqueName: 'File and Directory Discovery',
    tactic: 'Discovery',
    detectionRule: [
      { field: 'classification', operator: 'eq', value: 'config_hunter' },
    ],
  },
  {
    behavior: 'Credential extraction from configs',
    techniqueId: 'T1552.001',
    techniqueName: 'Credentials in Files',
    tactic: 'Credential Access',
    detectionRule: [
      { field: 'path', operator: 'matches', value: '/\\.(env|huggingface|streamlit)|gcp_credentials|terraform' },
    ],
  },
  {
    behavior: 'SSH/FTP brute force',
    techniqueId: 'T1110',
    techniqueName: 'Brute Force',
    tactic: 'Credential Access',
    detectionRule: [
      { field: 'service', operator: 'in', value: 'ssh,ftp' },
      { field: 'session.requestCount', operator: 'gte', value: '10' },
    ],
  },
  {
    behavior: 'LLMjacking (inference abuse)',
    techniqueId: 'T1496',
    techniqueName: 'Resource Hijacking',
    tactic: 'Impact',
    detectionRule: [
      { field: 'classification', operator: 'eq', value: 'free_rider' },
      { field: 'session.requestCount', operator: 'gte', value: '10' },
    ],
  },
  {
    behavior: 'MCP tool invocation',
    techniqueId: 'T1059',
    techniqueName: 'Command and Scripting Interpreter',
    tactic: 'Execution',
    detectionRule: [
      { field: 'path', operator: 'eq', value: '/mcp' },
      { field: 'requestBody.method', operator: 'eq', value: 'tools/call' },
    ],
  },
  {
    behavior: 'Exploit attempt (prototype pollution, injection)',
    techniqueId: 'T1190',
    techniqueName: 'Exploit Public-Facing Application',
    tactic: 'Initial Access',
    detectionRule: [
      { field: 'requestBody', operator: 'matches', value: '__proto__|constructor\\[|\\$\\{|<script' },
    ],
  },
  {
    behavior: 'Free-riding on inference',
    techniqueId: 'T1496',
    techniqueName: 'Resource Hijacking',
    tactic: 'Impact',
    detectionRule: [
      { field: 'classification', operator: 'eq', value: 'free_rider' },
    ],
  },
];
```

## STIX 2.1 Bundle Format

```typescript
// Example STIX bundle output
interface StixBundle {
  type: 'bundle';
  id: `bundle--${string}`;
  objects: StixObject[];
}

// Generate from captured data
function buildStixBundle(indicators: IocEntry[]): StixBundle {
  return {
    type: 'bundle',
    id: `bundle--${uuid()}`,
    objects: indicators.map(ind => ({
      type: 'indicator',
      spec_version: '2.1',
      id: `indicator--${uuid()}`,
      created: ind.firstSeen,
      modified: ind.lastSeen,
      name: `LLMTrap: ${ind.classification} from ${ind.ip}`,
      indicator_types: [mapClassificationToStix(ind.classification)],
      pattern: `[ipv4-addr:value = '${ind.ip}']`,
      pattern_type: 'stix',
      valid_from: ind.firstSeen,
      labels: [ind.classification, ind.asn || 'unknown-asn'],
    })),
  };
}
```

## Alert Channel Implementations

```typescript
// Telegram
async function sendTelegram(config: { botToken: string; chatId: string }, message: string) {
  await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: config.chatId, text: message, parse_mode: 'Markdown' }),
  });
}

// Discord
async function sendDiscord(config: { webhookUrl: string }, message: string) {
  await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  });
}

// Email (nodemailer)
async function sendEmail(config: SmtpConfig, subject: string, body: string) {
  const transporter = createTransport(config);
  await transporter.sendMail({ from: config.from, to: config.recipients, subject, html: body });
}

// Webhook
async function sendWebhook(config: { url: string; authHeader?: string }, payload: object) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.authHeader) headers['Authorization'] = config.authHeader;
  await fetch(config.url, { method: 'POST', headers, body: JSON.stringify(payload) });
}
```

## Cold Storage Archival Flow

```
Nightly job (cron: 0 2 * * *):
  1. Query: SELECT * FROM CapturedRequest WHERE timestamp < now() - interval '30 days'
     AND NOT archived LIMIT 50000
  2. Group by nodeId + date
  3. For each group:
     a. Serialize to JSONL (one JSON per line)
     b. Gzip compress
     c. Upload to S3: llmtrap/{nodeId}/{YYYY}/{MM}/{DD}.jsonl.gz
     d. On success: DELETE from CapturedRequest WHERE id IN (uploaded_ids)
  4. Log: {date, recordCount, compressedSize, s3Key}

On-demand retrieval:
  1. Dashboard: user selects node + date range
  2. API generates presigned S3 URL (expires 1h)
  3. Frontend downloads, decompresses in browser (pako), renders in table
  Alternative: API streams decompressed content
```

## Real-Time WebSocket (Live Feed)

```typescript
// apps/api/src/modules/live-feed/live-feed.gateway.ts

@WebSocketGateway({ namespace: '/ws/live-feed', cors: true })
export class LiveFeedGateway {
  @WebSocketServer() server: Server;

  // Called by capture ingestion when new request arrives
  broadcastEvent(event: CapturedRequestSummary) {
    this.server.emit('request', event);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, filters: LiveFeedFilters) {
    // Store filters per client; only emit matching events
    client.data.filters = filters;
    client.join(`feed:${client.id}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket) {
    client.leave(`feed:${client.id}`);
  }
}

// Client-side: auto-disable after 30min inactive
// useEffect: on visibilitychange hidden, start 30min timer -> disconnect
// On visibilitychange visible: reconnect if was auto-disabled
```

## Related Code Files

### Files to Create (API)

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/threat-intel/threat-intel.module.ts` | Threat intel root module |
| `apps/api/src/modules/threat-intel/blocklist/blocklist.controller.ts` | Blocklist generate/export |
| `apps/api/src/modules/threat-intel/blocklist/blocklist.service.ts` | Query + format + publish |
| `apps/api/src/modules/threat-intel/ioc/ioc.controller.ts` | IOC feed endpoints |
| `apps/api/src/modules/threat-intel/ioc/ioc.service.ts` | Aggregate IOCs |
| `apps/api/src/modules/threat-intel/mitre/mitre.controller.ts` | ATT&CK endpoints |
| `apps/api/src/modules/threat-intel/mitre/mitre.service.ts` | Mapping logic |
| `apps/api/src/modules/threat-intel/mitre/mitre-mappings.ts` | Static mapping table |
| `apps/api/src/modules/threat-intel/stix/stix.controller.ts` | STIX export |
| `apps/api/src/modules/threat-intel/stix/stix.service.ts` | STIX 2.1 builder |
| `apps/api/src/modules/alerts/alerts.module.ts` | Alert system root |
| `apps/api/src/modules/alerts/alerts.controller.ts` | CRUD rules + view logs |
| `apps/api/src/modules/alerts/alerts.service.ts` | Rule evaluation + dispatch |
| `apps/api/src/modules/alerts/alert-evaluator.ts` | Event -> rule matching |
| `apps/api/src/modules/alerts/channels/telegram-channel.ts` | Telegram Bot API |
| `apps/api/src/modules/alerts/channels/discord-channel.ts` | Discord webhook |
| `apps/api/src/modules/alerts/channels/email-channel.ts` | Nodemailer SMTP |
| `apps/api/src/modules/alerts/channels/webhook-channel.ts` | Generic HTTP webhook |
| `apps/api/src/modules/export/export.module.ts` | Export system |
| `apps/api/src/modules/export/export.controller.ts` | Export endpoints |
| `apps/api/src/modules/export/export.service.ts` | Format + stream data |
| `apps/api/src/modules/export/report-generator.service.ts` | Markdown/HTML reports |
| `apps/api/src/modules/cold-storage/cold-storage.module.ts` | Cold storage |
| `apps/api/src/modules/cold-storage/cold-storage.service.ts` | S3 operations |
| `apps/api/src/modules/cold-storage/cold-storage.controller.ts` | Config + retrieve |
| `apps/api/src/modules/live-feed/live-feed.module.ts` | Real-time feed |
| `apps/api/src/modules/live-feed/live-feed.gateway.ts` | Socket.IO gateway |
| `apps/api/src/modules/settings/settings.module.ts` | Global settings |
| `apps/api/src/modules/settings/settings.controller.ts` | CRUD settings |
| `apps/api/src/modules/settings/settings.service.ts` | Settings persistence |

### Files to Create (Worker)

| Path | Purpose |
|------|---------|
| `apps/worker/src/processors/alert-processor.ts` | Alert evaluation + dispatch |
| `apps/worker/src/processors/archival-processor.ts` | Nightly S3 archival |
| `apps/worker/src/processors/blocklist-publish-processor.ts` | GitHub auto-publish |
| `apps/worker/src/processors/report-processor.ts` | Async report generation |

### Files to Create (Web)

| Path | Purpose |
|------|---------|
| `apps/web/src/routes/threat-intel/blocklist.tsx` | Blocklist generator page |
| `apps/web/src/routes/threat-intel/ioc.tsx` | IOC feed viewer |
| `apps/web/src/routes/threat-intel/mitre.tsx` | MITRE ATT&CK heatmap |
| `apps/web/src/routes/threat-intel/stix.tsx` | STIX export config |
| `apps/web/src/routes/alerts/index.tsx` | Alert rules management |
| `apps/web/src/routes/alerts/logs.tsx` | Alert delivery log |
| `apps/web/src/routes/export/index.tsx` | Export + report generator |
| `apps/web/src/components/threat-intel/mitre-heatmap.tsx` | ATT&CK matrix heatmap |
| `apps/web/src/components/threat-intel/blocklist-preview.tsx` | Blocklist preview table |
| `apps/web/src/components/threat-intel/ioc-table.tsx` | IOC feed table |
| `apps/web/src/components/alerts/alert-rule-form.tsx` | Alert rule editor |
| `apps/web/src/components/alerts/alert-log-table.tsx` | Alert log table |
| `apps/web/src/components/export/report-form.tsx` | Report config form |
| `apps/web/src/components/export/export-format-selector.tsx` | Format picker |
| `apps/web/src/components/settings/alert-channels-form.tsx` | Channel config form |
| `apps/web/src/components/settings/cold-storage-form.tsx` | S3 config form |
| `apps/web/src/components/settings/retention-form.tsx` | Retention settings |
| `apps/web/src/components/settings/user-management.tsx` | User admin panel |
| `apps/web/src/hooks/use-alerts.ts` | Alert query hooks |
| `apps/web/src/hooks/use-threat-intel.ts` | Threat intel hooks |
| `apps/web/src/hooks/use-export.ts` | Export hooks |

### Files to Create (Root)

| Path | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline (lint, type, build, test, docker) |
| `.github/workflows/docker-publish.yml` | Docker image publish on release |
| `CONTRIBUTING.md` | Contribution guidelines |
| `LICENSE` | MIT or Apache 2.0 |
| `docs/deployment-guide.md` | Deployment documentation |
| `docs/environment-variables.md` | Env var reference |

## Implementation Steps

1. **Alert system**
   - Create alert channel implementations (Telegram, Discord, Email, Webhook) -- each < 50 LOC
   - Create alert evaluator: match incoming events against rules (conditions as field/operator/value)
   - Create BullMQ alert processor: on each captured request ingestion, enqueue evaluation
   - Implement cooldown: track last fire time per rule, skip if within cooldown window
   - Create 7 built-in rules (from PRD section 10.2)
   - Dashboard: CRUD alert rules, channel config in settings, alert log viewer

2. **Blocklist generation**
   - Blocklist service: query IPs matching criteria, format as text/JSON/CSV
   - Preview endpoint: return formatted blocklist without persisting
   - Export endpoint: return as file download
   - GitHub publish: BullMQ scheduled job using `@octokit/rest` or `gh` CLI to commit file
   - Allowlist: maintain IP allowlist in settings, exclude from all blocklists

3. **IOC feed**
   - Aggregate endpoint: query unique IPs, UAs, fingerprints, paths with metadata
   - Paginated + filterable
   - Export as JSON feed

4. **MITRE ATT&CK mapping**
   - Static mapping table (9 mappings from PRD)
   - Service: evaluate sessions against detection rules, return matched techniques
   - Per-session: annotate with matched ATT&CK techniques
   - Dashboard: ATT&CK matrix grid; cells colored by observed frequency (heatmap)

5. **STIX 2.1 export**
   - STIX bundle builder: convert IOCs to STIX Indicator objects
   - Actor data -> STIX ThreatActor objects
   - Node data -> STIX Infrastructure objects
   - Export endpoint: return STIX JSON bundle as download
   - [STRETCH] TAXII 2.1 server: `/taxii2/`, collections, objects endpoints

6. **Export & report generator**
   - Export filtered data as: JSON, CSV (via `csv-stringify`), Excel (via `exceljs`), Markdown, HTML
   - Report generator: aggregate stats for date range, render Markdown template with charts (server-side SVG or table-based)
   - Full database dump: stream all data as JSONL for LLM consumption
   - BullMQ for large exports; return job ID, poll for completion

7. **Cold storage archival**
   - S3 client: `@aws-sdk/client-s3` (works with MinIO, Backblaze, AWS)
   - Nightly BullMQ cron job: query old data, serialize JSONL, gzip, upload, delete from Postgres
   - Retrieval: generate presigned URL or stream through API
   - Dashboard: cold storage config (bucket, prefix, creds), trigger manual archival, browse archived dates

8. **Real-time WebSocket toggle**
   - Socket.IO gateway on `/ws/live-feed` namespace
   - On capture ingestion: broadcast to connected clients (filtered by their subscriptions)
   - Client: toggle button, filter controls, events/sec indicator
   - Auto-disable: visibilitychange listener, 30min timer
   - Reconnect: exponential backoff, fallback to polling with banner

9. **Audit logging (extend)**
   - Verify all config mutations go through AuditInterceptor (from Phase 2)
   - Add: data export events, alert rule changes, blocklist publications
   - Dashboard: audit log viewer with filters (user, action, date range)

10. **CI/CD pipeline**
    - `.github/workflows/ci.yml`: trigger on PR to main
      - Steps: checkout, pnpm install, lint, typecheck, build, test, docker build
    - `.github/workflows/docker-publish.yml`: trigger on release tag
      - Steps: build + push to GHCR (ghcr.io/username/llmtrap-api, -web, -worker, -node)
    - Branch protection: require CI pass before merge

11. **Open-source release prep**
    - Update README.md: project description, architecture diagram, features, quick start, screenshots placeholder
    - Create CONTRIBUTING.md: dev setup, PR process, coding standards
    - Choose + add LICENSE file
    - Update `docs/deployment-guide.md`: full deployment instructions for both stacks
    - Create `docs/environment-variables.md`: complete env var reference
    - Tag v0.1.0

## Todo List

- [ ] Implement Telegram alert channel
- [ ] Implement Discord alert channel
- [ ] Implement Email alert channel (nodemailer)
- [ ] Implement Generic Webhook channel
- [ ] Create alert evaluator (event -> rule matching)
- [ ] Create alert BullMQ processor
- [ ] Define 7 built-in alert rules
- [ ] Build alert rules CRUD dashboard page
- [ ] Build alert log viewer
- [ ] Create blocklist generation service (query + format)
- [ ] Create blocklist preview + export endpoints
- [ ] Create blocklist GitHub auto-publish job
- [ ] Implement IP allowlisting
- [ ] Create IOC feed aggregation endpoint
- [ ] Build IOC feed viewer page
- [ ] Create MITRE ATT&CK mapping table (9 mappings)
- [ ] Create MITRE mapping service (session -> techniques)
- [ ] Build ATT&CK heatmap dashboard component
- [ ] Create STIX 2.1 bundle builder
- [ ] Create STIX export endpoint
- [ ] [STRETCH] Implement TAXII 2.1 server endpoints
- [ ] Create export service (JSON, CSV, Excel, Markdown, HTML)
- [ ] Create report generator (date range -> formatted report)
- [ ] Create full database dump endpoint (JSONL)
- [ ] Build export/report dashboard page
- [ ] Create S3 cold storage service
- [ ] Create nightly archival BullMQ cron job
- [ ] Create on-demand retrieval endpoint (presigned URL)
- [ ] Build cold storage config + browser in settings
- [ ] Implement Socket.IO live feed gateway
- [ ] Build live feed toggle UI with filters + events/sec
- [ ] Implement auto-disable (30min inactive)
- [ ] Implement reconnect with fallback banner
- [ ] Extend audit logging (exports, alert changes, blocklist publishes)
- [ ] Build audit log viewer page
- [ ] [STRETCH] Implement failed interaction learning (suspicious abandonment detection)
- [ ] Create GitHub Actions CI workflow
- [ ] Create GitHub Actions Docker publish workflow
- [ ] Update README.md for open-source release
- [ ] Create CONTRIBUTING.md
- [ ] Add LICENSE file
- [ ] Write deployment guide
- [ ] Write environment variables reference
- [ ] Tag v0.1.0 release

## Success Criteria

- Alert fires within 5s of triggering event; delivered to configured Telegram/Discord/Email/Webhook
- Alert cooldown prevents re-firing within configured window
- Blocklist generates correct IP-per-line format; GitHub auto-publish commits successfully
- IOC feed returns paginated indicators with metadata
- MITRE ATT&CK heatmap renders with observed technique frequencies
- STIX 2.1 bundles are valid JSON conforming to STIX spec
- Export produces valid JSON, CSV, Excel, Markdown, HTML files
- Report generator creates readable Markdown/HTML with stats and tables
- Cold storage: nightly archival uploads to S3, old data removed from Postgres
- Cold storage: on-demand retrieval returns decompressed data
- Live feed WebSocket streams events in real time with < 1s latency
- Live feed auto-disables after 30min tab hidden; reconnects when tab active
- Audit log captures all config mutations and exports
- CI pipeline passes on clean PR; Docker images build
- README, CONTRIBUTING, LICENSE, deployment guide complete
- v0.1.0 tag created

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| S3 credentials misconfigured -> archival fails | Medium | Medium | Validate S3 connection on settings save; retry failed uploads |
| Alert channel rate limits (Telegram 30 msg/min) | Medium | Low | Queue alerts, respect rate limits, batch if needed |
| STIX spec compliance gaps | Low | Low | Validate output against stix2-validator (Python tool) during testing |
| GitHub auto-publish token expiry | Medium | Low | Alert on publish failure; manual fallback |
| WebSocket memory leak with many connections | Low | Medium | Connection limit (500), auto-cleanup on disconnect, heartbeat timeout |
| Large export OOM (millions of records) | Medium | Medium | Streaming exports, cursor-based pagination, BullMQ for async |

## Security Considerations

- Alert channel credentials (bot tokens, SMTP passwords, webhook secrets): encrypted at rest
- S3 credentials: encrypted at rest, never logged
- Blocklist auto-publish: use fine-grained GitHub token (repo:contents write only)
- STIX bundles: may contain IP addresses -- warn operator about sharing PII
- Export: respect role-based access (Viewer cannot export, Analyst can, Admin full access)
- WebSocket: authenticate with JWT before allowing subscription
- Audit log: immutable append-only; even admins cannot delete entries
- CI/CD: secrets via GitHub Actions secrets, never hardcoded

## Next Steps (Post v0.1.0)

- Community feedback -> prioritize feature requests
- [STRETCH] Embedding-based template matching (replace keyword overlap)
- [STRETCH] TAXII 2.1 server for automated feed consumers
- [STRETCH] Failed interaction learning (suspicious abandonment)
- [STRETCH] Mobile companion app for alerts
- [STRETCH] Multi-tenant dashboard for hosted version
- [STRETCH] Community template/persona sharing marketplace
- [STRETCH] Full filesystem simulation for SSH (Cowrie-level)
- [STRETCH] Canary token integration (Thinkst Canary)

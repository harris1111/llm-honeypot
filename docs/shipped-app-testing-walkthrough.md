# Shipped App Testing Walkthrough

This is the canonical local walkthrough for testing the currently shipped slice: completed Phase 1 to Phase 4 functionality plus the currently landed Phase 5 and Phase 6 surfaces.

Update this file whenever local testing steps, ports, env vars, compose usage, node enrollment flow, dashboard routes, or representative protocol probes change.

## What This Walkthrough Verifies

- the dashboard stack boots and the seeded local admin can sign in
- the public landing route at `/` renders and links operators to the right next steps
- the public docs area at `/docs` and `/docs/*` renders the in-app walkthrough pages for getting started, dashboard deployment, node enrollment, and smoke validation
- a node can be created, approved, and brought to `ONLINE`
- representative AI, RAG, homelab, and traditional listeners respond locally
- the authenticated dashboard Overview, Nodes, Sessions, Actors, Personas, Alerts, Threat Intel, Export, Live Feed, Response Engine, and Settings routes load from `/overview` onward
- manual backfeed can create reviewable template candidates through the dashboard Response Engine route
- approved templates can flow back to the node through config sync for live template routing
- threat-intel API endpoints support filters by node, classification, service, source IP, time window, and result limit
- the dashboard threat-intel route allows filter-based intelligence review
- dashboard analytics totals increase after sample traffic is generated
- live-feed REST and WebSocket endpoints deliver real-time events with authentication and optional filtering
- webhook alert delivery can be configured, tested, and tracked with HTTP status and delivery logs
- archive manifests are written to local MinIO, listed through the export API, and previewable in the dashboard
- repository-owned smoke scripts can validate websocket live-feed delivery, webhook alert delivery, and archive retrieval against the running stack

## Prerequisites

- Docker with modern Compose support
- Node.js 22+ available locally for the small JSON parsing snippets in the shell examples
- free local ports for `3000`, `4000`, `9001`, `9002`, `11434`, `8080`, `8081`, `3002`, `6333`, `19530`, `20021`, `20022`, `20023`, `20025`, `20053/udp`, `20445`, `20587`, and `7780` when running webhook smoke

## Shared Local Credentials

- Dashboard URL: `http://localhost:3000`
- API base URL: `http://localhost:4000/api/v1`
- Email: `admin@llmtrap.local`
- Password: `ChangeMe123456!`
- Recommended local node name: `local-test-node`

## Step 1. Start The Dashboard Stack

### Windows PowerShell

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build
Invoke-WebRequest -UseBasicParsing http://localhost:4000/api/v1/health | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:3000/healthz | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:3000/docs | Select-Object StatusCode
```

### macOS

```bash
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build
curl http://localhost:4000/api/v1/health
curl http://localhost:3000/healthz
curl -I http://localhost:3000/docs
```

### Linux

The dashboard API is loopback-bound by default, so same-host Docker testing needs one temporary override to publish the API beyond `127.0.0.1`.

```bash
cat > /tmp/llmtrap-dashboard.linux.override.yml <<'EOF'
services:
  api:
    ports:
      - '0.0.0.0:4000:4000'
EOF

docker compose \
  --env-file docker/dashboard-compose.local.env \
  -f docker/docker-compose.dashboard.yml \
  -f /tmp/llmtrap-dashboard.linux.override.yml \
  up -d --build

curl http://localhost:4000/api/v1/health
curl http://localhost:3000/healthz
curl -I http://localhost:3000/docs
```

The committed local env also starts MinIO for archive smoke. Local endpoints:

- MinIO S3 API: `http://localhost:9001`
- MinIO console: `http://localhost:9002`
- Worker webhook smoke target: `http://host.docker.internal:7780/smoke-alert`
- The worker compose service maps `host.docker.internal` to the host gateway so the webhook smoke target is reachable on same-host Linux Docker too.

If you are reusing an older local dashboard stack after pulling new schema or archive changes, rerun the bootstrap helpers once before continuing:

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml run --rm db-init
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d minio-init
```

## Step 2. Log In And Create/Approve A Node

### Windows PowerShell

```powershell
$loginBody = @{ email = 'admin@llmtrap.local'; password = 'ChangeMe123456!' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/auth/login -ContentType 'application/json' -Body $loginBody
$token = $login.data.tokens.accessToken

$createBody = @{ name = 'local-test-node'; hostname = 'docker-local-node'; publicIp = '127.0.0.1' } | ConvertTo-Json
$created = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/nodes -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body $createBody

$nodeId = $created.data.node.id
$nodeKey = $created.data.nodeKey

Invoke-RestMethod -Method Post -Uri ("http://localhost:4000/api/v1/nodes/{0}/approve" -f $nodeId) -Headers @{ Authorization = "Bearer $token" } | Out-Null

Write-Host "NODE_ID=$nodeId"
Write-Host "NODE_KEY=$nodeKey"
```

### macOS And Linux

```bash
LOGIN_JSON="$(curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@llmtrap.local","password":"ChangeMe123456!"}')"

TOKEN="$(printf '%s' "$LOGIN_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).data.tokens.accessToken")"

CREATE_JSON="$(curl -s http://localhost:4000/api/v1/nodes \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"local-test-node","hostname":"docker-local-node","publicIp":"127.0.0.1"}')"

NODE_ID="$(printf '%s' "$CREATE_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).data.node.id")"
NODE_KEY="$(printf '%s' "$CREATE_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).data.nodeKey")"

curl -s -X POST "http://localhost:4000/api/v1/nodes/$NODE_ID/approve" \
  -H "authorization: Bearer $TOKEN" > /dev/null

printf 'NODE_ID=%s\nNODE_KEY=%s\n' "$NODE_ID" "$NODE_KEY"
```

## Step 3. Start The Node Stack

### Windows PowerShell

The node uses **host networking** so it sees real attacker IPs on incoming connections. On the same host, point `LLMTRAP_DASHBOARD_URL` at `http://127.0.0.1:4000`.

```powershell
$tmp = Join-Path $env:TEMP 'llmtrap-node-compose.env'
@"
LLMTRAP_DASHBOARD_URL=http://127.0.0.1:4000
LLMTRAP_NODE_KEY=$nodeKey
"@ | Set-Content -Path $tmp -Encoding ascii

docker compose --env-file $tmp -f docker/docker-compose.node.yml up -d --build
```

### macOS / Linux

```bash
cat > /tmp/llmtrap-node-compose.env <<EOF
LLMTRAP_DASHBOARD_URL=http://127.0.0.1:4000
LLMTRAP_NODE_KEY=$NODE_KEY
EOF

docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml up -d --build
```

## Step 4. Probe Representative Shipped Listeners

### Windows PowerShell

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:11434/internal/health | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:11434/api/version | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:8080/v1/models | Select-Object -ExpandProperty Content

$openAiBody = @{ model = 'gpt-4o-mini'; stream = $false; messages = @(@{ role = 'user'; content = 'hello from walkthrough' }) } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri http://localhost:8080/v1/chat/completions -ContentType 'application/json' -Body $openAiBody | ConvertTo-Json -Depth 6

$anthropicBody = @{ model = 'claude-3-5-sonnet'; max_tokens = 64; messages = @(@{ role = 'user'; content = 'hello from walkthrough' }) } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri http://localhost:8081/v1/messages -ContentType 'application/json' -Body $anthropicBody | ConvertTo-Json -Depth 6

$ollamaBody = @{ model = 'llama3.2'; prompt = 'hello from walkthrough'; stream = $false } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:11434/api/generate -ContentType 'application/json' -Body $ollamaBody | ConvertTo-Json -Depth 6

Invoke-WebRequest -UseBasicParsing http://localhost:6333/collections | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:3002/api/health | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:19530/v1/vector/collections | Select-Object -ExpandProperty Content

Test-NetConnection -ComputerName localhost -Port 20022
Test-NetConnection -ComputerName localhost -Port 20021
Test-NetConnection -ComputerName localhost -Port 20025
Test-NetConnection -ComputerName localhost -Port 20587
Test-NetConnection -ComputerName localhost -Port 20023
Test-NetConnection -ComputerName localhost -Port 20445
Resolve-DnsName example.com -Server 127.0.0.1 -Port 20053
```

### macOS And Linux

```bash
curl http://localhost:11434/internal/health
curl http://localhost:11434/api/version
curl http://localhost:8080/v1/models

curl -s http://localhost:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"gpt-4o-mini","stream":false,"messages":[{"role":"user","content":"hello from walkthrough"}]}'

curl -s http://localhost:8081/v1/messages \
  -H 'content-type: application/json' \
  -d '{"model":"claude-3-5-sonnet","max_tokens":64,"messages":[{"role":"user","content":"hello from walkthrough"}]}'

curl -s http://localhost:11434/api/generate \
  -H 'content-type: application/json' \
  -d '{"model":"llama3.2","prompt":"hello from walkthrough","stream":false}'

curl http://localhost:6333/collections
curl http://localhost:3002/api/health
curl http://localhost:19530/v1/vector/collections

nc -vz localhost 20022
nc -vz localhost 20021
nc -vz localhost 20025
nc -vz localhost 20587
nc -vz localhost 20023
nc -vz localhost 20445
dig @127.0.0.1 -p 20053 example.com +short
```

## Step 5. Verify The Dashboard UI

The node batches captures on a flush interval and the worker correlates actors on a separate interval. After running the probes, wait up to 45 seconds and refresh before treating empty Overview, Sessions, or Actors screens as a failure.

Open `http://localhost:3000` and confirm the public landing page loads with feature copy plus visible links to `Docs` and `Operator login`.

Open `http://localhost:3000/docs` and confirm the docs home renders a sidebar-driven runbook index for the local workflow.

Open `http://localhost:3000/docs/getting-started`, `http://localhost:3000/docs/deploy-dashboard`, `http://localhost:3000/docs/enroll-node`, and `http://localhost:3000/docs/smoke-tests` and confirm each page renders inside the same docs shell with the correct page-specific sections and anchors.

Open `http://localhost:3000/login`, sign in with the shared local credentials if needed, confirm the app redirects you into `http://localhost:3000/overview`, and then verify the following.

1. `Overview` shows registered nodes, captured sessions, and captured requests above zero after the probe traffic has had time to flush and refresh into the dashboard.
2. `Nodes` lists `local-test-node` as `ONLINE`.
3. The node detail page at `/nodes/<nodeId>` loads and shows the node status badge plus config form.
4. `Sessions` loads a non-empty list after the OpenAI, Anthropic, and Ollama probes have flushed.
5. `Actors` loads and shows at least one actor/session aggregate after the worker correlation pass catches up.
6. `Personas` loads without error.
7. `Alerts` loads even if it is empty.
8. `Threat Intel` loads without error and the filter controls are available.
9. `Export` renders a report preview, export data summary, and any archive bundles produced by the worker.
10. `Live Feed` loads without error and may show recent events if polling catches them.
11. `Response Engine` loads and lets an operator generate and review manual backfeed candidates.
12. `Settings` loads the foundation settings screen.

### Verifying Response Engine

Open `http://localhost:3000/response-engine` and confirm:
- The response-engine route is accessible
- The manual backfeed form allows you to choose a node and submit a prompt for review generation
- If backfeed candidates exist, the review queue shows entries with approve and reject actions
- Approved candidates remain visible until they leave the pending queue, and rejected candidates disappear from the review queue

### Verifying Threat-Intel Filters

After enrichment jobs complete, open `http://localhost:3000/threat-intel` and confirm:
- The threat-intel route is accessible
- Filter UI elements are present for node, classification, service, source IP, days, and limit
- Applying filters updates the displayed data without errors
- The blocklist, MITRE, IOC preview, and STIX count all react to the selected filter set

## Step 6. Verify Response Engine API

### Windows PowerShell

```powershell
# Get backfeed candidates list
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/templates?reviewQueue=true -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

# Approve a candidate if one exists
# Note: replace <templateId> with an actual backfeed candidate ID from the list above
# Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/templates/<templateId>/approve -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

# Reject a candidate if one exists
# Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/templates/<templateId>/reject -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
```

### macOS And Linux

```bash
curl -s http://localhost:4000/api/v1/templates?reviewQueue=true -H "authorization: Bearer $TOKEN"

# Approve a candidate (if one exists, replace <templateId> with actual ID):
# curl -s -X POST http://localhost:4000/api/v1/templates/<templateId>/approve \
#   -H "authorization: Bearer $TOKEN"

# Reject a candidate:
# curl -s -X POST http://localhost:4000/api/v1/templates/<templateId>/reject \
#   -H "authorization: Bearer $TOKEN"
```

## Step 7. Verify Threat-Intel API With Filters

### Windows PowerShell

```powershell
# Get blocklist with default (no filters)
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/threat-intel/blocklist -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

# Get IOC feed with supported filters
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/threat-intel/ioc?classification=scanner&service=openai&days=7&limit=25" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

# Get MITRE mapping for one node or source IP when needed
# Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/threat-intel/mitre?nodeId=<nodeId>&sourceIp=203.0.113.10" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
```

### macOS And Linux

```bash
curl -s http://localhost:4000/api/v1/threat-intel/blocklist -H "authorization: Bearer $TOKEN"
curl -s "http://localhost:4000/api/v1/threat-intel/ioc?classification=scanner&service=openai&days=7&limit=25" -H "authorization: Bearer $TOKEN"
# curl -s "http://localhost:4000/api/v1/threat-intel/mitre?nodeId=<nodeId>&sourceIp=203.0.113.10" -H "authorization: Bearer $TOKEN"
```

## Step 8. Verify Dashboard API Totals

### Windows PowerShell

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/analytics/overview -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/sessions -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/actors -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/alerts -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
```

### macOS And Linux

```bash
curl -s http://localhost:4000/api/v1/analytics/overview -H "authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/v1/sessions -H "authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/v1/actors -H "authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/v1/alerts -H "authorization: Bearer $TOKEN"
```

## Step 9. Verify Live Feed Endpoints

The live-feed API provides both WebSocket and REST polling endpoints.

### REST Polling Endpoint (All Platforms)

Open a new shell and retrieve the latest 100 captured requests with optional filters:

**Windows PowerShell:**
```powershell
# All events
Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/live-feed/events -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

# Filtered by service (e.g., openai)
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/live-feed/events?service=openai" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

# Filtered by classification and source IP
Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/live-feed/events?classification=scanner&sourceIp=127.0.0.1" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
```

**macOS and Linux:**
```bash
curl -s http://localhost:4000/api/v1/live-feed/events -H "authorization: Bearer $TOKEN"
curl -s "http://localhost:4000/api/v1/live-feed/events?service=openai" -H "authorization: Bearer $TOKEN"
curl -s "http://localhost:4000/api/v1/live-feed/events?classification=scanner&sourceIp=127.0.0.1" -H "authorization: Bearer $TOKEN"
```

### WebSocket Live Feed Connection (Optional)

To test the WebSocket gateway directly, install `websocat` or use Node.js. This step is optional; the dashboard UI handles WebSocket updates automatically.

**Using Node.js (all platforms):**

Create a test script `test-ws.js`:
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:4000/live-feed', {
  auth: {
    token: '<YOUR_ACCESS_TOKEN>'
  },
  path: '/api/v1/socket.io',
  transports: ['websocket'],
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Connected to live-feed WebSocket');
  socket.emit('live-feed:subscribe', {
    filters: {
      service: 'openai' // optional: filter by service
    }
  });
});

socket.on('live-feed:subscribed', (payload) => {
  console.log('Subscribed to live-feed room:', payload);
});

socket.on('live-feed:event', (event) => {
  console.log('Received event:', event);
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connect error:', error.message);
});

socket.on('disconnect', () => {
  console.log('Disconnected from live-feed WebSocket');
});

setTimeout(() => {
  socket.disconnect();
}, 10000); // disconnect after 10 seconds
```

Then run:
```bash
node test-ws.js
```

### Verifying Live Feed Updates in Dashboard

1. Open `http://localhost:3000/live-feed` in the browser
2. Run probe traffic from Step 4 (OpenAI, Anthropic, Ollama queries)
3. If WebSocket is enabled, new events should appear almost immediately with timestamps, methods, services, and source IPs
4. Filter controls allow narrowing by classification, nodeId, service, or sourceIp
5. If WebSocket is unavailable (e.g., browser network issues), the UI automatically falls back to polling the REST endpoint every 15 seconds while polling remains enabled

---

## Step 10. Run Repository-Owned Smoke Scripts

With the dashboard and node stacks running, the repository-owned smoke scripts cover the new Phase 6 surfaces directly.

### All Platforms

```bash
pnpm run test:smoke:live-feed
pnpm run test:smoke:alerts
pnpm run test:smoke:archive
```

What each script checks:

- `test:smoke:live-feed` logs in, opens the authenticated `/live-feed` Socket.IO namespace, triggers probe traffic, and waits for a real-time event.
- `test:smoke:alerts` starts a local webhook receiver on port `7780`, creates a webhook alert rule, triggers probe traffic, and waits for both webhook delivery and a successful alert log.
- `test:smoke:archive` triggers probe traffic, waits for a new archive manifest, then fetches the archived bundle through `/api/v1/export/archives/:archiveId`.

The committed local dashboard env already points the worker webhook target at `http://host.docker.internal:7780/smoke-alert`, the worker service maps that hostname to the host gateway, and MinIO is provisioned locally for archive storage, so no extra override is needed for these scripts on the local compose stack.

---

## Step 11. Teardown

### Windows PowerShell

```powershell
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down --remove-orphans
docker compose --env-file $tmp -f docker/docker-compose.node.yml down --remove-orphans
```

### macOS

```bash
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down --remove-orphans
docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml down --remove-orphans
```

### Linux

```bash
docker compose \
  --env-file docker/dashboard-compose.local.env \
  -f docker/docker-compose.dashboard.yml \
  -f /tmp/llmtrap-dashboard.linux.override.yml \
  down --remove-orphans

docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml down --remove-orphans
```
# Shipped App Testing Walkthrough

This is the canonical local walkthrough for testing the currently shipped Phase 1 to Phase 4 slice.

Update this file whenever local testing steps, ports, env vars, compose usage, node enrollment flow, dashboard routes, or representative protocol probes change.

## What This Walkthrough Verifies

- the dashboard stack boots and the seeded local admin can sign in
- a node can be created, approved, and brought to `ONLINE`
- representative AI, RAG, homelab, and traditional listeners respond locally
- the dashboard Overview, Nodes, Sessions, Actors, Personas, Alerts, Threat Intel, Export, Live Feed, and Settings routes load
- dashboard analytics totals increase after sample traffic is generated

## Prerequisites

- Docker with modern Compose support
- Node.js 22+ available locally for the small JSON parsing snippets in the shell examples
- free local ports for `3000`, `4000`, `11434`, `8080`, `8081`, `3002`, `6333`, `19530`, `20021`, `20022`, `20023`, `20025`, `20053/udp`, `20445`, and `20587`

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
```

### macOS

```bash
docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build
curl http://localhost:4000/api/v1/health
curl http://localhost:3000/healthz
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

```powershell
$tmp = Join-Path $env:TEMP 'llmtrap-node-compose.env'
@"
LLMTRAP_DASHBOARD_URL=http://host.docker.internal:4000
LLMTRAP_NODE_KEY=$nodeKey
"@ | Set-Content -Path $tmp

docker compose --env-file $tmp -f docker/docker-compose.node.yml up -d --build
```

### macOS

```bash
cat > /tmp/llmtrap-node-compose.env <<EOF
LLMTRAP_DASHBOARD_URL=http://host.docker.internal:4000
LLMTRAP_NODE_KEY=$NODE_KEY
EOF

docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml up -d --build
```

### Linux

```bash
DASHBOARD_HOST_IP="$(hostname -I | awk '{print $1}')"

cat > /tmp/llmtrap-node-compose.env <<EOF
LLMTRAP_DASHBOARD_URL=http://$DASHBOARD_HOST_IP:4000
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

Open `http://localhost:3000` and confirm the following.

1. `Overview` shows registered nodes, captured sessions, and captured requests above zero after the probe traffic has had time to flush and refresh into the dashboard.
2. `Nodes` lists `local-test-node` as `ONLINE`.
3. The node detail page at `/nodes/<nodeId>` loads and shows the node status badge plus config form.
4. `Sessions` loads a non-empty list after the OpenAI, Anthropic, and Ollama probes have flushed.
5. `Actors` loads and shows at least one actor/session aggregate after the worker correlation pass catches up.
6. `Personas` loads without error.
7. `Alerts` loads even if it is empty.
8. `Threat Intel` loads without error.
9. `Export` renders a report preview and export data summary.
10. `Live Feed` loads without error and may show recent events if polling catches them.
11. `Settings` loads the foundation settings screen.

## Step 6. Verify Dashboard API Totals

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

## Step 7. Teardown

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
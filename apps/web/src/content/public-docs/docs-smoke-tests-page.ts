import type { DocsPage } from './docs-page-types';

const windowsProbeCommands = `Invoke-WebRequest -UseBasicParsing http://localhost:11434/internal/health | Select-Object -ExpandProperty Content
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
Resolve-DnsName example.com -Server 127.0.0.1 -Port 20053`;

const unixProbeCommands = `curl http://localhost:11434/internal/health
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
dig @127.0.0.1 -p 20053 example.com +short`;

const windowsApiVerificationCommands = `$loginBody = @{ email = 'admin@llmtrap.local'; password = 'ChangeMe123456!' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/auth/login -ContentType 'application/json' -Body $loginBody
$token = $login.data.tokens.accessToken

Invoke-RestMethod -Method Get -Uri http://localhost:4000/api/v1/templates?reviewQueue=true -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/threat-intel/ioc?classification=scanner&service=openai&days=7&limit=25" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/live-feed/events?service=openai" -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6`;

const unixApiVerificationCommands = `LOGIN_JSON="$(curl -s http://localhost:4000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@llmtrap.local","password":"ChangeMe123456!"}')"

TOKEN="$(printf '%s' "$LOGIN_JSON" | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).data.tokens.accessToken")"

curl -s http://localhost:4000/api/v1/templates?reviewQueue=true -H "authorization: Bearer $TOKEN"

curl -s "http://localhost:4000/api/v1/threat-intel/ioc?classification=scanner&service=openai&days=7&limit=25" -H "authorization: Bearer $TOKEN"

curl -s "http://localhost:4000/api/v1/live-feed/events?service=openai" -H "authorization: Bearer $TOKEN"`;

const smokeScriptCommands = `pnpm run test:smoke:live-feed
pnpm run test:smoke:alerts
pnpm run test:smoke:archive`;

const windowsTeardownCommands = `$tmp = Join-Path $env:TEMP 'llmtrap-node-compose.env'

docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down --remove-orphans
docker compose --env-file $tmp -f docker/docker-compose.node.yml down --remove-orphans`;

const macTeardownCommands = `docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml down --remove-orphans
docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml down --remove-orphans`;

const linuxTeardownCommands = `docker compose \
  --env-file docker/dashboard-compose.local.env \
  -f docker/docker-compose.dashboard.yml \
  -f /tmp/llmtrap-dashboard.linux.override.yml \
  down --remove-orphans

docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml down --remove-orphans`;

export const docsSmokeTestsPage: DocsPage = {
  eyebrow: 'Smoke tests',
  id: 'smoke-tests',
  quickFacts: [
    { label: 'Primary probes', value: 'AI + RAG + classic listeners' },
    { label: 'UI checks', value: 'Overview to Settings' },
    { label: 'Smoke scripts', value: 'live-feed / alerts / archive' },
    { label: 'Teardown', value: '2 compose downs' },
  ],
  relatedPageIds: ['deploy-dashboard', 'enroll-node'],
  sections: [
    {
      codeSamples: [
        { code: windowsProbeCommands, language: 'powershell', title: 'Windows PowerShell' },
        { code: unixProbeCommands, language: 'bash', title: 'macOS and Linux' },
      ],
      id: 'probe-listeners',
      intro: 'Generate representative AI, RAG, homelab, and classic listener traffic first so the node has captures to flush back into the dashboard.',
      title: 'Probe the representative shipped listener surface',
    },
    {
      checklist: [
        'Public landing at / still shows Docs and Operator login links.',
        'Docs pages under /docs render without auth and the sidebar navigation works.',
        'Overview shows registered nodes, captured sessions, and captured requests above zero after the flush interval.',
        'Nodes, Sessions, Actors, Personas, Alerts, Threat Intel, Export, Live Feed, Response Engine, and Settings routes all load without error after sign-in.',
        'The node detail page loads and the node status badge remains ONLINE.',
      ],
      id: 'verify-dashboard',
      intro: 'Wait up to 45 seconds after the probes so the node flush interval and worker correlation pass can catch up before treating empty dashboards as a failure.',
      title: 'Verify the dashboard routes and operator surfaces',
    },
    {
      codeSamples: [
        { code: windowsApiVerificationCommands, language: 'powershell', title: 'Windows API spot checks' },
        { code: unixApiVerificationCommands, language: 'bash', title: 'macOS and Linux API spot checks' },
        { code: smokeScriptCommands, language: 'bash', title: 'Repository-owned smoke scripts' },
      ],
      id: 'exercise-runtime',
      intro: 'The shipped slice includes direct API checks plus three smoke scripts that exercise the live-feed, alert, and archive paths.',
      title: 'Exercise the runtime and smoke automation',
    },
    {
      codeSamples: [
        { code: windowsTeardownCommands, language: 'powershell', title: 'Windows PowerShell' },
        { code: macTeardownCommands, language: 'bash', title: 'macOS' },
        { code: linuxTeardownCommands, language: 'bash', title: 'Linux' },
      ],
      id: 'teardown',
      intro: 'Once the validation pass is complete, tear down both compose stacks to leave the workstation clean.',
      title: 'Shut the local environment down cleanly',
    },
  ],
  summary: 'Generate traffic, verify the public and protected routes, spot-check the APIs, and run the live-feed, alert, and archive smoke suite.',
  title: 'Validate the shipped slice with live traffic and smoke checks',
};
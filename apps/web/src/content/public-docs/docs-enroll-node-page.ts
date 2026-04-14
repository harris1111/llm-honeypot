import type { DocsPage } from './docs-page-types';

const windowsNodeApproval = `$loginBody = @{ email = 'admin@llmtrap.local'; password = 'ChangeMe123456!' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/auth/login -ContentType 'application/json' -Body $loginBody
$token = $login.data.tokens.accessToken

$createBody = @{ name = 'local-test-node'; hostname = 'docker-local-node'; publicIp = '127.0.0.1' } | ConvertTo-Json
$created = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/v1/nodes -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body $createBody

$nodeId = $created.data.node.id
$nodeKey = $created.data.nodeKey

Invoke-RestMethod -Method Post -Uri ("http://localhost:4000/api/v1/nodes/{0}/approve" -f $nodeId) -Headers @{ Authorization = "Bearer $token" } | Out-Null

Write-Host "NODE_ID=$nodeId"
Write-Host "NODE_KEY=$nodeKey"`;

const macNodeApproval = `LOGIN_JSON="$(curl -s http://localhost:4000/api/v1/auth/login \
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

printf 'NODE_ID=%s\nNODE_KEY=%s\n' "$NODE_ID" "$NODE_KEY"`;

const linuxNodeApproval = macNodeApproval;

const windowsNodeBoot = `$tmp = Join-Path $env:TEMP 'llmtrap-node-compose.env'
@"
LLMTRAP_DASHBOARD_URL=http://dashboard-api:4000
LLMTRAP_NODE_KEY=$nodeKey
"@ | Set-Content -Path $tmp -Encoding ascii

docker compose --env-file $tmp -f docker/docker-compose.node.yml up -d --build`;

const macNodeBoot = `cat > /tmp/llmtrap-node-compose.env <<EOF
LLMTRAP_DASHBOARD_URL=http://dashboard-api:4000
LLMTRAP_NODE_KEY=$NODE_KEY
EOF

docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml up -d --build`;

const linuxNodeBoot = `cat > /tmp/llmtrap-node-compose.env <<EOF
LLMTRAP_DASHBOARD_URL=http://dashboard-api:4000
LLMTRAP_NODE_KEY=$NODE_KEY
EOF

docker compose --env-file /tmp/llmtrap-node-compose.env -f docker/docker-compose.node.yml up -d --build`;

export const docsEnrollNodePage: DocsPage = {
  eyebrow: 'Enroll node',
  id: 'enroll-node',
  quickFacts: [
    { label: 'Node view', value: '/nodes' },
    { label: 'Lifecycle', value: 'PENDING -> ONLINE' },
    { label: 'Runtime env', value: 'node key + dashboard URL' },
    { label: 'Sync gate', value: 'Approval required' },
  ],
  relatedPageIds: ['deploy-dashboard', 'smoke-tests'],
  sections: [
    {
      codeSamples: [
        { variants: { windows: windowsNodeApproval, macos: macNodeApproval, linux: linuxNodeApproval }, language: 'bash', title: 'Create and approve the node' },
      ],
      callout: { text: 'Copy the **node key** immediately — it is only shown once during creation.', variant: 'warning' },
      id: 'create-approve',
      intro: 'Sign in, create a node record, capture the issued **node key**, and approve the node before the runtime connects.',
      title: 'Create and approve a local node',
    },
    {
      codeSamples: [
        { variants: { windows: windowsNodeBoot, macos: macNodeBoot, linux: linuxNodeBoot }, language: 'bash', title: 'Start the node runtime' },
      ],
      id: 'start-runtime',
      intro: 'Once you have an approved node key, start the honeypot runtime with an env file that points back at the **dashboard stack**.',
      title: 'Start the honeypot runtime',
    },
    {
      checklist: [
        'The Nodes view shows `local-test-node` with status **ONLINE**.',
        'The node detail page loads and shows the node **status badge** plus config form.',
        'The runtime only continues into config refresh, heartbeat, and capture upload after the node is **approved**.',
        'You are ready to open the **Smoke tests** page and generate probe traffic.',
      ],
      id: 'confirm-online',
      intro: 'The node should be visible in the dashboard before you spend time generating traffic.',
      title: 'Confirm the node is fully enrolled',
    },
  ],
  summary: 'Create a node through the dashboard or API, approve it, then start the node stack with the dashboard URL and issued node key.',
  title: 'Issue a node key and bring a runtime online',
};
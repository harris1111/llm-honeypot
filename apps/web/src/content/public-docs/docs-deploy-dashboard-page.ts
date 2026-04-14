import type { DocsPage } from './docs-page-types';

const windowsDashboardBoot = `docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build`;

const unixDashboardBoot = `docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build`;

const linuxDashboardBoot = `cat > /tmp/llmtrap-dashboard.linux.override.yml <<'EOF'
services:
  api:
    ports:
      - '0.0.0.0:4000:4000'
EOF

docker compose \
  --env-file docker/dashboard-compose.local.env \
  -f docker/docker-compose.dashboard.yml \
  -f /tmp/llmtrap-dashboard.linux.override.yml \
  up -d --build`;

const windowsHealthChecks = `Invoke-WebRequest -UseBasicParsing http://localhost:4000/api/v1/health | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:3000/healthz | Select-Object -ExpandProperty Content
Invoke-WebRequest -UseBasicParsing http://localhost:3000/docs | Select-Object StatusCode`;

const unixHealthChecks = `curl http://localhost:4000/api/v1/health
curl http://localhost:3000/healthz
curl -I http://localhost:3000/docs`;

export const docsDeployDashboardPage: DocsPage = {
  eyebrow: 'Deploy dashboard',
  id: 'deploy-dashboard',
  quickFacts: [
    { label: 'Web UI', value: 'localhost:3000' },
    { label: 'API health', value: 'localhost:4000' },
    { label: 'MinIO S3', value: 'localhost:9001' },
    { label: 'MinIO console', value: 'localhost:9002' },
  ],
  relatedPageIds: ['getting-started', 'enroll-node', 'smoke-tests'],
  sections: [
    {
      codeSamples: [
        { code: windowsDashboardBoot, language: 'powershell', title: 'Windows PowerShell' },
        { code: unixDashboardBoot, language: 'bash', title: 'macOS' },
        { code: linuxDashboardBoot, language: 'bash', title: 'Linux override' },
      ],
      id: 'boot-dashboard',
      intro: 'Bring up the dashboard stack first so the public web UI, API, worker, Postgres, Redis, and MinIO are all present before you create a node.',
      title: 'Boot the local dashboard stack',
    },
    {
      codeSamples: [
        { code: windowsHealthChecks, language: 'powershell', title: 'Windows health checks' },
        { code: unixHealthChecks, language: 'bash', title: 'macOS and Linux health checks' },
      ],
      id: 'verify-health',
      intro: 'Verify both the proxied frontend and the API before you move on to node enrollment.',
      title: 'Verify the local control plane',
    },
    {
      bullets: [
        'The committed local env seeds a bootstrap admin for Docker-only testing: admin@llmtrap.local / ChangeMe123456!.',
        'The local dashboard stack also starts MinIO so archive smoke does not need external storage.',
        'The worker webhook smoke target is wired to http://host.docker.internal:7780/smoke-alert for same-host testing.',
        'If you reused an older stack after schema or storage changes, rerun db-init and minio-init before continuing.',
      ],
      id: 'boot-notes',
      intro: 'The local compose stack is opinionated toward the shipped walkthrough and smoke suite.',
      title: 'Know what the local dashboard boot includes',
    },
  ],
  summary: 'Use the committed local env file to boot the dashboard stack, then verify the public web route, API health endpoint, and MinIO-backed local services.',
  title: 'Bring the local control plane online',
};
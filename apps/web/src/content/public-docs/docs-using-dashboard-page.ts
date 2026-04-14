import type { DocsPage } from './docs-page-types';

export const docsUsingDashboardPage: DocsPage = {
  eyebrow: 'Using the dashboard',
  id: 'using-dashboard',
  quickFacts: [
    { label: 'Dashboard URL', value: 'http://localhost:3000' },
    { label: 'Auth', value: 'JWT + optional TOTP' },
    { label: 'Pages', value: '12 authenticated views' },
    { label: 'Real-time', value: 'WebSocket live feed' },
  ],
  relatedPageIds: ['how-it-works', 'configure-node', 'smoke-tests'],
  sections: [
    {
      id: 'login-and-auth',
      title: 'Login and authentication',
      intro:
        'The dashboard requires authentication. A seeded admin account is created during the first database migration.',
      body: [
        'Navigate to `/login` and sign in with `admin@llmtrap.local` / `ChangeMe123456!` (or whatever you configured in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`).',
        'On successful login you receive a short-lived JWT access token (15 min) and a refresh token. The frontend automatically refreshes tokens before expiry — you stay logged in as long as the tab is open.',
        'To enable two-factor authentication, go to **Settings** → TOTP section. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm. From then on, every login prompts for a TOTP code after the password step.',
      ],
    },
    {
      id: 'overview-page',
      title: 'Overview — high-level metrics',
      intro:
        'The Overview page is the first thing you see after login. It provides a quick health check of your entire deployment.',
      body: [
        '**Headline counters** show total sessions captured, total requests across all nodes, number of nodes online, and unique source IPs seen. These are sourced from the `/api/v1/analytics/overview` endpoint and refresh on page load.',
        'Use this page to spot-check that traffic is flowing. If all counters are zero, either no probe traffic has been sent yet or nodes are not flushing to the dashboard — check the Nodes page for ONLINE status.',
      ],
    },
    {
      id: 'nodes-page',
      title: 'Nodes — fleet management',
      intro:
        'The Nodes page lists every registered honeypot node with its current status, creation date, and last-seen heartbeat.',
      body: [
        '**Create a node** by clicking the "Create node" button and filling in a name, optional hostname, and optional public IP. The response includes the node ID and a one-time node key — copy the key immediately as it is only shown once.',
        '**Approve a node** by clicking the approve action on a PENDING node. Until approved, the node cannot pull configuration or upload captures.',
        '**Click a node name** to open the node detail page where you configure response strategy, templates, service toggles, and persona (see the Configure Node docs page for details).',
        '**Status meanings:** PENDING = created but not yet approved. ONLINE = approved and sending heartbeats. OFFLINE = heartbeats stopped for the configured timeout. DISABLED = manually disabled by the operator.',
      ],
    },
    {
      id: 'sessions-page',
      title: 'Sessions — captured interactions',
      intro:
        'The Sessions page shows every captured interaction grouped by session. A session is a cluster of requests from the same source IP within a time window.',
      body: [
        'Each session row shows: source IP, number of requests, services targeted, attack classification, first/last seen timestamps, and the associated node name.',
        'Click a session to expand it and see the full request/response details for each captured interaction: HTTP method, path, headers, request body, response body, and classification.',
        'Use the filter bar to narrow by classification (free_rider, scanner, config_hunter, attacker, mcp_prober, validator), service, node, or date range.',
      ],
    },
    {
      id: 'actors-page',
      title: 'Actors — threat intelligence correlation',
      intro:
        'The Actors page groups sessions into threat actor profiles based on source IP, user-agent, and TLS fingerprint.',
      body: [
        'Each actor card shows: primary IP address, number of sessions, services targeted, classification breakdown (pie chart or bar), and first/last seen timeline.',
        'Actor correlation runs as a background job in the worker. After sending probe traffic, wait about 45 seconds for the worker to process and correlate sessions into actors.',
        'Use this page to identify repeat offenders, track how an attacker escalates across services, and export actor profiles for threat intelligence sharing.',
      ],
    },
    {
      id: 'personas-page',
      title: 'Personas — AI identity management',
      intro:
        'The Personas page lets you create, edit, and manage the AI identities your nodes present to attackers.',
      body: [
        'Each persona defines: hostname, primary model name, GPU hardware, additional model list, timing parameters (min/max inference latency), credentials (dummy API keys), and per-service toggle defaults.',
        'Three presets are shipped: **homelabber** (consumer GPU, hobbyist setup), **researcher** (A100 cluster, academic models), and **startup** (production inference, low latency). Use these as-is or clone them as starting points for custom personas.',
        'When you assign a persona to a node, all responses from that node are generated using the persona\'s identity. Model names in API responses, hostnames in system info endpoints, GPU details in health checks — everything matches.',
      ],
    },
    {
      id: 'response-engine-page',
      title: 'Response Engine — template management',
      intro:
        'The Response Engine page is where you review, approve, and manage the templates that power node responses.',
      body: [
        '**Review queue.** New templates (loaded from `templates/core.json` during seeding or created via the API) appear in the review queue. Each template shows its keywords (match triggers), response text (with persona variable placeholders), and target services.',
        '**Approve / Reject.** Clicking approve makes the template available for live routing on all nodes. Rejecting removes it from the queue. You can filter the queue by status (pending, approved, rejected).',
        '**Template anatomy:** Each template has an `id`, a `category` (e.g., code-generation, summarization, jailbreak), `keywords` (array of trigger phrases), `responseText` (the reply with `{{modelName}}`, `{{hostname}}`, `{{gpuModel}}` placeholders), and an optional `services` array to restrict it to specific emulators.',
      ],
    },
    {
      id: 'alerts-page',
      title: 'Alerts — automated notification',
      intro:
        'The Alerts page lets you define rules that trigger webhook notifications when specific capture patterns occur.',
      body: [
        'An alert rule specifies: a name, match conditions (classification, service, source IP pattern), and the webhook URL to POST the alert payload to. When the worker processes a new capture that matches a rule, it fires the webhook immediately.',
        '**Alert logs** show the delivery history: each log entry records the rule that triggered, the capture that matched, the HTTP status code returned by the webhook, and the response latency. Use this to verify that your SIEM, Slack, or PagerDuty integration is receiving alerts.',
        'Common alert setups: fire on all `attacker` classifications, or fire when SSH or FTP gets a login attempt, or fire on any `config_hunter` that targets IDE config paths.',
      ],
    },
    {
      id: 'threat-intel-page',
      title: 'Threat Intel — IOC, MITRE, and exports',
      intro:
        'The Threat Intel page aggregates captured data into formats used by security teams and threat intelligence platforms.',
      body: [
        '**IOC feed** — Lists Indicators of Compromise extracted from captures: source IPs, user-agents, TLS fingerprints, and observed tooling signatures. Filterable by classification, service, and time range.',
        '**MITRE ATT&CK mapping** — Maps captured behavior to MITRE ATT&CK techniques. For example, endpoint scanning maps to T1046 (Network Service Discovery), credential extraction attempts map to T1552 (Unsecured Credentials).',
        '**Blocklist** — A downloadable list of source IPs that triggered attacker-class captures. Use this to feed your firewall, WAF, or cloud security group rules.',
        '**STIX bundle** — Exports the full threat intelligence picture as a STIX 2.1 JSON bundle, compatible with TAXII servers, OpenCTI, MISP, and other CTI platforms.',
      ],
    },
    {
      id: 'live-feed-page',
      title: 'Live Feed — real-time event stream',
      intro:
        'The Live Feed page shows captured requests as they arrive, powered by a WebSocket connection to the dashboard API.',
      body: [
        'Each event card shows: timestamp, source IP, service, HTTP method + path, classification badge, and a truncated request body preview. Click an event to see the full captured details.',
        'The feed connects via Socket.IO to the `/api/v1/socket.io` namespace `/live-feed`. You can filter the stream by classification, node, service, or source IP using the filter bar at the top.',
        'If WebSocket connectivity is interrupted (network change, API restart), the feed automatically reconnects and shows a connection-status indicator. While disconnected, events are still captured by the node and will appear in Sessions/Actors after the next flush.',
        'The Live Feed is the best place to watch during a penetration test or red team exercise — you see attacker behavior in real time without any delay.',
      ],
    },
    {
      id: 'export-page',
      title: 'Export — archives and reports',
      intro:
        'The Export page provides access to archived capture data and report generation.',
      body: [
        '**Archives.** The worker periodically compresses old sessions into gzipped NDJSON bundles and uploads them to MinIO/S3. The Export page lists all archive manifests with dates, record counts, and download links. Each bundle can be imported into Elasticsearch, Splunk, or any NDJSON-compatible tool.',
        '**Retention.** Archives follow the `ARCHIVE_RETENTION_DAYS` setting (default 30 days). Records older than the retention window are pruned from PostgreSQL after archival, keeping the database lean.',
      ],
    },
    {
      id: 'settings-page',
      title: 'Settings — account and security',
      intro:
        'The Settings page manages your operator account and security preferences.',
      body: [
        '**TOTP two-factor authentication.** Enable or disable TOTP for your account. When enabling, scan the displayed QR code with your authenticator app and confirm with a 6-digit code. Once active, every login requires the TOTP code after the password.',
        '**Session management.** View your current JWT token expiry. The frontend handles token refresh automatically, but you can force a logout from all devices by clicking "Revoke all sessions."',
      ],
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Navigation tips',
      intro:
        'The dashboard sidebar is always visible on desktop. On mobile, use the hamburger menu.',
      body: [
        'The sidebar groups pages into logical sections: **Monitor** (Overview, Live Feed), **Investigate** (Sessions, Actors), **Configure** (Nodes, Personas, Response Engine), **Intelligence** (Threat Intel, Alerts), and **System** (Export, Settings).',
        'Every page supports deep linking — bookmark or share the full URL including query parameters. Filter state on Sessions, Actors, Live Feed, and Threat Intel is preserved in the URL.',
        'The dashboard uses design tokens for all colors, so it adapts to your system\'s light/dark preference automatically. You can override this in the page\'s CSS custom properties if needed.',
      ],
    },
  ],
  summary:
    'Complete guide to the LLMTrap operator dashboard: login, overview metrics, node management, session analysis, actor correlation, personas, response engine, alerts, threat intelligence, live feed, export, and settings.',
  title: 'Using the dashboard',
};

import type { DocsPage } from './docs-page-types';

export const docsHowItWorksPage: DocsPage = {
  eyebrow: 'How it works',
  id: 'how-it-works',
  quickFacts: [
    { label: 'Stacks', value: 'Dashboard + Node' },
    { label: 'AI surfaces', value: '9 LLM endpoints' },
    { label: 'Traditional', value: '7 classic listeners' },
    { label: 'Total protocols', value: '31 emulated services' },
  ],
  relatedPageIds: ['deploy-dashboard', 'configure-node', 'using-dashboard'],
  sections: [
    {
      id: 'high-level-architecture',
      title: 'High-level architecture',
      intro:
        'LLMTrap is a distributed honeypot platform split into two independent Docker Compose stacks that communicate over a shared control-plane network.',
      body: [
        'The **Dashboard stack** is your central control plane. It runs the NestJS API, a React/Vite frontend, a BullMQ worker for background jobs, PostgreSQL for persistence, Redis for caching and pub/sub, and MinIO for S3-compatible cold storage. Operators log in here to manage nodes, review captured sessions, configure personas, set alert rules, and export threat intelligence.',
        'The **Node stack** is the honeypot itself. Each node runs a single NestJS container with 31 protocol emulators listening on separate ports, plus a local Redis instance for autonomous buffering. When an attacker probes any port, the node captures the full request (headers, body, TLS fingerprint), classifies it, generates a persona-consistent response, and queues the record. A background scheduler flushes captured records to the dashboard API in batches.',
        'Nodes authenticate to the dashboard using a shared secret (node key) issued during enrollment. The dashboard must approve the node before it can pull configuration or upload captures. This approval gate prevents rogue containers from injecting data.',
      ],
    },
    {
      id: 'protocol-emulation',
      title: 'Protocol emulation layer',
      intro:
        'Every node emulates 31 services across four categories. Each emulator is a dedicated NestJS module with its own controller, port, and response logic.',
      bullets: [
        '**AI LLM surfaces (9)** — Ollama (11434), OpenAI (8080), Anthropic (8081), LM Studio (1234), llama.cpp (8082), vLLM (8083), text-generation-webui (5000), LangServe (8000), AutoGPT (8084). Each emulates the real API surface: model listing, chat completions, streaming responses, and health endpoints.',
        '**RAG vector databases (5)** — Qdrant (6333), ChromaDB (8085), Neo4j (7474), Weaviate (8086), Milvus (19530). These mimic collection/index listing and status endpoints that scanners probe for open vector stores.',
        '**Homelab services (10)** — Plex (32400), Sonarr, Radarr, Prowlarr, Portainer, Home Assistant, Gitea, Grafana, Prometheus, Uptime Kuma. These attract lateral movement and config credential scraping.',
        '**Traditional listeners (7)** — SSH (10022), FTP (10021), SMTP (10025), SMTP Submission (10587), DNS (1053/udp), SMB (10445), Telnet (10023). Raw TCP/UDP handlers with banners and interactive bait.',
        '**Specialized surfaces** — MCP (JSON-RPC tool/resource bait on the main port) and IDE config files (.claude/settings.json, .cursor/mcp.json, .continue/config.json, etc.) served at well-known paths.',
      ],
    },
    {
      id: 'capture-pipeline',
      title: 'Capture and classification pipeline',
      intro:
        'Every inbound request flows through a unified capture pipeline that extracts metadata, classifies the attack, and routes it to the dashboard.',
      body: [
        '**Step 1 — Intercept.** Each protocol controller intercepts the raw request. The capture middleware extracts: source IP, HTTP method, path, headers, body (truncated at 64 KB), user-agent, and TLS JA3/JA4 fingerprint where available.',
        '**Step 2 — Classify.** The request is classified into one of seven categories: `free_rider` (checking model availability), `scanner` (port/endpoint discovery), `config_hunter` (searching for secrets or .env files), `attacker` (exploitation attempt), `mcp_prober` (MCP tool enumeration), `validator` (API key validation), or `unknown`.',
        '**Step 3 — Respond.** The response engine selects a strategy: `static` (hardcoded JSON), `template` (keyword-matched template with persona variable substitution), or in future `real_model` (LLM proxy). Responses are persona-consistent — model name, GPU, hostname, and uptime all match the active persona.',
        '**Step 4 — Buffer.** The captured record is pushed to the local Redis list. This ensures no data loss if the dashboard is temporarily unreachable.',
        '**Step 5 — Flush.** A scheduler (default every 15 seconds) drains the Redis list and sends a batch POST to `/api/v1/capture/ingest`. The dashboard persists each record in PostgreSQL and fans it out via Redis pub/sub to the live-feed WebSocket.',
      ],
    },
    {
      id: 'persona-engine',
      title: 'Persona engine',
      intro:
        'The persona engine ensures every response from a node looks like it came from a single, consistent AI deployment — not a honeypot.',
      body: [
        'A persona definition includes: a hostname (e.g., `gpu-worker-03`), a primary model (e.g., `deepseek-r1:70b`), GPU hardware (e.g., `NVIDIA A100 80GB`), timing parameters (inference latency range, startup jitter), credentials (dummy API keys), and a service toggle map that controls which emulators are active.',
        'Three built-in presets ship with LLMTrap: **homelabber** (hobbyist running models on consumer hardware), **researcher** (academic with high-end GPUs running code-generation models), and **startup** (small company deploying a customer-facing assistant). You can create custom personas or clone presets through the dashboard Personas page.',
        'When the response engine generates a reply, template variables like `{{modelName}}`, `{{hostname}}`, and `{{gpuModel}}` are substituted from the active persona snapshot. This means a scanner querying `/api/version` on the Ollama surface sees the same model name that appears in a `/v1/chat/completions` response on the OpenAI surface.',
      ],
    },
    {
      id: 'response-engine',
      title: 'Response engine',
      intro:
        'The response engine turns captured requests into believable replies using a template library and persona-aware variable substitution.',
      body: [
        '**Template matching.** When a prompt arrives at a chat/completions endpoint, the engine scores it against the keyword fields of all approved templates. The best-matching template is selected and its `responseText` is filled with persona variables. If no template exceeds the confidence threshold, a generic fallback response is returned.',
        '**Streaming support.** For endpoints that accept `stream: true`, the engine splits the response into token-sized chunks and delivers them as Server-Sent Events with realistic inter-token delays drawn from the persona\'s timing profile.',
        '**Template approval workflow.** New templates enter a review queue. An operator reviews them in the Response Engine page, then approves or rejects each one. Only approved templates are eligible for live routing. This prevents low-quality or unsafe responses from reaching attackers.',
        '**Starter templates.** LLMTrap ships with a `templates/core.json` file of starter templates covering common prompts: code generation, summarization, translation, and system-prompt extraction attempts.',
      ],
    },
    {
      id: 'node-dashboard-sync',
      title: 'Node ↔ Dashboard synchronization',
      intro:
        'Nodes and the dashboard stay in sync through three background loops: registration, heartbeat, and config refresh.',
      body: [
        '**Registration.** On startup the node sends a POST to the dashboard with its node key. The dashboard validates the key and marks the node as connected. If the node was not yet approved, registration is retried on an exponential backoff.',
        '**Heartbeat.** Every interval (default 30 s), the node sends a heartbeat containing its uptime, total captured count, and current status. The dashboard updates the node\'s last-seen timestamp. If heartbeats stop for a configurable number of intervals, the node transitions to OFFLINE.',
        '**Config refresh.** Every interval (default 60 s), the node pulls its latest configuration from GET `/api/v1/nodes/{nodeId}/config`. This includes the active response strategy, the list of approved template IDs, and per-service toggles. Changes take effect immediately — an operator can disable a protocol or change the response strategy from the dashboard, and the next config pull applies it on the node.',
        '**Capture flush.** Captured records are buffered in local Redis and flushed in batch to POST `/api/v1/capture/ingest` on each heartbeat cycle. If the dashboard is unreachable, records remain in Redis and are retried on the next successful connection.',
      ],
    },
    {
      id: 'worker-jobs',
      title: 'Background worker jobs',
      intro:
        'The worker process runs three long-lived BullMQ processors that handle tasks the API delegates asynchronously.',
      bullets: [
        '**Alert processor** — Evaluates alert rules against new captures. When a rule matches (e.g., classification = attacker, service = ssh), the processor fires a POST to the configured webhook URL with the alert payload. Delivery results (status code, latency) are stored as alert logs.',
        '**Archive processor** — On a cron interval (default 6 hours), scans for sessions older than the retention window (default 30 days), compresses them into gzipped NDJSON bundles, uploads them to MinIO/S3, and creates an archive manifest record. Old database rows are pruned after a successful upload.',
        '**Actor correlation** — Groups captured sessions by source IP, user-agent, and TLS fingerprint into threat actor profiles. Each actor gets a summary of services targeted, classification breakdown, and timeline. This powers the Actors page in the dashboard.',
      ],
    },
    {
      id: 'security-model',
      title: 'Security model',
      intro:
        'LLMTrap isolates honeypot traffic from the control plane and enforces authentication at every boundary.',
      bullets: [
        '**Network isolation.** The node compose exposes only honeypot ports to the external network. The control-plane network is internal — attackers cannot reach the dashboard API or PostgreSQL from a honeypot port.',
        '**Node authentication.** Every API call from a node includes the `x-node-key` header. The dashboard validates the key and rejects requests from unknown or unapproved nodes.',
        '**Operator authentication.** Dashboard login uses JWT with short-lived access tokens (15 min) and longer refresh tokens. TOTP two-factor authentication is available in Settings.',
        '**Audit trail.** Every login, node approval, config change, and template approval is recorded in the audit log. The Threat Intel page surfaces IOC (Indicators of Compromise), MITRE ATT&CK mapping, blocklists, and STIX bundle exports.',
        '**No real shell.** Traditional listeners (SSH, FTP, Telnet) present banners and interactive prompts but never execute commands on the host. The honeypot container runs as a non-root user with resource limits.',
      ],
    },
    {
      id: 'data-flow-summary',
      title: 'End-to-end data flow',
      intro:
        'Here is the complete journey of a single attacker request from first contact to the dashboard.',
      body: [
        '1. Attacker sends a request to an emulated port (e.g., `POST /v1/chat/completions` on port 8080).',
        '2. The OpenAI protocol controller intercepts the request and passes it through the capture middleware.',
        '3. The capture middleware extracts metadata (IP, headers, body, UA, TLS fingerprint) and classifies the request.',
        '4. The response engine matches the prompt against approved templates, substitutes persona variables, and returns a streaming SSE response.',
        '5. The captured record is pushed to the local Redis buffer.',
        '6. The heartbeat scheduler flushes the buffer to POST `/api/v1/capture/ingest` on the dashboard.',
        '7. The dashboard API persists the record in PostgreSQL and publishes it on the `live-feed` Redis channel.',
        '8. The WebSocket gateway fans the event to all connected dashboard clients subscribed to the live feed.',
        '9. The worker alert processor evaluates the capture against active alert rules and fires webhooks if matched.',
        '10. The worker actor-correlation processor groups the capture with prior requests from the same source IP.',
        '11. The operator sees the request appear in the Live Feed, the session in Sessions, and the actor in Actors.',
      ],
    },
  ],
  summary:
    'Deep dive into how LLMTrap works: the two-stack architecture, protocol emulation, capture pipeline, persona and response engines, node↔dashboard sync, background workers, and the security model.',
  title: 'How it works',
};

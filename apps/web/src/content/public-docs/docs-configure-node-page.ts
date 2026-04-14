import type { DocsPage } from './docs-page-types';

export const docsConfigureNodePage: DocsPage = {
  eyebrow: 'Configure node',
  id: 'configure-node',
  quickFacts: [
    { label: 'Config endpoint', value: 'GET /nodes/:id/config' },
    { label: 'Strategies', value: 'smart / fixed_n / budget' },
    { label: 'Service toggles', value: '31 per-service flags' },
    { label: 'Sync interval', value: '~60 s auto-refresh' },
  ],
  relatedPageIds: ['enroll-node', 'how-it-works', 'using-dashboard'],
  sections: [
    {
      id: 'node-detail-page',
      title: 'The node detail page',
      intro:
        'After enrolling a node, click its name in the **Nodes list** (or navigate to `/nodes/<nodeId>`) to open the node detail page. This is where all per-node configuration happens.',
      callout: { text: 'Every configuration change is applied **live** — the node picks it up on the next config-refresh cycle (~60 seconds). No container restart needed.', variant: 'tip' },
      body: [
        'At the top you see a **status badge** (`PENDING`, `ONLINE`, `OFFLINE`, or `DISABLED`) and creation/approval timestamps. Below that is the configuration form, split into the sections described on this page.',
      ],
    },
    {
      id: 'response-strategy',
      title: 'Response strategy',
      intro:
        'The response strategy controls how the node generates replies to attacker prompts. Choose the strategy that matches your **research goals**.',
      diagram: [
        '  ┌─────────────────────────────────────────────────────────┐',
        '  │                  RESPONSE STRATEGIES                     │',
        '  ├──────────┬──────────────────────────────────────────────┤',
        '  │  smart   │  Keyword-match → best template → fallback   │',
        '  │ (default)│  Best for: capturing varied attacker behavior│',
        '  ├──────────┼──────────────────────────────────────────────┤',
        '  │  fixed_n │  Use specific template IDs always            │',
        '  │          │  Best for: controlled response experiments   │',
        '  ├──────────┼──────────────────────────────────────────────┤',
        '  │  budget  │  Real LLM proxy with token budget (future)   │',
        '  │          │  Falls back to templates when exhausted      │',
        '  └──────────┴──────────────────────────────────────────────┘',
      ].join('\n'),
      body: [
        '**smart** (default) — The node uses keyword matching to find the best-matching approved template. If no template scores above the confidence threshold, a persona-consistent fallback is returned.',
        '**fixed_n** — The node always uses a fixed set of template IDs. Useful for controlling exactly which responses attackers see.',
        '**budget** — Reserved for future use. Will enable real LLM proxy routing with a token budget per time window.',
      ],
    },
    {
      id: 'approved-templates',
      title: 'Approved template selection',
      intro:
        'Templates are the pre-written responses that the node uses. Only **approved** templates are eligible for live routing.',
      body: [
        'Navigate to the **Response Engine** page in the dashboard sidebar. New templates enter a review queue where you can inspect the keywords, response text, and target services.',
        'On the node detail page, you can optionally restrict the node to a **specific subset** of approved template IDs. Leave the field empty to allow all approved templates.',
        'The starter file `templates/core.json` ships with templates for common prompts: code generation, summarization, translation, and system-prompt extraction attempts.',
      ],
    },
    {
      id: 'service-toggles',
      title: 'Per-service toggles',
      intro:
        'Each of the **31 protocol emulators** can be individually enabled or disabled per node. Tailor the attack surface to your research scenario.',
      callout: { text: 'Disabling a service does **not** close the port — it returns a `503` instead of connection-refused. A closed port is suspicious; a 503 suggests a temporary outage, which is more realistic.', variant: 'info' },
      body: [
        'The **service toggles** section shows a switch for every emulator: `Ollama`, `OpenAI`, `Anthropic`, `LM Studio`, `llama.cpp`, `vLLM`, `text-generation-webui`, `LangServe`, `AutoGPT`, `Qdrant`, `ChromaDB`, `Neo4j`, `Weaviate`, `Milvus`, `Plex`, `Sonarr`, `Radarr`, `Prowlarr`, `Portainer`, `Home Assistant`, `Gitea`, `Grafana`, `Prometheus`, `Uptime Kuma`, `SSH`, `FTP`, `SMTP`, `SMTP Submission`, `DNS`, `SMB`, `Telnet`, `MCP`, and IDE configs.',
        'Common configurations: enable only **AI surfaces + SSH** for an LLM-focused trap, or enable **homelab services + traditional listeners** for a lateral-movement study.',
      ],
    },
    {
      id: 'persona-assignment',
      title: 'Persona assignment',
      intro:
        'Each node uses a persona that controls the **identity** it presents to attackers — model names, GPU info, hostname, timing, and credentials.',
      body: [
        'Navigate to the **Personas** page to see built-in presets and any custom personas you have created. The three shipped presets are:',
        '**homelabber** — A hobbyist running `DeepSeek Coder` on a consumer `RTX 4090`. Hostname: `homeserver-01`. Moderate inference latency.',
        '**researcher** — An academic running `CodeLlama 70B` on an `A100` cluster. Hostname: `gpu-worker-03`. Fast inference.',
        '**startup** — A small company deploying `GPT-NeoX` as a customer assistant. Hostname: `prod-inference-1`. Low latency.',
        'Select a persona from the dropdown on the node detail page and save. All subsequent responses use the new persona\'s variables.',
      ],
    },
    {
      id: 'port-mapping',
      title: 'Port mapping and networking',
      intro:
        'When running in Docker, each emulator listens on an internal port. The compose file maps these to **host ports** you can customize via environment variables.',
      body: [
        'Default AI surfaces use their standard ports (`Ollama` on **11434**, `OpenAI` on **8080**, etc.). Traditional listeners use high ports to avoid conflicts: `SSH` on **20022**, `FTP` on **20021**, `SMTP` on **20025**, `DNS` on **20053/udp**, `SMB` on **20445**, `Telnet` on **20023**.',
        'To change host ports, edit `docker-compose.node.yml` or set corresponding environment variables in your node compose env file:',
      ],
      codeSamples: [
        {
          title: 'Example: customize host ports in node env file',
          language: 'bash',
          variants: {
            linux: `# Override default host ports
HOST_SSH_PORT=2222
HOST_FTP_PORT=2121
HOST_SMTP_PORT=2525
HOST_DNS_PORT=5353
HOST_SMB_PORT=4445
HOST_TELNET_PORT=2323

# Override AI surface ports
NODE_HTTP_PORT=11434
OPENAI_HTTP_PORT=8080
ANTHROPIC_HTTP_PORT=8081`,
          },
        },
      ],
    },
    {
      id: 'environment-variables',
      title: 'Node environment variables reference',
      intro:
        'The following environment variables control node behavior. Set them in a compose env file or pass them directly to the container.',
      bullets: [
        '`LLMTRAP_DASHBOARD_URL` **(required)** — Full URL of the dashboard API, e.g., `http://dashboard-api:4000`.',
        '`LLMTRAP_NODE_KEY` **(required)** — The shared secret issued during node enrollment. Sent in the `x-node-key` header.',
        '`LLMTRAP_RUNTIME_DIR` — Directory for local state files. Default: `/home/llmtrap/.llmtrap-runtime`.',
        '`REDIS_URL` — Connection string for the local Redis buffer. Default: `redis://redis:6379`.',
        '`NODE_HTTP_PORT` — Internal port for `Ollama`. Default: `11434`.',
        '`OPENAI_HTTP_PORT` — Internal port for `OpenAI`. Default: `8080`.',
        '`ANTHROPIC_HTTP_PORT` — Internal port for `Anthropic`. Default: `8081`.',
        '`LM_STUDIO_HTTP_PORT` — Default: `1234`. `LLAMACPP_HTTP_PORT` — Default: `8082`. `VLLM_HTTP_PORT` — Default: `8083`.',
        '`TEXT_GENERATION_WEBUI_HTTP_PORT` — Default: `5000`. `LANGSERVE_HTTP_PORT` — Default: `8000`. `AUTOGPT_HTTP_PORT` — Default: `8084`.',
        '`QDRANT_HTTP_PORT` — Default: `6333`. `CHROMADB_HTTP_PORT` — Default: `8085`. `NEO4J_HTTP_PORT` — Default: `7474`. `WEAVIATE_HTTP_PORT` — Default: `8086`. `MILVUS_HTTP_PORT` — Default: `19530`.',
        'Host port overrides: `HOST_SSH_PORT` (**20022**), `HOST_FTP_PORT` (**20021**), `HOST_SMTP_PORT` (**20025**), `HOST_SMTP_SUBMISSION_PORT` (**20587**), `HOST_DNS_PORT` (**20053**), `HOST_SMB_PORT` (**20445**), `HOST_TELNET_PORT` (**20023**).',
      ],
    },
    {
      id: 'live-config-sync',
      title: 'Live configuration sync',
      intro:
        'You **never** need to restart a node container to apply configuration changes. The sync loop handles it automatically.',
      callout: { text: 'If the dashboard is temporarily unreachable, the node continues with its **last-known configuration** and retries on the next cycle.', variant: 'info' },
      body: [
        'Every ~60 seconds the node calls `GET /api/v1/nodes/{nodeId}/config` and merges the response into its in-memory state. The response includes the current response strategy, approved template IDs, and per-service toggle map.',
        'To force an immediate config update, restart the node container — it pulls config on startup before accepting any traffic.',
      ],
    },
  ],
  summary:
    'Detailed guide to configuring a honeypot node: response strategy, template selection, service toggles, persona assignment, port mapping, environment variables, and live config sync.',
  title: 'Configure a node',
};

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
        'After enrolling a node, click its name in the Nodes list (or navigate to `/nodes/<nodeId>`) to open the node detail page. This is where all per-node configuration happens.',
      body: [
        'At the top you see a **status badge** (PENDING, ONLINE, OFFLINE, or DISABLED) and creation/approval timestamps. Below that is the configuration form, which is split into the sections described on this page.',
        'Every change you save here is persisted in the dashboard database. The node picks up the new configuration on its next config-refresh cycle (default every 60 seconds). There is no need to restart the node container — changes are applied live.',
      ],
    },
    {
      id: 'response-strategy',
      title: 'Response strategy',
      intro:
        'The response strategy controls how the node generates replies to attacker prompts. Choose the strategy that matches your research goals.',
      body: [
        '**smart** (default) — The node uses keyword matching to find the best-matching approved template. If no template scores above the confidence threshold, a generic persona-consistent fallback is returned. Best for capturing varied attacker behavior without tuning.',
        '**fixed_n** — The node always uses a fixed set of template IDs that you specify. Useful when you want to control exactly which responses attackers see — for example, to observe how they react to a specific jailbreak response.',
        '**budget** — Reserved for future use. Will enable real LLM proxy routing with a token budget per time window, falling back to templates when the budget is exhausted.',
        'Select the strategy from the dropdown on the node detail page and click Save.',
      ],
    },
    {
      id: 'approved-templates',
      title: 'Approved template selection',
      intro:
        'Templates are the pre-written responses that the node uses to reply to attacker prompts. Only approved templates are eligible for live routing.',
      body: [
        'Navigate to the **Response Engine** page in the dashboard sidebar. New templates enter a review queue where you can inspect the keywords, response text, and target services. Approve templates that produce convincing, persona-consistent replies; reject those that are low-quality or potentially dangerous.',
        'On the node detail page, you can optionally restrict the node to a specific subset of approved template IDs. Leave the field empty to allow the node to use all approved templates.',
        'The starter file `templates/core.json` ships with templates for common prompts: code generation, summarization, translation, and system-prompt extraction attempts. These are pre-loaded during database seeding and start in the review queue.',
      ],
    },
    {
      id: 'service-toggles',
      title: 'Per-service toggles',
      intro:
        'Each of the 31 protocol emulators can be individually enabled or disabled per node. This lets you tailor the attack surface to match your research scenario.',
      body: [
        'On the node detail page, the **service toggles** section shows a switch for every emulator: Ollama, OpenAI, Anthropic, LM Studio, llama.cpp, vLLM, text-generation-webui, LangServe, AutoGPT, Qdrant, ChromaDB, Neo4j, Weaviate, Milvus, Plex, Sonarr, Radarr, Prowlarr, Portainer, Home Assistant, Gitea, Grafana, Prometheus, Uptime Kuma, SSH, FTP, SMTP, SMTP Submission, DNS, SMB, Telnet, MCP, and IDE configs.',
        'Disabling a service does not stop the listener — the port remains open but returns a connection-refused or 503 response. This is intentional: a closed port is a signal to scanners that the service was selectively disabled, which is suspicious. A 503 suggests a temporary outage, which is more realistic.',
        'Common configurations: enable only AI surfaces + SSH for an LLM-focused trap, or enable homelab services + traditional listeners for a lateral-movement study.',
      ],
    },
    {
      id: 'persona-assignment',
      title: 'Persona assignment',
      intro:
        'Each node uses a persona that controls the identity it presents to attackers. The persona determines model names, GPU info, hostname, timing, and credentials.',
      body: [
        'Navigate to the **Personas** page to see built-in presets and any custom personas you have created. The three shipped presets are:',
        '**homelabber** — A hobbyist running DeepSeek Coder on a consumer RTX 4090. Hostname: `homeserver-01`. Moderate inference latency.',
        '**researcher** — An academic running CodeLlama 70B on an A100 cluster. Hostname: `gpu-worker-03`. Fast inference.',
        '**startup** — A small company deploying GPT-NeoX as a customer assistant. Hostname: `prod-inference-1`. Low latency.',
        'To assign a persona to a node, select it from the persona dropdown on the node detail page and save. The node applies the persona on the next config refresh. All subsequent responses use the new persona\'s model name, GPU, hostname, and timing.',
        'You can also create custom personas from the Personas page — define the hardware profile, model list, timing parameters, service toggles, and credentials to match any deployment you want to emulate.',
      ],
    },
    {
      id: 'port-mapping',
      title: 'Port mapping and networking',
      intro:
        'When running in Docker, each emulator listens on an internal port. The compose file maps these to host ports you can customize via environment variables.',
      body: [
        'The default port mapping exposes AI surfaces on their standard ports (Ollama on 11434, OpenAI on 8080, etc.). Traditional listeners use high ports to avoid conflicts with real services: SSH on 20022 (internal 10022), FTP on 20021, SMTP on 20025, DNS on 20053/udp, SMB on 20445, Telnet on 20023.',
        'To change host ports, edit the `docker-compose.node.yml` or set the corresponding environment variables in your node compose env file:',
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
        '`LLMTRAP_DASHBOARD_URL` (required) — Full URL of the dashboard API, e.g., `http://dashboard-api:4000`. The node uses this for registration, heartbeat, config refresh, and capture upload.',
        '`LLMTRAP_NODE_KEY` (required) — The shared secret issued during node enrollment. Sent in the `x-node-key` header on every API call.',
        '`LLMTRAP_RUNTIME_DIR` — Directory for local state files. Default: `/home/llmtrap/.llmtrap-runtime`.',
        '`REDIS_URL` — Connection string for the local Redis buffer. Default: `redis://redis:6379`.',
        '`NODE_HTTP_PORT` — Internal port for the Ollama emulator. Default: `11434`.',
        '`OPENAI_HTTP_PORT` — Internal port for the OpenAI emulator. Default: `8080`.',
        '`ANTHROPIC_HTTP_PORT` — Internal port for the Anthropic emulator. Default: `8081`.',
        '`LM_STUDIO_HTTP_PORT` — Internal port for the LM Studio emulator. Default: `1234`.',
        '`LLAMACPP_HTTP_PORT` — Internal port for the llama.cpp emulator. Default: `8082`.',
        '`VLLM_HTTP_PORT` — Internal port for the vLLM emulator. Default: `8083`.',
        '`TEXT_GENERATION_WEBUI_HTTP_PORT` — Internal port for text-generation-webui. Default: `5000`.',
        '`LANGSERVE_HTTP_PORT` — Internal port for LangServe. Default: `8000`.',
        '`AUTOGPT_HTTP_PORT` — Internal port for AutoGPT. Default: `8084`.',
        '`QDRANT_HTTP_PORT` — Default: `6333`. `CHROMADB_HTTP_PORT` — Default: `8085`. `NEO4J_HTTP_PORT` — Default: `7474`. `WEAVIATE_HTTP_PORT` — Default: `8086`. `MILVUS_HTTP_PORT` — Default: `19530`.',
        'Host port overrides: `HOST_SSH_PORT` (20022), `HOST_FTP_PORT` (20021), `HOST_SMTP_PORT` (20025), `HOST_SMTP_SUBMISSION_PORT` (20587), `HOST_DNS_PORT` (20053), `HOST_SMB_PORT` (20445), `HOST_TELNET_PORT` (20023).',
      ],
    },
    {
      id: 'live-config-sync',
      title: 'Live configuration sync',
      intro:
        'You never need to restart a node container to apply configuration changes. The sync loop handles it automatically.',
      body: [
        'Every ~60 seconds the node calls `GET /api/v1/nodes/{nodeId}/config` and merges the response into its in-memory state. The response includes the current response strategy, approved template IDs, and per-service toggle map.',
        'If the dashboard is temporarily unreachable, the node continues operating with its last-known configuration and retries on the next cycle. Captured requests continue to buffer in local Redis and flush when connectivity is restored.',
        'To force an immediate config update, restart the node container — it pulls config on startup before accepting any traffic.',
      ],
    },
  ],
  summary:
    'Detailed guide to configuring a honeypot node: response strategy, template selection, service toggles, persona assignment, port mapping, environment variables, and live config sync.',
  title: 'Configure a node',
};

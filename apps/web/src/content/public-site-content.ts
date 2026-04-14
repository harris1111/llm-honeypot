export interface LandingStat {
  label: string;
  value: string;
}

export interface FeatureCard {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}

export interface SurfaceCard {
  path: string;
  title: string;
  description: string;
  highlights: string[];
}

export const landingStats: LandingStat[] = [
  { label: 'Compose stacks', value: '2' },
  { label: 'AI HTTP surfaces', value: '9' },
  { label: 'Traditional listeners', value: '7' },
  { label: 'Completed phases', value: '4' },
];

export const architecturePillars: SurfaceCard[] = [
  {
    path: 'dashboard-stack',
    title: 'Dashboard stack',
    description: 'NestJS API, React web UI, worker, Postgres, Redis, and MinIO give the operator a single control plane.',
    highlights: ['Auth and node approval', 'Live feed, alerts, and archives', 'Operator-facing review and export flows'],
  },
  {
    path: 'node-stack',
    title: 'Node stack',
    description: 'A standalone honeypot node exposes the bait surfaces, buffers captures locally, and syncs with the dashboard.',
    highlights: ['Persona-shaped responses', 'Capture batching with local Redis spool', 'Heartbeat and config refresh loops'],
  },
  {
    path: 'shared-packages',
    title: 'Shared packages',
    description: 'Common contracts, Prisma models, response routing, and persona helpers keep the app, node, and worker aligned.',
    highlights: ['Shared DTOs and schemas', 'Prisma package for DB access', 'Response and persona engines'],
  },
];

export const featureCards: FeatureCard[] = [
  {
    eyebrow: 'Coverage',
    title: 'Multi-protocol lure surface',
    description: 'Expose AI-facing endpoints, MCP bait, RAG databases, IDE traps, homelab services, and classic network listeners from one node image.',
    bullets: ['OpenAI, Anthropic, Ollama, LM Studio, vLLM, llama.cpp, LangServe, AutoGPT, and more', 'MCP, IDE config, vector database, and homelab bait surfaces', 'Traditional SSH, FTP, SMTP, DNS, SMB, Telnet, and submission listeners'],
  },
  {
    eyebrow: 'Operations',
    title: 'Dashboard-first operator workflow',
    description: 'Approve nodes, inspect sessions, group actors, tune personas, and review capture streams from a single dashboard.',
    bullets: ['Protected control plane with login and node approval', 'Sessions, actors, personas, exports, and settings views', 'Live feed transport with filter support and polling fallback'],
  },
  {
    eyebrow: 'Response control',
    title: 'Runtime response strategy engine',
    description: 'Blend approved templates, persona constraints, and operator review loops to keep the node believable under probing traffic.',
    bullets: ['Node-side smart, fixed_n, and budget routing strategies', 'Manual backfeed and pending template review queue', 'Approved runtime template sync from the dashboard'],
  },
  {
    eyebrow: 'Detection',
    title: 'Threat intel, alerts, and archives',
    description: 'Track IOCs, blocklists, MITRE mappings, webhook alerts, and archive cold storage without leaving the platform.',
    bullets: ['Threat-intel filters, STIX export, and blocklist controls', 'Webhook alert delivery history and timeout tracking', 'MinIO-backed archive manifests with retrieval smoke coverage'],
  },
];

export const appSurfaces: SurfaceCard[] = [
  {
    path: 'apps/api',
    title: 'Dashboard API',
    description: 'NestJS control plane for auth, node lifecycle, session capture, exports, threat intel, alert configuration, and archive delivery.',
    highlights: ['JWT-authenticated operator APIs', 'Node registration, approval, and config endpoints', 'Live feed, alert, export, and archive routes'],
  },
  {
    path: 'apps/web',
    title: 'Dashboard web app',
    description: 'React plus TanStack Router app with a public landing page, public docs home, and the protected operator dashboard.',
    highlights: ['Public landing and docs routes', 'Protected dashboard views for nodes, sessions, actors, and alerts', 'Vite build with Tailwind styling'],
  },
  {
    path: 'apps/worker',
    title: 'Background worker',
    description: 'Runs asynchronous workloads for alert delivery, archival, and future enrichment or automation jobs.',
    highlights: ['BullMQ-ready worker bootstrap', 'Alert and archive flow support', 'Separated from the request path'],
  },
  {
    path: 'apps/node',
    title: 'Honeypot runtime node',
    description: 'Hosts the protocol emulators, records captures, applies response strategies, and syncs state with the dashboard.',
    highlights: ['HTTP AI surfaces and non-HTTP bait listeners', 'Local Redis buffering when the dashboard is unavailable', 'Persona-consistent protocol responses'],
  },
];

export const packageSurfaces: SurfaceCard[] = [
  {
    path: 'packages/shared',
    title: 'Shared contracts',
    description: 'Cross-app types, schemas, constants, and utilities used by the dashboard and node stacks.',
    highlights: ['DTO and schema reuse', 'Shared constants for protocols and ports', 'No duplicated transport contracts'],
  },
  {
    path: 'packages/db',
    title: 'Database package',
    description: 'Prisma schema, migrations, and database exports for dashboard persistence.',
    highlights: ['Schema and migrations in one place', 'Reusable Prisma client exports', 'Supports the API and worker'],
  },
  {
    path: 'packages/response-engine',
    title: 'Response engine',
    description: 'Encapsulates strategy selection and template matching for believable runtime responses.',
    highlights: ['Routing primitives', 'Template matching helpers', 'Reusable engine boundary'],
  },
  {
    path: 'packages/persona-engine',
    title: 'Persona engine',
    description: 'Keeps fake hardware, model, and uptime claims internally consistent across bait surfaces.',
    highlights: ['Persona state helpers', 'Consistency rules for emulated surfaces', 'Shared persona logic between services'],
  },
];

export const supportingSurfaces: SurfaceCard[] = [
  {
    path: 'docker',
    title: 'Compose and image assets',
    description: 'Dockerfiles, compose definitions, env templates, and runtime bootstrap scripts for the dashboard and node stacks.',
    highlights: ['Dashboard and node compose files', 'Per-service Dockerfiles', 'Local env templates and init scripts'],
  },
  {
    path: 'templates',
    title: 'Response templates',
    description: 'Shipped bait templates that feed the response-engine review and runtime sync loops.',
    highlights: ['Starter response library', 'Manual review inputs', 'Believability scaffolding'],
  },
  {
    path: 'personas',
    title: 'Built-in personas',
    description: 'Preset identities that shape how the honeypot node answers capability and environment probes.',
    highlights: ['Researcher, startup, and homelab presets', 'Reusable node personality seeds', 'Backstop for protocol consistency'],
  },
  {
    path: 'tests',
    title: 'Smoke and future e2e coverage',
    description: 'The repo ships protocol-focused smoke validation today and leaves browser-driven coverage as future follow-up work.',
    highlights: ['Smoke scripts for live feed, alerts, and archives', 'tests/e2e is reserved for future browser coverage', 'Regression surface for shipped flows'],
  },
  {
    path: 'docs',
    title: 'Project documentation',
    description: 'Roadmap, changelog, architecture notes, and the shipped-app walkthrough that track the current slice.',
    highlights: ['Roadmap and changelog', 'Architecture reference', 'Operator walkthrough for local validation'],
  },
  {
    path: 'plans',
    title: 'Implementation plans',
    description: 'Phase plans and reports that document shipped slices, pending work, and research findings.',
    highlights: ['Execution plans by date and phase', 'Report subfolders for supporting research', 'Useful trail for future contributors'],
  },
];
import type { DocsPage } from './docs-page-types';

export const docsOverviewPage: DocsPage = {
  eyebrow: 'Docs home',
  id: 'overview',
  quickFacts: [
    { label: 'Public docs pages', value: '5' },
    { label: 'Bootstrap admin', value: '1' },
    { label: 'Compose stacks', value: '2' },
    { label: 'Smoke scripts', value: '3' },
  ],
  relatedPageIds: ['getting-started', 'deploy-dashboard', 'enroll-node', 'smoke-tests'],
  sections: [
    {
      bullets: [
        'Start with Getting started if you need the local prerequisites, ports, and default credentials.',
        'Move to Deploy dashboard when you are ready to boot the local API, web, worker, Postgres, Redis, and MinIO stack.',
        'Use Enroll node to create a node record, approve it, and bring the runtime online with the issued node key.',
        'Finish with Smoke tests to probe listeners, verify the dashboard routes, and run the shipped smoke scripts.',
      ],
      id: 'docs-map',
      intro: 'The docs area is split by operator task so you can move through the product in the same order as the local walkthrough.',
      title: 'Follow the docs in operating order',
    },
    {
      bullets: [
        'Public landing page, docs area, and operator login remain reachable without authentication.',
        'Dashboard auth, nodes, sessions, actors, personas, alerts, threat intel, export, live feed, response engine, and settings are already shipped.',
        'The node runtime exposes AI HTTP listeners, bait services, traditional listeners, response strategies, archive hooks, and live-feed capture upload.',
        'Smoke coverage exists for live-feed WebSocket delivery, webhook alert delivery, and archive retrieval.',
      ],
      id: 'current-slice',
      intro: 'These pages document the currently shipped slice rather than the aspirational product surface.',
      title: 'Know what this docs area covers',
    },
    {
      checklist: [
        'Open /docs/getting-started and confirm your local machine meets the prerequisites.',
        'Boot the dashboard stack and verify both the public web route and API health endpoint.',
        'Create and approve a node before starting the honeypot runtime.',
        'Generate probe traffic, then verify dashboard screens and smoke scripts.',
      ],
      id: 'recommended-path',
      intro: 'If you want the shortest route from zero to validated stack, this is the path to follow.',
      title: 'Take the shortest path to a validated local stack',
    },
  ],
  summary: 'Use this docs area as a real operator runbook: prepare the workstation, boot the dashboard, enroll a node, then run probes and smoke validation.',
  title: 'Run the public docs like an operator checklist',
};
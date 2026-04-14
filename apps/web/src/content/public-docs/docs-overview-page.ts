import type { DocsPage } from './docs-page-types';

export const docsOverviewPage: DocsPage = {
  eyebrow: 'Docs',
  id: 'overview',
  quickFacts: [
    { label: 'Compose stacks', value: '2' },
    { label: 'AI surfaces', value: '9' },
    { label: 'Traditional listeners', value: '7' },
    { label: 'Smoke scripts', value: '3' },
  ],
  relatedPageIds: ['getting-started', 'deploy-dashboard', 'enroll-node', 'smoke-tests'],
  sections: [
    {
      id: 'quickstart',
      title: 'Quick start',
      intro: 'Follow these steps in order to go from zero to a running honeypot with captured traffic.',
      checklist: [
        'Check prerequisites and note the default ports and credentials.',
        'Boot the dashboard stack with Docker Compose.',
        'Create and approve a node in the dashboard UI.',
        'Start the node stack and probe the bait endpoints.',
      ],
    },
    {
      id: 'whats-shipped',
      title: 'What ships today',
      intro: 'The current release includes the full dashboard, node runtime, response engine, threat intel, and smoke automation.',
      bullets: [
        'Dashboard with auth, nodes, sessions, actors, personas, alerts, threat intel, export, live feed, and settings.',
        'Node runtime with AI HTTP listeners, MCP/IDE bait, RAG bait, homelab bait, and traditional protocol traps.',
        'Response strategy engine with template review and approved runtime sync.',
        'Smoke scripts for live-feed, alert delivery, and archive retrieval.',
      ],
    },
  ],
  summary: 'Set up the dashboard, enroll a honeypot node, and start capturing traffic.',
  title: 'LLMTrap Documentation',
};

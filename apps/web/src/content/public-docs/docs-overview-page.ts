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
  relatedPageIds: ['getting-started', 'how-it-works', 'deploy-dashboard', 'enroll-node', 'configure-node', 'using-dashboard', 'smoke-tests'],
  sections: [
    {
      id: 'quickstart',
      title: 'Quick start',
      intro: 'Follow these steps in order to go from zero to a running honeypot with captured traffic.',
      checklist: [
        'Read How It Works to understand the architecture and capture pipeline.',
        'Check prerequisites and note the default ports and credentials.',
        'Boot the dashboard stack with Docker Compose.',
        'Create and approve a node in the dashboard UI.',
        'Configure the node: response strategy, service toggles, and persona.',
        'Start the node stack and probe the bait endpoints.',
        'Explore the dashboard: sessions, actors, live feed, and threat intel.',
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

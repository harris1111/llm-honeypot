import type { DocsNavigationItem, DocsPageId } from './docs-page-types';

export const docsNavigation: DocsNavigationItem[] = [
  {
    id: 'overview',
    summary: 'Use the docs area as a runbook before you enter the operator dashboard.',
    title: 'Docs home',
    to: '/docs',
  },
  {
    id: 'getting-started',
    summary: 'Prerequisites, ports, credentials, and the first-run route map.',
    title: 'Getting started',
    to: '/docs/getting-started',
  },
  {
    id: 'deploy-dashboard',
    summary: 'Boot the dashboard stack and verify the local control plane.',
    title: 'Deploy dashboard',
    to: '/docs/deploy-dashboard',
  },
  {
    id: 'enroll-node',
    summary: 'Create, approve, and start a honeypot node with the issued key.',
    title: 'Enroll node',
    to: '/docs/enroll-node',
  },
  {
    id: 'how-it-works',
    summary: 'Architecture, protocol emulation, capture pipeline, persona and response engines, sync, and security.',
    title: 'How it works',
    to: '/docs/how-it-works',
  },
  {
    id: 'configure-node',
    summary: 'Response strategy, service toggles, persona assignment, ports, env vars, and live config sync.',
    title: 'Configure node',
    to: '/docs/configure-node',
  },
  {
    id: 'using-dashboard',
    summary: 'Every dashboard page explained: sessions, actors, personas, alerts, threat intel, live feed, and more.',
    title: 'Using the dashboard',
    to: '/docs/using-dashboard',
  },
  {
    id: 'smoke-tests',
    summary: 'Probe listeners, verify the UI, and run the shipped smoke scripts.',
    title: 'Smoke tests',
    to: '/docs/smoke-tests',
  },
];

export function getDocsNavigationItem(id: DocsPageId) {
  return docsNavigation.find((item) => item.id === id);
}
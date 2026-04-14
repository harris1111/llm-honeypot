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
    id: 'smoke-tests',
    summary: 'Probe listeners, verify the UI, and run the shipped smoke scripts.',
    title: 'Smoke tests',
    to: '/docs/smoke-tests',
  },
];

export function getDocsNavigationItem(id: DocsPageId) {
  return docsNavigation.find((item) => item.id === id);
}
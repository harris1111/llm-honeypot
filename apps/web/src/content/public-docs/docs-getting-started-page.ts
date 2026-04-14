import type { DocsPage } from './docs-page-types';

export const docsGettingStartedPage: DocsPage = {
  eyebrow: 'Getting started',
  id: 'getting-started',
  quickFacts: [
    { label: 'Node.js', value: '22+' },
    { label: 'pnpm', value: '10.10+' },
    { label: 'Docker', value: 'Compose-ready' },
    { label: 'Core ports', value: '3000 / 4000' },
  ],
  relatedPageIds: ['deploy-dashboard', 'enroll-node', 'smoke-tests'],
  sections: [
    {
      bullets: [
        '**Docker** with modern Compose support is required for both dashboard and node stacks.',
        '**Node.js 22+** is required for the helper snippets and smoke scripts used in the walkthrough.',
        '**pnpm 10.10+** is expected for workspace commands and repository-owned smoke scripts.',
        'Leave ports `3000`, `4000`, `9001`, `9002`, `11434`, `8080`, `8081`, `3002`, `6333`, `19530`, `20021–20587`, and `7780` available when running the full local slice.',
      ],
      callout: { text: 'All of these are pre-installed in most modern dev environments. If you use **Docker Desktop**, Compose v2 is already included.', variant: 'tip' },
      id: 'prerequisites',
      intro: 'Prepare the local workstation before you start the compose stacks.',
      title: 'Confirm the local prerequisites',
    },
    {
      bullets: [
        '**Dashboard URL:** `http://localhost:3000`',
        '**API base URL:** `http://localhost:4000/api/v1`',
        '**Bootstrap admin email:** `admin@llmtrap.local`',
        '**Bootstrap admin password:** `ChangeMe123456!`',
        '**Recommended local node name:** `local-test-node`',
      ],
      callout: { text: 'Copy these values now — you will need them on almost every docs page that follows.', variant: 'info' },
      id: 'shared-values',
      intro: 'These values are reused across the public docs pages and the repo walkthrough.',
      title: 'Keep the shared local values handy',
    },
    {
      bullets: [
        '`/` — the **public landing page** with platform summary and entry links.',
        '`/docs` — the **docs home** and index for the walkthrough pages you are reading now.',
        '`/login` — the **operator sign-in** route that leads into the protected dashboard shell.',
        '`/overview` — the **protected dashboard home** once you are authenticated.',
      ],
      id: 'route-map',
      intro: 'The public and protected routes are intentionally separate so first-time evaluators can orient before logging in.',
      title: 'Use the route map before signing in',
    },
    {
      checklist: [
        'Start with **Deploy dashboard** to bring the local control plane online.',
        'Continue with **Enroll node** to create, approve, and start a honeypot runtime.',
        'Use **Smoke tests** to generate traffic, verify the dashboard, and run the repository-owned smoke scripts.',
      ],
      id: 'next-steps',
      intro: 'Once the prerequisites are in place, the remaining pages line up with the real operating sequence.',
      title: 'Move through the remaining docs pages in order',
    },
  ],
  summary: 'Check the workstation requirements, note the shared credentials and URLs, and then move into the dashboard deployment page.',
  title: 'Prepare the workstation and the local route map',
};
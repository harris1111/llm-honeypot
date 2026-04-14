export type DocsPageId = 'overview' | 'getting-started' | 'deploy-dashboard' | 'enroll-node' | 'how-it-works' | 'configure-node' | 'using-dashboard' | 'smoke-tests';

export type DocsEnvironment = 'windows' | 'macos' | 'linux';

export interface DocsNavigationItem {
  id: DocsPageId;
  summary: string;
  title: string;
  to: string;
}

export interface DocsQuickFact {
  label: string;
  value: string;
}

export interface DocsCodeSample {
  /** Per-environment code variants. If only one key, no env tabs shown. Use 'shared' convention via single key. */
  variants: Partial<Record<DocsEnvironment, string>>;
  language: 'bash' | 'javascript' | 'powershell' | 'text';
  title: string;
}

export interface DocsSection {
  body?: string[];
  bullets?: string[];
  callout?: { icon?: string; text: string; variant?: 'info' | 'tip' | 'warning' };
  checklist?: string[];
  codeSamples?: DocsCodeSample[];
  diagram?: string;
  id: string;
  intro: string;
  title: string;
}

export interface DocsPage {
  eyebrow: string;
  id: DocsPageId;
  quickFacts: DocsQuickFact[];
  relatedPageIds: DocsPageId[];
  sections: DocsSection[];
  summary: string;
  title: string;
}
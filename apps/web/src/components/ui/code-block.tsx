import React, { useState } from 'react';

import type { DocsEnvironment } from '../../content/public-docs';

const envLabels: Record<DocsEnvironment, string> = {
  linux: 'Linux',
  macos: 'macOS',
  windows: 'Windows',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      className={`rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition ${
        copied
          ? 'text-[var(--color-success)]'
          : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-text-secondary)]'
      }`}
      onClick={handleCopy}
      type="button"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

/* ── Syntax highlighting tokens ────────────────────────────── */

/** Well-known CLI commands — colored as "keyword" */
const COMMANDS = new Set([
  'curl', 'docker', 'docker-compose', 'ssh', 'scp', 'git', 'npm', 'npx', 'pnpm',
  'node', 'cat', 'echo', 'open', 'xdg-open', 'start', 'cd', 'ls', 'mkdir', 'rm',
  'chmod', 'cp', 'mv', 'touch', 'grep', 'awk', 'sed', 'tar', 'wget', 'ping',
  'nslookup', 'dig', 'telnet', 'nc', 'openssl', 'kubectl', 'helm',
]);

/** PowerShell cmdlets pattern — Verb-Noun form */
const PS_CMDLET_RE = /^[A-Z][a-z]+-[A-Z][A-Za-z]+$/;

/** Variable patterns: $env:FOO, $variable, ${var} */
const VARIABLE_RE = /^\$[\w{}:]+$/;

const TOKEN_RE = /(\s+|'[^']*'|"[^"]*"|#.*$|\$[\w{}:]+|--?[\w][\w-]*|[|>&;]+|[\w./:@\\=-]+)/gm;

type TokenType = 'default' | 'comment' | 'string' | 'command' | 'flag' | 'variable' | 'operator' | 'prompt';

/** CSS color per token type — uses theme variables for theme-awareness */
const TOKEN_COLORS: Record<TokenType, string> = {
  default: 'inherit',
  comment: 'var(--color-text-tertiary)',
  string: 'var(--color-success)',
  command: 'var(--color-info)',
  flag: 'var(--color-warning)',
  variable: 'var(--color-accent)',
  operator: 'var(--color-text-tertiary)',
  prompt: 'var(--color-accent)',
};

function classifyToken(token: string, isFirstWord: boolean): TokenType {
  // Comments
  if (token.startsWith('#')) return 'comment';

  // Strings
  if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) return 'string';

  // Variables ($env:FOO, $variable)
  if (VARIABLE_RE.test(token)) return 'variable';

  // Flags (--flag, -f)
  if (token.startsWith('--') || (token.startsWith('-') && token.length >= 2 && token.length <= 3 && !token.startsWith('-.'))) return 'flag';

  // Pipe / redirect operators
  if (/^[|>&;]+$/.test(token)) return 'operator';

  // Commands — only highlight the first real word on a line
  if (isFirstWord) {
    // Known CLI commands
    if (COMMANDS.has(token)) return 'command';
    // "compose" after "docker"
    if (token === 'compose') return 'command';
    // PowerShell cmdlets: Invoke-WebRequest, Select-Object, etc.
    if (PS_CMDLET_RE.test(token)) return 'command';
  }

  // Sub-commands right after a known command (e.g. "docker compose up")
  if (COMMANDS.has(token) || PS_CMDLET_RE.test(token)) {
    // Only color if it looks like a sub-command, not an argument
    if (!/[/.\\:@=]/.test(token)) return 'command';
  }

  return 'default';
}

function highlightLine(line: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let isFirstWord = true;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(line)) !== null) {
    // Gap between matches (shouldn't happen often, but safety)
    if (match.index > lastIndex) {
      result.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const isWhitespace = /^\s+$/.test(token);

    if (isWhitespace) {
      result.push(token);
    } else {
      const type = classifyToken(token, isFirstWord);
      const color = TOKEN_COLORS[type];

      if (type === 'comment') {
        // Comment takes rest of line — push and break
        result.push(
          <span key={match.index} style={{ color, opacity: 0.6 }}>{token}</span>,
        );
        isFirstWord = false;
      } else if (color === 'inherit') {
        result.push(token);
      } else {
        result.push(
          <span key={match.index} style={{ color }}>{token}</span>,
        );
      }

      isFirstWord = false;
    }

    lastIndex = TOKEN_RE.lastIndex;
  }

  // Remainder
  if (lastIndex < line.length) {
    result.push(line.slice(lastIndex));
  }

  return result;
}

function formatCode(code: string): React.ReactNode[] {
  return code.split('\n').map((line, i) => {
    const trimmed = line.trimStart();

    // Empty line
    if (trimmed === '') return <span key={i}>{'\n'}</span>;

    // Prompt line: color the $ then highlight the rest
    if (trimmed.startsWith('$ ')) {
      const indent = line.slice(0, line.length - trimmed.length);
      return (
        <span key={i}>
          {indent}<span style={{ color: TOKEN_COLORS.prompt }}>$</span>{' '}{highlightLine(trimmed.slice(2))}{'\n'}
        </span>
      );
    }

    return <span key={i}>{highlightLine(line)}{'\n'}</span>;
  });
}

/* ── Component ─────────────────────────────────────────────── */

interface CodeBlockProps {
  variants: Partial<Record<DocsEnvironment, string>>;
  language?: string;
  title?: string;
}

export function CodeBlock({ variants, title }: CodeBlockProps) {
  const environments = Object.keys(variants) as DocsEnvironment[];
  const showTabs = environments.length > 1;
  const [active, setActive] = useState(environments[0]);
  const code = variants[active] ?? '';

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-code-border)] bg-[var(--color-code-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-code-border)] bg-[var(--color-code-tab-bg)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          {title ? (
            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{title}</span>
          ) : null}
          {showTabs
            ? environments.map((env) => (
                <button
                  className={`rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition ${
                    active === env
                      ? 'bg-[var(--color-code-tab-active-bg)] text-[var(--color-code-tab-active-text)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--color-code-tab-text)] hover:text-[var(--color-text-secondary)]'
                  }`}
                  key={env}
                  onClick={() => setActive(env)}
                  type="button"
                >
                  {envLabels[env]}
                </button>
              ))
            : null}
        </div>
        <CopyButton text={code} />
      </div>
      {/* Code */}
      <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-[var(--color-code-text)]">
        <code>{formatCode(code)}</code>
      </pre>
    </div>
  );
}

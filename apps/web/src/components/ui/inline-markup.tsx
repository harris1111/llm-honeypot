import type { ReactNode } from 'react';

/**
 * Renders a plain string with lightweight inline markup:
 *   **bold**  →  <strong>
 *   `code`   →  <code>
 *   {{var}}  →  <code> (template variable highlight)
 *
 * Only handles inline patterns — no block-level markdown.
 */
export function InlineMarkup({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  // Matches **bold**, `code`, or {{var}}
  const pattern = /(\*\*(.+?)\*\*|`([^`]+)`|\{\{([^}]+)\}\})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Push the plain text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      parts.push(
        <strong key={match.index} className="font-semibold text-[var(--color-text-primary)]">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      // `code`
      parts.push(
        <code key={match.index} className="rounded bg-[var(--color-bg-inset)] px-1.5 py-0.5 text-[13px] font-mono text-[var(--color-accent)]">
          {match[3]}
        </code>,
      );
    } else if (match[4] !== undefined) {
      // {{var}}
      parts.push(
        <code key={match.index} className="rounded bg-[var(--color-bg-inset)] px-1.5 py-0.5 text-[13px] font-mono text-[var(--color-accent)]">
          {`{{${match[4]}}}`}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

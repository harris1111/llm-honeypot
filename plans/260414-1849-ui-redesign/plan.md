---
title: "LLMTrap Full UI Redesign"
description: "Rebuild web app with CSS-var theme system (light/dark/hacker), per-block env tabs, clean docs/dashboard UI"
status: pending
priority: P1
effort: 10h
branch: feat/web/ui-redesign
tags: [web, ui, theme, redesign]
created: 2026-04-14
---

# LLMTrap UI Redesign

**Design spec:** `plans/reports/ui-ux-designer-260414-1854-llmtrap-design-system.md`

**Core change:** Replace hardcoded hacker-only theme with `data-theme` CSS custom property system. All components switch from inline hex/green classes to semantic token classes. Per-block env tabs replace global selector.

---

## Phase 1 -- Theme Foundation

> **No other phase depends on this being merged first, but all phases MUST use token classes not hardcoded colors.**

| Status | File | Key Changes |
|--------|------|-------------|
| [ ] | `index.html` | Add Inter font import; add FOUC-prevention `<script>` that reads `llmtrap-theme` from localStorage and sets `data-theme` on `<html>` before paint |
| [ ] | `styles.css` | **Full rewrite.** Replace `--hk-*` vars with 3 theme blocks (`[data-theme="light"]`, `[data-theme="dark"]`, `[data-theme="hacker"]`). Define all tokens from spec Sec 1+2+3: bg, border, text, accent, semantic, code, sidebar, input, shadow, radius, font stacks, typography scale. Keep existing `@utility` declarations but rebind to tokens. Add `@theme inline` block mapping CSS vars to Tailwind names (TW v4.1 pattern -- no tailwind.config.js) |
| [ ] | `lib/theme-store.ts` **(NEW)** | Zustand + persist middleware. Stores `'light'|'dark'|'hacker'`. `setTheme()` calls `document.documentElement.setAttribute('data-theme', theme)`. `onRehydrateStorage` applies saved theme |
| [ ] | `components/ui/theme-toggle.tsx` **(NEW)** | 3-segment toggle (Sun/Moon/Terminal icons via inline SVG). Reads/writes `useThemeStore`. Renders as a horizontal pill with active segment highlighted |

**Failure modes:** FOUC if script is missing or localStorage key mismatches Zustand persist key. Mitigate: script hardcodes same key `llmtrap-theme`. TW v4.1 `@theme inline` block syntax error breaks all styles -- validate with `pnpm build` immediately.

---

## Phase 2 -- Shared UI Components

> Depends on Phase 1 tokens existing in `styles.css`. Can run in parallel with Phases 3-5 if tokens are defined.

| Status | File | Key Changes |
|--------|------|-------------|
| [ ] | `content/public-docs/docs-page-types.ts` | Replace `DocsCodeSample.code: string` + `environment?: DocsEnvironment` with `variants: Partial<Record<DocsEnvironment, string>>` and optional `sharedCode?: string`. Remove single `code` field |
| [ ] | `content/public-docs/docs-*-page.ts` (4 files) | Migrate all `codeSamples` arrays to use `variants` shape. Group same-title samples by env into one object |
| [ ] | `content/public-docs/index.ts` | No structural change; re-export types |
| [ ] | `components/ui/code-block.tsx` **(NEW)** | Per-block env tabs component per spec Sec 4.2. Props: `variants`, `language`, `title?`. If only 1 env key, no tabs shown. Internal `useState` for active tab. Copy button built-in. Uses token classes: `bg-[var(--color-code-bg)]`, `border-[var(--color-code-border)]`, etc. |

**Failure modes:** Breaking change to `DocsCodeSample` type -- every consumer must be updated atomically. Mitigate: update all 4 page files + `public-docs-page-sections.tsx` in same phase.

---

## Phase 3 -- Layout Components

> Parallel with Phase 4 and 5. Touches only `components/layout/*` and `components/public/public-header.tsx`, `public-footer.tsx`.

| Status | File | Key Changes |
|--------|------|-------------|
| [ ] | `components/layout/sidebar.tsx` | Replace all `green-500/*` / `#0d1117` classes with token classes (`bg-[var(--color-sidebar-bg)]`, `text-[var(--color-accent)]`, etc.). Add `data-theme="hacker"` conditional for `//` prefix style. Add ThemeToggle at bottom |
| [ ] | `components/layout/topbar.tsx` | Replace terminal-prompt UI with clean breadcrumb layout. Use `text-[var(--color-text-primary)]` etc. Add ThemeToggle in top-right area |
| [ ] | `components/layout/page-container.tsx` | Replace `border-green-500/20` with `border-[var(--color-border-default)]`, `bg-[#0d1117]` with `bg-[var(--color-bg-surface)]` |
| [ ] | `components/layout/dashboard-frame.tsx` | Replace `bg-[#0a0a0a]` with `bg-[var(--color-bg-base)]`, `text-gray-300` with `text-[var(--color-text-primary)]` |
| [ ] | `components/public/public-header.tsx` | Replace hacker chrome (green glow, `$` prefix, `./docs` label) with clean nav using token classes. Keep same Link targets |
| [ ] | `components/public/public-footer.tsx` | Replace hardcoded dark classes with token classes |
| [ ] | `router.tsx` | Update `PublicFrame` bg/text from `bg-[#0a0a0a] text-gray-300` to `bg-[var(--color-bg-base)] text-[var(--color-text-primary)]`. Update `RoutePendingState` similarly |

**Failure modes:** Sidebar/topbar touched in Phase 3 while dashboard routes in Phase 5 -- no file overlap. Router change is minimal (2 lines).

---

## Phase 4 -- Public Pages

> Parallel with Phase 3 and 5. Consumes CodeBlock from Phase 2.

| Status | File | Key Changes |
|--------|------|-------------|
| [ ] | `components/public/public-docs-layout.tsx` | **Remove** global environment selector from page header. Remove `environment` state + localStorage logic (env now per-block). Remove `docsEnvironmentOptions`, `detectPreferredEnvironment`. Pass-through to sections without env prop. Convert all hardcoded classes to token classes |
| [ ] | `components/public/public-docs-page-sections.tsx` | **Remove** `environment` prop and `getVisibleCodeSamples`. Replace inline code rendering with `<CodeBlock>` component using `variants` from data. Remove local `CopyButton` (now in CodeBlock). Convert all hardcoded classes to token classes |
| [ ] | `components/public/features-section.tsx` | Replace green glow/border classes with token classes |
| [ ] | `components/public/repository-surface-grid.tsx` | Replace hardcoded colors with token classes |
| [ ] | `routes/landing.tsx` | Replace all hacker-specific classes with token classes |
| [ ] | `components/auth/login-form.tsx` | Replace green theme with token classes; use `bg-[var(--color-input-bg)]`, accent for submit button |
| [ ] | `routes/login.tsx` | Replace backdrop/container colors with token classes |
| [ ] | `routes/docs-*.tsx` (4 files) + `routes/repository-docs.tsx` | Remove `environment` prop passed to `PublicDocsLayout` (no longer needed). Minimal changes |

**Failure modes:** Removing global env selector is a behavior change -- must verify per-block tabs cover all use cases. Data migration in Phase 2 ensures `variants` field exists before Phase 4 consumes it.

---

## Phase 5 -- Dashboard Pages

> Parallel with Phase 3 layout + Phase 4. Touches only `routes/*` (dashboard) and `components/nodes/*`.

| Status | File | Key Changes |
|--------|------|-------------|
| [ ] | `components/nodes/node-card.tsx` | Replace green/hex classes with token classes. Use card pattern from spec Sec 4.3 |
| [ ] | `components/nodes/node-status-badge.tsx` | Use semantic token colors (success/warning/error) instead of hardcoded green/amber/red |
| [ ] | `components/nodes/node-config-form.tsx` | Replace input styling with token input classes |
| [ ] | `routes/overview.tsx` | Replace all hardcoded bg/border/text colors with tokens |
| [ ] | `routes/nodes.tsx` | Same token migration |
| [ ] | `routes/node-detail.tsx` | Same token migration |
| [ ] | `routes/sessions.tsx` | Same token migration |
| [ ] | `routes/actors.tsx` | Same token migration |
| [ ] | `routes/personas.tsx` | Same token migration |
| [ ] | `routes/response-engine.tsx` | Same token migration |
| [ ] | `routes/alerts.tsx` | Same token migration |
| [ ] | `routes/threat-intel.tsx` | Same token migration |
| [ ] | `routes/live-feed.tsx` | Same token migration |
| [ ] | `routes/export.tsx` | Same token migration |
| [ ] | `routes/settings.tsx` | Same token migration; add ThemeToggle as a settings option |

**Failure modes:** 15 files -- largest phase. All follow same mechanical pattern (search-replace per spec Sec 9.1). No inter-file dependencies. Can be parallelized across multiple agents by splitting node-components vs routes.

---

## Phase 6 -- Validation

| Status | Check | Command |
|--------|-------|---------|
| [ ] | TypeScript | `pnpm --filter web exec tsc --noEmit` |
| [ ] | Lint | `pnpm --filter web lint` |
| [ ] | Build | `pnpm --filter web build` |
| [ ] | Manual | Toggle all 3 themes on landing, docs, login, dashboard. Verify no hardcoded green/hex remnants |
| [ ] | Grep audit | `rg "#0a0a0a\|#0d1117\|#111820\|green-500\|green-400\|green-300\|green-600\|hk-" apps/web/src/` should return 0 matches outside `styles.css` |

---

## Dependency Graph

```
Phase 1 (foundation) ─┬─> Phase 2 (shared UI) ──> Phase 4 (public pages)
                       ├─> Phase 3 (layout)
                       └─> Phase 5 (dashboard pages)
                       All ──> Phase 6 (validation)
```

Phases 3, 4 (after 2), and 5 are parallelizable. Phase 4 depends on Phase 2 for CodeBlock + data shape.

## Rollback

Each phase is a separate commit on `feat/web/ui-redesign`. Revert any phase independently via `git revert`. Phase 1 revert requires reverting all downstream phases.

## Search-Replace Reference (from spec Sec 9.1)

| Hardcoded | Token |
|-----------|-------|
| `bg-[#0a0a0a]` | `bg-[var(--color-bg-base)]` |
| `bg-[#0d1117]` | `bg-[var(--color-bg-surface)]` |
| `bg-[#111820]` | `bg-[var(--color-bg-raised)]` |
| `border-green-500/15` | `border-[var(--color-border-default)]` |
| `border-green-500/20` | `border-[var(--color-border-default)]` |
| `border-green-500/40` | `border-[var(--color-border-strong)]` |
| `text-gray-100..300` | `text-[var(--color-text-primary)]` |
| `text-gray-400..500` | `text-[var(--color-text-secondary)]` |
| `text-gray-600` | `text-[var(--color-text-tertiary)]` |
| `text-green-300..500` | `text-[var(--color-accent)]` |
| `bg-green-500/10` | `bg-[var(--color-accent-muted)]` |
| `text-cyan-500` | `text-[var(--color-info)]` |
| `text-red-400` | `text-[var(--color-error)]` |
| `bg-red-500/5` | `bg-[var(--color-error-bg)]` |
| `border-red-500/30` | `border-[var(--color-error-border)]` |

# LLMTrap Design System

Complete UI/UX system for all three themes (Light, Dark, Hacker) with CSS custom properties and Tailwind mappings.

---

## 1. Color System

### Architecture

All colors defined as CSS custom properties on `[data-theme]` selectors. Tailwind references these via `theme.extend.colors`. The Light theme is default; Dark and Hacker are toggled by setting `data-theme="dark"` or `data-theme="hacker"` on `<html>`.

### 1.1 Light Theme (Default)

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  /* Backgrounds */
  --color-bg-base: #ffffff;
  --color-bg-surface: #f9fafb;
  --color-bg-raised: #f3f4f6;
  --color-bg-sunken: #f0f1f3;
  --color-bg-overlay: rgba(255, 255, 255, 0.95);

  /* Borders */
  --color-border-default: #e5e7eb;
  --color-border-muted: #f0f1f3;
  --color-border-strong: #d1d5db;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #9ca3af;
  --color-text-inverse: #ffffff;

  /* Accent (Indigo - professional, not "hacky") */
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-accent-muted: rgba(79, 70, 229, 0.08);
  --color-accent-subtle: rgba(79, 70, 229, 0.12);

  /* Brand */
  --color-brand: #4f46e5;
  --color-brand-text: #ffffff;

  /* Semantic */
  --color-success: #059669;
  --color-success-bg: rgba(5, 150, 105, 0.08);
  --color-success-border: rgba(5, 150, 105, 0.2);
  --color-warning: #d97706;
  --color-warning-bg: rgba(217, 119, 6, 0.08);
  --color-warning-border: rgba(217, 119, 6, 0.2);
  --color-error: #dc2626;
  --color-error-bg: rgba(220, 38, 38, 0.08);
  --color-error-border: rgba(220, 38, 38, 0.2);
  --color-info: #2563eb;
  --color-info-bg: rgba(37, 99, 235, 0.08);
  --color-info-border: rgba(37, 99, 235, 0.2);

  /* Code blocks */
  --color-code-bg: #f8f9fb;
  --color-code-border: #e5e7eb;
  --color-code-text: #1e293b;
  --color-code-tab-bg: #f3f4f6;
  --color-code-tab-active-bg: #ffffff;
  --color-code-tab-text: #6b7280;
  --color-code-tab-active-text: #111827;

  /* Sidebar */
  --color-sidebar-bg: #f9fafb;
  --color-sidebar-border: #e5e7eb;
  --color-sidebar-item-hover: rgba(79, 70, 229, 0.06);
  --color-sidebar-item-active-bg: rgba(79, 70, 229, 0.08);
  --color-sidebar-item-active-text: var(--color-accent);
  --color-sidebar-item-active-border: var(--color-accent);

  /* Interactive */
  --color-focus-ring: rgba(79, 70, 229, 0.4);
  --color-input-bg: #ffffff;
  --color-input-border: #d1d5db;
  --color-input-border-focus: var(--color-accent);

  /* Shadows (used by --shadow-* tokens) */
  --shadow-color: 220 3% 15%;
}
```

### 1.2 Dark Theme

```css
[data-theme="dark"] {
  color-scheme: dark;

  /* Backgrounds */
  --color-bg-base: #0f1117;
  --color-bg-surface: #161b22;
  --color-bg-raised: #1c2128;
  --color-bg-sunken: #0d0f14;
  --color-bg-overlay: rgba(22, 27, 34, 0.95);

  /* Borders */
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-border-strong: #484f58;

  /* Text */
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-tertiary: #6e7681;
  --color-text-inverse: #0f1117;

  /* Accent (Soft indigo for dark) */
  --color-accent: #818cf8;
  --color-accent-hover: #a5b4fc;
  --color-accent-muted: rgba(129, 140, 248, 0.1);
  --color-accent-subtle: rgba(129, 140, 248, 0.15);

  /* Brand */
  --color-brand: #818cf8;
  --color-brand-text: #0f1117;

  /* Semantic */
  --color-success: #34d399;
  --color-success-bg: rgba(52, 211, 153, 0.1);
  --color-success-border: rgba(52, 211, 153, 0.25);
  --color-warning: #fbbf24;
  --color-warning-bg: rgba(251, 191, 36, 0.1);
  --color-warning-border: rgba(251, 191, 36, 0.25);
  --color-error: #f87171;
  --color-error-bg: rgba(248, 113, 113, 0.1);
  --color-error-border: rgba(248, 113, 113, 0.25);
  --color-info: #60a5fa;
  --color-info-bg: rgba(96, 165, 250, 0.1);
  --color-info-border: rgba(96, 165, 250, 0.25);

  /* Code blocks */
  --color-code-bg: #0d1117;
  --color-code-border: #30363d;
  --color-code-text: #c9d1d9;
  --color-code-tab-bg: #161b22;
  --color-code-tab-active-bg: #0d1117;
  --color-code-tab-text: #6e7681;
  --color-code-tab-active-text: #e6edf3;

  /* Sidebar */
  --color-sidebar-bg: #0d1117;
  --color-sidebar-border: #21262d;
  --color-sidebar-item-hover: rgba(129, 140, 248, 0.08);
  --color-sidebar-item-active-bg: rgba(129, 140, 248, 0.12);
  --color-sidebar-item-active-text: var(--color-accent);
  --color-sidebar-item-active-border: var(--color-accent);

  /* Interactive */
  --color-focus-ring: rgba(129, 140, 248, 0.5);
  --color-input-bg: #0d1117;
  --color-input-border: #30363d;
  --color-input-border-focus: var(--color-accent);

  /* Shadows */
  --shadow-color: 220 40% 2%;
}
```

### 1.3 Hacker Theme

```css
[data-theme="hacker"] {
  color-scheme: dark;

  /* Backgrounds */
  --color-bg-base: #0a0a0a;
  --color-bg-surface: #0d1117;
  --color-bg-raised: #111820;
  --color-bg-sunken: #060808;
  --color-bg-overlay: rgba(13, 17, 23, 0.97);

  /* Borders */
  --color-border-default: rgba(34, 197, 94, 0.15);
  --color-border-muted: rgba(34, 197, 94, 0.08);
  --color-border-strong: rgba(34, 197, 94, 0.3);

  /* Text */
  --color-text-primary: #c9d1d9;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #4b5563;
  --color-text-inverse: #0a0a0a;

  /* Accent (Green - terminal aesthetic) */
  --color-accent: #22c55e;
  --color-accent-hover: #4ade80;
  --color-accent-muted: rgba(34, 197, 94, 0.1);
  --color-accent-subtle: rgba(34, 197, 94, 0.15);

  /* Brand */
  --color-brand: #22c55e;
  --color-brand-text: #0a0a0a;

  /* Semantic */
  --color-success: #22c55e;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-success-border: rgba(34, 197, 94, 0.3);
  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  --color-warning-border: rgba(245, 158, 11, 0.3);
  --color-error: #ef4444;
  --color-error-bg: rgba(239, 68, 68, 0.1);
  --color-error-border: rgba(239, 68, 68, 0.3);
  --color-info: #06b6d4;
  --color-info-bg: rgba(6, 182, 212, 0.1);
  --color-info-border: rgba(6, 182, 212, 0.3);

  /* Code blocks */
  --color-code-bg: #0a0a0a;
  --color-code-border: rgba(34, 197, 94, 0.15);
  --color-code-text: #4ade80;
  --color-code-tab-bg: #0d1117;
  --color-code-tab-active-bg: #0a0a0a;
  --color-code-tab-text: #4b5563;
  --color-code-tab-active-text: #22c55e;

  /* Sidebar */
  --color-sidebar-bg: #0d1117;
  --color-sidebar-border: rgba(34, 197, 94, 0.15);
  --color-sidebar-item-hover: rgba(34, 197, 94, 0.06);
  --color-sidebar-item-active-bg: rgba(34, 197, 94, 0.1);
  --color-sidebar-item-active-text: #22c55e;
  --color-sidebar-item-active-border: #22c55e;

  /* Interactive */
  --color-focus-ring: rgba(34, 197, 94, 0.4);
  --color-input-bg: #0a0a0a;
  --color-input-border: rgba(34, 197, 94, 0.15);
  --color-input-border-focus: #22c55e;

  /* Shadows (minimal in hacker - prefer glow) */
  --shadow-color: 140 80% 2%;

  /* Hacker-specific: glow effects */
  --hacker-glow-sm: 0 0 10px rgba(34, 197, 94, 0.15);
  --hacker-glow-md: 0 0 20px rgba(34, 197, 94, 0.15), inset 0 0 20px rgba(34, 197, 94, 0.05);
  --hacker-glow-lg: 0 0 30px rgba(34, 197, 94, 0.25), 0 0 60px rgba(34, 197, 94, 0.1);
  --hacker-text-glow: 0 0 10px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.2);
  --hacker-scanline: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 197, 94, 0.015) 2px,
    rgba(34, 197, 94, 0.015) 4px
  );
}
```

### 1.4 Tailwind Color Mapping

```ts
// tailwind.config.ts (partial)
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          raised: 'var(--color-bg-raised)',
          sunken: 'var(--color-bg-sunken)',
          overlay: 'var(--color-bg-overlay)',
        },
        border: {
          DEFAULT: 'var(--color-border-default)',
          muted: 'var(--color-border-muted)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          muted: 'var(--color-accent-muted)',
          subtle: 'var(--color-accent-subtle)',
        },
        brand: {
          DEFAULT: 'var(--color-brand)',
          text: 'var(--color-brand-text)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
        code: {
          bg: 'var(--color-code-bg)',
          border: 'var(--color-code-border)',
          text: 'var(--color-code-text)',
          'tab-bg': 'var(--color-code-tab-bg)',
          'tab-active-bg': 'var(--color-code-tab-active-bg)',
          'tab-text': 'var(--color-code-tab-text)',
          'tab-active-text': 'var(--color-code-tab-active-text)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          border: 'var(--color-sidebar-border)',
          'item-hover': 'var(--color-sidebar-item-hover)',
          'item-active-bg': 'var(--color-sidebar-item-active-bg)',
          'item-active-text': 'var(--color-sidebar-item-active-text)',
          'item-active-border': 'var(--color-sidebar-item-active-border)',
        },
        input: {
          bg: 'var(--color-input-bg)',
          border: 'var(--color-input-border)',
          'border-focus': 'var(--color-input-border-focus)',
        },
      },
    },
  },
};
```

---

## 2. Typography System

### 2.1 Font Stack

```css
:root {
  /* Display + Headings: Inter - clean, professional, excellent readability */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;

  /* Code: JetBrains Mono - best ligatures, clear at small sizes */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
    ui-monospace, SFMono-Regular, Consolas, monospace;
}

/* Hacker theme overrides body to monospace */
[data-theme="hacker"] {
  --font-sans: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
    ui-monospace, SFMono-Regular, Consolas, monospace;
}
```

**Rationale:**
- **Inter** -- industry standard for documentation/dashboard UIs. Supports Vietnamese. Excellent x-height, open counters, tabular figures. Used by Vercel, Linear, GitHub docs.
- **JetBrains Mono** -- best-in-class code font. Distinct `0O`, `1lI`. Already in codebase.
- Hacker theme uses monospace everywhere for that terminal feel.

### 2.2 Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

### 2.3 Type Scale

Based on a 1.250 (major third) scale from 16px base. All sizes in `rem`.

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `--text-display` | 2.25rem (36px) | 700 | 1.2 | -0.025em | Hero titles, landing page |
| `--text-h1` | 1.875rem (30px) | 700 | 1.25 | -0.02em | Page titles |
| `--text-h2` | 1.5rem (24px) | 600 | 1.3 | -0.015em | Section headings |
| `--text-h3` | 1.25rem (20px) | 600 | 1.35 | -0.01em | Card titles, sub-sections |
| `--text-h4` | 1.125rem (18px) | 600 | 1.4 | -0.005em | Sidebar group labels |
| `--text-h5` | 1rem (16px) | 600 | 1.4 | 0 | Smaller headings |
| `--text-h6` | 0.875rem (14px) | 600 | 1.4 | 0.01em | Overlines, eyebrows |
| `--text-body` | 1rem (16px) | 400 | 1.625 | 0 | Default body text |
| `--text-body-sm` | 0.875rem (14px) | 400 | 1.6 | 0 | Secondary body, sidebar items |
| `--text-small` | 0.8125rem (13px) | 400 | 1.5 | 0 | Metadata, timestamps |
| `--text-caption` | 0.75rem (12px) | 500 | 1.4 | 0.02em | Labels, badges |
| `--text-overline` | 0.6875rem (11px) | 600 | 1.3 | 0.08em | Uppercase labels |
| `--text-code` | 0.875rem (14px) | 400 | 1.7 | 0 | Inline + block code |

### 2.4 CSS Custom Properties for Typography

```css
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-snug: 1.35;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 1.75;
}
```

### 2.5 Tailwind Font Mapping

```ts
// tailwind.config.ts (partial)
fontFamily: {
  sans: ['var(--font-sans)'],
  mono: ['var(--font-mono)'],
},
```

---

## 3. Component Design Tokens

### 3.1 Border Radius Scale

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px - badges, small chips */
  --radius-md: 0.375rem;   /* 6px - buttons, inputs */
  --radius-lg: 0.5rem;     /* 8px - cards, modals */
  --radius-xl: 0.75rem;    /* 12px - large panels */
  --radius-2xl: 1rem;      /* 16px - hero sections */
  --radius-full: 9999px;   /* pills, avatars */
}

/* Hacker theme uses sharp edges */
[data-theme="hacker"] {
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
  --radius-2xl: 0;
  --radius-full: 0;
}
```

**Design rationale:** Light/Dark use soft rounded corners (modern, friendly). Hacker uses 0 radius everywhere for that rigid terminal aesthetic.

### 3.2 Shadow Scale

```css
:root {
  --shadow-xs: 0 1px 2px 0 hsl(var(--shadow-color) / 0.05);
  --shadow-sm: 0 1px 3px 0 hsl(var(--shadow-color) / 0.1),
               0 1px 2px -1px hsl(var(--shadow-color) / 0.1);
  --shadow-md: 0 4px 6px -1px hsl(var(--shadow-color) / 0.1),
               0 2px 4px -2px hsl(var(--shadow-color) / 0.1);
  --shadow-lg: 0 10px 15px -3px hsl(var(--shadow-color) / 0.1),
               0 4px 6px -4px hsl(var(--shadow-color) / 0.1);
  --shadow-xl: 0 20px 25px -5px hsl(var(--shadow-color) / 0.1),
               0 8px 10px -6px hsl(var(--shadow-color) / 0.1);
}

/* Hacker theme replaces shadows with glow */
[data-theme="hacker"] {
  --shadow-xs: var(--hacker-glow-sm);
  --shadow-sm: var(--hacker-glow-sm);
  --shadow-md: var(--hacker-glow-md);
  --shadow-lg: var(--hacker-glow-md);
  --shadow-xl: var(--hacker-glow-lg);
}
```

### 3.3 Spacing Scale

Uses Tailwind's default 4px base. No custom overrides needed. Reference scale:

| Token | Value | Usage |
|---|---|---|
| `0.5` | 2px | Tight internal gaps |
| `1` | 4px | Icon-text gap |
| `1.5` | 6px | Badge padding |
| `2` | 8px | Input padding-y, list item gap |
| `3` | 12px | Card internal padding-y |
| `4` | 16px | Section gaps, card padding-x |
| `5` | 20px | Content section padding |
| `6` | 24px | Large section padding |
| `8` | 32px | Section spacing |
| `10` | 40px | Major section breaks |
| `12` | 48px | Page-level vertical spacing |
| `16` | 64px | Hero section padding |

### 3.4 Transition Timings

```css
:root {
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
  --transition-slow: 250ms ease;
  --transition-slower: 350ms ease;
}
```

| Token | Duration | Usage |
|---|---|---|
| `--transition-fast` | 100ms | Hover color changes, opacity |
| `--transition-base` | 150ms | Button states, input focus |
| `--transition-slow` | 250ms | Sidebar expand/collapse, dropdown |
| `--transition-slower` | 350ms | Modal open/close, page transitions |

### 3.5 Tailwind Token Mapping

```ts
// tailwind.config.ts (partial)
borderRadius: {
  none: 'var(--radius-none)',
  sm: 'var(--radius-sm)',
  DEFAULT: 'var(--radius-md)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  full: 'var(--radius-full)',
},
boxShadow: {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  DEFAULT: 'var(--shadow-md)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
},
transitionDuration: {
  fast: '100ms',
  base: '150ms',
  slow: '250ms',
  slower: '350ms',
},
```

---

## 4. Key Component Specs

### 4.1 Sidebar Navigation (Docs + Dashboard)

**Structure:** Sticky, scroll-independent sidebar. `position: sticky; top: 0; max-height: 100vh; overflow-y: auto;`

#### Docs Sidebar

```
+----------------------------------+
| LLMTRAP (logo)                   |
| AI Honeypot Platform             |
+----------------------------------+
| GETTING STARTED            label |
|   Overview              active > |
|   Getting Started               |
+----------------------------------+
| DEPLOYMENT                 label |
|   Deploy Dashboard              |
|   Enroll Node                   |
|   Smoke Tests                   |
+----------------------------------+
```

**Tailwind classes:**

```tsx
// Container
<aside className="sticky top-0 hidden h-screen w-[var(--sidebar-docs-width)]
  overflow-y-auto border-r border-[var(--color-sidebar-border)]
  bg-[var(--color-sidebar-bg)] lg:block">

// Section label
<p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider
  text-[var(--color-text-tertiary)]">

// Nav item (inactive)
<a className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2
  text-sm text-[var(--color-text-secondary)] transition-[var(--transition-fast)]
  hover:bg-[var(--color-sidebar-item-hover)] hover:text-[var(--color-text-primary)]">

// Nav item (active)
<a className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2
  text-sm font-medium border-l-2 border-[var(--color-sidebar-item-active-border)]
  bg-[var(--color-sidebar-item-active-bg)]
  text-[var(--color-sidebar-item-active-text)]">
```

#### Dashboard Sidebar

Same structure as docs but adds:
- Icon before each nav label (Lucide icons)
- Collapsible on mobile (slide-over)
- Active item left border indicator (2px accent)
- Section dividers between nav groups
- Bottom section: user avatar, settings link, theme toggle

### 4.2 Code Block with Per-Block Environment Tabs

**Key change from current:** Environment tabs are PER code block, not a global page-level selector.

```
+-----------------------------------------------+
| [Windows] [macOS] [Linux]      [Copy]         |
+-----------------------------------------------+
| $ docker compose -f docker/                   |
|     docker-compose.dashboard.yml up -d        |
|                                               |
+-----------------------------------------------+
```

**Implementation:**

```tsx
interface CodeBlockProps {
  /** Map of environment -> code string. If only one key, no tabs shown. */
  variants: Partial<Record<DocsEnvironment, string>>;
  language: string;
  title?: string;
}

function CodeBlock({ variants, language, title }: CodeBlockProps) {
  const environments = Object.keys(variants) as DocsEnvironment[];
  const showTabs = environments.length > 1;
  const [active, setActive] = useState(environments[0]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)]
      border border-[var(--color-code-border)]
      bg-[var(--color-code-bg)]">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b
        border-[var(--color-code-border)]
        bg-[var(--color-code-tab-bg)] px-1 py-1">
        <div className="flex items-center gap-0.5">
          {title && (
            <span className="px-3 text-xs font-medium
              text-[var(--color-text-tertiary)]">
              {title}
            </span>
          )}
          {showTabs && environments.map((env) => (
            <button
              key={env}
              onClick={() => setActive(env)}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition",
                active === env
                  ? "bg-[var(--color-code-tab-active-bg)] text-[var(--color-code-tab-active-text)] shadow-xs"
                  : "text-[var(--color-code-tab-text)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {env === 'macos' ? 'macOS' : env === 'windows' ? 'Windows' : 'Linux'}
            </button>
          ))}
        </div>
        <CopyButton text={variants[active]!} />
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-[var(--text-code)]
        font-mono leading-relaxed text-[var(--color-code-text)]">
        <code>{variants[active]}</code>
      </pre>
    </div>
  );
}
```

**Visual states:**
- Active tab: elevated bg, darker text, subtle shadow
- Inactive tab: transparent bg, muted text
- Hover: text brightens
- Copy button: ghost style, shows "Copied!" for 2s after click
- In hacker theme: no border-radius, green tinted text, glow on active tab

### 4.3 Card Component

Three variants: **Default**, **Interactive** (hover effect), **Highlighted** (accent border).

```
+-------------------------------------------+
| [Optional eyebrow]                        |
|                                           |
|  Card Title                               |
|  Description text goes here for the       |
|  card content area.                       |
|                                           |
|  [Optional footer / actions]              |
+-------------------------------------------+
```

**CSS:**

```tsx
// Base card
<div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)]
  bg-[var(--color-bg-surface)] p-5">

// Interactive card (link / button)
<div className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)]
  bg-[var(--color-bg-surface)] p-5 transition
  hover:border-[var(--color-border-strong)] hover:shadow-sm
  cursor-pointer">

// Highlighted card
<div className="rounded-[var(--radius-lg)] border-l-2
  border border-[var(--color-border-default)]
  border-l-[var(--color-accent)] bg-[var(--color-bg-surface)] p-5">
```

### 4.4 Button Variants

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** | `accent` | `inverse` | none | Main CTAs |
| **Secondary** | `transparent` | `accent` | `accent` | Secondary actions |
| **Ghost** | `transparent` | `secondary` | none | Tertiary actions, nav |
| **Danger** | `error-bg` | `error` | `error-border` | Destructive actions |
| **Success** | `success-bg` | `success` | `success-border` | Confirm actions |

**Sizes:**

| Size | Height | Padding | Font Size |
|---|---|---|---|
| `sm` | 32px | `px-3 py-1.5` | 13px |
| `md` (default) | 36px | `px-4 py-2` | 14px |
| `lg` | 40px | `px-5 py-2.5` | 14px |

**Implementation pattern:**

```tsx
// Primary button
<button className="inline-flex items-center justify-center gap-2
  rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2
  text-sm font-medium text-[var(--color-text-inverse)]
  transition-[var(--transition-base)]
  hover:bg-[var(--color-accent-hover)]
  focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-[var(--color-focus-ring)]
  disabled:pointer-events-none disabled:opacity-50">

// Secondary button
<button className="inline-flex items-center justify-center gap-2
  rounded-[var(--radius-md)] border border-[var(--color-accent)]
  bg-transparent px-4 py-2
  text-sm font-medium text-[var(--color-accent)]
  transition-[var(--transition-base)]
  hover:bg-[var(--color-accent-muted)]
  focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-[var(--color-focus-ring)]
  disabled:pointer-events-none disabled:opacity-50">

// Ghost button
<button className="inline-flex items-center justify-center gap-2
  rounded-[var(--radius-md)] bg-transparent px-4 py-2
  text-sm text-[var(--color-text-secondary)]
  transition-[var(--transition-base)]
  hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-text-primary)]
  focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-[var(--color-focus-ring)]
  disabled:pointer-events-none disabled:opacity-50">
```

### 4.5 Input Fields

```
+-------------------------------------------+
| Label                                     |
| +---------------------------------------+ |
| | Placeholder text                      | |
| +---------------------------------------+ |
| Helper text or error message              |
+-------------------------------------------+
```

```tsx
// Label
<label className="block text-sm font-medium text-[var(--color-text-primary)]">

// Input
<input className="w-full rounded-[var(--radius-md)]
  border border-[var(--color-input-border)]
  bg-[var(--color-input-bg)] px-3 py-2
  text-sm text-[var(--color-text-primary)]
  placeholder:text-[var(--color-text-tertiary)]
  transition-[var(--transition-base)]
  focus:border-[var(--color-input-border-focus)]
  focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]
  disabled:opacity-50 disabled:cursor-not-allowed" />

// Helper text
<p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">

// Error text
<p className="mt-1.5 text-xs text-[var(--color-error)]">
```

**States:**
- Default: muted border
- Focus: accent border + ring
- Error: error border + error helper text
- Disabled: 50% opacity, not-allowed cursor

### 4.6 Status Badges

Five variants mapped to semantic colors:

| Status | BG | Text | Border | Dot color |
|---|---|---|---|---|
| **Online** | `success-bg` | `success` | `success-border` | `success` (pulsing) |
| **Offline** | `warning-bg` | `warning` | `warning-border` | `warning` |
| **Error** | `error-bg` | `error` | `error-border` | `error` |
| **Pending** | `info-bg` | `info` | `info-border` | `info` |
| **Disabled** | `bg-raised` | `text-tertiary` | `border-default` | `text-tertiary` |

```tsx
<span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)]
  border px-2.5 py-0.5 text-xs font-medium">
  <span className="h-1.5 w-1.5 rounded-full bg-current" />
  {label}
</span>
```

The Online badge dot gets a pulse animation:
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.badge-online .dot { animation: pulse-dot 2s ease-in-out infinite; }
```

### 4.7 Breadcrumbs

```
Home / Docs / Deploy Dashboard
```

```tsx
<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
  <a className="text-[var(--color-text-tertiary)]
    hover:text-[var(--color-text-primary)] transition">Home</a>
  <span className="text-[var(--color-text-tertiary)]">/</span>
  <a className="text-[var(--color-text-tertiary)]
    hover:text-[var(--color-text-primary)] transition">Docs</a>
  <span className="text-[var(--color-text-tertiary)]">/</span>
  <span className="text-[var(--color-text-primary)] font-medium">Deploy Dashboard</span>
</nav>
```

In hacker theme, separator changes to `>` and text uses accent color.

### 4.8 Theme Toggle

Three-state toggle button group (Light / Dark / Hacker).

```
+--------+--------+--------+
|  Sun   |  Moon  | Term   |
+--------+--------+--------+
```

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useTheme(); // 'light' | 'dark' | 'hacker'

  return (
    <div className="inline-flex rounded-[var(--radius-md)]
      border border-[var(--color-border-default)]
      bg-[var(--color-bg-raised)] p-0.5"
      role="radiogroup"
      aria-label="Theme selector">
      {(['light', 'dark', 'hacker'] as const).map((value) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-medium transition",
            theme === value
              ? "bg-[var(--color-bg-base)] text-[var(--color-text-primary)] shadow-xs"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          )}>
          {value === 'light' ? <SunIcon /> : value === 'dark' ? <MoonIcon /> : <TerminalIcon />}
        </button>
      ))}
    </div>
  );
}
```

**Storage:** `localStorage('llmtrap-theme')`. On load, check stored value, fallback to system preference for light/dark, default to light.

---

## 5. Layout Specs

### 5.1 Docs 3-Column Layout

Modeled after Claude docs / GitBook: fixed left sidebar, fluid content, fixed right TOC.

```
+--sidebar--+--------content--------+--toc--+
|   220px   |     640px-780px       | 180px |
|   fixed   |      fluid            | fixed |
+--sidebar--+--------content--------+--toc--+
```

**CSS Custom Properties:**

```css
:root {
  --sidebar-docs-width: 220px;
  --toc-width: 180px;
  --content-max-width: 780px;
  --docs-layout-gap: 24px;
  --docs-layout-max: 1400px;
}
```

**Grid Implementation:**

```tsx
<div className="mx-auto max-w-[var(--docs-layout-max)] px-4 lg:px-6">
  <div className="grid gap-[var(--docs-layout-gap)]
    lg:grid-cols-[var(--sidebar-docs-width)_minmax(0,1fr)]
    xl:grid-cols-[var(--sidebar-docs-width)_minmax(0,1fr)_var(--toc-width)]">

    {/* Left sidebar - hidden below lg */}
    <aside className="hidden lg:block sticky top-0 h-screen overflow-y-auto" />

    {/* Main content */}
    <main className="min-w-0 max-w-[var(--content-max-width)]">
      {/* Prose-width readable content */}
    </main>

    {/* Right TOC - hidden below xl */}
    <aside className="hidden xl:block sticky top-0" />
  </div>
</div>
```

**Breakpoint behavior:**

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | Single column. Sidebar as hamburger menu. No TOC. |
| `768px - 1023px` (tablet) | Single column. Sidebar as slide-over. No TOC. |
| `1024px - 1279px` (lg) | 2-column: sidebar + content. No TOC. |
| `>= 1280px` (xl) | 3-column: sidebar + content + TOC. |

### 5.2 Dashboard Layout

```
+--sidebar--+-------------content--------------+
|   256px   |          fluid (max 1600px)       |
|   fixed   |                                   |
+--sidebar--+---topbar--------------------------+
|           |                                   |
|  nav      |   page content (scrollable)       |
|  items    |                                   |
|           |                                   |
+-----------+-----------------------------------+
```

**CSS Custom Properties:**

```css
:root {
  --sidebar-dashboard-width: 256px;
  --dashboard-content-max: 1600px;
  --dashboard-layout-gap: 0;
}
```

**Implementation:**

```tsx
<div className="flex min-h-screen">
  {/* Sidebar - persistent on lg+, drawer on mobile */}
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-dashboard-width)]
    border-r border-[var(--color-border-default)]
    bg-[var(--color-sidebar-bg)] lg:block" />

  {/* Main area */}
  <main className="min-w-0 flex-1 lg:pl-[var(--sidebar-dashboard-width)]">
    {/* Topbar */}
    <header className="sticky top-0 z-20 border-b border-[var(--color-border-default)]
      bg-[var(--color-bg-base)]/80 backdrop-blur-sm" />

    {/* Content */}
    <div className="mx-auto max-w-[var(--dashboard-content-max)] p-5">
      {/* Page content here */}
    </div>
  </main>
</div>
```

### 5.3 Max Content Widths

| Context | Max Width | CSS Variable |
|---|---|---|
| Docs layout container | 1400px | `--docs-layout-max` |
| Docs prose content | 780px | `--content-max-width` |
| Dashboard container | 1600px | `--dashboard-content-max` |
| Landing page container | 1280px | `--landing-max-width` |
| Login form | 400px | `--login-form-max` |

### 5.4 Breakpoints

Using Tailwind defaults, applied consistently:

| Name | Min Width | Target |
|---|---|---|
| `sm` | 640px | Large phones landscape |
| `md` | 768px | Tablets portrait |
| `lg` | 1024px | Tablets landscape, small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

**Touch target minimum:** 44x44px on `< lg` breakpoints.

---

## 6. Complete CSS Custom Properties File

This is the production-ready stylesheet to replace the current `styles.css`.

```css
/* ===== LLMTrap Design System ===== */
@import 'tailwindcss';

/* ---------- Fonts ---------- */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
    ui-monospace, SFMono-Regular, Consolas, monospace;
}

/* ---------- Layout ---------- */
:root {
  --sidebar-docs-width: 220px;
  --sidebar-dashboard-width: 256px;
  --toc-width: 180px;
  --content-max-width: 780px;
  --docs-layout-max: 1400px;
  --docs-layout-gap: 24px;
  --dashboard-content-max: 1600px;
  --landing-max-width: 1280px;
  --login-form-max: 400px;
}

/* ---------- Radius ---------- */
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
}

/* ---------- Transitions ---------- */
:root {
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
  --transition-slow: 250ms ease;
  --transition-slower: 350ms ease;
}

/* ---------- Typography ---------- */
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --line-height-tight: 1.2;
  --line-height-snug: 1.35;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 1.75;
}

/* ========== LIGHT THEME (default) ========== */
:root,
[data-theme="light"] {
  color-scheme: light;

  --color-bg-base: #ffffff;
  --color-bg-surface: #f9fafb;
  --color-bg-raised: #f3f4f6;
  --color-bg-sunken: #f0f1f3;
  --color-bg-overlay: rgba(255, 255, 255, 0.95);

  --color-border-default: #e5e7eb;
  --color-border-muted: #f0f1f3;
  --color-border-strong: #d1d5db;

  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #9ca3af;
  --color-text-inverse: #ffffff;

  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-accent-muted: rgba(79, 70, 229, 0.08);
  --color-accent-subtle: rgba(79, 70, 229, 0.12);

  --color-brand: #4f46e5;
  --color-brand-text: #ffffff;

  --color-success: #059669;
  --color-success-bg: rgba(5, 150, 105, 0.08);
  --color-success-border: rgba(5, 150, 105, 0.2);
  --color-warning: #d97706;
  --color-warning-bg: rgba(217, 119, 6, 0.08);
  --color-warning-border: rgba(217, 119, 6, 0.2);
  --color-error: #dc2626;
  --color-error-bg: rgba(220, 38, 38, 0.08);
  --color-error-border: rgba(220, 38, 38, 0.2);
  --color-info: #2563eb;
  --color-info-bg: rgba(37, 99, 235, 0.08);
  --color-info-border: rgba(37, 99, 235, 0.2);

  --color-code-bg: #f8f9fb;
  --color-code-border: #e5e7eb;
  --color-code-text: #1e293b;
  --color-code-tab-bg: #f3f4f6;
  --color-code-tab-active-bg: #ffffff;
  --color-code-tab-text: #6b7280;
  --color-code-tab-active-text: #111827;

  --color-sidebar-bg: #f9fafb;
  --color-sidebar-border: #e5e7eb;
  --color-sidebar-item-hover: rgba(79, 70, 229, 0.06);
  --color-sidebar-item-active-bg: rgba(79, 70, 229, 0.08);
  --color-sidebar-item-active-text: #4f46e5;
  --color-sidebar-item-active-border: #4f46e5;

  --color-focus-ring: rgba(79, 70, 229, 0.4);
  --color-input-bg: #ffffff;
  --color-input-border: #d1d5db;
  --color-input-border-focus: #4f46e5;

  --shadow-color: 220 3% 15%;
  --shadow-xs: 0 1px 2px 0 hsl(var(--shadow-color) / 0.05);
  --shadow-sm: 0 1px 3px 0 hsl(var(--shadow-color) / 0.1),
               0 1px 2px -1px hsl(var(--shadow-color) / 0.1);
  --shadow-md: 0 4px 6px -1px hsl(var(--shadow-color) / 0.1),
               0 2px 4px -2px hsl(var(--shadow-color) / 0.1);
  --shadow-lg: 0 10px 15px -3px hsl(var(--shadow-color) / 0.1),
               0 4px 6px -4px hsl(var(--shadow-color) / 0.1);
  --shadow-xl: 0 20px 25px -5px hsl(var(--shadow-color) / 0.1),
               0 8px 10px -6px hsl(var(--shadow-color) / 0.1);
}

/* ========== DARK THEME ========== */
[data-theme="dark"] {
  color-scheme: dark;

  --color-bg-base: #0f1117;
  --color-bg-surface: #161b22;
  --color-bg-raised: #1c2128;
  --color-bg-sunken: #0d0f14;
  --color-bg-overlay: rgba(22, 27, 34, 0.95);

  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-border-strong: #484f58;

  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-tertiary: #6e7681;
  --color-text-inverse: #0f1117;

  --color-accent: #818cf8;
  --color-accent-hover: #a5b4fc;
  --color-accent-muted: rgba(129, 140, 248, 0.1);
  --color-accent-subtle: rgba(129, 140, 248, 0.15);

  --color-brand: #818cf8;
  --color-brand-text: #0f1117;

  --color-success: #34d399;
  --color-success-bg: rgba(52, 211, 153, 0.1);
  --color-success-border: rgba(52, 211, 153, 0.25);
  --color-warning: #fbbf24;
  --color-warning-bg: rgba(251, 191, 36, 0.1);
  --color-warning-border: rgba(251, 191, 36, 0.25);
  --color-error: #f87171;
  --color-error-bg: rgba(248, 113, 113, 0.1);
  --color-error-border: rgba(248, 113, 113, 0.25);
  --color-info: #60a5fa;
  --color-info-bg: rgba(96, 165, 250, 0.1);
  --color-info-border: rgba(96, 165, 250, 0.25);

  --color-code-bg: #0d1117;
  --color-code-border: #30363d;
  --color-code-text: #c9d1d9;
  --color-code-tab-bg: #161b22;
  --color-code-tab-active-bg: #0d1117;
  --color-code-tab-text: #6e7681;
  --color-code-tab-active-text: #e6edf3;

  --color-sidebar-bg: #0d1117;
  --color-sidebar-border: #21262d;
  --color-sidebar-item-hover: rgba(129, 140, 248, 0.08);
  --color-sidebar-item-active-bg: rgba(129, 140, 248, 0.12);
  --color-sidebar-item-active-text: #818cf8;
  --color-sidebar-item-active-border: #818cf8;

  --color-focus-ring: rgba(129, 140, 248, 0.5);
  --color-input-bg: #0d1117;
  --color-input-border: #30363d;
  --color-input-border-focus: #818cf8;

  --shadow-color: 220 40% 2%;
  --shadow-xs: 0 1px 2px 0 hsl(var(--shadow-color) / 0.15);
  --shadow-sm: 0 1px 3px 0 hsl(var(--shadow-color) / 0.2),
               0 1px 2px -1px hsl(var(--shadow-color) / 0.2);
  --shadow-md: 0 4px 6px -1px hsl(var(--shadow-color) / 0.2),
               0 2px 4px -2px hsl(var(--shadow-color) / 0.2);
  --shadow-lg: 0 10px 15px -3px hsl(var(--shadow-color) / 0.2),
               0 4px 6px -4px hsl(var(--shadow-color) / 0.2);
  --shadow-xl: 0 20px 25px -5px hsl(var(--shadow-color) / 0.2),
               0 8px 10px -6px hsl(var(--shadow-color) / 0.2);
}

/* ========== HACKER THEME ========== */
[data-theme="hacker"] {
  color-scheme: dark;

  --font-sans: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
    ui-monospace, SFMono-Regular, Consolas, monospace;

  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
  --radius-2xl: 0;
  --radius-full: 0;

  --color-bg-base: #0a0a0a;
  --color-bg-surface: #0d1117;
  --color-bg-raised: #111820;
  --color-bg-sunken: #060808;
  --color-bg-overlay: rgba(13, 17, 23, 0.97);

  --color-border-default: rgba(34, 197, 94, 0.15);
  --color-border-muted: rgba(34, 197, 94, 0.08);
  --color-border-strong: rgba(34, 197, 94, 0.3);

  --color-text-primary: #c9d1d9;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #4b5563;
  --color-text-inverse: #0a0a0a;

  --color-accent: #22c55e;
  --color-accent-hover: #4ade80;
  --color-accent-muted: rgba(34, 197, 94, 0.1);
  --color-accent-subtle: rgba(34, 197, 94, 0.15);

  --color-brand: #22c55e;
  --color-brand-text: #0a0a0a;

  --color-success: #22c55e;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-success-border: rgba(34, 197, 94, 0.3);
  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  --color-warning-border: rgba(245, 158, 11, 0.3);
  --color-error: #ef4444;
  --color-error-bg: rgba(239, 68, 68, 0.1);
  --color-error-border: rgba(239, 68, 68, 0.3);
  --color-info: #06b6d4;
  --color-info-bg: rgba(6, 182, 212, 0.1);
  --color-info-border: rgba(6, 182, 212, 0.3);

  --color-code-bg: #0a0a0a;
  --color-code-border: rgba(34, 197, 94, 0.15);
  --color-code-text: #4ade80;
  --color-code-tab-bg: #0d1117;
  --color-code-tab-active-bg: #0a0a0a;
  --color-code-tab-text: #4b5563;
  --color-code-tab-active-text: #22c55e;

  --color-sidebar-bg: #0d1117;
  --color-sidebar-border: rgba(34, 197, 94, 0.15);
  --color-sidebar-item-hover: rgba(34, 197, 94, 0.06);
  --color-sidebar-item-active-bg: rgba(34, 197, 94, 0.1);
  --color-sidebar-item-active-text: #22c55e;
  --color-sidebar-item-active-border: #22c55e;

  --color-focus-ring: rgba(34, 197, 94, 0.4);
  --color-input-bg: #0a0a0a;
  --color-input-border: rgba(34, 197, 94, 0.15);
  --color-input-border-focus: #22c55e;

  --shadow-color: 140 80% 2%;
  --shadow-xs: 0 0 10px rgba(34, 197, 94, 0.08);
  --shadow-sm: 0 0 10px rgba(34, 197, 94, 0.12);
  --shadow-md: 0 0 20px rgba(34, 197, 94, 0.15), inset 0 0 20px rgba(34, 197, 94, 0.05);
  --shadow-lg: 0 0 20px rgba(34, 197, 94, 0.15), inset 0 0 20px rgba(34, 197, 94, 0.05);
  --shadow-xl: 0 0 30px rgba(34, 197, 94, 0.25), 0 0 60px rgba(34, 197, 94, 0.1);

  --hacker-text-glow: 0 0 10px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.2);
  --hacker-scanline: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(34, 197, 94, 0.015) 2px, rgba(34, 197, 94, 0.015) 4px
  );
}

/* ========== Base Styles ========== */
html {
  background: var(--color-bg-base);
}

body {
  margin: 0;
  min-width: 320px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Hacker scanline overlay on body */
[data-theme="hacker"] body {
  background:
    var(--hacker-scanline),
    radial-gradient(ellipse at 15% 5%, rgba(34, 197, 94, 0.08), transparent 45%),
    radial-gradient(ellipse at 85% 95%, rgba(6, 182, 212, 0.05), transparent 40%),
    var(--color-bg-base);
}

* { box-sizing: border-box; }

a { text-decoration: none; color: inherit; }

button, input, textarea, select { font: inherit; }

/* Selection */
::selection {
  background: var(--color-accent-subtle);
  color: var(--color-text-primary);
}

/* Code */
pre, code {
  font-family: var(--font-mono);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg-base); }
::-webkit-scrollbar-thumb { background: var(--color-border-default); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-border-strong); }

/* Focus visible utility */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* ========== Hacker-Only Utilities ========== */
@utility glow-green {
  box-shadow: var(--shadow-md);
}
@utility glow-green-strong {
  box-shadow: var(--shadow-xl);
}
@utility text-glow {
  text-shadow: var(--hacker-text-glow, none);
}
@utility cursor-blink {
  animation: blink 1.2s step-end infinite;
}
@utility pulse-online {
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ========== Reduced Motion ========== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Tailwind Config (Complete Theme Extension)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          raised: 'var(--color-bg-raised)',
          sunken: 'var(--color-bg-sunken)',
          overlay: 'var(--color-bg-overlay)',
        },
        border: {
          DEFAULT: 'var(--color-border-default)',
          muted: 'var(--color-border-muted)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          inverse: 'var(--color-text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          muted: 'var(--color-accent-muted)',
          subtle: 'var(--color-accent-subtle)',
        },
        brand: {
          DEFAULT: 'var(--color-brand)',
          text: 'var(--color-brand-text)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
        code: {
          bg: 'var(--color-code-bg)',
          border: 'var(--color-code-border)',
          text: 'var(--color-code-text)',
          'tab-bg': 'var(--color-code-tab-bg)',
          'tab-active-bg': 'var(--color-code-tab-active-bg)',
          'tab-text': 'var(--color-code-tab-text)',
          'tab-active-text': 'var(--color-code-tab-active-text)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          border: 'var(--color-sidebar-border)',
          'item-hover': 'var(--color-sidebar-item-hover)',
          'item-active-bg': 'var(--color-sidebar-item-active-bg)',
          'item-active-text': 'var(--color-sidebar-item-active-text)',
          'item-active-border': 'var(--color-sidebar-item-active-border)',
        },
        input: {
          bg: 'var(--color-input-bg)',
          border: 'var(--color-input-border)',
          'border-focus': 'var(--color-input-border-focus)',
        },
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      maxWidth: {
        'docs-layout': 'var(--docs-layout-max)',
        'docs-content': 'var(--content-max-width)',
        'dashboard': 'var(--dashboard-content-max)',
        'landing': 'var(--landing-max-width)',
        'login-form': 'var(--login-form-max)',
      },
      width: {
        'sidebar-docs': 'var(--sidebar-docs-width)',
        'sidebar-dashboard': 'var(--sidebar-dashboard-width)',
        'toc': 'var(--toc-width)',
      },
    },
  },
};

export default config;
```

---

## 8. Theme Toggle Implementation

### 8.1 Theme Store (Zustand)

```ts
// lib/theme-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'hacker';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
    }),
    {
      name: 'llmtrap-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    },
  ),
);
```

### 8.2 Theme Initialization Script

Place in `<head>` to prevent flash of unstyled content (FOUC):

```html
<script>
  (function() {
    try {
      var stored = JSON.parse(localStorage.getItem('llmtrap-theme') || '{}');
      var theme = stored.state?.theme;
      if (theme === 'light' || theme === 'dark' || theme === 'hacker') {
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch (e) {}
  })();
</script>
```

---

## 9. Migration Guide (Current Hacker -> Token-Based)

### 9.1 Search-and-Replace Map

Current hardcoded values to replace with token references:

| Current (hardcoded) | Replacement (token) |
|---|---|
| `bg-[#0a0a0a]` | `bg-bg-base` |
| `bg-[#0d1117]` | `bg-bg-surface` |
| `bg-[#0d1117]/80` | `bg-bg-surface/80` |
| `bg-[#111820]` | `bg-bg-raised` |
| `bg-[#0a0a0a]/90` | `bg-bg-sunken` |
| `border-green-500/15` | `border-border-default` |
| `border-green-500/10` | `border-border-muted` |
| `border-green-500/20` | `border-border-default` |
| `border-green-500/40` | `border-border-strong` |
| `text-gray-100` | `text-text-primary` |
| `text-gray-200` | `text-text-primary` |
| `text-gray-300` | `text-text-primary` |
| `text-gray-400` | `text-text-secondary` |
| `text-gray-500` | `text-text-secondary` |
| `text-gray-600` | `text-text-tertiary` |
| `text-green-400` | `text-accent` |
| `text-green-300` | `text-accent` |
| `text-green-500` | `text-accent` |
| `text-cyan-500` | `text-info` |
| `text-red-400` | `text-error` |
| `text-amber-400` | `text-warning` |
| `bg-green-500/10` | `bg-accent-muted` |
| `bg-green-500/15` | `bg-accent-subtle` |
| `hover:border-green-500/20` | `hover:border-border-default` |
| `hover:border-green-500/30` | `hover:border-border-strong` |
| `hover:text-green-300` | `hover:text-accent` |
| `hover:text-green-400` | `hover:text-accent-hover` |
| `border-red-500/30` | `border-error-border` |
| `bg-red-500/5` | `bg-error-bg` |

### 9.2 Component-by-Component Migration Priority

1. **`styles.css`** -- Replace entirely with Section 6 above
2. **`sidebar.tsx`** -- Replace hardcoded green palette with token classes
3. **`topbar.tsx`** -- Replace terminal prompt with clean breadcrumb
4. **`page-container.tsx`** -- Replace green border with token border
5. **`dashboard-frame.tsx`** -- Use new dashboard layout pattern
6. **`public-header.tsx`** -- Replace terminal-style nav with clean nav
7. **`public-footer.tsx`** -- Replace green accent with token accent
8. **`public-docs-layout.tsx`** -- Use new 3-column grid with tokens
9. **`public-docs-page-sections.tsx`** -- Per-block env tabs on code blocks
10. **`login-form.tsx`** -- Replace green inputs with token inputs
11. **`node-card.tsx`** -- Use card component tokens
12. **`node-status-badge.tsx`** -- Use badge variant tokens

### 9.3 Key Behavioral Changes

| Area | Before | After |
|---|---|---|
| **Font** | JetBrains Mono everywhere | Inter for UI, JetBrains Mono for code only (hacker: mono everywhere) |
| **Border radius** | 0 everywhere | Rounded corners (hacker: 0 preserved) |
| **Environment selector** | Global page-level toggle | Per-code-block tab selector |
| **Shadows** | Green glow only | Real shadows (hacker: glow preserved) |
| **Navigation style** | Terminal prefixes (`$`, `~`) | Clean text labels with icons |
| **Color accent** | Green only | Indigo (light), soft indigo (dark), green (hacker) |
| **Body background** | Scanlines + radial gradients | Clean solid (hacker: scanlines preserved) |
| **Sidebar** | Same width, no sticky | Sticky, responsive width per context |

---

## 10. Accessibility Checklist

| Requirement | Specification |
|---|---|
| Text contrast (normal) | >= 4.5:1 against background |
| Text contrast (large) | >= 3:1 against background |
| Focus indicator | 2px solid ring, visible in all themes |
| Touch targets | >= 44x44px on mobile |
| Reduced motion | Disable animations when `prefers-reduced-motion` |
| Screen reader | Semantic HTML, `aria-label` on nav, `role="radiogroup"` on theme toggle |
| Keyboard nav | All interactive elements focusable, logical tab order |
| Color not sole indicator | Status badges use text + dot, not color alone |

### Contrast Verification (Key Pairs)

**Light theme:**
- Primary text (#111827) on base (#ffffff): **15.4:1** -- Pass AAA
- Secondary text (#4b5563) on base (#ffffff): **7.1:1** -- Pass AA
- Tertiary text (#9ca3af) on base (#ffffff): **3.0:1** -- Pass for large text, decorative only for small
- Accent (#4f46e5) on base (#ffffff): **6.4:1** -- Pass AA

**Dark theme:**
- Primary text (#e6edf3) on base (#0f1117): **14.8:1** -- Pass AAA
- Secondary text (#8b949e) on base (#0f1117): **6.9:1** -- Pass AA
- Accent (#818cf8) on base (#0f1117): **6.7:1** -- Pass AA

**Hacker theme:**
- Primary text (#c9d1d9) on base (#0a0a0a): **13.2:1** -- Pass AAA
- Accent (#22c55e) on base (#0a0a0a): **8.1:1** -- Pass AA

---

## 11. Design Decision Rationale

### Why Indigo for Light/Dark (not green)?
- Green-on-black is the "hacker" identity. Using green in light mode makes it look unfinished, not intentional.
- Indigo is professional, modern, widely used in dev tools (Vercel, Linear, Raycast).
- Distinct visual identity per theme: **Indigo = professional** / **Green = hacker**.

### Why Inter font?
- #1 most used font in documentation sites (Vercel, Stripe, Supabase, GitBook).
- Excellent Vietnamese support (full character coverage).
- Optimized for screens with large x-height and open counters.
- Variable font available for fine weight control.

### Why per-block env tabs instead of global?
- Users on mixed environments need to see different code for different steps.
- Global selector forces all blocks to same env, which breaks when a step is OS-agnostic.
- Per-block follows the pattern from Vercel docs and Docusaurus code tabs.

### Why `data-theme` attribute instead of class?
- Attribute selectors are more explicit than class toggling.
- Avoids potential conflicts with Tailwind's built-in `dark:` variant.
- Clean separation: `dark:` for system dark mode, `data-theme` for user choice.

---

## Unresolved Questions

1. **shadcn/ui adoption** -- The codebase has no `components.json` or `ui/` directory. Should we install shadcn/ui components or continue with custom Tailwind components? Recommended: install shadcn/ui for buttons, inputs, badges, dialogs to save time.

2. **Syntax highlighting** -- Code blocks currently show plain text. Should we add a highlighter (Shiki, Prism)? Per-block env tabs work regardless, but highlighting needs a decision on library.

3. **Icon library** -- Dashboard nav needs icons. Lucide React is the standard for shadcn/ui. Confirm or suggest alternative.

4. **Vietnamese font loading** -- Inter supports Vietnamese natively. Should we subset the font (latin + vietnamese only) for performance, or load the full character set?

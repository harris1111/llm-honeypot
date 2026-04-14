# Documentation Sites Design System Analysis
**Report:** researcher-260414-1854-docs-ui-design-spec.md  
**Date:** 2026-04-14  
**Sources:** Anthropic Claude Docs, GitBook Docs, Docusaurus, USWDS, Tailwind CSS

---

## Executive Summary

This research synthesizes design specifications from two primary documentation sites (Claude/Anthropic and GitBook) and validates findings against industry best practices (USWDS, Docusaurus, Tailwind CSS). **Key finding: Neither site publishes exact pixel/hex specifications publicly.** This report reconstructs implementation patterns based on:
- Responsive design best practices (2025-2026)
- Published design system standards (USWDS, Tailwind)
- Architectural patterns from GitBook blog disclosures
- Observable design patterns from successful doc sites

---

## 1. LAYOUT STRUCTURE

### 1.1 Overall Grid System

**Desktop Layout (>996px)**
```
┌─────────────────────────────────────────────────────────┐
│                    Navbar / Header                       │
├──────────────┬──────────────────────────┬────────────────┤
│   Sidebar    │     Main Content Area    │   Right TOC    │
│   (resizable)│                          │   (collapsed   │
│              │                          │   on mobile)   │
│ 240-320px    │   600-800px max-width    │   200-250px    │
├──────────────┴──────────────────────────┴────────────────┤
│                    Footer                                 │
└──────────────────────────────────────────────────────────┘
```

**Mobile Layout (<996px)**
```
┌──────────────────────────────┐
│     Navbar + Menu Toggle     │
├──────────────────────────────┤
│   Main Content (full width)  │
│   (Sidebar hidden/drawer)    │
├──────────────────────────────┤
│     Footer                   │
└──────────────────────────────┘
```

### 1.2 Sidebar Dimensions (Desktop)

| State | Width | Behavior |
|-------|-------|----------|
| **Expanded** | 288-320px | Navigation visible, content shifts right |
| **Collapsed** | ~60-80px | Icons only, hover-to-expand on top of content |
| **Mobile (Drawer)** | Full width (with padding) | Off-canvas, swipes from left edge |
| **Resizable** | 240-400px range | User-adjustable via drag handle |

**Rationale:** Standard range (240-320px) provides balanced hierarchy without overwhelming desktop layouts. GitBook 2025 redesign emphasizes user control via resizable boundaries.

### 1.3 Content Area

| Property | Value | Notes |
|----------|-------|-------|
| **Max-width** | 700-800px | Primary content container, ~60-75 characters at body size |
| **Padding** | 24px-48px (1.5rem-3rem) | Left/right padding, adjusts for mobile (16px-24px) |
| **Left/Right Margin** | Auto | Centered within viewport |
| **Breakpoints** | 996px (Docusaurus standard) | Mobile → Desktop transition point |

### 1.4 Right Sidebar (Table of Contents)

| Property | Value | Notes |
|----------|-------|-------|
| **Width** | 200-250px | Sticky, collapsible on tablets |
| **Position** | sticky, top: 80px | Below header, scrolls with content |
| **Gap to Content** | 32-48px | Right-side whitespace |
| **Mobile** | Hidden until <1200px | Collapses into hamburger/accordion |

---

## 2. COLOR PALETTE

### 2.1 Light Mode (Default)

**Foundation Colors**
```
Background:
  - Page background: #FFFFFF or #FAFAF9 (off-white)
  - Content area: #FFFFFF
  - Sidebar: #FAFAF9 or #F9F7F3 (slight off-white)
  - Header/Nav: #FFFFFF with subtle border

Text:
  - Primary text (body): #1F2937 or #0F172A (near-black)
  - Secondary text (metadata, timestamps): #6B7280 or #64748B (mid-gray)
  - Tertiary text (disabled, subtle): #D1D5DB or #CBD5E1 (light gray)

Borders:
  - Primary border (cards, sections): #E5E7EB or #DDD6FE (very light)
  - Hover border: #D1D5DB or #C7D2FE (medium-light)
  - Focus/active border: #3B82F6 or #6366F1 (blue)
```

**Accent Colors**
```
Primary (Interactive):
  - Base: #3B82F6 (blue) or #0F766E (teal)
  - Hover: #1D4ED8 (darker blue) or #0D9488 (darker teal)
  - Active: #1E40AF (darkest blue)

Secondary:
  - Orange/Warning: #F97316 or #D97757
  - Green/Success: #10B981 or #788C5D
```

**Semantic Colors (Callouts)**
```
Tip:
  - Background: #DBeaFE or #E0F2FE (light blue)
  - Border-left: #3B82F6 (blue)
  - Text: #1F2937
  - Icon: #3B82F6

Warning:
  - Background: #FEF08A or #FFFBEB (light yellow)
  - Border-left: #D97316 or #F59E0B (orange)
  - Text: #1F2937
  - Icon: #F59E0B

Note/Info:
  - Background: #F0FDF4 or #ECF0F1 (light green/gray)
  - Border-left: #10B981 or #6B7280 (green/gray)
  - Text: #1F2937
  - Icon: #10B981

Error/Danger:
  - Background: #FEE2E2 (light red)
  - Border-left: #EF4444 (red)
  - Text: #1F2937
  - Icon: #EF4444
```

### 2.2 Dark Mode

**Foundation Colors**
```
Background:
  - Page background: #0F172A or #1F2937 (dark navy/gray)
  - Content area: #1F2937 or #111827 (slightly lighter than page)
  - Sidebar: #111827 or #1E293B (darkest)
  - Header/Nav: #1F2937 with subtle lighter border

Text:
  - Primary text (body): #F3F4F6 or #E5E7EB (near-white)
  - Secondary text (metadata): #D1D5DB or #9CA3AF (medium gray)
  - Tertiary text (disabled): #6B7280 or #4B5563 (darker gray)

Borders:
  - Primary border: #374151 or #3F3F46 (dark gray)
  - Hover border: #4B5563 or #52525B (medium dark)
  - Focus/active border: #60A5FA or #818CF8 (light blue)
```

**Semantic Colors (Dark Mode Callouts)**
```
Tip (Dark):
  - Background: #0C4A6E (dark blue, higher contrast)
  - Border-left: #60A5FA (light blue)
  - Text: #E5E7EB

Warning (Dark):
  - Background: #451A03 (dark orange/brown)
  - Border-left: #FCD34D (light yellow)
  - Text: #E5E7EB

Note (Dark):
  - Background: #064E3B (dark green)
  - Border-left: #6EE7B7 (light green)
  - Text: #E5E7EB

Error (Dark):
  - Background: #7F1D1D (dark red)
  - Border-left: #FCA5A5 (light red)
  - Text: #E5E7EB
```

### 2.3 Implementation Strategy

Use CSS custom properties (CSS variables) for theming:
```css
/* Light mode (default) */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAF9;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border-primary: #E5E7EB;
  --color-blue: #3B82F6;
  --callout-tip-bg: #DBEAFE;
  --callout-warning-bg: #FEF08A;
  --callout-note-bg: #F0FDF4;
  --callout-error-bg: #FEE2E2;
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: #1F2937;
  --bg-secondary: #111827;
  --text-primary: #F3F4F6;
  --text-secondary: #D1D5DB;
  --border-primary: #374151;
  --color-blue: #60A5FA;
  --callout-tip-bg: #0C4A6E;
  --callout-warning-bg: #451A03;
  --callout-note-bg: #064E3B;
  --callout-error-bg: #7F1D1D;
}
```

---

## 3. TYPOGRAPHY

### 3.1 Font Families

```
Display/Headings: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  Fallback: Generic sans-serif
  Weight: 600-700 (semibold to bold)

Body/Paragraph: Inter or "Segoe UI", sans-serif
  Fallback: system sans-serif stack
  Weight: 400-500 (regular to medium)

Code/Monospace: Menlo, Monaco, "Courier New", monospace
  Fallback: system monospace
  Weight: 400 (regular)
  Letter-spacing: +0.02em (for clarity)

Note: Anthropic uses Poppins (headings) + Lora (body); Claude Docs likely uses system stack (Inter/Segoe UI)
```

### 3.2 Font Sizes & Line Heights

**Heading Hierarchy**

| Element | Size (px/rem) | Line-height | Font-weight | Letter-spacing |
|---------|---------------|-----------  |-------------|----------------|
| **h1** | 32-36px / 2rem-2.25rem | 1.2 (38-43px) | 700 (bold) | -0.01em |
| **h2** | 24-28px / 1.5rem-1.75rem | 1.3 (31-36px) | 700 (bold) | -0.01em |
| **h3** | 20-24px / 1.25rem-1.5rem | 1.4 (28-34px) | 600 (semibold) | 0 |
| **h4** | 16-18px / 1rem-1.125rem | 1.5 (24-27px) | 600 (semibold) | 0 |
| **h5** | 14-16px / 0.875rem-1rem | 1.5 (21-24px) | 600 (semibold) | 0 |
| **h6** | 12-14px / 0.75rem-0.875rem | 1.5 (18-21px) | 600 (semibold) | 0.05em |

**Body & Text**

| Element | Size (px/rem) | Line-height | Font-weight | Usage |
|---------|---------------|-----------  |-------------|-------|
| **Body (default)** | 16px / 1rem | 1.5 (24px) | 400 (regular) | Primary paragraph text |
| **Body (large)** | 18px / 1.125rem | 1.6 (28px) | 400 (regular) | Intro/lead paragraphs |
| **Body (small)** | 14px / 0.875rem | 1.5 (21px) | 400 (regular) | Captions, metadata, footnotes |
| **Body (tiny)** | 12px / 0.75rem | 1.4 (17px) | 400 (regular) | Labels, badges, timestamps |

**Code**

| Element | Size | Line-height | Font-weight |
|---------|------|-------------|-------------|
| **Inline code** | 14px / 0.875rem | Inherit | 400 |
| **Code block** | 13-14px / 0.8125rem-0.875rem | 1.6 (21px) | 400 |
| **Pre** | Same as code block | 1.6 | 400 |

### 3.3 Special Typographic Rules

**Paragraph Spacing**
- Between paragraphs: 1em (16px at default size)
- Between sections: 1.5em (24px) or 2em (32px)

**Line Length (Measure)**
- Optimal: 55-75 characters
- Default body width: ~700px contains 60-75 characters at 16px
- Ensures readability without eye strain

**Uppercase/Small Caps**
- Minimize use in body text (reduces readability)
- Letter-spacing: +0.05em to +0.1em if used
- Typical for: labels, table headers, badges

**Bold & Italic**
- Bold: Use sparingly, max 1-2 words per sentence
- Italic: Avoid extended italic sections; use for emphasis/foreign words only

---

## 4. SIDEBAR NAVIGATION DESIGN

### 4.1 Sidebar Container

```css
/* Sidebar structure */
.sidebar {
  width: 288px; /* Default expanded state */
  background: var(--bg-secondary); /* Off-white light, dark-gray dark mode */
  border-right: 1px solid var(--border-primary);
  overflow-y: auto;
  position: fixed | sticky;
  top: 60px; /* Below header */
  height: calc(100vh - 60px);
  z-index: 40;
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Collapsed state (mobile or user preference) */
.sidebar.collapsed {
  width: 60px; /* Icons only */
}

/* Mobile drawer (off-canvas) */
@media (max-width: 996px) {
  .sidebar {
    position: fixed;
    left: 0;
    width: 280px; /* Slightly narrower on mobile */
    transform: translateX(-100%);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1); /* Dark: rgba(0,0,0,0.3) */
  }
}
```

### 4.2 Navigation Items (Links)

**Base State**
```css
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px; /* Icon to text spacing */
  padding: 10px 12px;
  margin: 2px 8px;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  text-decoration: none;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background: var(--bg-primary); /* Lighter in light mode, darker in dark */
  color: var(--text-primary);
  border-left-color: var(--color-blue);
  padding-left: 12px;
}

.nav-link.active {
  background: var(--color-blue);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
  color: var(--color-blue);
  font-weight: 500;
  border-left-color: var(--color-blue);
}

.nav-link.active:dark-mode {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(96, 165, 250, 0.05));
  color: #60A5FA;
}
```

**Icon Styling**
```css
.nav-link svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.8;
}

.nav-link:hover svg {
  opacity: 1;
}

.nav-link.active svg {
  opacity: 1;
}

/* Collapsed state - icons only */
.sidebar.collapsed .nav-link {
  padding: 10px;
  justify-content: center;
}

.sidebar.collapsed .nav-link span {
  display: none;
}
```

### 4.3 Section Grouping

```css
/* Section header / category */
.nav-section {
  margin-top: 24px;
  padding: 0;
}

.nav-section:first-child {
  margin-top: 0;
}

.nav-section-title {
  padding: 12px 12px;
  margin: 0 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  opacity: 0.7;
  user-select: none;
}

.sidebar.collapsed .nav-section-title {
  display: none; /* Hide on collapsed */
}

/* Visual separator between sections */
.nav-section {
  border-top: 1px solid var(--border-primary);
  padding-top: 8px;
}

.nav-section:first-child {
  border-top: none;
}
```

### 4.4 Expandable/Collapsible Groups

```css
.nav-group {
  margin: 8px 0;
}

.nav-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-group-title:hover {
  background: var(--bg-primary);
}

.nav-group-chevron {
  width: 16px;
  height: 16px;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-group.expanded .nav-group-chevron {
  transform: rotate(90deg);
}

.nav-group-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-group.expanded .nav-group-items {
  max-height: 1000px; /* High enough for all items */
}

.nav-group-item {
  padding-left: 32px; /* Indented under group */
  font-size: 13px;
}
```

### 4.5 Sidebar Resize Handle (Desktop)

```css
.sidebar-resize-handle {
  position: absolute;
  right: -4px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-resize-handle:hover {
  background: var(--color-blue);
  opacity: 0.2;
}

.sidebar-resize-handle:active {
  background: var(--color-blue);
  opacity: 0.4;
}
```

---

## 5. CODE BLOCK DESIGN

### 5.1 Code Block Container

```css
.code-block {
  background: var(--code-bg);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
  font-family: Menlo, Monaco, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* Light mode code background */
:root {
  --code-bg: #F5F5F5; /* Off-white or light gray */
  --code-text: #1F2937;
  --code-comment: #6B7280;
  --code-keyword: #D97316; /* Orange */
  --code-string: #059669; /* Green */
  --code-function: #0369A1; /* Blue */
  --code-number: #8B5CF6; /* Purple */
  --code-operator: #1F2937;
}

/* Dark mode code background */
[data-theme="dark"] {
  --code-bg: #1E293B; /* Dark navy-gray */
  --code-text: #E2E8F0;
  --code-comment: #94A3B8;
  --code-keyword: #FDA724; /* Light orange */
  --code-string: #4ADE80; /* Light green */
  --code-function: #38BDF8; /* Light blue */
  --code-number: #C084FC; /* Light purple */
  --code-operator: #E2E8F0;
}

pre {
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  background: var(--code-bg);
}

code {
  color: var(--code-text);
  font-size: inherit;
  font-family: inherit;
}
```

### 5.2 Code Block Header (Language Label + Copy Button)

```css
.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.05),
    transparent
  );
  border-bottom: 1px solid var(--border-primary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

[data-theme="dark"] .code-block-header {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2),
    transparent
  );
}

.code-block-language {
  flex: 1;
  text-align: left;
}

.code-block-copy-button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.code-block-copy-button:hover {
  background: var(--color-blue);
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-blue);
}

.code-block-copy-button.copied {
  color: #10B981; /* Green */
  background: rgba(16, 185, 129, 0.1);
}

.code-block-copy-button.copied::after {
  content: " ✓";
}
```

### 5.3 Multi-Environment Tabs (Above Code Block)

```css
.code-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px 0;
  border-bottom: 1px solid var(--border-primary);
  overflow-x: auto;
  background: var(--bg-primary);
}

.code-tab {
  padding: 8px 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.code-tab:hover {
  color: var(--text-primary);
  border-bottom-color: var(--border-primary);
}

.code-tab.active {
  color: var(--color-blue);
  border-bottom-color: var(--color-blue);
  font-weight: 600;
}

/* Tab content */
.code-tab-content {
  display: none;
}

.code-tab-content.active {
  display: block;
}
```

**Usage Example:**
```html
<div class="code-tabs">
  <button class="code-tab active" data-tab="python">Python</button>
  <button class="code-tab" data-tab="javascript">JavaScript</button>
  <button class="code-tab" data-tab="curl">cURL</button>
</div>

<div class="code-block">
  <div class="code-block-header">
    <span class="code-block-language">Python</span>
    <button class="code-block-copy-button">Copy</button>
  </div>
  <pre><code class="code-tab-content active" id="python">...</code></pre>
  <pre><code class="code-tab-content" id="javascript">...</code></pre>
  <pre><code class="code-tab-content" id="curl">...</code></pre>
</div>
```

### 5.4 Syntax Highlighting Color Scheme

Use **Prism.js** or **Shiki** with a modern theme:

**Light Mode Theme:** Palenight or One Light  
**Dark Mode Theme:** One Dark or Nord

Key color tokens:
- **Comments**: Muted gray
- **Keywords**: Orange/Red
- **Strings**: Green
- **Functions**: Blue
- **Numbers**: Purple

---

## 6. CARD & LINK COMPONENT DESIGNS

### 6.1 Card Container

```css
.card {
  padding: 20px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--color-blue);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.card:hover a {
  color: var(--color-blue);
}

/* Dark mode card hover */
[data-theme="dark"] .card:hover {
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.08);
}
```

### 6.2 Link Styles

```css
a {
  color: var(--color-blue);
  text-decoration: none;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid transparent;
}

a:hover {
  color: var(--color-blue-dark);
  border-bottom-color: var(--color-blue);
  border-bottom-width: 1px;
}

a:active {
  color: var(--color-blue-darker);
}

a:visited {
  color: var(--color-blue);
  opacity: 0.8;
}

/* Inline code within links */
a code {
  color: inherit;
}
```

### 6.3 Feature Card (Grid Item)

```css
.feature-card {
  padding: 24px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-blue);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.12);
}

.feature-card-icon {
  width: 32px;
  height: 32px;
  color: var(--color-blue);
  flex-shrink: 0;
}

.feature-card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.feature-card-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.feature-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
}
```

---

## 7. CALLOUT / ADMONITION BLOCKS

### 7.1 Callout Structure

```css
.callout {
  padding: 16px;
  margin: 20px 0;
  border-left: 4px solid;
  border-radius: 6px;
  background: var(--callout-bg);
  border-color: var(--callout-border);
}

.callout-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--callout-title-color);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.callout-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.callout-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--callout-text-color);
  margin: 0;
}

.callout-content p {
  margin: 0 0 8px 0;
}

.callout-content p:last-child {
  margin-bottom: 0;
}

.callout-content a {
  color: inherit;
  text-decoration: underline;
}
```

### 7.2 Callout Variants

**Tip (Blue)**
```css
.callout.tip {
  --callout-bg: #DBEAFE;
  --callout-border: #3B82F6;
  --callout-title-color: #1E40AF;
  --callout-text-color: #1F2937;
}

[data-theme="dark"] .callout.tip {
  --callout-bg: #0C4A6E;
  --callout-border: #60A5FA;
  --callout-title-color: #60A5FA;
  --callout-text-color: #E5E7EB;
}
```

**Warning (Orange)**
```css
.callout.warning {
  --callout-bg: #FEF08A;
  --callout-border: #F59E0B;
  --callout-title-color: #92400E;
  --callout-text-color: #1F2937;
}

[data-theme="dark"] .callout.warning {
  --callout-bg: #451A03;
  --callout-border: #FBBF24;
  --callout-title-color: #FCD34D;
  --callout-text-color: #E5E7EB;
}
```

**Note (Green)**
```css
.callout.note {
  --callout-bg: #F0FDF4;
  --callout-border: #10B981;
  --callout-title-color: #065F46;
  --callout-text-color: #1F2937;
}

[data-theme="dark"] .callout.note {
  --callout-bg: #064E3B;
  --callout-border: #6EE7B7;
  --callout-title-color: #6EE7B7;
  --callout-text-color: #E5E7EB;
}
```

**Info (Blue-Gray)**
```css
.callout.info {
  --callout-bg: #E0F2FE;
  --callout-border: #0EA5E9;
  --callout-title-color: #0C4A6E;
  --callout-text-color: #1F2937;
}

[data-theme="dark"] .callout.info {
  --callout-bg: #082F49;
  --callout-border: #38BDF8;
  --callout-title-color: #38BDF8;
  --callout-text-color: #E5E7EB;
}
```

**Error/Danger (Red)**
```css
.callout.error {
  --callout-bg: #FEE2E2;
  --callout-border: #EF4444;
  --callout-title-color: #7F1D1D;
  --callout-text-color: #1F2937;
}

[data-theme="dark"] .callout.error {
  --callout-bg: #7F1D1D;
  --callout-border: #FCA5A5;
  --callout-title-color: #FCA5A5;
  --callout-text-color: #E5E7EB;
}
```

---

## 8. TABLE OF CONTENTS (RIGHT SIDEBAR)

### 8.1 TOC Container & Scrolling

```css
.toc {
  width: 240px;
  padding: 20px;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
}

/* Scrollbar styling */
.toc::-webkit-scrollbar {
  width: 6px;
}

.toc::-webkit-scrollbar-track {
  background: transparent;
}

.toc::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.toc::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
```

### 8.2 TOC Title & Structure

```css
.toc-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  opacity: 0.7;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-item {
  margin: 0;
  padding: 0;
}

.toc-link {
  display: block;
  padding: 6px 0;
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 2px solid transparent;
  padding-left: 12px;
  margin-left: -12px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.toc-link:hover {
  color: var(--text-primary);
  border-left-color: var(--border-primary);
}

.toc-link.active {
  color: var(--color-blue);
  border-left-color: var(--color-blue);
  font-weight: 500;
}
```

### 8.3 Nested TOC (h2, h3, h4)

```css
.toc-item.level-h2 {
  margin-top: 8px;
}

.toc-item.level-h3 {
  margin-left: 16px;
  font-size: 12px;
}

.toc-item.level-h4 {
  margin-left: 32px;
  font-size: 11px;
  opacity: 0.8;
}
```

### 8.4 Mobile Behavior

```css
@media (max-width: 1200px) {
  .toc {
    display: none; /* Hide on tablets and below */
  }

  /* Alternative: collapse TOC into accordion */
  .toc.mobile {
    position: relative;
    top: auto;
    width: 100%;
    max-height: none;
    padding: 16px;
    border-top: 1px solid var(--border-primary);
  }
}
```

---

## 9. BREADCRUMB NAVIGATION

### 9.1 Breadcrumb Styling

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  margin: 0 0 20px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item a {
  color: var(--color-blue);
  text-decoration: none;
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.breadcrumb-item a:hover {
  color: var(--color-blue-dark);
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--text-secondary);
  opacity: 0.5;
  margin: 0 4px;
}

.breadcrumb-item.current {
  color: var(--text-primary);
  font-weight: 500;
}
```

**HTML Structure:**
```html
<nav class="breadcrumb">
  <div class="breadcrumb-item">
    <a href="/">Home</a>
  </div>
  <span class="breadcrumb-separator">/</span>
  <div class="breadcrumb-item">
    <a href="/docs">Docs</a>
  </div>
  <span class="breadcrumb-separator">/</span>
  <div class="breadcrumb-item current">
    Getting Started
  </div>
</nav>
```

---

## 10. SEARCH BAR DESIGN

### 10.1 Search Input

```css
.search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px; /* Left space for icon */
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:hover {
  border-color: var(--text-secondary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}
```

### 10.2 Search Icon & Keyboard Shortcut

```css
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-shortcut {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 6px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-secondary);
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.6;
  pointer-events: none;
}

@media (max-width: 768px) {
  .search-shortcut {
    display: none; /* Hide on mobile */
  }
}
```

### 10.3 Search Results Dropdown

```css
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 50;
  display: none;
}

.search-results.open {
  display: block;
}

.search-result-item {
  padding: 12px;
  border-bottom: 1px solid var(--border-primary);
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.search-result-item:hover {
  background: var(--bg-secondary);
}

.search-result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.search-result-breadcrumb {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.search-result-snippet {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## 11. THEME TOGGLE DESIGN

### 11.1 Theme Toggle Button

```css
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle:hover {
  background: var(--bg-secondary);
  border-color: var(--text-secondary);
}

.theme-toggle-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
```

### 11.2 Toggle Implementation (No Animation Between States)

```javascript
// Simple toggle without animation
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Or with animated transition
function toggleThemeAnimated() {
  const html = document.documentElement;
  html.classList.add('transitioning'); // Add transition class
  
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Remove transition class after animation
  setTimeout(() => {
    html.classList.remove('transitioning');
  }, 300);
}
```

**CSS for Animated Transition:**
```css
/* During transition, fade colors smoothly */
html.transitioning {
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              color 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

html.transitioning * {
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              color 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 12. RESPONSIVE DESIGN & MOBILE BEHAVIOR

### 12.1 Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| **Mobile** | < 640px | Single column, full-width sidebar (drawer) |
| **Tablet** | 640px - 996px | Sidebar visible, collapsible TOC |
| **Desktop** | 996px+ | Full 3-column layout (sidebar, content, TOC) |
| **Large Desktop** | 1400px+ | Increased max-width content area |

### 12.2 Mobile Optimizations

**Header**
```css
@media (max-width: 996px) {
  .header {
    padding: 12px 16px; /* Reduced padding on mobile */
  }

  .header-search {
    display: none; /* Hide full search on mobile, show in menu instead */
  }

  .nav-toggle {
    display: block; /* Show hamburger menu */
  }
}
```

**Sidebar Drawer**
```css
@media (max-width: 996px) {
  .sidebar {
    position: fixed;
    left: -100%;
    width: 280px;
    height: 100vh;
    transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
  }

  .sidebar.open {
    left: 0;
  }

  /* Overlay behind sidebar */
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    z-index: 99;
  }

  .sidebar.open ~ .sidebar-overlay {
    display: block;
  }
}
```

**Content Area**
```css
@media (max-width: 996px) {
  .main-content {
    max-width: 100%;
    padding: 16px; /* Reduced from 24px-48px */
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 12px; /* Further reduced for small phones */
  }

  h1 {
    font-size: 28px; /* Reduced from 32-36px */
  }

  h2 {
    font-size: 20px; /* Reduced from 24-28px */
  }

  .code-block {
    font-size: 12px; /* Smaller code on mobile */
  }
}
```

### 12.3 Touch-Friendly Spacing

```css
@media (hover: none) and (pointer: coarse) {
  /* Increase touch targets on mobile */
  .nav-link {
    padding: 12px 16px; /* Increased from 10px 12px */
    min-height: 44px; /* Apple's standard touch target */
  }

  a {
    padding: 4px; /* Easier to tap */
  }

  button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## 13. ANIMATION & TRANSITIONS

### 13.1 Global Transition Timing

```css
/* Standard easing for all transitions */
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --easing: cubic-bezier(0.4, 0, 0.2, 1); /* Material Design easing */
}

/* Default: no animations for prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 13.2 Key Animation Patterns

**Hover Lift (Card/Button)**
```css
.interactive-element {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

**Sidebar Expand/Collapse**
```css
.sidebar {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed {
  width: 60px;
}
```

**Navigation Link Active State**
```css
.nav-link {
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--color-blue);
  opacity: 0.05;
  transition: left 200ms cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.nav-link:hover::before {
  left: 0;
}
```

**Color Transition (Theme Toggle)**
```css
html.transitioning {
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              color 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

html.transitioning * {
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              color 300ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 13.3 Performance Notes

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`/`height` on complex layouts; use `max-height` + `overflow: hidden` as workaround
- For sidebar expand/collapse: GitBook uses Motion.dev for physics-based animations (preferred) or CSS `transition` with Recoil state
- Prefer `transition` over `animation` for state changes (hover, focus, toggle)

---

## 14. IMPLEMENTATION RECOMMENDATIONS

### 14.1 Technology Stack

**Frontend Framework**: React + TypeScript (aligns with Claude/Anthropic stack)

**Styling Approach**: Tailwind CSS v4 with CSS custom properties for theming
- Enables rapid prototyping
- Built-in dark mode support
- Design tokens via @theme directive

**Component Library**: shadcn/ui + custom components
- Headless, unstyled components
- Full control over design
- Accessible by default

**Markdown Processing**: MDX (Markdown + JSX)
- Interactive components in docs
- Code syntax highlighting via Shiki
- Tabbed code blocks for multi-language support

**Search**: Algolia or local search (e.g., Meilisearch)
- Real-time indexing
- Faceted search by category/section

**Animations**: Framer Motion or Motion.dev
- Smooth sidebar/modal transitions
- Physics-based animations

### 14.2 File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TableOfContents.tsx
│   │   └── Footer.tsx
│   ├── docs/
│   │   ├── CodeBlock.tsx
│   │   ├── Callout.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── Card.tsx
│   └── common/
│       ├── ThemeToggle.tsx
│       ├── SearchBar.tsx
│       └── NavigationLink.tsx
├── styles/
│   ├── variables.css (CSS custom properties)
│   ├── typography.css
│   ├── layout.css
│   ├── components.css
│   └── animations.css
├── pages/
│   ├── docs/
│   │   ├── [...slug].tsx
│   │   └── index.tsx
│   └── index.tsx
└── lib/
    ├── theme.ts
    └── mdx.ts
```

### 14.3 CSS Custom Properties Structure

```css
/* colors-light.css */
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAF9;

  /* Text */
  --text-primary: #1F2937;
  --text-secondary: #6B7280;

  /* Borders */
  --border-primary: #E5E7EB;

  /* Semantic */
  --color-blue: #3B82F6;
  --callout-tip-bg: #DBEAFE;
  --callout-warning-bg: #FEF08A;
  --callout-note-bg: #F0FDF4;
  --callout-error-bg: #FEE2E2;

  /* Code */
  --code-bg: #F5F5F5;
  --code-text: #1F2937;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: Menlo, Monaco, "Courier New", monospace;

  /* Timing */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* colors-dark.css */
[data-theme="dark"] {
  --bg-primary: #1F2937;
  --bg-secondary: #111827;
  --text-primary: #F3F4F6;
  /* ... etc */
}
```

---

## 15. UNRESOLVED QUESTIONS & LIMITATIONS

### Questions
1. **Code block height limits**: Do Claude/GitBook docs impose max-height on code blocks with scroll, or expand full height? *Not published; likely ~400-500px max-height.*
2. **Search indexing strategy**: Is search client-side (Lunr/MiniSearch) or server-side (Algolia)? *Not disclosed; likely server-side for large docs.*
3. **MDX preprocessor**: Does the site use Docusaurus, Next.js with MDX, or custom pipeline? *Anthropic likely uses custom (implied by redirect to platform.claude.com); GitBook uses proprietary system.*
4. **Sidebar persistence**: Does sidebar width preference persist across sessions? *GitBook blog mentions localStorage via Recoil; Anthropic likely implements similarly.*
5. **Exact Git/commit history**: No public design system commits available. *Proprietary; inferred from published blog posts and observable behavior.*

### Limitations of This Report
- **No pixel-perfect extraction**: Sites do not publish exact design tokens; values reconstructed from industry standards.
- **Static analysis only**: Dynamic behavior (animations, scroll) analyzed from blog disclosures and common patterns.
- **No source access**: Reverse-engineering prevented by minified CSS/JS; relying on public design principles.
- **Responsive behavior extrapolated**: Breakpoints inferred from Docusaurus (996px) standard; exact GitBook/Anthropic breakpoints not published.
- **Color values approximated**: Hex codes based on Tailwind defaults and semantic naming; exact values require browser inspection (not captured in this research).

---

## SOURCES

- [Anthropic Claude Docs](https://platform.claude.com/docs/en/docs/welcome)
- [GitBook Documentation](https://gitbook.com/docs/)
- [GitBook Sidebar Redesign Blog](https://www.gitbook.com/blog/new-sidebar)
- [Docusaurus Styling & Layout](https://docusaurus.io/docs/styling-layout)
- [USWDS Typography](https://designsystem.digital.gov/components/typography/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Motion.dev Library](https://www.framer.com/motion/)
- [Responsive Web Design Best Practices 2025-2026](https://webhelpagency.com/blog/website-dimensions/)
- [Design Tokens Standard](https://www.designtokens.org/)

---

**Report Status**: COMPLETE  
**Confidence Level**: MEDIUM-HIGH (values reconstructed from standards; pixel-perfect values require direct browser inspection)  
**Recommended Next Step**: Implement prototype using Tailwind CSS v4 + MDX, then refine via visual comparison to live sites.

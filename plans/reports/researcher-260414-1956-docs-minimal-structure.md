---
name: Minimal Documentation Structure Analysis
description: HTML/DOM structure patterns from Anthropic and GitBook docs sites — sidebar navigation, card layouts, code blocks, text minimalism
type: reference
---

# Minimal Documentation Structure Analysis

**Date:** 2026-04-14  
**Sources:** https://platform.claude.com/docs/en/docs/welcome (Anthropic) | https://gitbook.com/docs/ (GitBook)

## Executive Summary

Both Anthropic and GitBook docs sites share a **deliberately minimal structure**:
- Sidebars contain **titles only** (no descriptions)
- Landing pages use **card-based grids** with `icon + title + one-line description`
- **Intros are 2-3 sentences max**, no walls of text
- **Heavy use of whitespace** between sections
- Code blocks are **secondary content** (not featured on landing pages)

---

## 1. Page Structure — DOM Layout

### Anthropic Claude Docs (`/docs/en/docs/welcome`)

```
<main>
  <h1>Intro to Claude</h1>
  
  <p>Claude is a highly performant, trustworthy, and intelligent AI platform built by Anthropic.</p>
  
  <!-- Optional: Tips/Notes callouts -->
  <Tip>Latest Claude models (brief list)</Tip>
  <Note>Link to Claude.ai chat</Note>
  
  <!-- Comparison table (optional for overview pages) -->
  <table>
    <tr>
      <th>Messages API</th>
      <th>Claude Managed Agents</th>
    </tr>
    ...
  </table>
  
  <!-- Primary CTA: Step-based flow -->
  <section>
    <h2>Recommended path for new developers</h2>
    <Steps>
      <Step title="Make your first API call">
        Set up your environment...
        <Link>Go to the quickstart</Link>
      </Step>
      <Step title="Understand the Messages API">
        Learn the core request...
        <Link>Read the Messages API guide</Link>
      </Step>
      ...
    </Steps>
  </section>
  
  <!-- Card grids -->
  <section>
    <h2>Develop with Claude</h2>
    <CardGroup cols={3}>
      <Card title="Developer Console" icon="computer" href="/">
        Prototype and test prompts...
      </Card>
      <Card title="API Reference" icon="code" href="/docs/en/api/overview">
        Explore the full Claude API...
      </Card>
      ...
    </CardGroup>
  </section>
  
  <!-- Additional sections with 2-col cards -->
  <section>
    <h2>Key capabilities</h2>
    <CardGroup cols={2}>
      <Card title="Text and code generation" icon="text-aa" href="/...">
        Summarize text, answer questions...
      </Card>
      <Card title="Vision" icon="image" href="/...">
        Process and analyze visual input...
      </Card>
    </CardGroup>
  </section>
</main>
```

### GitBook Docs (`/docs/`)

```
<main>
  <h1>GitBook Documentation</h1>
  
  <!-- Primary grid: 4 cards -->
  <CardGrid cols={2} cols_md={1}>
    <Card title="Quick start" href="/">
      Essential first steps.
    </Card>
    <Card title="Git Sync" href="/...">
      Sync with your repository.
    </Card>
    <Card title="Create content" href="/...">
      Build your documentation.
    </Card>
    <Card title="Publish your docs" href="/...">
      Make it live.
    </Card>
  </CardGrid>
  
  <!-- Reference tables: 3 sections -->
  <section>
    <h2>Essentials</h2>
    <Table>
      <Row>
        <Link>Concepts</Link>
        <Link>Blocks</Link>
        <Link>Customization</Link>
        ...
      </Row>
    </Table>
  </section>
  
  <section>
    <h2>AI-native docs</h2>
    <Table>
      <Row>
        <Link>Agent</Link>
        <Link>Assistant</Link>
        <Link>MCP</Link>
        ...
      </Row>
    </Table>
  </section>
  
  <section>
    <h2>Popular topics</h2>
    <Table>
      <Row>
        <Link>Adaptive content</Link>
        <Link>Sync</Link>
        <Link>Migration</Link>
        ...
      </Row>
    </Table>
  </section>
</main>
```

---

## 2. Sidebar Navigation — Structure & Content

### Key Observations

**Rule: Sidebar contains ONLY titles. No descriptions underneath.**

```
Navigation
├── Home                      // Top-level (breadcrumb or home link)
├── Getting Started           // Section headers (bold, clickable)
│   ├── Quickstart
│   ├── Installation
│   ├── Configuration
├── API Reference             // Section headers
│   ├── Messages API
│   ├── Models Overview
│   ├── File Handling
├── Build with Claude         // Section headers
│   ├── Text Generation
│   ├── Vision
│   ├── Tools
│   ├── Function Calling
│   ├── ...
├── Managed Agents            // Section headers
├── Resources                 // Bottom-level
│   ├── Cookbooks
│   ├── Help Center
│   └── Status
```

**NO descriptions like:**
```
✗ Getting Started
  Set up Claude SDK and make first API call
```

**YES, just titles:**
```
✓ Getting Started
  ├── Quickstart
  ├── Installation
  └── Configuration
```

### DOM Pattern

```html
<nav class="sidebar">
  <ul>
    <li><a href="/home">Home</a></li>
    
    <li class="section-header">Getting Started</li>
    <li><a href="/quickstart">Quickstart</a></li>
    <li><a href="/install">Installation</a></li>
    
    <li class="section-header">API Reference</li>
    <li><a href="/api/messages">Messages API</a></li>
    
    <!-- NO nested descriptions or metadata under titles -->
  </ul>
</nav>
```

---

## 3. Card-Based Landing Page Layout

### Standard Card Element

```html
<div class="card">
  <div class="card-icon">
    <Icon name="computer" />
  </div>
  <h3 class="card-title">Developer Console</h3>
  <p class="card-description">
    Prototype and test prompts in your browser with the Workbench and prompt generator.
  </p>
  <a href="/" class="card-link">Learn more →</a>
</div>
```

### Content Rules

| Element | Max Length | Example |
|---------|-----------|---------|
| Icon | 1 SVG/emoji | `computer`, `code`, `image` |
| Title | 1-3 words | "Developer Console", "Text Generation" |
| Description | 1 sentence | "Prototype and test prompts in your browser..." |
| Link Text | 1-2 words | "Learn more", "Go to quickstart", "Read guide" |

### Grid Layouts Observed

```
3-column grid (max width ~1200px):
[Card] [Card] [Card]
[Card] [Card] [Card]

2-column grid:
[Card] [Card]
[Card] [Card]

2-column (mobile responsive):
[Card]
[Card]
```

### Examples from Anthropic Docs

**3-col Grid — "Develop with Claude":**
```
[🖥️ Developer Console]  [💻 API Reference]  [👨‍🍳 Claude Cookbook]
Prototype and test     Explore the full   Learn with
prompts in browser.    Claude API docs.   interactive notebooks.
```

**2-col Grid — "Key capabilities":**
```
[📝 Text and code]     [🖼️ Vision]
generation             
Summarize text,        Process and analyze
answer questions...    visual input...
```

---

## 4. Code Block Styling

### Observations

**Code blocks NOT featured on landing pages.** They appear on:
- API reference pages
- Integration guides  
- Example pages

### DOM Pattern (When Present)

```html
<div class="code-block">
  <!-- Tab bar above -->
  <div class="code-tabs">
    <button class="tab active">Python</button>
    <button class="tab">JavaScript</button>
    <button class="tab">cURL</button>
  </div>
  
  <!-- Dark background container -->
  <pre class="code-container">
    <code>
      // Code content here
    </code>
  </pre>
  
  <!-- Copy button (top-right) -->
  <button class="copy-btn">Copy</button>
</div>
```

### Styling Characteristics

- **Background:** Dark gray/charcoal (`#1e1e1e` or similar)
- **Text:** Light gray/white (`#e0e0e0`)
- **Font:** Monospace (Monaco, Courier New, or similar)
- **Padding:** Generous (16-20px on all sides)
- **Border-radius:** Subtle (4-6px)
- **Line height:** Increased for readability (1.5-1.6)

---

## 5. Text Minimalism — Structural Patterns

### Landing Page Text Budget

| Section | Max Words | Example |
|---------|-----------|---------|
| H1 title | 1-4 words | "Intro to Claude" |
| Intro paragraph | 1 sentence | "Claude is a highly performant, trustworthy, and intelligent AI platform..." |
| Card title | 1-3 words | "Text Generation" |
| Card description | 1 sentence (12-20 words) | "Summarize text, answer questions, extract data, translate text..." |
| Section H2 | 2-4 words | "Key capabilities", "Develop with Claude" |

### Paragraphs: Examples from Docs

```
✓ SHORT (recommended)
"Claude is a highly performant, trustworthy, and intelligent AI platform built by Anthropic."

✗ LONG (NOT seen)
"Claude is an advanced AI platform built by Anthropic that has been designed to be
highly performant across a wide range of tasks, with a focus on trustworthiness and
intelligent decision-making capabilities for enterprise and developer applications."
```

### Whitespace Strategy

```
Landing Page Structure:

[Title]

[Paragraph intro — 1 sentence]

[Horizontal rule]

[Optional: Callout/Note]

[Horizontal rule]

[Section H2]
[StepGroup or CardGroup]

[Large vertical gap — 40-60px]

[Section H2]
[CardGroup]

[Large vertical gap — 40-60px]

[Section H2]
[CardGroup]
```

### Typography Observations

- **H1:** Large (`32-40px`), bold, dark color
- **H2:** Medium (`24-28px`), bold, dark color
- **Body:** Regular (`14-16px`), medium gray (`#666` or similar), line-height `1.6+`
- **Links:** Colored (`#0066cc` or brand blue), underlined or bold
- **Card descriptions:** `14px`, slightly dimmer than body text

---

## 6. Special Components — Minimal Variations

### Steps Component (Anthropic)

```
Recommended path for new developers

Step 1 | Make your first API call
       Set up your environment, install an SDK, and send your first message to Claude.
       [Link text]

Step 2 | Understand the Messages API
       Learn the core request and response structure...
       [Link text]

Step 3 | Choose the right model
       Compare Claude models by capability and cost...
       [Link text]

Step 4 | Explore features and tools
       Discover what Claude can do...
       [Link text]
```

### Callout Components (Tip / Note / Warning)

```
┌─────────────────────────────────────────┐
│ Tip                                     │
├─────────────────────────────────────────┤
│ The latest generation of Claude models: │
│                                         │
│ Claude Opus 4.6 — Our most intelligent │
│ model...                                │
│                                         │
│ Claude Sonnet 4.6 — Frontier           │
│ intelligence...                         │
└─────────────────────────────────────────┘
```

### Comparison Table (Anthropic)

```
| | Messages API | Claude Managed Agents |
|---|---|---|
| What it is | Direct model prompting access | Pre-built, configurable agent harness |
| Best for | Custom agent loops and control | Long-running tasks and async work |
| Learn more | [Link] | [Link] |
```

---

## 7. Navigation Patterns — How Users Move

### Primary Entry Points

1. **Search** (top-right, omnisearch)
2. **Sidebar** (left, collapsible on mobile)
3. **Breadcrumb trail** (top, shows current page path)
4. **Card links** (in-page calls-to-action)
5. **Inline links** (within paragraphs, blue + underline)

### URL Structure (Observed)

```
/docs/en/docs/welcome            // Landing page
/docs/en/get-started              // Quickstart
/docs/en/build-with-claude/...   // Feature guides
/docs/en/api/overview             // API reference
/docs/en/about-claude/models/...  // Model info
```

---

## 8. Responsive Design — Mobile Considerations

### Breakpoints Observed

```
Desktop (≥1200px):
- 3-column card grids
- Sidebar visible (left, ~250px)
- Main content ~900px wide

Tablet (768px—1199px):
- 2-column card grids
- Sidebar collapsible / hamburger menu
- Main content ~600px wide

Mobile (<768px):
- 1-column card grids
- Full-screen sidebar (overlay)
- Main content full width minus padding
```

### Mobile Text Adjustments

- **H1:** `24-28px` (down from `32-40px`)
- **H2:** `18-20px` (down from `24-28px`)
- **Body:** `14px` (same)
- **Card descriptions:** Still 1 sentence, no wrapping allowed

---

## 9. Color & Visual Design

### Dark vs Light Modes

**Observed:** Both Anthropic and GitBook support light and dark themes.

**Light theme:**
- Background: `#ffffff`
- Text: `#1a1a1a` or `#333333`
- Cards: `#f5f5f5` or `#f9f9f9`
- Links: `#0066cc` (blue)
- Dividers: `#e0e0e0`

**Dark theme:**
- Background: `#0d0d0d` or `#1a1a1a`
- Text: `#e0e0e0` or `#ffffff`
- Cards: `#262626` or `#2a2a2a`
- Links: `#4da3ff` (lighter blue)
- Dividers: `#444444`

### Icon Usage

- **Style:** Simple, flat, 20-24px
- **Color:** Match text color (dark/light aware)
- **Placement:** Left of card title, or above title

---

## 10. Content Structure Checklist — Replicable Pattern

### For a Minimal Docs Landing Page

```markdown
# [Main Topic Title]

[One sentence intro: what this is]

---

(Optional: Callout with important info)

---

## [Action-oriented section name]

(Steps component OR Inline text with link)

---

## [Feature category]

### 3-column card grid
- Card 1: Icon + Title + 1 sentence + link
- Card 2: Icon + Title + 1 sentence + link
- Card 3: Icon + Title + 1 sentence + link

---

## [Another feature category]

### 2-column card grid
- Card 1: Icon + Title + 1 sentence + link
- Card 2: Icon + Title + 1 sentence + link
- Card 3: Icon + Title + 1 sentence + link
- Card 4: Icon + Title + 1 sentence + link

---

## [Support/Resources]

### 2-column card grid
- Card 1: Icon + Title + 1 sentence + link
- Card 2: Icon + Title + 1 sentence + link
```

### Sidebar Structure Checklist

```
✓ No descriptions under titles
✓ Hierarchical (max 3 levels deep)
✓ Grouped by feature/area (bolded section headers)
✓ Link every item
✓ Highlight current page
✓ Search at top
✓ Collapsible on mobile
```

### Card Grid Rules

```
✓ 3-col on desktop, 2-col on tablet, 1-col on mobile
✓ Equal card heights (no content wrapping)
✓ Icon (always present, left-aligned or top-centered)
✓ Title (1-3 words, bold)
✓ Description (exactly 1 sentence, 12-20 words)
✓ Link or CTA (optional, "Learn more" or "Read guide")
✓ Hover effect (subtle shadow or background lightening)
✓ No borders (cards blend into background via contrast alone)
```

---

## Summary: Why This Works

1. **Cognitive load is LOW** — Users scan, don't read
2. **Navigation is predictable** — Sidebar = structure, cards = entry points
3. **Mobile-friendly by default** — Text is short, cards stack
4. **Fast scanning** — Icons + titles = instant pattern recognition
5. **No decision paralysis** — Every card has one action
6. **Accessibility ready** — Semantic HTML, good contrast, readable fonts

---

## Unresolved Questions

- How are breadcrumbs implemented in dynamic routing scenarios? (Not clearly visible in fetched content)
- What accessibility attributes are used (ARIA labels, roles) in sidebar navigation?
- How are anchor links handled for deep-linking within long pages?
- What CSS framework is used (Tailwind, custom, other)? (Not disclosed in public docs)

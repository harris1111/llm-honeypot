# Phase 2: In-App Walkthrough Content

## Context Links
- `apps/web/src/routes/repository-docs.tsx`
- `apps/web/src/content/public-site-content.ts`
- `docs/shipped-app-testing-walkthrough.md`
- `README.md`

## Overview
- Priority: P2
- Current status: completed
- Brief description: move the deeper walkthrough guidance into typed web content and split it into dedicated docs pages that feel like a documentation site instead of a landing-style summary.

## Key Insights
- The walkthrough markdown already maps cleanly to the requested pages.
- The existing `public-site-content.ts` pattern fits a typed content approach and avoids runtime markdown parsing.
- Scope stays smaller if the page bodies are rendered from shared content primitives instead of bespoke JSX per section.

## Requirements
- Render the current deeper guidance in-app rather than pointing readers back to a single markdown file.
- Split content across `getting-started`, `deploy-dashboard`, `enroll-node`, and `smoke-tests` with clear next-step links.
- Preserve the current visual language and reuse public components where possible.
- Keep content concise enough to scan, but retain the current Windows/macOS/Linux command coverage where it matters.

## Architecture
- Create one typed docs content module, likely `apps/web/src/content/public-docs-content.ts`, containing page metadata, summary text, section anchors, command blocks, and next-step links.
- Keep each child route thin: it loads one page definition and renders shared section primitives.
- Use one overview/index page at `/docs` to summarize the four paths, show route cards, and orient first-time visitors.
- Keep walkthrough markdown in the repo as synced reference documentation, not as the app's runtime source.

## Related Code Files
- Phase ownership, create: `apps/web/src/content/public-docs-content.ts`
- Phase ownership, create: docs child route files for `getting-started`, `deploy-dashboard`, `enroll-node`, and `smoke-tests`
- Phase ownership, modify or replace: `apps/web/src/routes/repository-docs.tsx`
- Optional create if a shared renderer is needed: `apps/web/src/components/public/public-docs-page.tsx`

## Implementation Steps
1. Translate current docs quickstart plus walkthrough headings into a page map and section model.
2. Move quickstart, prerequisites, and route orientation into `/docs` and `/docs/getting-started`.
3. Move dashboard boot and local caveats into `/docs/deploy-dashboard`.
4. Move node creation, approval, and startup into `/docs/enroll-node`.
5. Move probes, UI verification, smoke scripts, and teardown into `/docs/smoke-tests`.
6. Add page-to-page next-step links so the flow remains linear for first-time users.

## Todo List
- [x] Define typed docs content schema
- [x] Create the docs index overview content
- [x] Create the four requested leaf pages
- [x] Add section anchors for long pages
- [x] Add next-step links between pages

## Success Criteria
- A new visitor can complete the public docs journey in-app without opening repo markdown.
- Each docs page has a focused scope and does not duplicate large blocks unnecessarily.
- Command blocks remain readable across desktop and mobile widths.
- The docs area still looks like the existing public site, not a separate theme.

## Risk Assessment
- Medium likelihood / high impact: naïvely copying markdown into JSX can create a large, hard-to-maintain route file. Mitigation: extract typed content and shared render primitives early.
- Medium likelihood / medium impact: OS-specific variants can overwhelm one page. Mitigation: keep page boundaries narrow and use anchored subsections.
- Low likelihood / medium impact: exposed local credentials can look production-grade. Mitigation: label them clearly as local bootstrap/testing credentials wherever repeated.

## Security Considerations
- Keep local credentials marked as Docker/local-only bootstrap values.
- Avoid adding examples that imply production-safe defaults for secrets, hostnames, or open ports.

## Next Steps
- Hand off to Phase 3 once URLs, titles, and content boundaries are stable enough to sync the repo docs.
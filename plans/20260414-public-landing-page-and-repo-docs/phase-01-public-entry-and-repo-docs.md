# Phase 01: Public Entry And Repo Docs

## Context Links
- [README.md](../../README.md)
- [docs/system-architecture.md](../../docs/system-architecture.md)
- [docs/development-roadmap.md](../../docs/development-roadmap.md)
- [docs/project-changelog.md](../../docs/project-changelog.md)
- [docs/shipped-app-testing-walkthrough.md](../../docs/shipped-app-testing-walkthrough.md)
- [apps/web/src/router.tsx](../../apps/web/src/router.tsx)
- [apps/web/src/components/layout/sidebar.tsx](../../apps/web/src/components/layout/sidebar.tsx)
- [apps/web/src/routes/overview.tsx](../../apps/web/src/routes/overview.tsx)
- [apps/web/package.json](../../apps/web/package.json)

## Overview
- Priority: P2
- Current status: completed
- Description: add a public landing page with a features section and a public repository documentation page while preserving the existing authenticated dashboard workflows.
- Completed: April 14, 2026

## Current Constraints
- `OverviewRouteView` currently owns `/`, so landing the public homepage requires a route migration, not just a new component.
- The existing app frame only treats `/login` as public; adding more exceptions there would make future public pages brittle.
- The current web package has no markdown rendering dependency, so the repository page should be a static React/Tailwind surface for the first slice.
- The repo already documents apps and packages in `README.md` and `docs/system-architecture.md`; duplicating that content manually in multiple places will drift fast.

## Data Flows
1. Anonymous visitor requests `/` and receives a public landing page with a features section and CTA links to `/login` and `/docs`.
2. Authenticated operator requests `/` and is redirected to `/overview` to preserve the current one-hop dashboard entry behavior.
3. Any unauthenticated request to `/overview`, `/nodes`, `/sessions`, or other dashboard routes still hits auth gating and redirects to `/login`.
4. Any visitor requests `/docs` and receives a public repository explainer page that summarizes each app, package, and key supporting directory.
5. Repository docs content is defined once in the web app and mirrored in repo markdown updates so the public page and open-source docs do not diverge.

## Route And Component Assumptions
- Keep TanStack Router and the current hand-written route tree.
- Replace pathname-based shell branching with two layout branches: a public frame and a dashboard frame.
- Move `OverviewRouteView` from `/` to `/overview`.
- Add `LandingRouteView` at `/`.
- Add `RepositoryDocsRouteView` at `/docs`.
- Keep `/login` public and separate from the dashboard shell.
- Keep the repository docs page static for this slice; do not add markdown parsing, CMS wiring, or API-backed content.
- Keep styling inside the current Tailwind + local CSS approach; no new UI framework or design-system dependency is required.

## Related Code Files

### Likely Existing Files To Edit
- `apps/web/src/router.tsx`
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/components/layout/topbar.tsx`
- `apps/web/src/routes/overview.tsx`
- `apps/web/src/routes/login.tsx`
- `apps/web/src/styles.css`
- `README.md`
- `docs/system-architecture.md`
- `docs/shipped-app-testing-walkthrough.md`
- `docs/project-changelog.md`
- `docs/development-roadmap.md`

### Likely New Files To Add
- `apps/web/src/routes/landing.tsx`
- `apps/web/src/routes/repository-docs.tsx`
- `apps/web/src/components/public/public-header.tsx`
- `apps/web/src/components/public/public-footer.tsx`
- `apps/web/src/components/public/features-section.tsx`
- `apps/web/src/components/public/repository-surface-grid.tsx`
- `apps/web/src/content/public-site-content.ts`

## Content Scope Assumptions
- Landing features section should summarize shipped capabilities already named in `README.md`: multi-protocol emulation, dashboard control plane, threat intel, live feed, archives, and response-engine workflows.
- Repository docs page should cover every deployable app and shared package first, then summarize supporting directories such as `docker`, `templates`, `personas`, `tests`, `docs`, and `plans`.
- Use short explainer cards or sections, not long prose walls; this keeps the page maintainable and typical of open-source landing/docs surfaces.

## Implementation Steps
1. Refactor the router so public pages and authenticated dashboard pages use separate layout branches instead of pathname checks in one frame.
2. Move the authenticated overview route from `/` to `/overview`, then update sidebar navigation and any hard-coded overview links.
3. Build the public landing page with a hero, concise architecture summary, features section, and clear CTA links to sign in and read the repository docs.
4. Build the public repository docs page using a local content map so apps, packages, and supporting directories render from data instead of repeated JSX.
5. Update login or top-level navigation only where needed so moving between landing, docs, and dashboard entry feels deliberate.
6. Update repo markdown docs so quickstart, architecture, changelog, roadmap, and shipped walkthrough all reflect the new public routes and the moved overview entry point.

## File Ownership / Parallelization
- Slice A: routing and dashboard shell ownership for `apps/web/src/router.tsx`, `apps/web/src/components/layout/sidebar.tsx`, and `apps/web/src/components/layout/topbar.tsx`.
- Slice B: public page ownership for new public routes, new public components, `apps/web/src/content/public-site-content.ts`, and `apps/web/src/styles.css`.
- Slice C: repository markdown ownership for `README.md`, `docs/system-architecture.md`, `docs/project-changelog.md`, `docs/development-roadmap.md`, and `docs/shipped-app-testing-walkthrough.md`.
- Rule: Slice C starts after route names are fixed; otherwise the walkthrough and README will churn.

## Test Matrix
- Static validation: web lint, typecheck, and build.
- Manual route smoke: anonymous `/`, anonymous `/docs`, anonymous `/overview` redirect, authenticated `/overview`, and authenticated deep links such as `/nodes`.
- Navigation smoke: sidebar Overview link now targets `/overview`; login CTA from landing works; docs page remains reachable without auth.
- Regression scope: existing dashboard routes, auth flow, and API proxy health path continue to work unchanged.
- Optional later follow-up: add Playwright coverage in `tests/e2e` once browser automation is in scope. Not required for this slice.

## Validation Commands
- `pnpm --filter @llmtrap/web lint`
- `pnpm --filter @llmtrap/web typecheck`
- `pnpm --filter @llmtrap/web build`
- `pnpm --filter @llmtrap/web dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `docker compose --env-file docker/dashboard-compose.local.env -f docker/docker-compose.dashboard.yml up -d --build web api`

## Documentation Updates Needed
- `README.md`: add a short public-web section that names `/`, `/docs`, `/login`, and `/overview` so first-time users understand the split.
- `docs/system-architecture.md`: update the dashboard web surface to mention the public landing/docs routes in addition to the operator dashboard.
- `docs/shipped-app-testing-walkthrough.md`: add explicit checks for the landing page and repository docs page, and change dashboard route verification from `/` to `/overview`.
- `docs/project-changelog.md`: add a dated entry for the new public landing/docs surfaces.
- `docs/development-roadmap.md`: record the shipped web/open-source onboarding improvement if this slice is completed.

## Risk Assessment
- High likelihood, medium impact: the `/` route migration breaks operator habit and bookmarks. Mitigation: redirect authenticated `/` traffic to `/overview` and update walkthrough screenshots or steps.
- Medium likelihood, medium impact: public pages accidentally render dashboard chrome or auth pages inherit marketing chrome. Mitigation: separate layout branches in the router tree.
- Medium likelihood, low impact: repository docs page becomes stale versus README. Mitigation: use one content source inside the web app and require same-change markdown updates.
- Low likelihood, medium impact: scope balloons into a full docs engine. Mitigation: keep the first slice static and card-based.

## Backwards Compatibility
- No API, DB, worker, or package contract changes.
- Preserve `/login` and all existing protected dashboard paths except the overview route.
- Preserve operator convenience by redirecting authenticated root traffic to `/overview`.
- Preserve direct deep links to `/nodes`, `/sessions`, `/actors`, `/personas`, `/response-engine`, `/alerts`, `/threat-intel`, `/live-feed`, `/export`, and `/settings`.

## Rollback Plan
- Repoint `OverviewRouteView` back to `/`.
- Remove the landing and repository docs routes plus the public components.
- Restore the sidebar Overview link to `/`.
- Revert README and walkthrough route references.
- No schema or data rollback is needed because the slice is web-only.

## Success Criteria
- ✅ Anonymous `/` renders a public landing page with a visible features section.
- ✅ Anonymous `/docs` renders a readable repository explainer that covers each app and package plus the main supporting directories.
- ✅ Authenticated dashboard overview still works at `/overview` and all other protected routes behave as before.
- ✅ The router no longer depends on ad hoc pathname checks to decide whether dashboard chrome renders.
- ✅ README and walkthrough docs clearly explain the new public entry points.

## Validation Summary
- ✅ `pnpm --filter @llmtrap/web lint`
- ✅ `pnpm --filter @llmtrap/web typecheck`
- ✅ `pnpm --filter @llmtrap/web build`
- ✅ Code review: no actionable findings
- All success criteria met. Implementation complete.

## Unresolved Question
- Confirm whether authenticated users should always redirect from `/` to `/overview` or whether product wants signed-in users to still see the public landing page with a dashboard CTA. The plan assumes redirect because it best preserves the current operator workflow.
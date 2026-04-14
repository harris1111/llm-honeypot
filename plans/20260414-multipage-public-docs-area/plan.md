---
title: "Multi-Page Public Docs Area Plan"
description: "Split the single public docs page into a small docs area with sidebar navigation and in-app walkthrough content."
status: completed
priority: P2
effort: 8h
branch: main
tags: [web, docs, routing, public-site]
created: 2026-04-14
---

# Multi-Page Public Docs Area Plan

## Current Baseline
- `apps/web/src/router.tsx` already separates the public frame from the authenticated dashboard frame.
- `apps/web/src/routes/repository-docs.tsx` is one static route that mixes quickstart, walkthrough summary, and a handoff back to repo markdown for the deeper path.
- `docs/shipped-app-testing-walkthrough.md` already has a natural split across prerequisites, dashboard bootstrap, node enrollment, node startup, probe/verification, smoke scripts, and teardown.
- Existing public styling primitives already exist in `PublicHeader`, `PublicFooter`, and the current stone/emerald/orange docs treatment.

## Target Shape
- Keep `/`, `/login`, `/overview`, and the existing protected dashboard routes intact.
- Keep `/docs` stable as the public docs entry route.
- Add dedicated docs pages under `/docs` for `getting-started`, `deploy-dashboard`, `enroll-node`, and `smoke-tests`.
- Introduce a reusable docs shell with a left sidebar on desktop and in-page section navigation for long-page/mobile use.
- Render the walkthrough guidance from typed in-app content modules instead of runtime markdown parsing or a repo-markdown dependency.

## Focused Phases
| Phase | File | Effort | Status | Primary outcome |
|---|---|---:|---|---|
| 1 | [phase-01-route-map-and-docs-shell.md](phase-01-route-map-and-docs-shell.md) | 3h | completed | Nested public docs route map and reusable docs shell |
| 2 | [phase-02-in-app-walkthrough-content.md](phase-02-in-app-walkthrough-content.md) | 3h | completed | Walkthrough content split into dedicated in-app pages |
| 3 | [phase-03-docs-sync-and-validation.md](phase-03-docs-sync-and-validation.md) | 2h | completed | Repo docs alignment plus web validation |

## Data Flow
- Input: existing quickstart copy in `repository-docs.tsx` and the canonical walkthrough steps in `docs/shipped-app-testing-walkthrough.md`.
- Transform: normalize that material into typed docs-page metadata, section blocks, and command snippets inside `apps/web/src/content`.
- Output: static React routes rendered inside a shared docs shell with sidebar navigation and anchor links.
- Sync: `README.md` and project docs describe the new public docs area after URLs and page boundaries are stable.

## Dependency Graph
- Phase 1 blocks all follow-on work because the final `/docs/*` route map and shell decide page ownership, nav state, and layout constraints.
- Phase 2 depends on the page taxonomy from Phase 1 so walkthrough content is split once instead of copied into multiple routes.
- Phase 3 depends on finalized URLs, page titles, and verification wording from Phases 1 and 2.
- No API, DB, worker, auth, or dashboard data dependencies exist.

## Backwards Compatibility
- Preserve `/docs` as a reachable overview route instead of replacing it with an immediate redirect.
- Leave `/`, `/login`, `/overview`, and all existing protected dashboard routes unchanged.
- Avoid new libraries like markdown/MDX parsers unless the current typed-rendering approach proves insufficient.
- No schema, env, or compose changes.

## Highest Risks
- Medium: in-app docs and repo docs drift. Mitigation: same-change docs sync and one typed in-app content source.
- Medium: a left sidebar can regress on mobile. Mitigation: responsive stack with compact in-page nav anchors.
- Low: nested `/docs` routes can accidentally disturb auth or active-link behavior. Mitigation: keep them under the existing public frame and validate anonymous plus authenticated navigation.
- Low: moving everything into one new shell can recreate the current monolithic page. Mitigation: enforce page-level boundaries around bootstrap, enrollment, and smoke flows.

## Test Matrix
- Static validation: `pnpm --filter @llmtrap/web lint`, `pnpm --filter @llmtrap/web typecheck`, `pnpm --filter @llmtrap/web build`
- Anonymous route smoke: `/`, `/docs`, `/docs/getting-started`, `/docs/deploy-dashboard`, `/docs/enroll-node`, `/docs/smoke-tests`, `/login`
- Auth route smoke: authenticated visit to `/` still lands on `/overview`; protected dashboard routes remain unchanged
- Visual/manual checks: sidebar active state, anchor navigation, mobile stacking, long command block readability, preserved landing-page styling direction

## Rollback
- Revert the router to a single `/docs` route and remove the new docs shell/content files.
- Keep documentation text changes isolated so the web rollback stays local to `apps/web` plus follow-up wording reverts.
- Because there are no API, DB, or schema changes, rollback impact is limited to public web content.

## Minimal File Targets
- Change: `apps/web/src/router.tsx`
- Change: `apps/web/src/routes/repository-docs.tsx` or replace its responsibilities with a docs shell plus index route
- Likely create: `apps/web/src/content/public-docs-content.ts`
- Likely create: `apps/web/src/components/public/public-docs-layout.tsx`
- Likely create: `apps/web/src/components/public/public-docs-sidebar.tsx`
- Likely create: thin child route files for `getting-started`, `deploy-dashboard`, `enroll-node`, and `smoke-tests`
- Sync after implementation: `docs/shipped-app-testing-walkthrough.md`, `README.md`, `docs/system-architecture.md`, `docs/project-changelog.md`, `docs/development-roadmap.md`
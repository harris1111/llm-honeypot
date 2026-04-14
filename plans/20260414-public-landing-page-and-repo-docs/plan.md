---
title: "Public Landing And Repo Docs Plan"
description: "Add a public homepage with feature highlights and a repository explainer page without breaking the authenticated dashboard."
status: completed
priority: P2
effort: 10h
branch: main
tags: [web, docs, landing-page, routing, open-source]
created: 2026-04-14
completed: 2026-04-14
---

# Public Landing And Repo Docs Plan

## Current Baseline
- `apps/web/src/router.tsx` binds `/` to authenticated `OverviewRouteView`.
- `AppFrame` only skips dashboard chrome for `/login`, so new public pages need a real public layout boundary.
- The web app is static React + TanStack Router + Tailwind; no markdown renderer or CMS is present.
- `README.md` already describes the apps and packages, so the repo-docs page can reuse that structure.

## Focused Phases
| Phase | File | Effort | Status | Primary outcome |
|---|---|---:|---|---|
| 1 | [phase-01-public-entry-and-repo-docs.md](phase-01-public-entry-and-repo-docs.md) | 10h | completed | Public landing at `/`, public repo docs at `/docs`, authenticated overview at `/overview` |

## Dependency Graph
- Router/layout split blocks every UI change because the current shell assumes dashboard chrome for all non-login routes.
- Landing content and repo-docs content can proceed in parallel once the final route map is fixed.
- README and docs updates should happen last, after route names and verification steps are stable.

## Backwards Compatibility
- Move the current authenticated overview to `/overview`.
- Keep `/login` and all other authenticated dashboard routes stable.
- Prefer a signed-in `/` redirect to `/overview`; keep `/docs` public for all users.
- No API, DB, or worker contract changes.

## Highest Risks
- High: operator bookmarks to `/` stop opening the dashboard directly. Mitigation: auth-aware redirect on `/` plus walkthrough update.
- Medium: bolting exceptions into the existing frame makes public routes fragile. Mitigation: split public and dashboard layout routes.
- Medium: repo-doc content drifts from `README.md`. Mitigation: keep one shared content source or enforce same-change doc updates.

## Validation Baseline
- `pnpm --filter @llmtrap/web lint`
- `pnpm --filter @llmtrap/web typecheck`
- `pnpm --filter @llmtrap/web build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Detailed assumptions, file targets, rollback, and documentation impact live in the phase file.
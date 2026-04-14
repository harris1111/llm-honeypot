# Phase 1: Route Map And Docs Shell

## Context Links
- `apps/web/src/router.tsx`
- `apps/web/src/routes/repository-docs.tsx`
- `apps/web/src/components/public/public-header.tsx`
- `apps/web/src/components/public/public-footer.tsx`

## Overview
- Priority: P2
- Current status: completed
- Brief description: replace the single `/docs` route view with a reusable docs shell and explicit public docs child routes without touching dashboard ownership.

## Key Insights
- The public frame already exists, so this is a route-tree extension rather than a shell rewrite.
- `/docs` should remain stable as the public docs entry to avoid breaking existing README links and public bookmarks.
- Four explicit child routes are enough for the requested scope; a markdown engine or CMS is unnecessary.

## Requirements
- Add a public docs parent that supports `/docs` plus the requested child pages.
- Add a left sidebar on desktop and a compact fallback nav for smaller screens.
- Preserve `PublicHeader`, `PublicFooter`, and the current styling direction where reasonable.
- Do not change `/login`, `/overview`, or other protected dashboard paths.

## Architecture
- `router.tsx`: keep `publicFrameRoute`; convert `/docs` into a parent docs route with child pages.
- Docs shell: one shared layout component renders page chrome, sidebar links, page title area, and content slot.
- Navigation metadata: one typed array defines labels, hrefs, and optional section anchors so route config and sidebar stay aligned.
- Data flow: browser path -> TanStack route -> docs shell -> child page content.

## Related Code Files
- Phase ownership, modify: `apps/web/src/router.tsx`
- Phase ownership, modify or replace: `apps/web/src/routes/repository-docs.tsx`
- Phase ownership, create: `apps/web/src/components/public/public-docs-layout.tsx`
- Phase ownership, create: `apps/web/src/components/public/public-docs-sidebar.tsx`
- Optional touch only if active-state behavior needs it: `apps/web/src/components/public/public-header.tsx`

## Implementation Steps
1. Freeze the public docs IA: `/docs`, `/docs/getting-started`, `/docs/deploy-dashboard`, `/docs/enroll-node`, `/docs/smoke-tests`.
2. Refactor the router so `/docs` becomes a parent docs area instead of a single leaf route.
3. Build a shared docs shell with a sidebar, mobile nav fallback, and main content region.
4. Keep header/footer reuse intact so the landing and docs surfaces still feel related.
5. Verify the docs shell stays entirely inside the public frame and does not pull dashboard chrome or auth guards.

## Todo List
- [x] Finalize docs page slugs and labels
- [x] Add parent/child route structure under the public frame
- [x] Add shared docs shell component
- [x] Add sidebar/mobile nav component
- [x] Confirm anonymous and authenticated route ownership stays unchanged

## Success Criteria
- `/docs` and all requested child routes resolve from the public frame.
- The docs area has visible persistent navigation on desktop and usable stacked nav on mobile.
- `/`, `/login`, `/overview`, and protected dashboard views behave exactly as before.
- No new runtime dependency is introduced for markdown rendering.

## Risk Assessment
- High likelihood / medium impact: nested route config can be wired incorrectly and produce duplicate or broken paths. Mitigation: keep explicit static child routes and validate each URL.
- Medium likelihood / medium impact: sidebar active state may not highlight nested docs routes correctly. Mitigation: drive links from one metadata source and verify active behavior manually.

## Security Considerations
- The docs area remains public and static; no new auth state or operator data should leak into the shell.
- Do not expose anything beyond the already documented local bootstrap credentials and localhost-only walkthrough values.

## Next Steps
- Hand off to Phase 2 after the route map and shell structure are stable.
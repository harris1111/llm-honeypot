# Phase 3: Docs Sync And Validation

## Context Links
- `docs/shipped-app-testing-walkthrough.md`
- `README.md`
- `docs/system-architecture.md`
- `docs/project-changelog.md`
- `docs/development-roadmap.md`

## Overview
- Priority: P2
- Current status: completed
- Brief description: align the repo documentation with the new multipage public docs area and validate that the landing page and protected dashboard flows remain intact.

## Key Insights
- The repo already treats the walkthrough as canonical local guidance, so the markdown still matters even after the app renders the same journey.
- The main compatibility promise is that `/docs` stays public while `/overview` and other dashboard paths remain unchanged.
- Validation is mostly web-focused because no API or persistence contracts change.

## Requirements
- Update repo docs to describe the public docs area as a multipage surface rather than one page with a markdown handoff.
- Record the implementation in the changelog and roadmap.
- Validate route behavior, build health, and the preserved landing/dashboard entry flow.

## Architecture
- Documentation updates stay outside `apps/web` and happen only after page titles and routes settle.
- Validation combines static checks with route-level manual smoke.
- Rollback remains cheap because repo docs and web route changes are the only touched surfaces.

## Related Code Files
- Phase ownership, modify: `docs/shipped-app-testing-walkthrough.md`
- Phase ownership, modify: `README.md`
- Phase ownership, modify: `docs/system-architecture.md`
- Phase ownership, modify: `docs/project-changelog.md`
- Phase ownership, modify: `docs/development-roadmap.md`

## Implementation Steps
1. Update walkthrough wording so `/docs` is described as a docs area with dedicated pages.
2. Update README and system architecture to reflect the new public docs IA.
3. Add changelog and roadmap entries for the docs-area upgrade.
4. Run `pnpm --filter @llmtrap/web lint`, `typecheck`, and `build`.
5. Manually verify public docs routes plus `/` and `/login`, then confirm authenticated `/` still lands on `/overview`.

## Todo List
- [x] Sync walkthrough wording with new docs URLs
- [x] Sync README and system architecture references
- [x] Add changelog entry
- [x] Update roadmap status text if scope lands
- [x] Run web validation commands
- [x] Run route smoke for public and protected entry points

## Success Criteria
- Repo documentation no longer implies that deeper guidance only lives in one markdown file.
- Public docs URLs referenced in README and architecture docs match the implemented route map.
- Web lint, typecheck, and build pass after the route/content split.
- Landing and protected dashboard flows remain unchanged apart from docs navigation improvements.

## Risk Assessment
- Medium likelihood / medium impact: wording can lag behind final route names. Mitigation: do docs sync after implementation stabilizes and before merge.
- Low likelihood / medium impact: validation may miss auth regressions if only public docs pages are checked. Mitigation: include authenticated `/` to `/overview` smoke in the validation checklist.

## Security Considerations
- Keep documentation explicit that sample credentials and ports are for local testing.
- Avoid documenting any internal-only route assumptions beyond the already public web surface.

## Next Steps
- After validation passes, implementation can be reviewed and merged without any downstream API or schema rollout.
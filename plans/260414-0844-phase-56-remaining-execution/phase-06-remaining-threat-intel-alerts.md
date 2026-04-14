# Phase 06 Remaining: Threat Intel, Alerts, and Release

## Context Links
- [README.md](../../README.md)
- [docs/development-roadmap.md](../../docs/development-roadmap.md)
- [docs/project-changelog.md](../../docs/project-changelog.md)
- [docs/system-architecture.md](../../docs/system-architecture.md)
- [docs/code-standards.md](../../docs/code-standards.md)
- [Master Phase 6 Plan](../260413-0930-llmtrap-implementation/phase-06-threat-intel-alerts.md)
- [Current threat-intel service](../../apps/api/src/modules/threat-intel/threat-intel.service.ts)
- [Current alert processor](../../apps/worker/src/processors/alert-processor.service.ts)
- [Current live-feed service](../../apps/api/src/modules/live-feed/live-feed.service.ts)

## Overview
- Priority: P1 after Phase 05 remaining
- Current status: pending
- Description: finish the unfinished operator automation layer by adding real alert delivery, live websocket transport, filterable intel export depth, archival and retrieval, and repo-owned validation or release steps.

## Landed Baseline
- `apps/api` already exposes threat-intel preview endpoints for blocklist, IOC feed, MITRE summary, and STIX bundle generation.
- `apps/api` already exposes alert rule CRUD, export report and dataset endpoints, and REST polling live-feed queries.
- `apps/worker` already evaluates rules and materializes internal `AlertLog` rows.
- `apps/web` already renders read-only alerts, threat-intel, export, and polling live-feed screens.
- `packages/db` already includes `AlertRule`, `AlertLog`, `IpEnrichment`, `BudgetEntry`, and threat-actor-related tables.

## Remaining Scope
- Deliver alerts through webhook, Discord, Telegram, and SMTP instead of only writing internal logs.
- Add live websocket transport with filterable rooms while keeping REST polling fallback as the default-safe path.
- Deepen blocklist, IOC, MITRE, and STIX outputs from fixed previews into filterable, exportable operator tools.
- Add cold-storage archival and retrieval with manifest tracking instead of only live-database export.
- Add repo-owned validation assets for the new slices and close the release-prep gap after feature behavior stabilizes.

## Data Flows
1. Worker sees a classified or enriched session, evaluates enabled alert rules, dispatches each matched channel, and records one log row per delivery attempt with status and error detail.
2. API publishes live-feed events to Socket.IO rooms keyed by node, service, classification, and source IP; web subscribes when the operator enables live mode and falls back to REST polling when sockets are disabled or disconnected.
3. Threat-intel endpoints aggregate sessions, requests, actors, and enrichment data into filtered blocklists, IOC feeds, MITRE summaries, and STIX bundles without breaking current default responses.
4. Archival jobs export old sessions and requests to JSONL.gz, upload to S3-compatible storage, store a manifest row, and expose retrieval metadata through the dashboard.

## Related Code Files

### API
- Modify `apps/api/src/modules/alerts/alerts.service.ts`
- Modify `apps/api/src/modules/alerts/alerts.schemas.ts`
- Modify `apps/api/src/modules/alerts/alerts.controller.ts`
- Modify `apps/api/src/modules/threat-intel/threat-intel.service.ts`
- Modify `apps/api/src/modules/threat-intel/threat-intel.controller.ts`
- Modify `apps/api/src/modules/threat-intel/mitre-mappings.ts`
- Modify `apps/api/src/modules/live-feed/live-feed.service.ts`
- Modify `apps/api/src/modules/live-feed/live-feed.controller.ts`
- Modify `apps/api/src/modules/export/export.service.ts`
- Modify `apps/api/src/modules/export/report-renderer.ts`
- Modify `apps/api/src/config/env-config.ts`
- Likely add `apps/api/src/modules/live-feed/live-feed.gateway.ts`
- Likely add `apps/api/src/modules/alerts/channels/*`
- Likely add `apps/api/src/modules/settings/*`
- Likely add `apps/api/src/modules/cold-storage/*`

### Worker
- Modify `apps/worker/src/processors/alert-processor.service.ts`
- Modify `apps/worker/src/worker.service.ts`
- Modify `apps/worker/src/worker.module.ts`
- Modify `apps/worker/src/config/worker-runtime-config.service.ts`
- Likely add `apps/worker/src/processors/archival-processor.service.ts`
- Likely add `apps/worker/src/processors/blocklist-publish-processor.service.ts`
- Likely add `apps/worker/src/processors/report-processor.service.ts`

### Web
- Modify `apps/web/src/lib/api-client.ts`
- Modify `apps/web/src/routes/alerts.tsx`
- Modify `apps/web/src/routes/threat-intel.tsx`
- Modify `apps/web/src/routes/live-feed.tsx`
- Modify `apps/web/src/routes/export.tsx`
- Modify `apps/web/src/routes/settings.tsx`
- Modify `apps/web/src/hooks/use-alerts.ts`
- Modify `apps/web/src/hooks/use-live-feed.ts`
- Modify `apps/web/src/hooks/use-export.ts`
- Likely add `apps/web/src/hooks/use-live-feed-socket.ts`
- Likely add `apps/web/src/components/alerts/*`
- Likely add `apps/web/src/components/threat-intel/*`

### Packages
- Modify `packages/shared/src/contracts/api-contract.ts`
- Modify `packages/shared/src/types/index.ts`
- Modify `packages/db/prisma/schema.prisma`
- Likely add Prisma tables for archive manifests or settings only where existing models cannot represent the needed state
- Likely add shared contracts for alert channel config, archive records, websocket payloads, and blocklist filters

## Repo-Level Validation Assets
- Add real tests under `apps/web` instead of the current placeholder `test` script.
- Add smoke coverage under `tests/smoke` for alert delivery stubs, websocket live feed, and archive retrieval.
- Add e2e coverage under `tests/e2e` for operator flows that now span alerts, threat intel, export, and live feed.

## Implementation Steps
1. Add settings storage and validation for outbound alert channels and cold-storage credentials, with encrypted secrets and redacted read responses.
2. Extend alert processing from internal log materialization to real delivery adapters with retries, cooldown handling, and per-channel success or failure persistence.
3. Add Socket.IO live-feed transport, but keep the existing REST `live-feed/events` endpoint and polling UI as the default-safe fallback.
4. Deepen threat-intel generation so blocklist, IOC, MITRE, and STIX endpoints accept filters and use actor and enrichment context rather than only recent raw records.
5. Add archival manifests, export old data to JSONL.gz, upload to S3-compatible storage, and expose retrieval metadata in the dashboard.
6. Expand the web UI from preview-only panels to rule editing, delivery observability, websocket controls, filterable intel export, and archive browsing.
7. Finish with repo-owned validation and release preparation only after feature behavior and contracts settle.

## Todo List
- [ ] Keep current alert rules and logs working while adding external delivery.
- [ ] Keep live-feed polling working while adding websocket transport.
- [ ] Turn threat-intel previews into filterable exports without breaking current default requests.
- [ ] Add archive manifests and retrieval before attempting automated publication or retention cleanup.
- [ ] Replace placeholder web tests and empty repo-level smoke or e2e directories with real checks for the new workflows.
- [ ] Sequence CI and release prep after the feature contract is stable, not before.

## Test Matrix
- Unit: alert channel adapters, MITRE mapping helpers, STIX builders, blocklist filter logic, archive manifest naming.
- Unit: websocket event filter and room-key helpers.
- Integration: alert dispatch status persistence, live-feed REST plus websocket parity, threat-intel filtered exports, archive upload and retrieval metadata.
- UI: alert rule CRUD, delivery history, live-feed socket fallback, export generation, archive list and download actions.
- E2E or smoke: one end-to-end alert delivery path, one websocket live-feed path, one archive retrieval path.

## Validation Commands
- `pnpm --filter @llmtrap/api lint`
- `pnpm --filter @llmtrap/api typecheck`
- `pnpm --filter @llmtrap/api test`
- `pnpm --filter @llmtrap/worker lint`
- `pnpm --filter @llmtrap/worker typecheck`
- `pnpm --filter @llmtrap/worker test`
- `pnpm --filter @llmtrap/web lint`
- `pnpm --filter @llmtrap/web typecheck`
- `pnpm --filter @llmtrap/web build`
- `pnpm --filter @llmtrap/web test`
- `pnpm db:generate`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `docker compose -f docker/docker-compose.dashboard.yml config`
- `docker compose -f docker/docker-compose.node.yml config`

## Risk Assessment
- High likelihood, high impact: channel delivery errors fill logs without operator value. Mitigation: bounded retries, circuit-breaker semantics, and visible failure reasons.
- Medium likelihood, high impact: websocket fan-out or reconnect churn overwhelms API. Mitigation: filtered rooms, capped event windows, and default polling fallback.
- Medium likelihood, medium impact: S3 archival adds secret and retention complexity. Mitigation: start with one archive manifest model and manual retrieval before automated expiration.
- Medium likelihood, medium impact: release tasks consume time before behavior is stable. Mitigation: keep CI or release prep as the final gate.

## Backwards Compatibility
- Preserve current alert rule schema and internal alert log records.
- Preserve current REST live-feed endpoint and polling UI.
- Preserve current threat-intel default endpoint behavior for callers that send no filters.
- Preserve current export report and dataset routes while adding new formats or filters.

## Rollback Plan
- Disable external channels and keep writing internal alert logs only.
- Turn off websocket transport and fall back to REST polling everywhere.
- Stop archival scheduling and keep export functionality database-only.
- Leave release automation out of the branch if the feature set is not yet contract-stable.

## Success Criteria
- Alert rules can deliver through at least webhook plus one chat channel with visible status per attempt.
- Operators can opt into websocket live feed and recover cleanly to polling on failure.
- Threat-intel endpoints return filterable blocklist, IOC, MITRE, and STIX outputs grounded in actor and enrichment data.
- Archived datasets can be listed and retrieved from the dashboard using manifest metadata.
- Repo-level tests exist for the new web and end-to-end workflows instead of placeholder or empty harnesses.

## Next Steps
- After this phase completes, update the roadmap and changelog to move Phase 5 and Phase 6 from in progress to complete only if the validation matrix above passes end to end.
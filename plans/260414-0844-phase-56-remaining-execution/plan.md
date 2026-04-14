---
title: "Remaining Phase 5/6 Execution Plan"
description: "Focused execution plan for unfinished intelligence, threat intel, and alerting work after the landed baseline."
status: pending
priority: P1
effort: 44h
branch: main
tags: [phase-5, phase-6, intelligence, alerts, threat-intel]
created: 2026-04-14
---

# Remaining Phase 5/6 Execution Plan

## Current Baseline
- Landed API modules: `analytics`, `personas`, `response-config`, `sessions`, `actors`, `alerts`, `threat-intel`, `export`, and `live-feed`.
- Landed worker processors: classification, enrichment, actor correlation, and alert-log materialization.
- Landed web routes: sessions, actors, personas, alerts, threat intel, export, live feed, and node response-config preview.
- Missing execution depth: node runtime never consumes `responseConfig`; `@llmtrap/response-engine` still does template or static only; enrichment is synthetic; alerts stop at internal logs; live feed is polling-only; cold storage and release automation are absent.

## Focused Phases
| Phase | File | Effort | Status | Primary outcome |
|---|---|---:|---|---|
| 5R | [phase-05-remaining-intelligence-engine.md](phase-05-remaining-intelligence-engine.md) | 24h | pending | Real response orchestration, backfeed queue, rule-driven classification and enrichment, persona consistency |
| 6R | [phase-06-remaining-threat-intel-alerts.md](phase-06-remaining-threat-intel-alerts.md) | 20h | pending | External alert delivery, websocket live feed, richer intel exports, cold storage, release validation |

## Dependency Graph
- 5R.1 runtime strategy execution blocks all remaining intelligence work.
- 5R.2 budget accounting and backfeed review depends on 5R.1.
- 5R.3 configurable classification, enrichment, and persona consistency depends on 5R.1 capture metadata.
- 6R.1 alert delivery and websocket live feed depends on 5R.3 stable session and actor data.
- 6R.2 threat-intel export deepening depends on 5R.3 and 6R.1.
- 6R.3 cold storage, CI, and release prep stays last to avoid locking unstable payload contracts.

## Highest-Value Execution Order
1. Make node runtime honor stored response config and route requests through a real strategy orchestrator with safe template fallback.
2. Turn `ResponseTemplate` and `BudgetEntry` into a usable backfeed and spend-control workflow.
3. Replace synthetic worker heuristics with persisted rule and provider loading.
4. Deliver alerts externally and add Socket.IO live feed while preserving current REST and polling behavior.
5. Finish filtered intel exports, archival and retrieval, and repo-level validation or release automation.

## Backwards Compatibility
- Keep `Node.config.responseConfig` as the persisted contract for this slice.
- Keep current REST `live-feed/events`, `threat-intel/*`, and `export/*` endpoints working with default behavior.
- Keep internal alert log creation even when external channel delivery fails.
- Keep template or static fallback available when proxy, budget, enrichment, or socket dependencies fail.

## Risks
- High: proxy timeout or provider failure causes obvious behavior drift. Mitigation: bounded timeout, retry cap, template fallback, capture-level strategy tagging.
- High: budget races overcount or overspend. Mitigation: atomic `BudgetEntry` updates and a hard stop before proxy dispatch.
- Medium: rule configurability balloons scope. Mitigation: ship persisted JSON rule packs, not a full DSL.
- Medium: websocket fan-out degrades API. Mitigation: room filters, bounded backlog, default-off polling fallback.

## Parallelization Boundaries
- Workstream A owns `packages/response-engine`, `packages/shared`, `packages/db`, and the node runtime integration needed by 5R.1.
- Workstream B owns `apps/worker` processors and only consumes shared or package contracts from A.
- Workstream C owns `apps/web` after API contracts for each slice stabilize.
- Workstream D owns `apps/api` threat-intel, alerts, live-feed, and export after A sets shared contracts.

## Validation Baseline
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `docker compose -f docker/docker-compose.dashboard.yml config`
- `docker compose -f docker/docker-compose.node.yml config`

Detailed TODOs, file targets, failure modes, rollback, and per-slice validation live in the two phase files above.
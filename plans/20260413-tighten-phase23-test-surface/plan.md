---
title: "Tighten Phase 2/3 Automated Test Surface"
description: "Replace placeholder api/node test scripts with minimal high-value Vitest coverage for core Phase 2/3 services."
status: completed
priority: P2
effort: 4h
branch: feat/fullstack/dashboard-node-core
tags: [testing, phase-2, phase-3, api, node]
created: 2026-04-13
---

# Scope

Completed on 2026-04-13.
Validation completed with:
- `pnpm --filter @llmtrap/api test`
- `pnpm --filter @llmtrap/node test`
- `pnpm --filter @llmtrap/api typecheck`
- `pnpm --filter @llmtrap/node typecheck`
- `pnpm test`
- `pnpm build`

- Replace the placeholder test scripts in apps/api and apps/node with real Vitest runs.
- Keep coverage narrow: service-level logic that backs the already-validated runtime smoke.
- Non-goals: controller tests, full-stack DB tests, Docker/E2E, web/worker work, Phase 4 expansion.

# Data Flows To Lock

- Auth/session: request input -> Prisma user/session access -> JWT or TOTP challenge -> audit event.
- Capture ingestion: node key + batch -> node approval -> duplicate check -> session grouping -> audit count.
- Node sync: runtime state -> register/config/heartbeat/flush calls -> dashboard client -> sync error/status transitions.

# Ordered Steps

1. Add the minimal Vitest harness.
   Depends on: none. Owner: harness only.
   Edit: package.json, apps/api/package.json, apps/node/package.json.
   Create: apps/api/vitest.config.ts, apps/node/vitest.config.ts.
   Notes: keep tests under test/ so the current src-only tsconfig build surface stays unchanged.

2. Add API service tests.
   Depends on: step 1. Owner: api only.
   Create: apps/api/test/auth.service.spec.ts, apps/api/test/capture.service.spec.ts.
   Optional seam only if mocks become brittle: apps/api/src/modules/auth/auth.service.ts or apps/api/src/modules/capture/capture.service.ts with tiny injectable helpers and no behavior changes.
   Cases:
   - AuthService: invalid login accumulates attempts and rate-limits on the sixth attempt; TOTP-enabled login returns a temp token instead of a full session; refreshSession rejects expired or missing sessions and rotates the session on success.
   - CaptureService: rejects invalid node key or non-ONLINE node; de-duplicates identical captures; groups same source/service traffic inside the 5 minute window and increments requestCount.

3. Add node runtime/sync tests.
   Depends on: step 1. Owner: node only.
   Create: apps/node/test/runtime-state.service.spec.ts, apps/node/test/dashboard-api.service.spec.ts, apps/node/test/node-lifecycle.service.spec.ts.
   Optional seam only if state isolation is hard to guarantee: apps/node/src/runtime/runtime-state.service.ts with a narrow reset helper.
   Cases:
   - RuntimeStateService: applyRegistration/applyConfig mutate state, buildHeartbeat requires a registered node, markSyncError and clearSyncError behave deterministically.
   - DashboardApiService: emits expected URL, method, headers, and body; parses valid envelopes; surfaces dashboard error messages; rejects invalid envelopes.
   - NodeLifecycleService: registers before other cycles, skips duplicate in-flight cycles, clears sync error on success, marks sync error on failures, and clears timers on destroy.

4. Aggregate and keep rollback simple.
   Depends on: steps 2 and 3.
   Success criteria: package test scripts run Vitest, package-local tests pass without Docker, and root pnpm test passes through Turbo.

# Test Matrix

- Unit/mock: all listed service specs.
- Integration/E2E: none in this slice.
- Regression focus: auth token issuance and rotation, capture session grouping, node registration and sync error handling.

# Risks And Mitigation

- High: RuntimeStateService uses a static store and can leak state across tests. Mitigate with module resets or a tiny internal reset helper.
- Medium: Prisma transaction mocks can become brittle. Mitigate by mocking only the methods touched by each service path.
- Medium: timer assertions can get noisy. Mitigate with fake timers and assertions on observable state transitions, not every interval callback.

# Compatibility And Rollback

- Backwards compatibility: no external API or runtime contract changes required; tests live outside src/.
- Rollback: remove Vitest config and spec files, revert package test scripts, and remove any optional test-only helper.

# Validation Sequence

1. pnpm --filter @llmtrap/api test
2. pnpm --filter @llmtrap/node test
3. pnpm --filter @llmtrap/api typecheck
4. pnpm --filter @llmtrap/node typecheck
5. pnpm test
6. pnpm build

# Unresolved Question

- Prefer a single workspace Vitest dependency at the root unless package-local isolation is explicitly required.
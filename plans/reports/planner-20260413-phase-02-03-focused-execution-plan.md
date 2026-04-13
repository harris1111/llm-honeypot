# Focused Execution Plan: Phase 2 + Phase 3

Date: 2026-04-13
Scope: Deliver Phase 2 (Dashboard Foundation) and Phase 3 (Honeypot Node Core) in one pass on top of the completed Phase 1 scaffold, with the fewest coherent slices and the smallest cross-team coordination surface.

## Repo Reality

- `apps/api` is a NestJS stub with only `GET /api/v1/health`.
- `apps/node` is a single-port NestJS stub with `GET /internal/health` and a placeholder root route.
- `apps/web` is a static React page with React Query only; no router, auth, or state layer.
- `packages/shared` already owns env parsing and base types.
- `packages/db` already contains a much richer Prisma schema than the app code uses.
- `packages/response-engine` and `packages/persona-engine` are placeholders, not production engines.
- Current plan docs assume far more code exists than Phase 1 actually delivered.

## Planning Stance

Use contract-first sequencing. Freeze shared types, Prisma shape, auth/capture/node-control-plane DTOs, and dependency additions before app code branches.

Keep the first end-to-end node path narrow:

1. Dashboard control plane works.
2. Web can log in and manage nodes.
3. Node can register, heartbeat, pull config, buffer captures, and sync them.
4. One protocol emulator proves the capture and response path.
5. Remaining protocols reuse the same response and capture primitives.

## Required Decisions Before Coding

### 1. Offline buffer backend

There is a live doc mismatch:

- `docs/system-architecture.md` describes local Redis buffering in the node stack.
- `phase-03-honeypot-node-core.md` describes SQLite buffering.
- `packages/shared/src/schemas/env-schema.ts` already requires `REDIS_URL` for the node.

Recommendation: use local Redis for Phase 3 v1.

Reason:

- Matches the current node env contract and documented node stack.
- Avoids introducing native SQLite build/runtime complexity into the first pass.
- Is good enough for a bounded offline spool if the queue is explicit and capped.

Consequence:

- Treat buffer durability across full node container loss as out of scope for this pass.
- If durable local storage becomes a hard requirement, make that a later migration, not a Phase 2/3 blocker.

### 2. Secret storage fields

Current docs say node API keys and refresh tokens should be hashed at rest, but the Phase 1 Prisma schema still stores raw values:

- `Node.nodeKey`
- `UserSession.refreshToken`

Recommendation: correct this in Slice 0 before implementation code lands.

Minimal contract fix:

- replace raw `nodeKey` persistence with `nodeKeyHash` plus optional display-only key prefix/label
- replace raw `refreshToken` persistence with `refreshTokenHash`

### 3. Capture ingestion ownership

`phase-03-honeypot-node-core.md` adds dashboard-side capture ingestion under the node phase, but that API surface is a hard dependency for the node.

Recommendation: treat capture ingestion as a cross-phase API deliverable owned by the dashboard control plane work, even if it is only used by the node.

## Authoritative Data Flows

### Auth flow

Browser -> `POST /api/v1/auth/login` -> API auth service -> Prisma user/session tables -> access + refresh tokens -> browser auth store -> protected API calls.

### Node enrollment flow

Node boot -> `POST /api/v1/nodes/register` with node key + metadata -> API node service -> node status update -> config response -> node starts heartbeat -> `GET /api/v1/nodes/:id/config` on refresh cadence.

### Capture flow

Attacker request -> node protocol controller -> capture extractor -> session grouper -> local spool if dashboard unavailable, else batch upload -> `POST /api/v1/capture/batch` -> API persists request + session linkage.

### Response flow

Protocol request -> protocol adapter -> shared response engine -> template match -> persona substitution -> stream formatter -> response to attacker -> capture response metadata.

## Smallest Coherent Execution Slices

### Slice 0: Contract Freeze and Dependency Alignment

Goal: remove schema/doc ambiguity before app work starts.

Owner:

- `packages/shared/**`
- `packages/db/**`
- root/package manifests only

Depends on: Phase 1 only.

Deliver:

- shared DTOs/types for auth, node registration, node config, heartbeat, capture batch, and persona payloads
- Prisma migration for hashed token/key storage and any missing indexes for node/capture paths
- dependency additions for API auth stack, web router/state stack, node streaming/realtime stack, test stack
- explicit choice of Redis spool over SQLite for Phase 3 v1

Validation:

- `pnpm db:generate`
- build/typecheck for `packages/shared` and `packages/db`
- contract review: no remaining raw secret persistence

Rollback:

- revert the migration and package changes before module code starts; no app code depends on Slice 0 outputs yet

### Slice 1: Dashboard Control Plane API Core

Goal: create the minimum API surface both the web app and the node require.

Owner:

- `apps/api/**`

Depends on: Slice 0.

Deliver:

- auth: first-user register, login, refresh, logout
- nodes: create/list/detail/update/delete, register, approve, config fetch
- health: keep current health endpoint stable
- capture ingestion: `POST /api/v1/capture/batch`
- common infra: Zod validation, exception envelope, auth guards, role guards, Prisma repositories

Explicitly defer from this slice:

- TOTP
- invite UX polish
- browser realtime features
- analytics endpoints

Validation:

- integration tests for register/login/refresh/logout
- integration tests for node create -> register -> approve -> config fetch
- integration tests for capture batch insert + session linkage
- narrow build/typecheck for `@llmtrap/api`

Rollback:

- remove module imports from `AppModule`; DB migration remains additive and safe

### Slice 2: Dashboard Web Shell Against Real API

Goal: make the dashboard usable without waiting for node protocol emulation.

Owner:

- `apps/web/**`

Depends on: Slice 1 contract freeze and running API endpoints.

Deliver:

- TanStack Router shell
- login route and guarded app layout
- auth store with refresh handling
- nodes list and node detail/config page
- settings page as placeholder only
- polling for node status; no web socket push required for browser yet

Validation:

- web typecheck/build
- one browser flow: login -> list nodes -> approve/edit node -> logout

Rollback:

- keep current static scaffold page or leave login route as the default app entry if needed

### Slice 3: Dashboard Hardening and Admin Features

Goal: finish the dashboard foundation without blocking node core.

Owner:

- `apps/api/**`
- small `apps/web/**` follow-up for user management screens only if time remains

Depends on: Slice 1. Can run in parallel with Slice 4 only after API contracts in Slice 1 are merged.

Deliver:

- RBAC enforcement
- users CRUD / invite flow
- TOTP setup and verification
- rate limiting on auth endpoints
- audit log writes for auth and node config mutations

Validation:

- integration tests for role enforcement
- integration tests for TOTP branch and refresh rotation
- regression test that node registration/config endpoints still work

Rollback:

- disable the feature modules or guards independently; core node control-plane paths remain intact from Slice 1

### Slice 4: Node Control Plane and Persona Sync

Goal: make a real node join the dashboard before any protocol traffic matters.

Owner:

- `apps/node/src/config/**`
- `apps/node/src/sync/**`
- `packages/persona-engine/**`

Depends on: Slice 1 and Slice 0 shared contracts.

Deliver:

- node bootstrap config loader
- registration on boot
- heartbeat loop
- periodic config refresh
- persona snapshot/normalization shared through `packages/persona-engine`
- bounded local Redis spool abstraction for unsent captures

Validation:

- node boot against local API: register -> approve -> heartbeat -> config refresh
- forced dashboard outage: confirm captures queue instead of failing request handling

Rollback:

- node remains a single-port health-only scaffold; dashboard APIs are still usable without the node

### Slice 5: Capture Pipeline End to End

Goal: prove the node can record attacker traffic and the dashboard can persist it correctly.

Owner:

- `apps/node/src/capture/**`
- `apps/api/src/modules/capture/**`
- `packages/shared/**` only if a contract gap remains

Depends on: Slice 4.

Deliver:

- request/response metadata extraction
- session grouping by IP + service + 5 minute gap
- batch upload path with idempotent handling expectations
- minimal persistence model wiring only; no Phase 5 classification logic yet

Validation:

- integration test for capture batch persistence
- reconnect test: offline queue flushes once, no duplicate request rows
- load sanity test at planned concurrency for capture insert path

Rollback:

- disable batch sync and keep capture in-memory on the node for dev-only fallback; do not block dashboard auth/web work

### Slice 6: First Protocol Vertical Slice (Ollama Only)

Goal: validate the protocol, response, persona, and capture stack with the cheapest realistic emulator.

Owner:

- `apps/node/src/protocols/ollama/**`
- `apps/node/src/response-engine/**`
- `packages/response-engine/**`

Depends on: Slice 5 and Slice 4.

Deliver:

- `/api/tags`, `/api/version`, `/api/generate`, `/api/chat`
- persona-aware model list and metadata
- template loading, match, substitution, streaming primitives
- latency/jitter simulation shared by later protocols

Explicitly defer in this slice:

- full template corpus size target
- `/api/pull`, `/api/ps`, `/api/show` polish beyond a deterministic fake response

Validation:

- `curl` and Ollama-compatible client smoke tests
- streamed NDJSON shape validation
- capture record includes request body and streamed-response summary

Rollback:

- keep node registration/sync live while disabling protocol module import

### Slice 7: Protocol Expansion (OpenAI + Anthropic)

Goal: finish Phase 3 by reusing the proven engine and capture stack rather than building new parallel code paths.

Owner:

- `apps/node/src/protocols/openai/**`
- `apps/node/src/protocols/anthropic/**`
- shared stream formatter helpers in `packages/response-engine/**`

Depends on: Slice 6.

Deliver:

- OpenAI: `/v1/models`, `/v1/chat/completions`, `/v1/completions`, deterministic placeholder `/v1/embeddings`
- Anthropic: `/v1/messages`, `/anthropic/v1/messages`, `/v1/models`
- protocol-specific SSE/JSON chunk formatters only; matching/substitution stays shared

Validation:

- official SDK smoke tests or closest protocol-compatible clients
- SSE framing verification under stream mode
- regression that queue/capture paths still behave the same as Ollama

Rollback:

- disable either protocol module independently; Ollama path remains the stable fallback

## Dependency Graph

Required order:

`Slice 0 -> Slice 1 -> Slice 2`

`Slice 0 -> Slice 1 -> Slice 3`

`Slice 0 -> Slice 1 -> Slice 4 -> Slice 5 -> Slice 6 -> Slice 7`

Parallel window after Slice 1:

- API hardening team: Slice 3
- Web team: Slice 2
- Node team: Slice 4

No file-overlap rule for that parallel window:

- Slice 3 owns only `apps/api/**`
- Slice 2 owns only `apps/web/**`
- Slice 4 owns only `apps/node/**` and `packages/persona-engine/**`
- `packages/shared/**` is frozen after Slice 0 unless a true contract bug is found

## Cross-Repo Dependency Map

### `packages/shared`

Provides the source-of-truth DTOs and type contracts for:

- API controller inputs/outputs
- web client types
- node registration, heartbeat, config, and capture payloads

Rule: after Slice 0, changes here are expensive because they ripple into all three apps.

### `packages/db`

Unblocks:

- API auth/session persistence
- node approval/config persistence
- capture/session persistence

Rule: all schema changes needed for Phase 2 and 3 should land together up front to avoid migration churn.

### `packages/persona-engine`

Unblocks:

- node config application
- protocol response substitution

Rule: keep it narrow in this pass. It should normalize and expose persona state, not implement Phase 5 response strategy logic.

### `packages/response-engine`

Unblocks:

- Ollama first
- then OpenAI and Anthropic format adapters

Rule: shared engine owns matching, substitution, tokenization, and stream pacing. Protocol modules only own transport framing.

### `apps/web`

Depends on:

- auth endpoints
- nodes CRUD/approve/config endpoints

Does not depend on:

- capture ingestion
- node protocol emulation
- Phase 5 analytics

### `apps/node`

Depends on:

- node registration/approval/config endpoints
- heartbeat path
- capture batch ingestion endpoint
- persona payload contract

Does not depend on:

- users CRUD
- dashboard analytics UI

## Highest-Risk Validation Points

1. Secret-storage migration correctness.
   - Risk: raw refresh tokens or node keys remain persisted.
   - Check: inspect migration and integration tests before app feature work starts.

2. Node registration/approval/config handshake.
   - Risk: dashboard and node disagree on node identity, status transitions, or config shape.
   - Check: boot a real node against a local API before implementing protocol adapters.

3. Streaming protocol compatibility.
   - Risk: Ollama/OpenAI/Anthropic SDKs reject framing even when JSON bodies look close.
   - Check: run protocol-specific smoke tests immediately after each adapter lands, not at the end.

4. Offline spool flush semantics.
   - Risk: reconnect causes duplicates, lost captures, or backpressure on the node.
   - Check: disconnect dashboard, generate traffic, reconnect, verify exactly-once-or-explicitly-idempotent behavior.

5. Session grouping stability.
   - Risk: the same actor/request stream fragments into many sessions or merges unrelated traffic.
   - Check: replay mixed traffic from same IP across protocol/service/time-gap boundaries.

6. Auth branching with TOTP and refresh rotation.
   - Risk: login branch or refresh rotation breaks normal login, or stale refresh tokens remain valid.
   - Check: integration matrix across first-user bootstrap, normal login, TOTP login, logout, and rotated refresh token reuse.

7. Contract drift after Slice 0.
   - Risk: web or node teams edit shared DTOs mid-stream and break parallel work.
   - Check: freeze shared package ownership after Slice 0 and require explicit review for any change.

## Test Matrix

### Unit

- shared DTO and env validation
- token hashing and comparison helpers
- response-engine matching/substitution/stream pacing
- persona normalization helpers
- session grouping logic

### Integration

- API auth/session flows
- API nodes register/approve/config
- API capture batch persistence
- node boot/register/heartbeat/config refresh
- offline spool flush behavior

### End-to-End / Smoke

- web login -> nodes list -> node detail/config -> logout
- Ollama request path via `curl` and client compatibility test
- OpenAI and Anthropic stream tests with SDK-compatible clients

## Backward Compatibility Strategy

- Preserve current health endpoints in API and node.
- Keep env variable names already introduced in Phase 1; add only additive vars.
- Keep Prisma changes additive where possible; use field replacement only for raw secret storage before any production data exists.
- Keep `packages/persona-engine` and `packages/response-engine` exports additive so existing Phase 1 placeholders can be retired without import churn.

## Rollback Strategy

- Slice 0 rollback is cleanest before any downstream code uses the new contracts.
- Slice 1 rollback leaves the API health endpoint and Prisma baseline intact.
- Slice 2 rollback can fall back to the current static web scaffold.
- Slice 4-7 rollback can disable node modules incrementally while preserving dashboard functionality.
- Do not couple dashboard release readiness to OpenAI/Anthropic support if Ollama and control-plane flows are already stable.

## Measurable Done State

Phase 2 done when:

- an admin can bootstrap the dashboard, log in, manage users, create/approve a node, and edit node config from the web app
- auth, node lifecycle, and capture ingestion integration tests pass
- API contracts are stable enough that the node can use them without branch-local patches

Phase 3 done when:

- a node can boot, register, heartbeat, pull config, emulate Ollama/OpenAI/Anthropic core endpoints, capture traffic, and flush queued captures after reconnect
- protocol smoke tests pass for all three emulators
- capture/session persistence works without duplicate inserts under reconnect

## Suggested Minimal Plan Doc Updates

No plan docs were edited. Minimal updates worth making before implementation:

1. `phase-03-honeypot-node-core.md`: replace remaining Express server terminology with NestJS module/controller terminology.
2. `phase-03-honeypot-node-core.md` and `docs/system-architecture.md`: align offline buffering on one backend. This plan recommends local Redis for Phase 3 v1.
3. `phase-02-dashboard-foundation.md`: explicitly own dashboard-side capture ingestion as a dependency the node needs.
4. `phase-02-dashboard-foundation.md` and `phase-03-honeypot-node-core.md`: state that hashed refresh tokens and hashed node keys are a precondition, because the current Prisma scaffold still stores raw values.

## Recommended Start Order

If only one engineer is driving the first merge train, use this order:

1. Slice 0
2. Slice 1
3. Slice 4
4. Slice 5
5. Slice 2
6. Slice 3
7. Slice 6
8. Slice 7

Reason: it proves the dashboard-node contract and the first protocol path early, before spending time on dashboard polish.

## Unresolved Questions

- Is exact-once capture ingestion required, or is at-least-once with request-level idempotency enough for Phase 3?
- Is TOTP mandatory for Phase 2 completion, or acceptable as the last hardening slice inside the same pass?
- Does the node need dashboard-to-node push for config changes now, or is poll-based refresh acceptable until Phase 5?
# Phase 2: Dashboard Foundation

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 24h
- **Branch:** `feat/fullstack/dashboard-node-core`
- **Depends On:** Phase 1

Build the NestJS API backend (auth, user management, node management) and React dashboard shell (login, overview, settings pages). Establish the core CRUD patterns all later phases reuse.

## Current Implementation Snapshot

- Landed: auth, users, nodes, capture, audit, and health modules in `apps/api`
- Landed: first-user bootstrap, JWT refresh sessions, TOTP challenge/setup/enable, node registration/approval/config/control APIs
- Landed: React login, overview, nodes, node detail, and settings routes with Zustand/TanStack Query wiring
- Deferred: explicit invite workflow, richer analytics surfaces, and optional operator-facing real-time updates

## Milestone Closure

- Closed on 2026-04-13 for the dashboard-foundation slice implemented in this repository.
- Validation: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` (current workspace scripts are placeholder smoke commands), plus Docker smoke for dashboard health/login and live node provisioning/approval.
- Follow-up work moves into later phases rather than blocking Phase 2 closure.
- The structures, file inventories, implementation steps, and checklist below are preserved as original planning reference; they do not fully match the as-built file layout for the shipped slice.

## Key Insights (from Research)

- First user becomes admin; subsequent users via invite only
- JWT + refresh token pattern; TOTP 2FA via `otplib`
- Node registration: node sends key -> dashboard approves -> node pulls persona config
- REST heartbeat landed first for node health; dashboard socket work remains deferred
- Repository/service pattern per NestJS module; Zod DTOs via `@anatine/zod-nestjs`

## Requirements

### Functional
- **Auth module:** Register (first user = admin), login (email + bcrypt password), JWT access/refresh tokens, TOTP 2FA setup/verify, logout
- **User module:** CRUD users (admin only), role assignment (Admin/Analyst/Viewer), invite flow follow-up
- **Node module:** CRUD nodes, node registration endpoint (API key auth), heartbeat receiver, persona assignment, config pull
- **Audit module:** Log all auth events + config changes
- **React shell:** Login page, overview dashboard (placeholder stats), node list, settings page, layout with sidebar navigation

### Non-Functional
- Login endpoint < 200ms response
- JWT access token: 15min expiry, refresh token: 7 days
- Rate limit login: 5 attempts per IP per 15min
- All API responses follow consistent envelope: `{ data, meta, error }`
- API versioned at `/api/v1/*`

## Architecture

### Data Flow: Authentication
```
Client -> POST /api/v1/auth/login {email, password}
  -> AuthService.validateCredentials() -> bcrypt.compare
  -> If 2FA enabled -> return {requiresTOTP: true, tempToken}
  -> Client -> POST /api/v1/auth/verify-totp {token, code}
  -> AuthService.verifyTOTP() -> otplib.authenticator.check
  -> JwtService.signAccessToken() + JwtService.signRefreshToken()
  -> Store refresh token in UserSession table
  -> Return {accessToken, refreshToken, user}
```

### Data Flow: Node Registration
```
Node boots -> reads LLMTRAP_DASHBOARD_URL + LLMTRAP_NODE_KEY from env
  -> POST /api/v1/nodes/register {nodeKey, hostname, publicIp}
  -> NodeService.register() -> verify key exists in Node table with status=PENDING
  -> If auto-approve enabled -> set status=ONLINE, return persona config
  -> Else -> set status=PENDING, admin approves via dashboard
   -> Node polls registration until approved, then starts REST heartbeat (every 30s)
   -> Dashboard updates lastHeartbeat on each POST heartbeat
  -> If heartbeat missed >5min -> status=OFFLINE, trigger alert
```

### NestJS Module Structure
```
apps/api/src/
├── main.ts                          # Bootstrap, CORS, global filters/interceptors
├── app.module.ts                    # Root module imports
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts  # Wraps responses in {data, meta}
│   └── pipes/
│       └── zod-validation.pipe.ts
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts          # Zod schema
│   │       ├── register.dto.ts
│   │       └── verify-totp.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── nodes/
│   │   ├── nodes.module.ts
│   │   ├── nodes.controller.ts
│   │   ├── nodes.service.ts
│   │   └── dto/
│   │       ├── register-node.dto.ts
│   │       ├── update-node.dto.ts
│   │       └── node-heartbeat.dto.ts
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts
│   │   └── audit.interceptor.ts      # Auto-log config changes
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts      # /api/v1/health for Docker checks
└── config/
    └── env-config.ts                 # Zod-validated env loading
```

### Original Planned React Dashboard Structure (Historical Reference)
```
apps/web/src/
├── main.tsx
├── app.tsx                           # TanStack Router root
├── routes/
│   ├── __root.tsx                    # Root layout (sidebar + topbar)
│   ├── login.tsx                     # Login page
│   ├── index.tsx                     # Overview dashboard (home)
│   ├── nodes/
│   │   ├── index.tsx                 # Node list
│   │   └── $nodeId.tsx               # Node detail/edit
│   └── settings/
│       └── index.tsx                 # Settings page
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── page-container.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── totp-dialog.tsx
│   ├── nodes/
│   │   ├── node-card.tsx
│   │   ├── node-status-badge.tsx
│   │   └── node-config-form.tsx
│   └── ui/                           # shadcn/ui components (auto-generated)
├── hooks/
│   ├── use-auth.ts                   # Auth state + token refresh
│   └── use-nodes.ts                  # TanStack Query hooks for nodes
├── lib/
│   ├── api-client.ts                 # Axios/fetch wrapper with auth headers
│   ├── auth-store.ts                 # Zustand store for auth state
│   └── query-client.ts              # TanStack Query client config
└── styles/
    └── globals.css                   # Tailwind base + shadcn theme
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | None (first user only) | Create first admin user |
| POST | `/api/v1/auth/login` | None | Login, returns tokens |
| POST | `/api/v1/auth/verify-totp` | Temp token | Verify 2FA code |
| POST | `/api/v1/auth/refresh` | Refresh token | Get new access token |
| POST | `/api/v1/auth/logout` | JWT | Invalidate refresh token |
| POST | `/api/v1/auth/setup-totp` | JWT | Generate TOTP secret + otpauth URL |
| POST | `/api/v1/auth/enable-totp` | JWT | Confirm TOTP with code |

### Users (Admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Create user (invite) |
| PATCH | `/api/v1/users/:id` | Update user role |
| DELETE | `/api/v1/users/:id` | Delete user |

### Nodes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/nodes` | JWT | List all nodes |
| POST | `/api/v1/nodes` | JWT (Admin) | Create node (generates nodeKey) |
| GET | `/api/v1/nodes/:id` | JWT | Get node detail + config |
| PATCH | `/api/v1/nodes/:id` | JWT (Admin) | Update node config/persona |
| DELETE | `/api/v1/nodes/:id` | JWT (Admin) | Remove node |
| POST | `/api/v1/nodes/register` | API Key | Node self-registration |
| POST | `/api/v1/nodes/:id/approve` | JWT (Admin) | Approve pending node |
| GET | `/api/v1/nodes/:id/config` | API Key | Node pulls its config |
| POST | `/api/v1/nodes/:id/heartbeat` | API Key | Heartbeat receiver |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | None | Liveness check |

## Original Planned Code Inventory

### Originally Planned Files

| Path | Purpose |
|------|---------|
| `apps/api/src/main.ts` | NestJS bootstrap with CORS, global filters/interceptors |
| `apps/api/src/app.module.ts` | Root module importing all feature modules |
| `apps/api/src/config/env-config.ts` | Zod env validation |
| `apps/api/src/common/decorators/current-user.decorator.ts` | Extract user from JWT |
| `apps/api/src/common/decorators/roles.decorator.ts` | Role metadata decorator |
| `apps/api/src/common/filters/http-exception.filter.ts` | Consistent error envelope |
| `apps/api/src/common/guards/jwt-auth.guard.ts` | JWT validation guard |
| `apps/api/src/common/guards/roles.guard.ts` | Role-based access guard |
| `apps/api/src/common/interceptors/transform.interceptor.ts` | Wrap in `{data, meta}` |
| `apps/api/src/common/pipes/zod-validation.pipe.ts` | Zod DTO validation pipe |
| `apps/api/src/modules/auth/auth.module.ts` | Auth module |
| `apps/api/src/modules/auth/auth.controller.ts` | Auth endpoints |
| `apps/api/src/modules/auth/auth.service.ts` | Auth business logic |
| `apps/api/src/modules/auth/strategies/jwt.strategy.ts` | Passport JWT strategy |
| `apps/api/src/modules/auth/dto/login.dto.ts` | Login Zod schema |
| `apps/api/src/modules/auth/dto/register.dto.ts` | Register Zod schema |
| `apps/api/src/modules/auth/dto/verify-totp.dto.ts` | TOTP verify schema |
| `apps/api/src/modules/users/users.module.ts` | Users module |
| `apps/api/src/modules/users/users.controller.ts` | Users CRUD |
| `apps/api/src/modules/users/users.service.ts` | Users service |
| `apps/api/src/modules/users/dto/create-user.dto.ts` | Create user schema |
| `apps/api/src/modules/users/dto/update-user.dto.ts` | Update user schema |
| `apps/api/src/modules/nodes/nodes.module.ts` | Nodes module |
| `apps/api/src/modules/nodes/nodes.controller.ts` | Nodes CRUD + registration |
| `apps/api/src/modules/nodes/nodes.service.ts` | Nodes service |
| `apps/api/src/modules/nodes/dto/register-node.dto.ts` | Node registration schema |
| `apps/api/src/modules/nodes/dto/update-node.dto.ts` | Node update schema |
| `apps/api/src/modules/nodes/dto/node-heartbeat.dto.ts` | Heartbeat payload schema |
| `apps/api/src/modules/audit/audit.module.ts` | Audit module |
| `apps/api/src/modules/audit/audit.service.ts` | Audit logging service |
| `apps/api/src/modules/audit/audit.interceptor.ts` | Auto-log interceptor |
| `apps/api/src/modules/health/health.module.ts` | Health module |
| `apps/api/src/modules/health/health.controller.ts` | Health check |
| `apps/web/src/main.tsx` | React entry point |
| `apps/web/src/app.tsx` | TanStack Router root |
| `apps/web/src/routes/__root.tsx` | Layout with sidebar |
| `apps/web/src/routes/login.tsx` | Login page |
| `apps/web/src/routes/index.tsx` | Overview dashboard |
| `apps/web/src/routes/nodes/index.tsx` | Node list page |
| `apps/web/src/routes/nodes/$nodeId.tsx` | Node detail page |
| `apps/web/src/routes/settings/index.tsx` | Settings page |
| `apps/web/src/components/layout/sidebar.tsx` | Sidebar nav |
| `apps/web/src/components/layout/topbar.tsx` | Top bar |
| `apps/web/src/components/layout/page-container.tsx` | Page wrapper |
| `apps/web/src/components/auth/login-form.tsx` | Login form |
| `apps/web/src/components/auth/totp-dialog.tsx` | TOTP dialog |
| `apps/web/src/components/nodes/node-card.tsx` | Node card component |
| `apps/web/src/components/nodes/node-status-badge.tsx` | Status badge |
| `apps/web/src/components/nodes/node-config-form.tsx` | Node config editor |
| `apps/web/src/hooks/use-auth.ts` | Auth hook |
| `apps/web/src/hooks/use-nodes.ts` | Node query hooks |
| `apps/web/src/lib/api-client.ts` | HTTP client wrapper |
| `apps/web/src/lib/auth-store.ts` | Zustand auth store |
| `apps/web/src/lib/query-client.ts` | TanStack Query config |
| `apps/web/src/styles/globals.css` | Tailwind + shadcn globals |

## Original Implementation Plan

1. **API common infrastructure**
   - Create `env-config.ts` with Zod validation for DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
   - Create global exception filter (consistent `{data, meta, error}` envelope)
   - Create transform interceptor to wrap all responses
   - Create Zod validation pipe
   - Defer Swagger/OpenAPI until the operator surface stabilizes

2. **Auth module**
   - Implement register endpoint (check if first user -> auto-admin, else reject)
   - Implement login with bcrypt password verification
   - Implement JWT access token (15min) + refresh token (7 days) signing
   - Store refresh tokens in UserSession table
   - Implement token refresh endpoint
   - Implement logout (delete refresh token)
   - Implement TOTP setup (generate secret, return QR URI)
   - Implement TOTP enable (verify code, set totpEnabled=true)
   - Implement TOTP verification during login
   - Add rate limiting on login (5 attempts / 15min per IP)
   - Create JwtAuthGuard, RolesGuard, CurrentUser decorator

3. **Users module**
   - CRUD endpoints (admin only)
   - Create user generates temporary password or invite link
   - Role assignment (Admin, Analyst, Viewer)
   - Self-profile update (password change)

4. **Nodes module**
   - CRUD for node management
   - Node creation generates unique `nodeKey` (crypto.randomUUID)
   - Registration endpoint (API key auth): node sends key + metadata -> validate -> update status
   - Config pull endpoint: node requests its persona + service config
   - Approve endpoint (admin): set node PENDING -> ONLINE
   - REST heartbeat endpoint: update `lastHeartbeat` timestamp for approved nodes
   - Background job check: if `lastHeartbeat > 5min ago` -> set OFFLINE

5. **Audit module**
   - AuditService.log(userId, action, target, details, ip)
   - AuditInterceptor: attach to config-change controllers, auto-log mutations

6. **Health module**
   - Simple GET /api/v1/health returning `{status: "ok", timestamp, uptime}`
   - Check DB connectivity, Redis connectivity

7. **React dashboard shell**
   - Set up TanStack Router with file-based routing
   - Create sidebar layout (shadcn sidebar component)
   - Login page with email/password form + TOTP dialog
   - Auth store (Zustand): accessToken, refreshToken, user, login/logout actions
   - API client with interceptor for Authorization header + auto-refresh
   - Overview page: placeholder cards for stats (wired up in Phase 5)
   - Nodes list page: table of nodes with status badges
   - Node detail page: config form (persona selector, service toggles)
   - Settings page: placeholder sections for alerts, storage, users

8. **Integration tests**
   - Auth flow: register -> login -> access protected route -> refresh -> logout
   - Node flow: create node -> register from node side -> approve -> pull config
   - TOTP flow: setup -> enable -> login requires code
   - Role enforcement: analyst can't create users, viewer can't edit nodes

## Original Task Checklist

- [ ] Create API common infrastructure (filters, guards, interceptors, pipes)
- [ ] Create env-config with Zod validation
- [ ] Implement auth module (register, login, JWT, refresh, logout)
- [ ] Implement TOTP 2FA (setup, enable, verify)
- [ ] Add login rate limiting
- [ ] Implement users module (CRUD, roles, invite)
- [ ] Implement nodes module (CRUD, registration, config pull)
- [ ] Harden REST heartbeat polling and offline detection
- [ ] Implement node offline detection (scheduled job)
- [ ] Implement audit module (service + interceptor)
- [ ] Implement health check endpoint
- [ ] Add Swagger/OpenAPI once the control-plane surface settles
- [ ] Create React app with TanStack Router
- [ ] Build sidebar layout + topbar
- [ ] Build login page + TOTP dialog
- [ ] Build auth store (Zustand) + API client with auto-refresh
- [ ] Build overview dashboard page (placeholder cards)
- [ ] Build nodes list page with status table
- [ ] Build node detail/edit page
- [ ] Build settings page (placeholder)
- [ ] Write integration tests: auth flow
- [ ] Write integration tests: node registration flow
- [ ] Write integration tests: role enforcement

## Success Criteria

- First user registration creates admin account
- Login returns valid JWT refresh sessions; protected endpoints reject expired/missing tokens
- TOTP setup generates scannable QR; login enforces code when enabled
- Rate limiter blocks after 5 failed login attempts
- Node provisioning, approval, config pull, and REST heartbeat work against a live node smoke
- REST heartbeat updates `lastHeartbeat`; missed heartbeat handling remains follow-up work
- React app renders login -> dashboard -> nodes -> settings
- All API responses wrapped in `{data, meta, error}` envelope
- Monorepo `lint`, `typecheck`, `build`, and the current `test` pipeline pass; deeper integration coverage remains follow-up work
- Audit log captures login events + config changes

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| JWT token leakage | Low | High | Short access token TTL (15min), httpOnly cookies option |
| Heartbeat polling drift or missed retries | Medium | Medium | Re-register until approval, keep REST heartbeat retryable, add offline scheduler |
| First-user race condition | Low | Medium | DB unique constraint on user count check + atomic transaction |
| TOTP secret exposure | Low | High | Never return secret after initial setup; add encryption at rest in follow-up hardening |

## Security Considerations

- Passwords hashed with bcrypt (cost factor 12)
- JWT secret from env var, minimum 32 chars enforced by Zod
- Refresh tokens stored hashed in DB, single-use on rotation
- TOTP secret is stored in the user record today; encryption at rest remains follow-up hardening
- Rate limiting on auth endpoints currently uses an in-memory per-IP window inside the auth service
- CORS restricted to dashboard domain in production
- API key for node auth: SHA-256 hashed in DB, transmitted once on creation
- All admin-only endpoints guarded by RolesGuard
- Audit log is append-only through the current service layer; DB-level immutability remains follow-up hardening

## Next Steps

- Phase 3 completed in parallel with Phase 2: Honeypot Node Core
- Phase 5 (after Phase 2 + 3): Intelligence Engine wires dashboard analytics to captured data

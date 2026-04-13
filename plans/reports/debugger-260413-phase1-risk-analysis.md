# Phase 1 Risk Analysis — LLMTrap Monorepo Scaffold

**Session:** 2026-04-13  
**Investigator:** debugger agent  
**Scope:** Post-implementation residual warnings and risk surface  
**Context:** Phase 1 monorepo setup completed, build passes, no runtime testing yet

---

## Executive Summary

Phase 1 scaffold builds successfully but exposes **6 verified risks** (2 critical blockers, 3 high-priority issues, 1 medium-priority warning) that will impact Phases 2-4 deployment. Windows development environment reveals platform-specific friction. Docker architecture contains unvalidated assumptions about service routing and privileged port binding.

**Critical path blockers before Phase 2:**
1. Dockerfile healthcheck endpoints (blocks production orchestration)
2. Honeypot node multi-service routing architecture validation (fundamental design assumption)

**Recommended action:** Fix critical issues before Phase 2 kickoff. Medium/low issues can be addressed in parallel during Phase 2.

---

## Risk Inventory

### R1 — Prisma Seed Configuration Deprecation
**Severity:** Medium  
**Category:** Configuration  
**Impact:** Build warnings, future Prisma version incompatibility

#### Evidence
```json
// packages/db/package.json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Prisma deprecated this configuration format. Recommended: use `prisma/seed` script in package.json scripts section or migrate to ESM seed file.

#### Blast Radius
- Affects only `@llmtrap/db` package
- No immediate breakage, warning-level only
- Future Prisma upgrades may remove support entirely

#### Mitigation
**Priority:** P2 (can defer to Phase 2)  
**Effort:** 5 minutes  
**Fix:**
```json
// Move seed config to scripts section
"scripts": {
  "seed": "tsx prisma/seed.ts"
}
```

Remove `"prisma"` top-level key. Update Phase 2 seeding docs.

---

### R2 — Windows Corepack Enable EPERM
**Severity:** Low  
**Category:** Platform-specific  
**Impact:** Fresh Windows clone setup friction

#### Evidence
User-reported during `pnpm install` on Windows. Corepack requires admin privileges or manual enablement on Windows.

#### Blast Radius
- Affects Windows developers only
- One-time setup issue per machine
- Does not affect Docker builds (Linux-based)
- Does not affect CI/CD (GitHub Actions Ubuntu runner)

#### Mitigation
**Priority:** P3 (documentation fix)  
**Effort:** 10 minutes  
**Fix:**
1. Add Windows setup note to README.md:
   ```md
   **Windows:** Run `corepack enable` in admin PowerShell before first install.
   ```
2. Add to .npmrc: `enable-pre-post-scripts=true` (if using npm fallback)
3. Or: document manual pnpm install via `npm install -g pnpm@10.10.0`

---

### R3 — Missing Healthcheck Endpoints
**Severity:** Critical (production blocker)  
**Category:** Infrastructure  
**Impact:** Docker orchestration failures, zero-downtime deployment impossible

#### Evidence
All Dockerfiles lack healthcheck definitions:
```dockerfile
# Dockerfile.api — no HEALTHCHECK instruction
# docker-compose.dashboard.yml expects app healthchecks for graceful startup
```

docker-compose.yml uses `service_healthy` conditions but apps don't expose `/health` endpoints.

#### Blast Radius
- Affects all 4 apps (api, web, worker, node)
- `depends_on.condition: service_healthy` will wait indefinitely or fail
- Production orchestrators (K8s, Docker Swarm) cannot perform liveness/readiness probes
- Rolling updates will cause downtime

#### Mitigation
**Priority:** P0 (must fix before Phase 2 deployment testing)  
**Effort:** 2 hours  
**Fix:**
1. Add `/health` endpoint to NestJS apps (api, worker, node):
   ```typescript
   @Get('health')
   health() {
     return { status: 'ok', timestamp: new Date().toISOString() };
   }
   ```
2. Add HEALTHCHECK to Dockerfiles:
   ```dockerfile
   HEALTHCHECK --interval=10s --timeout=3s --start-period=30s \
     CMD node -e "require('http').get('http://localhost:${PORT}/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
   ```
3. For web (nginx): use `/` endpoint or add minimal health.html

---

### R4 — Privileged Port Binding in Node Compose
**Severity:** High  
**Category:** Security/Portability  
**Impact:** Deployment failures on hardened systems, root requirement on Linux

#### Evidence
```yaml
# docker-compose.node.yml
ports:
  - '0.0.0.0:22:2222'   # SSH
  - '0.0.0.0:23:2323'   # Telnet
  - '0.0.0.0:25:2525'   # SMTP
  - '0.0.0.0:53:5353'   # DNS
  - '0.0.0.0:445:4450'  # SMB
```

Binding to ports <1024 requires root on most Linux systems. Docker user is `llmtrap` (non-root) but host binding may fail.

#### Blast Radius
- Honeypot node stack won't start without elevated privileges
- Cloud providers often block privileged port binding
- Violates least-privilege principle
- May conflict with existing services (SSH on 22, DNS on 53)

#### Mitigation
**Priority:** P1 (before production deployment)  
**Effort:** 30 minutes  
**Fix options:**
1. **Recommended:** Use high ports (2222, 2323, etc.) and document iptables redirect:
   ```bash
   iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 2222
   ```
2. **Alternative:** Add `CAP_NET_BIND_SERVICE` capability:
   ```yaml
   cap_add:
     - CAP_NET_BIND_SERVICE
   ```
3. Document deployment assumes dedicated honeypot VM/VPS

---

### R5 — Unvalidated Multi-Service Routing Architecture
**Severity:** Critical (design assumption)  
**Category:** Architecture  
**Impact:** Fundamental honeypot node design may not work as intended

#### Evidence
```yaml
# docker-compose.node.yml spawns 7 containers from same Dockerfile.node
trap-core:   env.LLMTRAP_SERVICE=undefined  # port 11434
trap-ssh:    env.LLMTRAP_SERVICE=ssh        # port 2222
trap-ftp:    env.LLMTRAP_SERVICE=ftp        # port 2121
# ... 5 more services
```

**Design assumption:** Single NestJS app in `apps/node` can:
- Read `LLMTRAP_SERVICE` env var
- Conditionally bootstrap different protocol handlers
- Listen on `NODE_HTTP_PORT` with service-specific logic

**NOT VERIFIED:** No code in `apps/node/src/` currently implements this service routing. Current scaffold is generic HTTP "hello world".

#### Blast Radius
- If routing not implemented, all services respond identically
- Phase 3 implementation may require architectural pivot
- May need separate Dockerfiles per service (massive increase in build complexity)
- Current plan assumes code-level service multiplexing

#### Mitigation
**Priority:** P0 (validate assumption before Phase 3)  
**Effort:** Phase 3 research milestone  
**Options:**
1. **Implement service router in Phase 3:** Validate feasibility with prototype
2. **Pivot to separate apps:** `apps/node-ssh`, `apps/node-ftp`, etc. (increases repo complexity)
3. **Unified protocol handler:** Single port, protocol detection via initial bytes (advanced, risky)

**Next step:** Add Phase 3 research task: "Validate NestJS multi-service architecture with SSH prototype"

---

### R6 — Missing Build Script Warning (pnpm)
**Severity:** Low  
**Category:** Build tooling  
**Impact:** Console noise during install, no functional breakage

#### Evidence
User-reported "pnpm ignored build-script warning" — likely from packages without build scripts being referenced in turbo.json pipelines.

**Hypothesis:** Some packages (e.g., `@llmtrap/db` seed script) trigger turborepo build dependency but have non-standard build flow.

#### Blast Radius
- Warning only, no breakage
- May indicate turborepo dependency graph needs refinement
- Could slow CI builds if tasks run unnecessarily

#### Mitigation
**Priority:** P3  
**Effort:** 15 minutes  
**Fix:**
1. Verify all packages in `pnpm-workspace.yaml` have valid `build` script or exclude from turbo pipeline
2. Check `turbo.json` `dependsOn: ["^build"]` doesn't force unnecessary builds
3. Add `"build": "echo 'No build step for @llmtrap/db'"` if warning from db package

---

## Additional Observations

### Docker Network Isolation
**Status:** Implemented correctly  
dashboard.yml: `frontend`, `backend` networks — proper separation  
node.yml: `honeypot`, `internal` networks — external exposure isolated

No risk identified.

### Environment Variables
**Status:** Comprehensive `.env.example` provided  
Includes all required vars for both stacks. Safe defaults for local dev.

**Minor note:** `JWT_SECRET` default is insecure placeholder — no risk if users follow deployment docs.

### Prisma Schema
**Status:** Complete core tables  
All entities from plan defined. Indexes present. Relations correct.

**Minor note:** `IpEnrichment.expiresAt` exists but no TTL cleanup job defined — defer to Phase 5 (intelligence engine).

### TypeScript Configuration
**Status:** Strict mode enabled, proper extends chain  
No risks. ESLint config appropriate.

---

## Recommended Fix Order

### Pre-Phase 2 (Critical Path)
1. **R3 — Healthcheck endpoints** (2h) — blocks deployment testing
2. **R5 — Validate service routing** (research, 4h) — validates Phase 3 feasibility

### During Phase 2 (Parallel)
3. **R4 — Privileged ports** (30m) — add docs + deployment script
4. **R1 — Prisma seed config** (5m) — cleanup warning

### Phase 3 Prep
5. **R5 cont.** — Implement service routing in node app

### Low Priority (Backlog)
6. **R2 — Windows corepack** (10m docs)
7. **R6 — Build script warning** (15m investigation)

---

## Unresolved Questions

1. **Service routing implementation:** Has prototype been built? Should validation happen before or during Phase 3?
2. **Privileged port strategy:** Firewall redirect or capability? Need production deployment target (VPS, bare metal, K8s?)
3. **Healthcheck implementation:** REST endpoint or TCP socket probe? Should worker have HTTP server just for health?

---

## Conclusion

Phase 1 scaffold structurally sound. Build system works. Schema complete. **Two critical assumptions need validation before Phase 2:**

1. Docker healthcheck strategy — affects all deployment environments
2. Multi-service node architecture — affects Phase 3 implementation path

If both assumptions validate, Phase 2 can proceed with parallel fixes to medium/low priority issues. If service routing assumption fails, architectural pivot required (impacts timeline).

**Recommendation:** Allocate 1 day at Phase 2 start for healthcheck implementation + service routing prototype before proceeding with dashboard features.

---
title: "LLMTrap Implementation Plan"
description: "Multi-protocol AI honeypot platform for security research"
status: in_progress
priority: P1
effort: 124h
branch: main
tags: [feature, backend, frontend, security, infra]
blockedBy: []
blocks: []
created: 2026-04-13
---

# LLMTrap Implementation Plan

## Architecture Summary

Two Docker Compose stacks: **Dashboard** (NestJS API + React + PostgreSQL + Redis + Worker + db-init bootstrap) and **Honeypot Node** (`trap-core` + local Redis). `trap-core` now hosts the full Phase 4 listener matrix alongside the core control-plane/runtime logic: Ollama, OpenAI-compatible, Anthropic-compatible, LM Studio, text-generation-webui, LangServe, llama.cpp, vLLM, AutoGPT, MCP/IDE bait, RAG bait, homelab bait, and traditional listeners. Nodes register with the dashboard via API key, pull persona configs, buffer logs locally when disconnected, and feed both HTTP and raw-protocol captures through the same batch-sync path.

## Phase Overview

| # | Phase | Effort | Status | Depends On | Key Deliverables |
|---|-------|--------|--------|------------|------------------|
| 1 | [Monorepo Setup](phase-01-monorepo-setup.md) | 12h | Complete | -- | Turborepo, pnpm workspaces, Prisma schema, Docker scaffolds, CI base |
| 2 | [Dashboard Foundation](phase-02-dashboard-foundation.md) | 24h | Complete | Phase 1 | Auth, user/node mgmt API, React shell, TOTP settings, capture/control routes |
| 3 | [Honeypot Node Core](phase-03-honeypot-node-core.md) | 24h | Complete | Phase 1 | Ollama/OpenAI/Anthropic emulators, Redis spool, dashboard sync, template engine |
| 4 | [Full Protocol Coverage](phase-04-full-protocol-coverage.md) | 24h | Complete | Phase 3 | All LLM/MCP/IDE/RAG/homelab/traditional protocols + persona-shaped interactive shell bait |
| 5 | [Intelligence Engine](phase-05-intelligence-engine.md) | 24h | In Progress | Phase 2, 3 | Response strategies, proxy, backfeed, classification, fingerprinting, personas |
| 6 | [Threat Intel & Alerts](phase-06-threat-intel-alerts.md) | 16h | In Progress | Phase 5 | Blocklists, IOC, MITRE, STIX, alerts, reports, cold storage, CI/CD, release |

## Dependency Graph

```
Phase 1 (Monorepo Setup)
  |--- Phase 2 (Dashboard Foundation)
  |       |
  |--- Phase 3 (Honeypot Node Core)
  |       |
  |       |--- Phase 4 (Full Protocol Coverage)
  |       |
  +-------+--- Phase 5 (Intelligence Engine)
                  |
                  |--- Phase 6 (Threat Intel & Alerts)
```

## Critical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| JA3/JA4 capture unreliable in Node.js | High | Medium | Fallback to HTTP header fingerprinting; add tls-trace as optional |
| Honeypot container escape | Low | Critical | Dedicated VMs in prod, non-root containers, seccomp profiles |
| Real model API costs exceed budget | Medium | Medium | Budget caps per node + global, auto-fallback to templates |
| Template detection by validators | Medium | High | Latency jitter, response variance, validation prompt routing to real model |

## Research Reports

- [Honeypot Ecosystem & Architecture](research/researcher-01-honeypot-ecosystem.md)
- [LLM Protocols & Response Engine](research/researcher-02-llm-protocols-response-engine.md)

## Validation Log

### Session 1 — 2026-04-13
**Trigger:** Post-plan validation (hard mode, scope expansion)
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Node framework: Express vs NestJS vs Fastify for honeypot node?
   - Options: Express (Recommended) | NestJS everywhere | Fastify
   - **Answer:** NestJS everywhere
   - **Rationale:** Monorepo consistency — shared decorators, guards, pipes, interceptors, DI patterns. Contributors learn one framework.

2. **[Scope]** Template sourcing: how to generate 300+ starter templates?
   - Options: AI-generate batch (Recommended) | Manual curation | Minimal set (50) + backfeed
   - **Answer:** AI-generate batch
   - **Rationale:** Fast, diverse, cheap. Use Claude/GPT to generate prompt-response pairs across categories.

3. **[Architecture]** SSH honeypot depth: minimal command map vs full filesystem?
   - Options: Minimal command map (Recommended) | Full filesystem simulation | Defer to Phase 4
   - **Answer:** Persona-shaped interactive shell bait
   - **Rationale:** Good enough realism for the shipped slice without introducing a full Cowrie-style filesystem emulator into `trap-core`.

4. **[Architecture]** Default real-model proxy provider for validation prompt routing?
   - Options: OpenRouter (Recommended) | OpenAI direct | Self-hosted Ollama
   - **Answer:** Generic OpenAI-compatible endpoint
   - **Custom input:** "give me base url, api key and model. openai-compatible is a must."
   - **Rationale:** User wants configurable base_url + api_key + model. Works with any OpenAI-compatible provider (OpenRouter, OpenAI, vLLM, LM Studio, etc.)

#### Confirmed Decisions
- Node framework: NestJS — unified DI/decorator patterns across monorepo
- Templates: AI-batch generation — 300+ prompt-response pairs via LLM
- SSH depth: Persona-shaped interactive shell bait — lightweight command/file responses inside `trap-core`
- Proxy config: Generic OpenAI-compatible — base_url, api_key, model fields

### Session 2 — 2026-04-13
**Trigger:** Phase 2/3 core milestone implementation

#### Landed work
- Dashboard API foundation: auth/users/nodes/capture/audit/health modules, shared contracts, hashed secrets, TOTP setup/verify/enable
- Dashboard web shell: routed login, overview, nodes, settings, auth store, node CRUD UI
- Node core runtime: registration/config refresh/REST heartbeat/capture flush scheduler, Redis-backed local spool, runtime health
- Protocol slice: Ollama, OpenAI-compatible, and Anthropic-compatible listeners with streaming support

#### Validation
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test` (current workspace scripts are placeholder smoke commands)
- Docker dashboard smoke: API health + seeded admin login
- Docker node smoke: node provisioning/approval + Ollama, OpenAI-compatible, and Anthropic-compatible requests
- Dashboard persistence smoke: `3` captured requests + `3` grouped sessions for the live node, with node buffer drained back to `0`

#### Closure note
- Phase 2 and Phase 3 are complete for the shipped core milestone slice in this repository.
- Invite workflows, richer analytics, broader protocol coverage, and deeper automated integration coverage remain deferred to later phases.

### Session 3 — 2026-04-13
**Trigger:** Phase 4 completion and Docker runtime validation

#### Landed work
- Added raw protocol capture plumbing plus a protocol listener manager for the remaining Phase 4 services
- Added RAG bait endpoints, homelab bait services, and traditional listeners for SSH, FTP, SMTP, DNS, SMB, and Telnet inside `apps/node`
- Hardened decoy node-key handling, SSH host-key persistence for non-root containers, and Windows-safe `HOST_*` traditional port remaps in the node Docker stack

#### Validation
- `pnpm --filter @llmtrap/node test`
- `pnpm --filter @llmtrap/node build`
- `pnpm --filter @llmtrap/node lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `docker compose --env-file docker/node-compose.env.example -f docker/docker-compose.node.yml up -d --build`
- Docker smoke: Qdrant `/collections`, Grafana `/api/health`, Milvus bait `/v1/vector/collections`, SSH `20022`, FTP `20021`, SMTP `20025`, Telnet `20023`, SMB `20445`, DNS `20053/udp`

#### Closure note
- Phase 4 is complete for the current repository slice.
- Phase 5 and Phase 6 retain landed partial work, but proxy routing, backfeed/template distribution, external alert delivery, cold storage, WebSocket live feed, and repository-owned e2e/smoke automation remain open.

#### Impact on Phases
- Phase 1: Update `apps/node` scaffold from Express to NestJS app
- Phase 3: Change all Express references to NestJS controllers/modules; add template generation script step
- Phase 4: Harden interactive traditional listeners and Docker validation (effort +4h)
- Phase 5: Change proxy config from provider dropdown to generic OpenAI-compatible fields (base_url, api_key, model)

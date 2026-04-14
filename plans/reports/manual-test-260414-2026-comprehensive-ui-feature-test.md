# Comprehensive Manual Test Plan
**Date:** 2026-04-14 | **Stacks:** Dashboard + Node both running

---

## Stack URLs

| Service | URL |
|---------|-----|
| Web UI | http://51.255.81.151:3000 |
| API | http://51.255.81.151:4000/api/v1/health |
| Ollama bait | http://51.255.81.151:11434 |
| OpenAI bait | http://51.255.81.151:8080 |
| Anthropic bait | http://51.255.81.151:8081 |
| Qdrant bait | http://51.255.81.151:6333 |
| Grafana bait | http://51.255.81.151:3002 |
| Milvus bait | http://51.255.81.151:19530 |
| SSH | 51.255.81.151:20022 |
| FTP | 51.255.81.151:20021 |
| SMTP | 51.255.81.151:20025 |
| Telnet | 51.255.81.151:20023 |

**Credentials:** `admin@llmtrap.local` / `ChangeMe123456!`

---

## 1. PUBLIC PAGES

### 1.1 Landing page (/)
- [ ] Page loads at http://51.255.81.151:3000
- [ ] Hero section: colored "AI traffic" text, status badge with green dot
- [ ] Two CTA buttons: "Get started" → /docs, "Dashboard" → /login
- [ ] 6 capability cards with colored icon backgrounds (different colors per card)
- [ ] "Try it out" section with 4 code block cards (Ollama, OpenAI, Qdrant, SSH)
- [ ] Code blocks have syntax highlighting ($ prompt = accent, comments = dimmed)
- [ ] "3 steps to deploy" section with numbered cards (blue/amber/green)
- [ ] Footer with "Docs" and "Login" links
- [ ] Header: logo, "Docs" link, "Login" link, theme toggle

### 1.2 Theme toggle
- [ ] Toggle is visible in header (all public pages)
- [ ] Click "☀ Light" — page turns white bg, indigo accent, rounded corners
- [ ] Click "◑ Dark" — page turns dark bg (#0f1117), soft indigo accent
- [ ] Click "> Hacker" — page turns black, green accent, square corners, monospace font, scanline bg
- [ ] Theme persists after page reload (stored in localStorage)
- [ ] Toggle also in dashboard sidebar and Settings page

### 1.3 Docs home (/docs)
- [ ] Card grid: cards for Getting Started, Deploy Dashboard, Enroll Node, Smoke Tests, etc.
- [ ] Each card has colored icon background + title + 1-line description
- [ ] Clicking a card navigates to the correct docs page
- [ ] "Quick start" terminal block with commands, syntax highlighted
- [ ] Stats row with stacks, surfaces, listeners, phases in different colors

### 1.4 Docs sub-pages
Routes: /docs/getting-started, /docs/deploy-dashboard, /docs/enroll-node, /docs/configure-node, /docs/how-it-works, /docs/using-dashboard, /docs/smoke-tests
- [ ] 3-column layout: left sidebar | content | right TOC (desktop)
- [ ] Left sidebar: title-only nav, active page highlighted
- [ ] Breadcrumbs: Home / Docs / Page Name
- [ ] Page title (large) + summary paragraph
- [ ] Sections with h2 headings, body text, bullet lists, checklists
- [ ] Code blocks with per-block env tabs (Windows / macOS / Linux)
- [ ] Click a tab → code switches for that block only (other blocks unaffected)
- [ ] Copy button on each code block → copies code to clipboard
- [ ] "Next steps" cards at bottom link to other docs pages
- [ ] Right TOC: clicking a section name scrolls to it
- [ ] Mobile: sidebar hidden, nav pills shown instead

### 1.5 Smoke tests playground (/docs/smoke-tests)
- [ ] "Playground" section with fun commands (Ollama chat, OpenAI probe, Anthropic prompt injection, Qdrant search, SSH connect, SMTP send)
- [ ] Commands are syntax highlighted in the code block

---

## 2. AUTHENTICATION

### 2.1 Login (/login)
- [ ] Clean login form: Email + Password fields
- [ ] "Sign in" / "Bootstrap admin" toggle tabs
- [ ] Pre-filled: admin@llmtrap.local / ChangeMe123456!
- [ ] Click "Sign in" → redirects to /overview
- [ ] Invalid credentials → shows error message
- [ ] After login, visiting / redirects to /overview

### 2.2 Sign out
- [ ] "Sign out" button in dashboard topbar
- [ ] Clicking it → redirects to /login
- [ ] After sign out, visiting /overview redirects to /login

---

## 3. DASHBOARD PAGES

### 3.1 Overview (/overview)
- [ ] Shows 3 stat cards: Nodes, Sessions, Requests
- [ ] Node state section: Online count, Pending count
- [ ] Top services section: lists services by capture count
- [ ] Values update after generating probe traffic (may take ~45s for flush)

### 3.2 Nodes (/nodes)
- [ ] Shows node cards with status badge (ONLINE = green, pulsing dot)
- [ ] Create form: Name, Hostname, IP fields + "Create" button
- [ ] Create a new node → shows raw key banner (copy it!)
- [ ] Node card shows: key prefix, hostname, last heartbeat
- [ ] "Inspect" link → goes to node detail

### 3.3 Node detail (/nodes/{id})
- [ ] Shows node name as title, status badge
- [ ] If PENDING: "Approve" button appears
- [ ] Config form: Name, Hostname, IP, Persona, Config JSON
- [ ] "Save" button persists changes
- [ ] Response engine section: strategy chain, fixed_n, budget, proxy info

### 3.4 Sessions (/sessions)
- [ ] Empty initially. After probing → shows session cards
- [ ] Each card: service name, source IP, timestamp, request count
- [ ] Classification badge + node ID badge

### 3.5 Actors (/actors)
- [ ] Shows correlated actors after probe traffic
- [ ] Session count per actor, services, IPs, user agents

### 3.6 Personas (/personas)
- [ ] Lists persona presets (homelabber, researcher, startup)
- [ ] Each shows name, services, config files

### 3.7 Response Engine (/response-engine)
- [ ] Backfeed form: select node, category, subcategory, prompt
- [ ] Review queue: pending templates with approve/reject buttons
- [ ] Shipped templates section with category filter
- [ ] Empty state when no pending templates

### 3.8 Alerts (/alerts)
- [ ] Stats: rules, deliveries, failures
- [ ] Rules column: lists alert rules with severity badge
- [ ] Deliveries column: lists delivery history with success/fail status

### 3.9 Threat Intel (/threat-intel)
- [ ] Stats: blocklist IPs, IOC rows, active filters
- [ ] Filter form: classification, service, node, source IP, days, limit
- [ ] Apply → updates blocklist, ATT&CK, IOCs
- [ ] Reset → clears filters
- [ ] STIX indicator count shown

### 3.10 Live Feed (/live-feed)
- [ ] Stats: events on screen, past 60s, active filters
- [ ] Transport controls: REST polling ON/OFF, WebSocket ON/OFF
- [ ] Filter fields: classification, service, node ID, source IP
- [ ] Event cards: method badge, service, classification, path
- [ ] 5-column grid: Node, Actor, IP, Strategy, Captured (timestamp + HTTP code)
- [ ] User agent shown below each event card
- [ ] Events appear after probe traffic (with polling ON)

### 3.11 Export (/export)
- [ ] Summary: report filename, data filename, session/request counts
- [ ] Markdown preview of exported report
- [ ] Cold storage: archive list (if worker has created any)
- [ ] Archive preview: select an archive → shows NDJSON preview

### 3.12 Settings (/settings)
- [ ] Appearance section with ThemeToggle (Light/Dark/Hacker)
- [ ] Two-factor auth section: TOTP status badge
- [ ] "Generate secret" → shows manual entry key + otpauth URL
- [ ] Enter 6-digit code → enables TOTP

---

## 4. HONEYPOT PROBES (run in terminal, then check dashboard)

Run these commands, then check Sessions/Live Feed in the dashboard:

```bash
# AI protocol probes
curl http://51.255.81.151:11434/api/version
curl http://51.255.81.151:11434/api/chat -d '{"model":"llama3.2","messages":[{"role":"user","content":"hello"}]}'
curl http://51.255.81.151:8080/v1/models
curl http://51.255.81.151:8080/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"gpt-4o-mini","stream":false,"messages":[{"role":"user","content":"test"}]}'
curl http://51.255.81.151:8081/v1/messages -H "Content-Type: application/json" -d '{"model":"claude-3-5-sonnet","max_tokens":64,"messages":[{"role":"user","content":"hello"}]}'

# RAG / bait probes
curl http://51.255.81.151:6333/collections
curl http://51.255.81.151:3002/api/health
curl http://51.255.81.151:19530/v1/vector/collections

# Traditional probes (open separate terminals)
ssh -p 20022 -o StrictHostKeyChecking=no root@51.255.81.151
# (type some commands in the fake shell, then exit)
```

### Expected in dashboard after ~45s:
- [ ] Overview: captured sessions > 0, captured requests > 0
- [ ] Sessions: entries for openai, ollama, anthropic, qdrant, grafana, milvus, ssh
- [ ] Live Feed (with polling ON): recent events show up
- [ ] Actors: at least 1 actor with multiple services

---

## 5. RESPONSIVE / MOBILE

- [ ] Resize browser to <768px width
- [ ] Public pages: header collapses, cards stack to 1 column
- [ ] Docs pages: sidebar hidden, mobile nav pills shown
- [ ] Dashboard: sidebar collapses
- [ ] All pages readable at mobile width

---

## 6. CROSS-THEME VISUAL CHECK

For each theme (Light, Dark, Hacker), quickly verify:
- [ ] Landing page renders correctly, no broken colors
- [ ] Docs pages: sidebar, content, TOC all readable
- [ ] Dashboard: sidebar, cards, forms all styled correctly
- [ ] Code blocks: syntax highlighting visible and readable
- [ ] Buttons, inputs, badges all use theme-appropriate colors
- [ ] Hacker theme: square corners, monospace font, green accent
- [ ] Light theme: white bg, indigo accent, rounded corners
- [ ] Dark theme: dark bg, soft indigo, rounded corners

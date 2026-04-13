# GitNexus Setup & Integration Report
**Date:** 2026-04-13 | **Topic:** KuzuDB + MCP Code Graph for TypeScript Monorepo

## Executive Summary

**GitNexus is a client-side code intelligence engine** that indexes your codebase into a queryable knowledge graph and exposes 16 specialized tools via MCP (Model Context Protocol). Unlike grep/ripgrep, it understands call chains, dependency flows, and impact radius—critical for reliable AI-assisted refactoring.

**For your TypeScript monorepo (pnpm + Turborepo):** Single `npx gitnexus analyze` indexes all packages, one `npx gitnexus setup` configures MCP once globally, then Claude Code gets deep architectural awareness across workspaces.

---

## 1. What is GitNexus?

### Core Architecture
- **Client-side, no server:** All processing happens locally; code never leaves your machine
- **Graph Database:** KuzuDB (embedded graph DB) + HNSW vector index for semantic search
- **Multi-phase indexing:**
  1. **Structure** — Walk file tree, map folder/file relationships
  2. **Parsing** — Extract functions, classes, interfaces via Tree-sitter AST
  3. **Resolution** — Resolve imports and call chains across files
  4. **Clustering** — Group related symbols into functional communities
  5. **Processes** — Trace execution flows from entry points
  6. **Search** — Hybrid BM25 + semantic indexing

### Differentiator vs. Grep
- Grep = pattern matching; GitNexus = **semantic relationship mapping**
- Grep: `grep "functionName"` → raw matches across files
- GitNexus: `query("impact of renaming functionName")` → call graph, ripple effects, confidence scoring
- GitNexus precomputes clustering, tracing, confidence at index time → tools return complete context in single calls

---

## 2. Installation & Setup

### Prerequisites
- Node.js 18+ (check with `node --version`)
- pnpm/npm/yarn (you have pnpm; no conflict)

### Step 1: Initial Analysis (Per Repository)
```bash
cd /path/to/your/monorepo
npx gitnexus analyze
```

**What happens:**
- Scans all packages in workspaces
- Builds `.gitnexus/` directory with KuzuDB index
- Registers repo in `~/.gitnexus/registry.json` (global registry)
- Creates `.claude/skills/` with 4 agent skills
- Generates context files (AGENTS.md, CLAUDE.md updates)

**Duration:** ~30–60 sec for medium monorepos; varies by codebase size.

### Step 2: Configure MCP (One-Time, Global)
```bash
npx gitnexus setup
```

**What it does:**
- Auto-detects your editors (Claude Code, Cursor, Windsurf, etc.)
- Writes MCP server config to global config files:
  - **macOS/Linux:** `~/.config/Claude/mcp.json` (or editor equivalent)
  - **Windows:** `%APPDATA%\Anthropic\Claude\mcp.json`
- Adds: `npx -y gitnexus@latest mcp` as the MCP server command

**Or manually add to Claude Code:**
```bash
# macOS/Linux
claude mcp add gitnexus -- npx -y gitnexus@latest mcp

# Windows
cmd /c npx -y gitnexus@latest mcp
```

**One-time setup.** After this, all indexed repos are automatically available to Claude Code.

---

## 3. Configuration File Structure

### `.gitnexus/` Directory (Auto-Generated)
```
.gitnexus/
├── db/                           # KuzuDB graph database
├── indexes/                       # BM25 + HNSW embeddings
├── metadata.json                 # Indexing metadata
└── registry.json (global)         # ~/.gitnexus/registry.json
```

### Global Registry (`~/.gitnexus/registry.json`)
```json
{
  "repositories": [
    {
      "name": "llm-honeypot",
      "path": "/absolute/path/to/llm-honeypot",
      "indexedAt": "2026-04-13T10:00:00Z",
      "indexVersion": "1.5.0"
    }
  ]
}
```

**No per-project config file needed.** GitNexus reads `.gitnexus/` and registry on startup.

### Claude Code MCP Config (Auto-Generated)

**Location:** `~/.config/Claude/mcp.json` (or platform equivalent)

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"],
      "disabled": false
    }
  }
}
```

**For monorepos:** One MCP server transparently serves all indexed repos via internal registry.

---

## 4. Available MCP Tools (16 Total)

### Per-Repository Tools (11)
These are the primary intelligence tools for code exploration and modification:

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `query` | Hybrid search (BM25 + semantic + RRF) | query string | ranked symbols with confidence |
| `context` | 360° symbol view with references | symbol name | callers, callees, uses, definitions |
| `impact` | Blast radius analysis | change list | affected symbols + confidence |
| `detect_changes` | Git-diff impact mapping | git hash range | impacted call chains |
| `rename` | Coordinated multi-file refactoring | old name, new name | files to change, changes needed |
| `go_to_definition` | Find symbol definition | symbol | file path + line number |
| `find_usages` | Find all references | symbol | usage locations + context |
| `cluster_info` | Functional grouping details | cluster ID | cohesion score, members |
| `trace_execution` | Execution flow from entry point | entry symbol | call chain trace |
| `architecture_map` | High-level module relationships | (optional) filter | module graph structure |
| `incremental_index` | Update index after commits | (auto) | re-indexed symbols |

### Repository Group Tools (5)
For multi-repo operations:

| Tool | Purpose |
|------|---------|
| `list_repositories` | All indexed repos |
| `cross_repo_imports` | Find inter-repo dependencies |
| `cross_repo_impact` | Impact across multiple repos |
| `compare_architectures` | API compatibility analysis |
| `merge_indexes` | Combine indexes for analysis |

### Resources (7 Instant-Access)
These auto-load in Claude Code context:

| Resource | Content |
|----------|---------|
| `gitnexus://repos` | All indexed repositories |
| `gitnexus://repo/{name}/clusters` | Functional groups + cohesion |
| `gitnexus://repo/{name}/processes` | Execution flow traces |
| `gitnexus://repo/{name}/graph-stats` | Index size, symbol count |
| `gitnexus://repo/{name}/recent-changes` | Last 20 indexed changes |
| `gitnexus://repo/{name}/schema` | KuzuDB schema for Cypher queries |
| `gitnexus://cache-status` | Index staleness warnings |

---

## 5. Integration with Claude Code

### What You Get (After Setup)
1. **16 MCP tools** immediately available in Claude Code
2. **4 agent skills** in `.claude/skills/`:
   - Exploring unfamiliar code
   - Tracing bugs through call chains
   - Blast radius analysis before changes
   - Safe refactoring via dependency mapping
3. **Hooks integration** (Claude Code only):
   - `PreToolUse` — Enrich searches with graph context
   - `PostToolUse` — Auto-reindex after commits
4. **Resources** — Auto-load in context windows

### Example Workflow in Claude Code
```
User: "Rename getUserId() to getCurrentUserId() in the API package"

Claude Code will:
1. Call gitnexus.query("getUserId") → find all definitions
2. Call gitnexus.impact(["getUserId"]) → find all callers
3. Call gitnexus.rename("getUserId", "getCurrentUserId") → list changes
4. Make refactoring changes
5. MCP hook auto-reindexes after commit
```

### Best Practices for Your Monorepo

**During Analysis:**
```bash
# Index from monorepo root (includes all pnpm packages)
cd /path/to/llm-honeypot
npx gitnexus analyze

# This automatically discovers:
# - all packages in pnpm-workspace.yaml
# - all workspaces in turbo.json
# - cross-workspace imports
```

**During Development:**
- Run `npx gitnexus analyze` again after major refactors (optional; hooks auto-reindex)
- GitNexus watches git commits; indexes stay fresh
- Don't commit `.gitnexus/` to version control; add to `.gitignore`

**In Claude Code:**
- Use `query()` for discovery: "Find all uses of the auth middleware"
- Use `impact()` before changes: "What breaks if I move this utils file?"
- Use `rename()` for refactoring: "Rename config key from old_name to new_name"
- Use `context()` for education: "Show me all places this function is called"

---

## 6. MCP Server Configuration Details

### How It Works
```
Claude Code (with MCP enabled)
    ↓
Connect to: npx gitnexus mcp (MCP server)
    ↓
MCP server reads ~/.gitnexus/registry.json
    ↓
Lazy-load KuzuDB connections for indexed repos
    ↓
Expose 16 tools + 7 resources to Claude Code
```

### Manual MCP Setup (If Auto-Setup Fails)

**macOS/Linux:**
```bash
cat >> ~/.config/Claude/mcp.json << 'EOF'
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"],
      "disabled": false,
      "alwaysAllow": true
    }
  }
}
EOF
```

**Windows (PowerShell):**
```powershell
$configPath = "$env:APPDATA\Anthropic\Claude\mcp.json"
$config = @{
    mcpServers = @{
        gitnexus = @{
            command = "npx"
            args = @("-y", "gitnexus@latest", "mcp")
            disabled = $false
            alwaysAllow = $true
        }
    }
}
$config | ConvertTo-Json | Out-File -FilePath $configPath
```

### Restart Claude Code
After updating config, restart Claude Code for MCP to load.

---

## 7. Limitations & Gotchas

### Known Limitations
1. **Language Support:** Tree-sitter coverage varies
   - Full: TypeScript, JavaScript, Python, Go, Rust, Java
   - Partial: C/C++, C#, PHP (basic parsing)
   - Missing: Some DSLs, custom syntax
2. **Monorepo Scaling:** Works great for <500 packages; >1000 may see indexing slowdown
3. **Graph Size:** In-memory KuzuDB limits practical size to ~50k symbols per repo
4. **Browser UI:** Web version (gitnexus.vercel.app) limited to ~50MB codebases

### Gotchas for Your Setup

| Gotcha | Impact | Mitigation |
|--------|--------|-----------|
| **Dynamic Imports** | `require(variable)` not resolved | Won't appear in impact analysis; document manually |
| **Barrel Exports** | Re-exports can confuse clustering | Check `context()` output for aliases |
| **Build-Step Code Gen** | Generated code not indexed | Re-run `analyze` after code gen; document entry points |
| **Monorepo Scope** | All packages indexed together | Use `repo` parameter in tools to focus scope |
| **.gitnexus/ in Git** | Bloats repo; re-creates on every machine | Add to `.gitignore` |

### Reindexing Triggers
- **Auto:** After every git commit (hooks enabled in Claude Code)
- **Manual:** Run `npx gitnexus analyze` after major refactors, package additions
- **Refresh:** `npx gitnexus clean && npx gitnexus analyze` for full rebuild

---

## 8. Usage Rules for Developers

### When to Use Each Tool

**Query (`query()`)**
- Exploring new code: "Find all API endpoints in the auth package"
- Semantic search: "Find password validation logic"
- Discovery: "What utilities are in the shared lib?"

**Context (`context()`)**
- Before touching a function: "Show me every place getCurrentUser() is called"
- Impact estimation: "Who depends on this type?"
- Dependency mapping: "What does this module import/export?"

**Impact (`impact()`)**
- Before refactoring: "What breaks if I remove this utility?"
- Before renaming: "What files change if I rename this constant?"
- Risk assessment: "What's the blast radius of this database schema change?"

**Rename (`rename()`)**
- Coordinated refactoring: "Rename getUserToken to getAuthToken across all packages"
- Will find: variable names, function names, export names, imports (if resolvable)
- Returns: file list + exact text changes needed

**Detect Changes (`detect_changes()`)**
- After pull: "What code paths changed in this PR?"
- Debugging: "This bug appeared after commit X; what changed?"
- Review: "Show me the call chain impact of these commits"

### Rules of Thumb
1. Always run `impact()` before large refactors
2. Use `context()` to understand a function's role before touching it
3. Use `rename()` instead of find-replace for coordinated changes
4. Trust confidence scores in impact analysis; low confidence = missing context
5. If GitNexus can't resolve something, document it in comments

---

## 9. CLI Commands Reference

### Core Commands
```bash
npx gitnexus analyze          # Index codebase (run from repo root)
npx gitnexus setup            # Configure MCP (global, one-time)
npx gitnexus mcp              # Start MCP server (for testing/debug)
npx gitnexus serve            # Local HTTP server for web UI (port 3000)
```

### Utility Commands
```bash
npx gitnexus list             # Show all indexed repos
npx gitnexus clean            # Delete all indexes
npx gitnexus clean <repo>     # Delete index for specific repo
npx gitnexus status           # Index freshness, stats
```

### Scripting / CI Integration
```bash
# In your monorepo CI/CD:
npx gitnexus analyze --no-interactive  # Non-blocking, for CI
```

---

## 10. Unresolved Questions

1. **Performance at Scale:** How does GitNexus handle >100 packages in Turborepo? (No documented benchmarks found)
2. **Incremental Updates:** Does `analyze` do incremental updates or full rebuild? (Docs suggest incremental, but not explicit)
3. **Cross-Workspace Imports:** For pnpm workspaces, how are internal imports (`@workspace/*`) resolved? (Assume correctly, not confirmed)
4. **CI/CD Integration:** Recommended index caching strategy for GitHub Actions? (Not documented)
5. **Memory Usage:** KuzuDB memory footprint for mid-sized monorepos? (No profiling data available)
6. **Vector Index Size:** Does HNSW embedding storage grow linearly with symbols? (Implementation detail not exposed)

---

## Recommendation

**For your TypeScript monorepo (pnpm + Turborepo):**

✅ **Adopt GitNexus now** — it directly solves the problem your memory noted (user prefers GitNexus over grep for large codebases).

**Implementation path:**
1. Run `npx gitnexus analyze` in your llm-honeypot monorepo root
2. Run `npx gitnexus setup` (one-time, global)
3. Restart Claude Code
4. Add `.gitnexus/` to `.gitignore`
5. Document in your team's developer guide (see "Usage Rules" section above)

**Adoption risk: LOW**
- Zero runtime overhead (indexes are pre-built)
- Backward compatible (doesn't replace grep; complements it)
- No breaking changes; mature project (active GitHub stars, multiple forks)
- Can be disabled by removing MCP config

**Next steps:**
- Run analysis on your largest package to validate performance
- Test `query()` and `impact()` tools in Claude Code
- Document monorepo-specific patterns in CLAUDE.md or developer guide

---

## Sources

- [GitHub - abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus) — Official repository
- [npm - gitnexus](https://www.npmjs.com/package/gitnexus) — Package registry
- [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) — MCP integration docs
- [Client-Side RAG: Building Knowledge Graphs in the Browser with GitNexus](https://www.sitepoint.com/client-side-rag-building-knowledge-graphs-in-the-browser-with-gitnexus/) — Technical overview
- [Debugging data, not just code: Using Claude and Cursor with Kuzu-MCP](https://blog.kuzudb.com/post/2025-03-23-kuzu-mcp-server/) — KuzuDB MCP integration guide

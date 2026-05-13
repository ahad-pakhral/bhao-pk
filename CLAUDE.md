# Bhao.pk — Claude Code Project Instructions

## Mandatory: Document Every Change

**After EVERY code change — no matter how small — you MUST run `/document` to log the change in `docs/DEVLOG.md`.**

This is not optional. Even a one-line fix, a renamed variable, a config tweak, or a dependency update gets logged. The devlog is the project's memory.

If you made changes to multiple files as part of one task, log them as a single entry (not one per file).

## After Non-Trivial Changes

After any fix, feature, or refactor that taught you something new, also run `/update-skills` to update the relevant skill files in `.claude/commands/`.

## Project Structure

- `webapp/` — Next.js 14 web app (port 3000)
- `mobile/` — React Native + Expo mobile app
- `backend/` — Express API server (port 3001) + Python scrapers
- `docs/DEVLOG.md` — Append-only changelog of every change
- `.claude/commands/` — Skill files for common tasks

## Key Design Principles

1. **No product storage** — PostgreSQL stores only user data and vendor URLs. Product data lives in Redis cache (TTL-based) only.
2. **Graceful degradation** — Backend works without PostgreSQL/Redis (search still works via scrapers). Frontends work without backend (fall back to dummy data).
3. **Three ranking implementations** — `backend/src/services/ranking.service.ts`, `webapp/utils/ranking.ts`, `mobile/src/utils/ranking.ts` must stay in sync.

## Available Skills

Run these for guided procedures:

| Skill | Use When |
|-------|----------|
| `/document` | After ANY code change (mandatory) |
| `/update-skills` | After learning something new about the project |
| `/architecture` | Need to understand project structure |
| `/start` | Starting development services |
| `/test-scraper` | Testing store scrapers |
| `/add-scraper` | Adding a new store scraper |
| `/build-check` | Verifying builds pass |
| `/search-flow` | Understanding the search pipeline |
| `/debug-scraper` | Debugging scraper issues |
| `/fix-types` | Fixing TypeScript type errors |
| `/add-route` | Adding new API routes |
| `/add-screen` | Adding new screens/pages |
| `/ranking` | Understanding/modifying the ranking algorithm |

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

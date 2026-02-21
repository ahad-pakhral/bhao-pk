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

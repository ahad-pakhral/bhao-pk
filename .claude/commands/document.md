# Document — Log Every Code Change

**This skill is MANDATORY after every code change, no matter how small.**

You must run this after every edit, fix, feature, refactor, config change, dependency update, or file creation/deletion. No exceptions. Even a one-line fix gets logged.

## What To Do

1. Read the current devlog at `docs/DEVLOG.md`
2. Append a new entry at the TOP of the "## Changelog" section (newest first)
3. Follow the exact format below

## Entry Format

```markdown
### [YYYY-MM-DD HH:MM] — Short Title (Category)

**What changed:**
- Bullet list of every file modified/created/deleted and what was done to it

**Why:**
- The reason for the change (bug fix, feature request, performance, etc.)

**Technical details:**
- Implementation specifics someone would need to understand the change
- Algorithms used, patterns followed, libraries involved
- Any non-obvious decisions and WHY they were made

**Side effects:**
- Other parts of the system affected by this change
- Things that might break if this change is reverted
- "None" if truly isolated

**Gotchas / Lessons learned:**
- Anything surprising encountered during implementation
- Workarounds applied and why
- "None" if straightforward

**Testing:**
- How the change was verified (manual test, build check, curl command, etc.)
- "Not tested" if skipped (and why)

**Related skills updated:**
- List any skills updated via `/update-skills`, or "None yet"
```

## Categories

Use one of these in the title:

| Category | When |
|----------|------|
| `Feature` | New functionality |
| `Fix` | Bug fix |
| `Refactor` | Code restructuring, no behavior change |
| `Scraper` | Scraper-related changes |
| `Ranking` | Ranking algorithm changes |
| `UI` | Frontend visual/UX changes |
| `API` | Backend route/endpoint changes |
| `Config` | Configuration, env vars, dependencies |
| `Types` | TypeScript type changes |
| `Infra` | Docker, CI/CD, deployment |
| `Docs` | Documentation only |
| `Skill` | Claude Code skill files |
| `Data` | Dummy data, test data, seed data |
| `Security` | Auth, permissions, input validation |
| `Performance` | Speed, caching, optimization |

## Rules

1. **Every change gets an entry** — even renaming a variable
2. **Be specific about files** — list exact paths, not "updated the search page"
3. **Include the WHY** — "fixed type error" is not enough; say "fixed type error because rankByRelevance generic expects originalPrice as string but SearchProduct had it as number"
4. **Technical details matter** — future you (or another developer) should understand the change without reading the diff
5. **Newest entries at the top** — reverse chronological order
6. **Never delete old entries** — the devlog is append-only
7. **Group related changes** — if you edited 5 files for one feature, that's ONE entry with 5 files listed, not 5 entries

## Quick Template (Copy-Paste)

```markdown
### [YYYY-MM-DD HH:MM] — TITLE (CATEGORY)

**What changed:**
- `path/to/file.ts` — description

**Why:**
- Reason

**Technical details:**
- Details

**Side effects:**
- None / list

**Gotchas / Lessons learned:**
- None / list

**Testing:**
- How verified

**Related skills updated:**
- None yet / list
```

## After Documenting

If the change was non-trivial, also run `/update-skills` to update affected skill files.

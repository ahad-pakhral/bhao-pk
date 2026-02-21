# Update Skills — Post-Fix / Post-Feature Checklist

Run this after fixing any bug, adding any feature, or learning something new about the project. It ensures lessons are captured in the right skill files so future work is faster.

## Step 1: Classify What Changed

Determine the category of work you just completed:

| Category | Affected Skills |
|----------|----------------|
| Scraper fix/change | `/debug-scraper`, `/test-scraper`, `/add-scraper`, `/search-flow` |
| New scraper added | `/add-scraper`, `/debug-scraper`, `/architecture`, `/search-flow` |
| Ranking algorithm change | `/ranking`, `/search-flow` |
| Type error fix | `/fix-types` |
| New API route | `/add-route`, `/architecture`, `/search-flow` |
| New screen/page | `/add-screen`, `/architecture` |
| Build fix | `/build-check`, `/fix-types` |
| New store added | `/add-scraper`, `/debug-scraper`, `/architecture` |
| Architecture change | `/architecture`, `/search-flow` |
| Startup/config change | `/start`, `/architecture` |
| New dependency | `/start`, `/architecture` |

## Step 2: Update Affected Skills

For each affected skill file, read it and determine what needs updating:

### Scraper-related changes
- **`/debug-scraper`**: Add the issue to the "Known Issues Per Store" table. Include: store name, symptom, root cause, fix applied.
- **`/test-scraper`**: If the test commands changed or new parse patterns are needed, update the test commands.
- **`/add-scraper`**: If you discovered a new pattern (e.g., JSON API vs HTML, anti-bot measure), add it to the guide.
- **`/search-flow`**: If the data flow changed (new cache layer, new normalization step), update the pipeline diagram.

### Type-related changes
- **`/fix-types`**: Add the error pattern, root cause, and fix to the known patterns table. Format:
  ```
  | Error message pattern | Root cause | Fix |
  ```

### Architecture changes
- **`/architecture`**: Update directory structure, tech stack, or design principles sections as needed.
- **`/search-flow`**: Update if data flow between components changed.

### Ranking changes
- **`/ranking`**: Update formula, weights, store reliability scores, or tuning guidance.
- Update ALL THREE ranking files if the algorithm changed:
  - `backend/src/services/ranking.service.ts`
  - `webapp/utils/ranking.ts`
  - `mobile/src/utils/ranking.ts`

## Step 3: Decide If a New Skill Is Needed

Create a new skill if ANY of these are true:

1. **Repeated pattern**: You've done the same type of task 2+ times and will likely do it again
2. **Complex procedure**: The task has 4+ steps that are easy to forget or get wrong
3. **Gotchas discovered**: You found non-obvious pitfalls that would bite you again
4. **New subsystem**: A new area of the codebase was added (e.g., payments, notifications, admin panel)

### New skill template:
```markdown
# Skill Name — One-Line Description

Brief context on when to use this skill.

## Quick Reference
Key facts, commands, or formulas.

## Step-by-Step
Numbered steps for the procedure.

## Common Issues
| Issue | Cause | Fix |
Table of known gotchas.

## Verification
How to confirm the task succeeded.

## After Completing
Always run `/update-skills` to capture lessons.
```

Save new skills to: `.claude/commands/<skill-name>.md`

## Step 4: Record the Lesson

After updating skill files, mentally verify:

- [ ] The fix/feature is documented in the right skill(s)
- [ ] Any new error patterns are in `/fix-types` or `/debug-scraper`
- [ ] If a file path changed, all skills referencing it are updated
- [ ] If a new store was added, it appears in `/architecture`, `/debug-scraper`, and `/ranking` (store reliability scores)
- [ ] If ranking weights or formula changed, all three ranking files are in sync

## Examples

### Example 1: Fixed PriceOye SSL error
1. Category: Scraper fix → affects `/debug-scraper`, `/test-scraper`
2. Update `/debug-scraper`: Add to Known Issues table:
   ```
   | PriceOye | SSL TLSV1_ALERT_PROTOCOL_VERSION | Python 3.9 LibreSSL too old for PriceOye's TLS config | Upgrade Python to 3.11+ or use pyOpenSSL |
   ```
3. No new skill needed (one-off fix)

### Example 2: Added Czone.pk scraper
1. Category: New scraper → affects `/add-scraper`, `/debug-scraper`, `/architecture`, `/search-flow`
2. Update `/architecture`: Add Czone to store list and directory structure
3. Update `/debug-scraper`: Add Czone section with known page structure details
4. Update `/ranking`: Add Czone to store reliability scores
5. Update `/search-flow`: Add Czone to the list of scraped stores
6. No new skill needed (existing `/add-scraper` covers the process)

### Example 3: Added push notification system
1. Category: New subsystem → affects `/architecture`
2. Update `/architecture`: Add notifications section
3. **Create new skill** `/notifications` — covers Expo push tokens, notification triggers, payload format
4. Update `/add-route`: If notification routes were added, update the routes table

## Quick Command

After any fix or feature, ask yourself:
> "If I had to do this exact same thing again in 3 months, what would I wish I had written down?"

Write that down in the appropriate skill file.

# Sync — Handoff Context with Antigravity

Use this skill whenever you are told to "sync" or if you are about to end your session so that Antigravity knows what you did.

## Step-by-step
1. **Read the Log**: Run `cat .agent-sync.md` to see the central bulletin board. Read the "Current Project State", "Active Blockers", and the latest "Chronological Log" entry. Note what Antigravity last did.
2. **Understand the Goal**: By reading the sync log, you should instantly have full context on the current state of Bhao.pk without needing to randomly explore the codebase.
3. **Write Your Log Entry**: Before you finish your turn (and hand off back to the user or Antigravity), you MUST edit `.agent-sync.md`.
4. **Format for your Entry**:
   Add a new block to the TOP of the "Chronological Log" section formatted like this:
   ```markdown
   ### Entry: [YYYY-MM-DD] | Claude Code
   **Summary of Recent Work:**
   - [Bullet points of what you fixed, created, or researched. Mention specific file paths.]
   **Next Suggested Steps for Antigravity:**
   - [Leave breadcrumbs or a to-do item for Antigravity to pick up instantly]
   ```
5. **Update Global State**: If you introduced a major new feature or hit a brick wall bug, update the "Current Project State" or "Active Blockers" sections at the top of the file as well.

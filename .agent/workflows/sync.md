---
description: Sync — Handoff Context with Claude Code
---
Use this workflow whenever you are told to "sync" or if you are about to end a major session so that Claude Code knows what you did.

## Step-by-step
1. **Read the Log**: Use the `view_file` tool on `.agent-sync.md` to see the central bulletin board. Read the "Current Project State", "Active Blockers", and the latest "Chronological Log" entry. Note what Claude Code last did.
2. **Understand the Goal**: By reading the sync log, you should instantly have full context on the current state of Bhao.pk without needing to randomly explore the codebase.
3. **Write Your Log Entry**: Before you notify the user that you are done with a major feature (and handing off back to Claude Code or the User), you MUST edit `.agent-sync.md` using the `multi_replace_file_content` or `replace_file_content` tool.
4. **Format for your Entry**:
   Add a new block to the TOP of the "Chronological Log" section formatted like this:
   ```markdown
   ### Entry: [YYYY-MM-DD] | Antigravity
   **Summary of Recent Work:**
   - [Bullet points of what you fixed, created, or researched. Mention specific file paths.]
   **Next Suggested Steps for Claude Code:**
   - [Leave breadcrumbs or a to-do item for Claude Code to pick up instantly]
   ```
5. **Update Global State**: If you introduced a major new feature or hit a brick wall bug, update the "Current Project State" or "Active Blockers" sections at the top of the file as well.

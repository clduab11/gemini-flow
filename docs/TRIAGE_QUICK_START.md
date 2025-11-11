# Triage System Quick Start Guide

**Goal:** Get the GitHub Projects board set up and start managing issues in < 30 minutes.

---

## Overview

You've just completed Sprint 8 (System Integration). Now you have:
- ✅ **28 identified issues** across P0, P1, P2, P3 priorities
- ✅ **Comprehensive triage document** with RICE prioritization
- ✅ **Three Queues workflow** to manage work
- ✅ **Automated scripts** to set up GitHub infrastructure

This guide walks you through the setup process step-by-step.

---

## Prerequisites

1. **GitHub CLI installed:**
   ```bash
   # Check if installed
   gh --version

   # If not, install:
   # macOS: brew install gh
   # Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   ```

2. **Authenticated with GitHub:**
   ```bash
   # Login
   gh auth login

   # Verify
   gh auth status
   ```

3. **Repository cloned:**
   ```bash
   cd gemini-flow
   git status  # Should show your current branch
   ```

---

## Step 1: Create Labels (2 minutes)

Run the automated script:

```bash
./scripts/create-github-labels.sh
```

**Expected Output:**
```
🏷️  Creating GitHub Labels for Gemini Flow...
✅ GitHub CLI is installed and authenticated
📦 Creating Type labels...
✅ Type labels created
🎯 Creating Priority labels...
✅ Priority labels created
⏱️  Creating Effort labels...
✅ Effort labels created
✅ All labels created successfully!
```

**Verify:**
```bash
# View labels
gh label list

# Or visit
# https://github.com/clduab11/gemini-flow/labels
```

---

## Step 2: Create GitHub Project Board (5 minutes)

**Manual setup required** (GitHub Projects doesn't have CLI yet).

1. Go to: https://github.com/clduab11/gemini-flow/projects
2. Click: **New project**
3. Select: **Board** template
4. Name: `Gemini Flow Development`
5. Click: **Create project**

**Rename columns:**
- "Todo" → `🔥 Critical Path (P0)` (description: "Max 3 items")
- Delete: "In Progress"
- Keep: "Done" as `✅ Done`

**Add columns:**
- `🚀 Active Sprint (P1)` (description: "Max 5 items")
- `⚡ Quick Wins (P2 Small)` (description: "Max 10 items")
- `📦 Backlog`

**Final order:**
```
🔥 Critical Path (P0) → 🚀 Active Sprint (P1) → ⚡ Quick Wins → 📦 Backlog → ✅ Done
```

**Enable automation:**
- Settings → Workflows → Enable "Auto-add to project"
- When: Issues opened → Add to: Backlog

---

## Step 3: Create Critical Path Issues (2 minutes)

Run the automated script:

```bash
./scripts/create-critical-issues.sh
```

**Expected Output:**
```
🔥 Creating Critical Path (P0) Issues...
Creating Issue #1...
✅ Issue #1 created
Creating Issue #2...
✅ Issue #2 created
Creating Issue #3...
✅ Issue #3 created
✅ All Critical Path (P0) issues created!
```

**Verify:**
```bash
# View issues
gh issue list --label P0

# Expected: 3 issues
# #1: Super Terminal StoreAdapter Missing node-fetch Dependency
# #2: StoreAdapter Response Format Incompatible with Sprint 7 API
# #3: Docker Compose Environment Variables Not Documented
```

---

## Step 4: Move P0 Issues to Critical Path (1 minute)

1. Open GitHub Projects board
2. Find the 3 new issues (should be in Backlog)
3. Drag each to **🔥 Critical Path (P0)** column

---

## Step 5: Start Working (30 seconds)

Pick the smallest issue from Critical Path and start:

```bash
# View issue details
gh issue view 1  # Replace with actual issue number

# Start work
# 1. Read the issue description
# 2. Review Definition of Done
# 3. Follow the steps
# 4. Test thoroughly
# 5. Commit and push

# Close when done
gh issue close 1 --comment "Fixed by implementing [solution]"
```

---

## Your First Week: Stabilization

### Monday Morning (30 min)

✅ **You just did this!** (Steps 1-4)

### Daily (Each Day This Week)

**Morning:**
1. Open Critical Path column
2. Pick 1 issue (start with smallest E-small)
3. Read Definition of Done carefully
4. Start work

**Afternoon:**
- If done: Close issue, move next
- If blocked: Comment on issue, ask for help
- If done early: Pick from Quick Wins (after creating them)

### Friday Afternoon (30 min)

**Review progress:**
```bash
# How many P0 issues closed?
gh issue list --label P0 --state closed

# Goal: 3/3 (100%)
```

**If all P0 complete:**
- 🎉 Celebrate! Critical path cleared!
- Move to Week 2: Create P1 issues
- Start Active Sprint selection

**If some P0 incomplete:**
- Continue next week
- Re-evaluate priorities (maybe not really P0?)
- Ask for help in GitHub Discussions

---

## Creating More Issues (Optional, Week 2+)

### For P1 Issues (Active Sprint):

Reference the triage document and create manually:

```bash
# Example: Issue #4 - Super Terminal Should Use WebSocket
gh issue create \
  --title "Super Terminal Should Use WebSocket Instead of Polling" \
  --label "P1,enhancement,agent-ux,E-medium" \
  --body "See docs/TRIAGE_SPRINT_8_AFTERMATH.md Issue #4 for full description"
```

Or use GitHub web UI:
1. Copy issue description from `docs/TRIAGE_SPRINT_8_AFTERMATH.md`
2. Create issue: https://github.com/clduab11/gemini-flow/issues/new
3. Paste description
4. Add labels
5. Submit

### For P2/P3 Issues (Backlog):

Create as needed or during quarterly backlog grooming.

---

## Weekly Workflow Reference

### Monday (30 min): Sprint Planning

1. Review Critical Path (should be 0-3 items)
2. Choose week theme:
   - Week 1: Stabilization (P0 issues)
   - Week 2: Testing (Issue #5, #13)
   - Week 3: Infrastructure (Issue #6, #9, #12)
   - Week 4: Agent UX (Issue #10, #14, #11)
3. Select 3-5 P1 issues for Active Sprint
4. Move from Backlog to Active Sprint column
5. Assign to yourself

### Daily (15 min):

- Morning: Pick 1 item, start work
- Afternoon: Update status, close or continue

### Friday (30 min): Retrospective

1. Count completed items
2. Move incomplete to Backlog
3. Archive done items
4. Triage new issues
5. Write weekly summary

---

## Common Commands

```bash
# List all open issues
gh issue list

# List P0 issues
gh issue list --label P0

# List issues assigned to you
gh issue list --assignee @me

# View issue details
gh issue view 123

# Close issue
gh issue close 123

# Reopen issue
gh issue reopen 123

# Comment on issue
gh issue comment 123 --body "Working on this now"

# Create new issue
gh issue create --title "New issue" --label "P1,infra,E-small"
```

---

## Project Board URLs

- **Main Board:** https://github.com/clduab11/gemini-flow/projects
- **Issues:** https://github.com/clduab11/gemini-flow/issues
- **Labels:** https://github.com/clduab11/gemini-flow/labels

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `TRIAGE_SPRINT_8_AFTERMATH.md` | Full triage (all 28 issues) |
| `GITHUB_PROJECTS_SETUP.md` | Detailed board setup guide |
| `TRIAGE_QUICK_START.md` | This document (quick setup) |

---

## Troubleshooting

### "gh: command not found"

Install GitHub CLI:
- macOS: `brew install gh`
- Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

### "gh auth login" fails

Try:
```bash
gh auth login --web
```

### Labels already exist

This is fine! Script uses `--force` flag to update existing labels.

### Issues not appearing in Project

1. Check automation is enabled (Settings → Workflows)
2. Manually add: Open issue → Projects (sidebar) → Add to project

### Can't drag issues between columns

- Ensure you're in Board view (not Table view)
- Try refreshing the page
- Check browser permissions

---

## Success Metrics

### Week 1 Goals (Stabilization)

- ✅ 3/3 P0 issues closed
- ✅ End-to-end sync working (TUI ↔ Backend ↔ Frontend)
- ✅ Docker deployment documented and tested

### Week 2+ Goals

- Add 20+ automated tests
- SQLite database migration
- CI/CD pipeline running

---

## Next Steps

Now that you're set up:

1. ✅ **Start with Issue #1** (node-fetch dependency)
2. ✅ **Test thoroughly** (npm run super-terminal)
3. ✅ **Close when done**
4. ✅ **Move to Issue #2**

**Remember:**
- Focus on Definition of Done
- Ship 80% solutions
- Capture 20% as new issues
- Maintain weekly cadence

---

**Questions?**

- Open GitHub Discussion: https://github.com/clduab11/gemini-flow/discussions
- Read full docs: `docs/TRIAGE_SPRINT_8_AFTERMATH.md`

**Good luck, and happy shipping! 🚀**

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0

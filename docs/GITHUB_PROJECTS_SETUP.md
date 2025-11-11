# GitHub Projects Setup Guide

**Date:** November 11, 2025
**Purpose:** Set up GitHub Projects board for Gemini Flow development workflow
**Time Required:** ~15-20 minutes

---

## Overview

This guide walks you through setting up a GitHub Projects board using the **Three Queues** workflow recommended for managing agentic sprint output. The board will help you:

- Triage and prioritize issues efficiently
- Maintain forward velocity while preventing scope creep
- Track progress across multiple work streams
- Surface the most important next steps

---

## Part 1: Create GitHub Labels (5 minutes)

Labels are the foundation of the triage system. Create these in your repository.

### Navigate to Labels

1. Go to: `https://github.com/clduab11/gemini-flow/labels`
2. Or: Repository → Issues → Labels

### Create Type Labels

| Label | Description | Color Code |
|-------|-------------|------------|
| `critical-bug` | Blocks core functionality | `#d73a4a` (red) |
| `agent-ux` | Affects agent interaction quality | `#0075ca` (blue) |
| `infra` | Build, deploy, dependencies | `#fbca04` (yellow) |
| `monitoring` | Metrics, observability, performance | `#1d76db` (dark blue) |
| `enhancement` | New features, improvements | `#a2eeef` (light blue) |
| `tech-debt` | Refactoring, cleanup, optimization | `#d4c5f9` (purple) |

### Create Priority Labels

| Label | Description | Color Code |
|-------|-------------|------------|
| `P0` | Ship-blocker, fix today | `#b60205` (dark red) |
| `P1` | Degrades core UX, fix this week | `#e99695` (pink) |
| `P2` | Important but not urgent, next sprint | `#c5def5` (light blue) |
| `P3` | Nice-to-have, backlog | `#f9d0c4` (light pink) |

### Create Effort Labels

| Label | Description | Color Code |
|-------|-------------|------------|
| `E-small` | < 2 hours | `#c2e0c6` (light green) |
| `E-medium` | 2-8 hours | `#fef2c0` (light yellow) |
| `E-large` | > 8 hours | `#f9c5d5` (light red) |

### Bash Script to Create Labels

Run this script to create all labels automatically:

```bash
#!/bin/bash

# Type labels
gh label create "critical-bug" --description "Blocks core functionality" --color "d73a4a"
gh label create "agent-ux" --description "Affects agent interaction quality" --color "0075ca"
gh label create "infra" --description "Build, deploy, dependencies" --color "fbca04"
gh label create "monitoring" --description "Metrics, observability, performance" --color "1d76db"
gh label create "enhancement" --description "New features, improvements" --color "a2eeef"
gh label create "tech-debt" --description "Refactoring, cleanup, optimization" --color "d4c5f9"

# Priority labels
gh label create "P0" --description "Ship-blocker, fix today" --color "b60205"
gh label create "P1" --description "Degrades core UX, fix this week" --color "e99695"
gh label create "P2" --description "Important but not urgent, next sprint" --color "c5def5"
gh label create "P3" --description "Nice-to-have, backlog" --color "f9d0c4"

# Effort labels
gh label create "E-small" --description "< 2 hours" --color "c2e0c6"
gh label create "E-medium" --description "2-8 hours" --color "fef2c0"
gh label create "E-large" --description "> 8 hours" --color "f9c5d5"
```

Save as `scripts/create-github-labels.sh` and run:

```bash
chmod +x scripts/create-github-labels.sh
./scripts/create-github-labels.sh
```

---

## Part 2: Create GitHub Project Board (5 minutes)

### Step 1: Create New Project

1. Go to: `https://github.com/clduab11/gemini-flow/projects`
2. Click: **New project**
3. Select: **Board** template
4. Name: `Gemini Flow Development`
5. Description: `Three Queues workflow for managing agentic sprint output`
6. Click: **Create project**

### Step 2: Configure Board Columns

The default Board template comes with "Todo", "In Progress", "Done". We need to customize it.

**Rename Columns:**

1. Click ⚙️ on "Todo" → Rename to: `🔥 Critical Path (P0)`
2. Click ⚙️ on "In Progress" → Delete this column
3. Click ⚙️ on "Done" → Keep as `✅ Done`

**Add New Columns** (Click + Add column):

1. `🚀 Active Sprint (P1)` - Insert between Critical Path and Done
2. `⚡ Quick Wins (P2 Small)` - Insert between Active Sprint and Done
3. `📦 Backlog` - Insert between Quick Wins and Done

**Final Column Order:**

```
🔥 Critical Path (P0) → 🚀 Active Sprint (P1) → ⚡ Quick Wins (P2 Small) → 📦 Backlog → ✅ Done
```

### Step 3: Configure Column Limits

GitHub Projects doesn't enforce WIP limits natively, but you can add them to column descriptions:

1. Click ⚙️ on "🔥 Critical Path (P0)" → Edit → Set description:
   ```
   **Max 3 items** - Ship-blockers only. Nothing else until these are resolved.
   ```

2. Click ⚙️ on "🚀 Active Sprint (P1)" → Edit → Set description:
   ```
   **Max 5 items** - This week's focus. Selected at Monday planning.
   ```

3. Click ⚙️ on "⚡ Quick Wins (P2 Small)" → Edit → Set description:
   ```
   **Max 10 items** - E-small tasks only. Mental break work.
   ```

---

## Part 3: Create Custom Views (3 minutes)

Projects support multiple views. Create these for different workflows:

### View 1: Board View (Default)

Already created. This is your daily working view.

### View 2: Priority Table View

1. Click **+ New view**
2. Select: **Table**
3. Name: `Priority View`
4. Click **Create**

**Configure Table:**

1. Click **Group** → Select `Priority`
2. Click **Sort** → Select `Effort` → Ascending
3. Click **Filter** → Add filter: `Status is not Done`
4. Add columns: `Title`, `Labels`, `Priority`, `Effort`, `Assignees`, `Status`

### View 3: Type Table View

1. Click **+ New view**
2. Select: **Table**
3. Name: `By Type`
4. Click **Create**

**Configure Table:**

1. Click **Group** → Select `Type` (custom field, see below)
2. Click **Sort** → Select `Priority` → Ascending
3. Click **Filter** → Add filter: `Status is not Done`

### View 4: Sprint Planning View

1. Click **+ New view**
2. Select: **Table**
3. Name: `Sprint Planning`
4. Click **Create**

**Configure Table:**

1. Click **Filter** → Add filters:
   - `Priority is P1`
   - `Status is not Done`
2. Click **Sort** → Select `Effort` → Ascending
3. Add columns: `Title`, `Effort`, `Type`, `Assignees`

**Purpose:** Use this view during Monday planning to select Active Sprint items.

---

## Part 4: Add Custom Fields (3 minutes)

GitHub Projects allows custom fields for better organization.

### Add Priority Field

1. In any view, click **+** next to column headers
2. Click **+ New field**
3. Name: `Priority`
4. Type: **Single select**
5. Options:
   - `P0` (color: red)
   - `P1` (color: orange)
   - `P2` (color: yellow)
   - `P3` (color: gray)
6. Click **Save**

### Add Effort Field

1. Click **+ New field**
2. Name: `Effort`
3. Type: **Single select**
4. Options:
   - `E-small` (color: green)
   - `E-medium` (color: yellow)
   - `E-large` (color: red)
5. Click **Save**

### Add Type Field

1. Click **+ New field**
2. Name: `Type`
3. Type: **Single select**
4. Options:
   - `critical-bug` (color: red)
   - `agent-ux` (color: blue)
   - `infra` (color: yellow)
   - `monitoring` (color: dark blue)
   - `enhancement` (color: light blue)
   - `tech-debt` (color: purple)
5. Click **Save**

### Add Estimated Hours Field (Optional)

1. Click **+ New field**
2. Name: `Est. Hours`
3. Type: **Number**
4. Click **Save**

---

## Part 5: Set Up Automation (2 minutes)

GitHub Projects has built-in automation workflows.

### Auto-add Issues to Project

1. Click **⚙️** (Settings) in top-right
2. Click **Workflows**
3. Enable: **Auto-add to project**
4. Configure:
   - When: `Issues are opened or reopened`
   - Add to: This project
   - Status: `📦 Backlog`

### Auto-move to Done

1. Enable: **Auto-archive**
2. Configure:
   - When: `Issue is closed`
   - Move to: `✅ Done`
   - Archive: After 7 days

### Custom Workflow: P0 Detection

Unfortunately, GitHub Projects doesn't support custom label-based automation natively. You'll need to manually move P0 issues to Critical Path.

**Alternative:** Use GitHub Actions (see Part 6)

---

## Part 6: GitHub Actions Automation (Optional, Advanced)

Create `.github/workflows/project-automation.yml`:

```yaml
name: Project Board Automation

on:
  issues:
    types: [opened, labeled, unlabeled]

jobs:
  auto-triage:
    runs-on: ubuntu-latest
    steps:
      - name: Move P0 to Critical Path
        if: contains(github.event.issue.labels.*.name, 'P0')
        uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/users/clduab11/projects/YOUR_PROJECT_NUMBER
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: 🔥 Critical Path (P0)

      - name: Move P1 to Active Sprint
        if: contains(github.event.issue.labels.*.name, 'P1')
        uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/users/clduab11/projects/YOUR_PROJECT_NUMBER
          github-token: ${{ secrets.GITHUB_TOKEN }}
          status: 🚀 Active Sprint (P1)
```

**Note:** Replace `YOUR_PROJECT_NUMBER` with your actual project number (found in project URL).

---

## Part 7: Create Initial Issues (5 minutes)

Now populate the board with the 28 issues from the triage document.

### Quick Method: Use GitHub CLI

Create `scripts/create-triage-issues.sh`:

```bash
#!/bin/bash

# Issue #1
gh issue create \
  --title "Super Terminal StoreAdapter Missing node-fetch Dependency" \
  --body-file .github/issue-templates/issue-1.md \
  --label "P0,critical-bug,infra,E-small" \
  --project "Gemini Flow Development"

# Issue #2
gh issue create \
  --title "StoreAdapter Response Format Incompatible with Sprint 7 API" \
  --body-file .github/issue-templates/issue-2.md \
  --label "P0,critical-bug,agent-ux,E-small" \
  --project "Gemini Flow Development"

# Issue #3
gh issue create \
  --title "Docker Compose Environment Variables Not Documented" \
  --body-file .github/issue-templates/issue-3.md \
  --label "P0,infra,E-small" \
  --project "Gemini Flow Development"

# ... continue for all 28 issues
```

### Manual Method: Copy-Paste Template

For each issue in `docs/TRIAGE_SPRINT_8_AFTERMATH.md`:

1. Go to: `https://github.com/clduab11/gemini-flow/issues/new`
2. Copy issue title and description
3. Add labels (Type, Priority, Effort)
4. Click **Submit new issue**
5. Issue will auto-add to project board (backlog)
6. Manually move to correct column based on priority

---

## Part 8: Weekly Workflow (Ongoing)

### Monday Morning (30 min): Sprint Planning

**Goal:** Triage new issues and load Active Sprint

1. **Open Priority View** in GitHub Projects
2. **Review Critical Path (P0)**
   - Must be 0-3 items
   - If > 3, promote less critical to P1
3. **Select Week Theme** (from triage doc)
   - Week 1: Stabilization
   - Week 2: Testing
   - Week 3: Infrastructure
   - Week 4: Agent UX
4. **Load Active Sprint (P1)**
   - Select 3-5 items matching week theme
   - Move from Backlog to Active Sprint column
   - Assign to yourself
5. **Refresh Quick Wins (P2 Small)**
   - Ensure 5-10 E-small items available
   - Add new ones if needed

### Daily (~15 min): Standup

**Morning:**
- Open Board View
- Pick 1 item from Active Sprint
- Move to In Progress (add comment: "Starting work")
- Close GitHub Projects, focus on work

**Afternoon:**
- If done: Move to Done, add summary comment
- If blocked: Add comment, move back to Active Sprint
- If done early: Pick from Quick Wins

### Friday Afternoon (30 min): Sprint Retrospective

1. **Review Done column**
   - Count completed items
   - Calculate velocity (hours completed)
   - Archive completed items
2. **Review Active Sprint**
   - Move incomplete items to Backlog
   - Add notes on why incomplete
3. **Review Critical Path**
   - Should be empty or nearly empty
4. **Triage new issues**
   - Apply labels to any new issues
   - Prioritize using RICE framework
5. **Celebrate wins** 🎉
   - Write weekly summary comment in Sprint 8 PR
   - Update project README with progress

---

## Part 9: Quick Reference

### Queue Health Indicators

| Queue | Target | Warning | Critical |
|-------|--------|---------|----------|
| Critical Path | 0-3 | 4-5 | > 5 |
| Active Sprint | 3-5 | 7+ | 10+ |
| Quick Wins | 5-10 | 15+ | - |

### Label Combinations

Common patterns:

- `P0 + critical-bug` → Drop everything, fix now
- `P1 + agent-ux + E-small` → Quick UX improvement for this week
- `P1 + infra + E-large` → Major infrastructure work for next sprint
- `P2 + tech-debt + E-medium` → Schedule during tech-debt week

### Triage Decision Tree

```
Is it blocking core functionality?
  Yes → P0, Critical Path
  No ↓

Does it degrade core UX?
  Yes → P1, Active Sprint (or Quick Wins if E-small)
  No ↓

Is it important for next sprint?
  Yes → P2, Backlog
  No → P3, Backlog
```

---

## Part 10: Troubleshooting

### Issue: Too many items in Critical Path

**Problem:** > 5 items in P0

**Solution:**
1. Re-evaluate priorities - are they really ship-blockers?
2. Demote less critical items to P1
3. Break down large P0 items into smaller tasks
4. Focus team (if applicable) on clearing queue

### Issue: Active Sprint consistently incomplete

**Problem:** Only completing 2/5 items weekly

**Solution:**
1. Reduce sprint size to 3 items
2. Choose more E-small items
3. Review effort estimates - are they accurate?
4. Check for scope creep in Definition of Done

### Issue: Backlog growing too fast

**Problem:** > 50 items in backlog

**Solution:**
1. Close stale issues (> 6 months old, no activity)
2. Merge duplicate issues
3. Re-prioritize: many P2 → P3
4. Consider quarterly backlog grooming session

### Issue: Labels not syncing with custom fields

**Problem:** Label says P0, custom field says P1

**Solution:**
- GitHub Projects custom fields are independent of labels
- Use either labels OR custom fields, not both
- Recommended: Use labels (more GitHub-integrated)
- Update custom fields manually or via GitHub Actions

---

## Part 11: Advanced Tips

### Tip 1: Use Draft Issues for Ideas

- Create draft issues for brainstorming
- Don't assign labels/priority yet
- Triage during Friday retrospective
- Prevents premature commitment

### Tip 2: Create "Epic" Issues for Large Features

- Use issue templates for epics
- Link related issues with task lists
- Track epic progress in custom field
- Example: "Sprint 9: Testing Suite" epic with 10 linked issues

### Tip 3: Use Milestones for Sprint Cycles

- Create milestone: "Week 1: Stabilization"
- Assign Active Sprint items to milestone
- GitHub auto-calculates progress
- Close milestone on Friday

### Tip 4: Add Burndown Chart (External Tool)

GitHub Projects doesn't have built-in burndown charts. Options:

- **ZenHub:** Browser extension for GitHub
- **Custom script:** Export project data, generate chart
- **GitHub Actions:** Auto-generate chart weekly

### Tip 5: Use Saved Views for Different Roles

- **Developer View:** Active Sprint + Quick Wins
- **Manager View:** All priorities, sorted by status
- **Planning View:** P1/P2 items, sorted by effort
- **Monitoring View:** All `monitoring` type issues

---

## Part 12: Onboarding New Contributors

When onboarding new developers:

1. **Share this document**
2. **Walk through Board View**
   - Explain three queues
   - Show how to pick tasks
3. **Explain Labels**
   - Type, Priority, Effort
   - How to apply during triage
4. **Review Weekly Workflow**
   - Monday: Planning
   - Daily: Pick → Work → Done
   - Friday: Retrospective
5. **Assign First Task**
   - Pick from Quick Wins (E-small)
   - Pair on first issue
   - Review Definition of Done

---

## Conclusion

You now have a production-ready GitHub Projects board using the Three Queues workflow! This system will help you:

✅ Triage issues efficiently with RICE framework
✅ Maintain focus with WIP limits
✅ Ship consistently with weekly sprints
✅ Prevent scope creep with Definition of Done
✅ Track progress with multiple views
✅ Onboard new contributors easily

**Next Steps:**
1. Create labels (Part 1)
2. Create project board (Part 2)
3. Create custom views (Part 3)
4. Add custom fields (Part 4)
5. Create initial issues (Part 7)
6. Start Week 1: Stabilization

**Remember:** The system works best when you follow it consistently. Start with Week 1, adjust based on your velocity, and iterate.

---

## Resources

- **Triage Document:** `docs/TRIAGE_SPRINT_8_AFTERMATH.md`
- **GitHub Projects Docs:** https://docs.github.com/en/issues/planning-and-tracking-with-projects
- **GitHub CLI:** https://cli.github.com
- **Label Script:** `scripts/create-github-labels.sh`

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0
**Status:** Active

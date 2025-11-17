#!/bin/bash

###############################################################################
# GitHub Projects V2 GraphQL Automation
# Automatically manage issues in GitHub Projects board based on labels
#
# ⚠️  WARNING: DO NOT USE UNTIL WEEK 2+ ⚠️
#
# This script is PREMATURE OPTIMIZATION until you have:
# 1. ✅ Completed all P0 issues (Issue #1, #2, #3)
# 2. ✅ Completed Week 1 sprint
# 3. ✅ Validated the manual workflow works
# 4. ✅ Measured actual time spent on manual triage (< 10 min/week)
#
# If you're running this before completing P0 issues, you're procrastinating.
# Go fix Issue #1 instead: npm install node-fetch
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - GitHub Projects V2 board created
# - Issues with P0/P1/P2/P3 labels
# - PROJECT_NUMBER configured below
#
# Usage:
#   ./scripts/sync-issues-to-project.sh
###############################################################################

set -e

# ⚠️  BEFORE RUNNING: Update these values
PROJECT_NUMBER="1"  # REQUIRED: Update with your project number from URL
OWNER="clduab11"
REPO="gemini-flow"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Pre-flight Checks
###############################################################################

echo -e "${RED}⚠️  WARNING: This script is premature optimization${NC}"
echo ""
echo "Have you completed all P0 issues? (Issue #1, #2, #3)"
echo "Have you run Week 1 sprint and validated the manual workflow?"
echo ""
read -p "Continue anyway? (yes/no): " CONTINUE

if [ "$CONTINUE" != "yes" ]; then
  echo ""
  echo -e "${YELLOW}Good choice! Go fix Issue #1 instead:${NC}"
  echo "  npm install node-fetch"
  echo ""
  exit 0
fi

echo ""
echo -e "${BLUE}🔄 GitHub Projects V2 Sync Starting...${NC}"
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI not installed${NC}"
  echo "Install: https://cli.github.com"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
  echo "Run: gh auth login"
  exit 1
fi

if [ "$PROJECT_NUMBER" = "1" ]; then
  echo -e "${YELLOW}⚠️  WARNING: PROJECT_NUMBER is still default (1)${NC}"
  echo "Update PROJECT_NUMBER in this script with your actual project number"
  echo "Find it in the URL: https://github.com/users/$OWNER/projects/NUMBER"
  echo ""
  read -p "Is your project actually #1? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    exit 1
  fi
fi

###############################################################################
# Step 1: Get Project ID
###############################################################################

echo -e "${YELLOW}📋 Fetching project ID...${NC}"

PROJECT_ID=$(gh api graphql -f query='
  query($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
      }
    }
  }
' -f owner="$OWNER" -F number="$PROJECT_NUMBER" --jq '.data.user.projectV2.id' 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Could not find project #$PROJECT_NUMBER${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Verify project exists: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
  echo "2. Update PROJECT_NUMBER in this script"
  echo "3. Check you're authenticated as $OWNER: gh auth status"
  exit 1
fi

echo -e "${GREEN}✅ Project ID: $PROJECT_ID${NC}"
echo ""

###############################################################################
# Step 2: Get Project Fields (Status column)
###############################################################################

echo -e "${YELLOW}📊 Fetching project fields...${NC}"

FIELD_DATA=$(gh api graphql -f query='
  query($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
' -f owner="$OWNER" -F number="$PROJECT_NUMBER")

# Parse Status field ID
STATUS_FIELD_ID=$(echo "$FIELD_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .id')

if [ -z "$STATUS_FIELD_ID" ]; then
  echo -e "${RED}❌ Could not find Status field${NC}"
  echo ""
  echo "Make sure your project has a Status field with these columns:"
  echo "  - 🔥 Critical Path (P0)"
  echo "  - 🚀 Active Sprint (P1)"
  echo "  - ⚡ Quick Wins"
  echo "  - 📦 Backlog"
  exit 1
fi

# Parse column IDs (flexible matching)
CRITICAL_PATH_ID=$(echo "$FIELD_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .options[] | select(.name | test("Critical|P0"; "i")) | .id' | head -1)
ACTIVE_SPRINT_ID=$(echo "$FIELD_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .options[] | select(.name | test("Active|Sprint|P1"; "i")) | .id' | head -1)
QUICK_WINS_ID=$(echo "$FIELD_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .options[] | select(.name | test("Quick|Wins"; "i")) | .id' | head -1)
BACKLOG_ID=$(echo "$FIELD_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .options[] | select(.name | test("Backlog"; "i")) | .id' | head -1)

echo -e "${GREEN}✅ Status field ID: $STATUS_FIELD_ID${NC}"
echo "   Critical Path: ${CRITICAL_PATH_ID:-NOT FOUND}"
echo "   Active Sprint: ${ACTIVE_SPRINT_ID:-NOT FOUND}"
echo "   Quick Wins: ${QUICK_WINS_ID:-NOT FOUND}"
echo "   Backlog: ${BACKLOG_ID:-NOT FOUND}"

if [ -z "$BACKLOG_ID" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Warning: Some columns not found. Issues will not be moved.${NC}"
fi

echo ""

###############################################################################
# Step 3: Process Issues
###############################################################################

echo -e "${YELLOW}🔍 Processing open issues...${NC}"
echo ""

# Get all open issues with labels
ISSUES=$(gh issue list --repo "$OWNER/$REPO" --state open --json number,title,labels,id --limit 100)

if [ "$(echo "$ISSUES" | jq '. | length')" = "0" ]; then
  echo -e "${YELLOW}No open issues found${NC}"
  exit 0
fi

PROCESSED=0
MOVED=0
ADDED=0
SKIPPED=0

echo "$ISSUES" | jq -c '.[]' | while read -r issue; do
  ISSUE_NUMBER=$(echo "$issue" | jq -r '.number')
  ISSUE_TITLE=$(echo "$issue" | jq -r '.title')
  ISSUE_ID=$(echo "$issue" | jq -r '.id')
  LABELS=$(echo "$issue" | jq -r '.labels[].name' | tr '\n' ' ')

  # Determine target column based on labels
  TARGET_COLUMN=""
  TARGET_COLUMN_ID=""

  if echo "$LABELS" | grep -q "P0"; then
    TARGET_COLUMN="🔥 Critical Path (P0)"
    TARGET_COLUMN_ID="$CRITICAL_PATH_ID"
  elif echo "$LABELS" | grep -q "P1" && echo "$LABELS" | grep -q "E-small"; then
    TARGET_COLUMN="⚡ Quick Wins"
    TARGET_COLUMN_ID="$QUICK_WINS_ID"
  elif echo "$LABELS" | grep -q "P1"; then
    TARGET_COLUMN="🚀 Active Sprint (P1)"
    TARGET_COLUMN_ID="$ACTIVE_SPRINT_ID"
  else
    TARGET_COLUMN="📦 Backlog"
    TARGET_COLUMN_ID="$BACKLOG_ID"
  fi

  echo -e "${BLUE}#$ISSUE_NUMBER:${NC} $ISSUE_TITLE"
  echo "  Labels: $LABELS"
  echo "  Target: $TARGET_COLUMN"

  # Check if issue is already in project
  ITEM_ID=$(gh api graphql -f query='
    query($projectId: ID!, $issueId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  id
                }
              }
            }
          }
        }
      }
    }
  ' -f projectId="$PROJECT_ID" -f issueId="$ISSUE_ID" --jq ".data.node.items.nodes[] | select(.content.id == \"$ISSUE_ID\") | .id" 2>/dev/null)

  if [ -z "$ITEM_ID" ]; then
    # Add issue to project
    echo "  → Adding to project..."

    RESULT=$(gh api graphql -f query='
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          item {
            id
          }
        }
      }
    ' -f projectId="$PROJECT_ID" -f contentId="$ISSUE_ID" 2>&1)

    if echo "$RESULT" | jq -e '.data.addProjectV2ItemById.item.id' > /dev/null 2>&1; then
      ITEM_ID=$(echo "$RESULT" | jq -r '.data.addProjectV2ItemById.item.id')
      echo -e "  ${GREEN}✅ Added to project${NC}"
      ADDED=$((ADDED + 1))
    else
      echo -e "  ${RED}❌ Failed to add to project${NC}"
      SKIPPED=$((SKIPPED + 1))
      echo ""
      continue
    fi
  else
    echo "  ℹ️  Already in project"
  fi

  # Update status column
  if [ -n "$TARGET_COLUMN_ID" ] && [ -n "$ITEM_ID" ]; then
    echo "  → Moving to $TARGET_COLUMN..."

    RESULT=$(gh api graphql -f query='
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
        updateProjectV2ItemFieldValue(
          input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: {singleSelectOptionId: $value}
          }
        ) {
          projectV2Item {
            id
          }
        }
      }
    ' -f projectId="$PROJECT_ID" -f itemId="$ITEM_ID" -f fieldId="$STATUS_FIELD_ID" -f value="$TARGET_COLUMN_ID" 2>&1)

    if echo "$RESULT" | jq -e '.data.updateProjectV2ItemFieldValue.projectV2Item.id' > /dev/null 2>&1; then
      echo -e "  ${GREEN}✅ Moved to $TARGET_COLUMN${NC}"
      MOVED=$((MOVED + 1))
    else
      echo -e "  ${YELLOW}⚠️  Could not move (already in correct column?)${NC}"
    fi
  else
    echo -e "  ${YELLOW}⚠️  Target column not found, skipping move${NC}"
    SKIPPED=$((SKIPPED + 1))
  fi

  echo ""
  PROCESSED=$((PROCESSED + 1))
done

###############################################################################
# Summary
###############################################################################

echo ""
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo "📊 Summary:"
echo "   Processed: $PROCESSED issues"
echo "   Added: $ADDED issues"
echo "   Moved: $MOVED issues"
echo "   Skipped: $SKIPPED issues"
echo ""
echo "🔗 View project: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
echo ""
echo -e "${YELLOW}💡 Reminder: This script should be used sparingly.${NC}"
echo "   Manual triage is fast (5 min/week) and helps you stay connected to issues."
echo ""

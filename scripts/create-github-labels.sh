#!/bin/bash

###############################################################################
# GitHub Labels Creation Script
# Creates all labels needed for the Three Queues triage system
###############################################################################

set -e  # Exit on error

echo "🏷️  Creating GitHub Labels for Gemini Flow..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

###############################################################################
# Type Labels
###############################################################################

echo "📦 Creating Type labels..."

gh label create "critical-bug" \
  --description "Blocks core functionality" \
  --color "d73a4a" \
  --force || true

gh label create "agent-ux" \
  --description "Affects agent interaction quality" \
  --color "0075ca" \
  --force || true

gh label create "infra" \
  --description "Build, deploy, dependencies" \
  --color "fbca04" \
  --force || true

gh label create "monitoring" \
  --description "Metrics, observability, performance" \
  --color "1d76db" \
  --force || true

gh label create "enhancement" \
  --description "New features, improvements" \
  --color "a2eeef" \
  --force || true

gh label create "tech-debt" \
  --description "Refactoring, cleanup, optimization" \
  --color "d4c5f9" \
  --force || true

echo "✅ Type labels created"
echo ""

###############################################################################
# Priority Labels
###############################################################################

echo "🎯 Creating Priority labels..."

gh label create "P0" \
  --description "Ship-blocker, fix today" \
  --color "b60205" \
  --force || true

gh label create "P1" \
  --description "Degrades core UX, fix this week" \
  --color "e99695" \
  --force || true

gh label create "P2" \
  --description "Important but not urgent, next sprint" \
  --color "c5def5" \
  --force || true

gh label create "P3" \
  --description "Nice-to-have, backlog" \
  --color "f9d0c4" \
  --force || true

echo "✅ Priority labels created"
echo ""

###############################################################################
# Effort Labels
###############################################################################

echo "⏱️  Creating Effort labels..."

gh label create "E-small" \
  --description "< 2 hours" \
  --color "c2e0c6" \
  --force || true

gh label create "E-medium" \
  --description "2-8 hours" \
  --color "fef2c0" \
  --force || true

gh label create "E-large" \
  --description "> 8 hours" \
  --color "f9c5d5" \
  --force || true

echo "✅ Effort labels created"
echo ""

###############################################################################
# Summary
###############################################################################

echo "✅ All labels created successfully!"
echo ""
echo "📋 Summary:"
echo "   Type labels: critical-bug, agent-ux, infra, monitoring, enhancement, tech-debt"
echo "   Priority labels: P0, P1, P2, P3"
echo "   Effort labels: E-small, E-medium, E-large"
echo ""
echo "🔗 View labels: https://github.com/clduab11/gemini-flow/labels"
echo ""
echo "Next steps:"
echo "1. Create GitHub Project board (see docs/GITHUB_PROJECTS_SETUP.md)"
echo "2. Create initial issues (run scripts/create-critical-issues.sh)"
echo ""

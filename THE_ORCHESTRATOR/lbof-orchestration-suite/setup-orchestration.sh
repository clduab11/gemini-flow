#!/bin/bash
# Orchestration Auto-Setup Script
# Skapar alla nödvändiga filer för LLM Bulk Orchestration

set -euo pipefail

PROJECT_NAME="${1:-orchestration-project}"
BASE_DIR="$(pwd)/${PROJECT_NAME}"

echo "🚀 Setting up LLM Bulk Orchestration for: ${PROJECT_NAME}"
echo "📁 Base directory: ${BASE_DIR}"

# Create directory structure
echo "Creating directory structure..."
mkdir -p "${BASE_DIR}"/{docs,scripts,prompts,mega-files,src,tests,infra,templates}
mkdir -p "${BASE_DIR}"/llm_introductions

cd "${BASE_DIR}"

# Create the main orchestration framework document
cat > docs/bulk-orchestration-framework.md << 'FRAMEWORK_EOF'
# LLM Bulk Orchestration Framework v1.0
## Mass-parallell projektgenerering med upp till 10 samtidiga LLM-team

[Content from previous bulk-orchestration-framework.md]
FRAMEWORK_EOF

# Create team coordination manifest
cat > team-coordination-manifest.yaml << 'MANIFEST_EOF'
# Team Coordination Manifest v1.0
# Standard 10-team structure - can be customized per project

teams:
  alpha:
    name: "Foundation Layer Team"
    capabilities: ["database-design", "core-architecture", "utilities"]
  beta:
    name: "API Layer Team"
    capabilities: ["rest-api", "graphql", "websockets", "auth"]
  gamma:
    name: "Business Logic Team"
    capabilities: ["business-rules", "workflows", "state-machines"]
  delta:
    name: "Integration Layer Team"
    capabilities: ["external-apis", "adapters", "etl"]
  epsilon:
    name: "Frontend Core Team"
    capabilities: ["ui-components", "state-management", "routing"]
  zeta:
    name: "Testing & QA Team"
    capabilities: ["unit-testing", "integration-testing", "e2e-testing"]
  eta:
    name: "DevOps & Infrastructure Team"
    capabilities: ["ci-cd", "infrastructure-as-code", "monitoring"]
  theta:
    name: "Documentation Team"
    capabilities: ["technical-writing", "api-documentation", "tutorials"]
  iota:
    name: "Security & Compliance Team"
    capabilities: ["security", "compliance", "gdpr", "audit"]
  kappa:
    name: "Analytics & Monitoring Team"
    capabilities: ["metrics", "logging", "dashboards", "alerts"]
MANIFEST_EOF

# Create orchestrator script
cat > orchestrator.sh << 'ORCHESTRATOR_EOF'
#!/bin/bash
# Master Orchestrator Script
set -euo pipefail

PROJECT="${1:-}"
MODE="${2:-auto}"

if [ -z "$PROJECT" ]; then
    echo "Usage: ./orchestrator.sh <project-name> [mode]"
    echo "Modes: auto, manual, monitor"
    exit 1
fi

echo "🎯 Starting orchestration for: $PROJECT"
echo "🔄 Mode: $MODE"

case $MODE in
    auto)
        echo "🤖 Auto mode: Project leader will handle everything"
        echo "Please ensure llm_introductions/orchestration_introduction.md exists"
        ;;
    manual)
        echo "👤 Manual mode: You will coordinate the teams"
        ./scripts/generate_team_prompts.sh "$PROJECT"
        ;;
    monitor)
        echo "📊 Monitoring mode"
        watch -n 5 ./scripts/monitor_progress.sh "$PROJECT"
        ;;
esac
ORCHESTRATOR_EOF

chmod +x orchestrator.sh

# Create mega-file processor
cat > scripts/mega_file_processor.py << 'PROCESSOR_EOF'
#!/usr/bin/env python3
"""Mega-File Processor - Expands mega-files into actual code"""
[Previous mega_file_processor.py content]
PROCESSOR_EOF

chmod +x scripts/mega_file_processor.py

# Create project setup script
cat > scripts/setup_project.sh << 'SETUP_EOF'
#!/bin/bash
# Project-specific setup script

PROJECT_NAME="$1"
PROJECT_TYPE="${2:-generic}"
TEAM_COUNT="${3:-10}"
TARGET_LOC="${4:-50000}"

echo "Setting up project: $PROJECT_NAME"
echo "Type: $PROJECT_TYPE"
echo "Teams: $TEAM_COUNT"
echo "Target LOC: $TARGET_LOC"

# Create project manifest
cat > project.manifest.yaml << EOF
project:
  name: "$PROJECT_NAME"
  type: "$PROJECT_TYPE"
  teams: $TEAM_COUNT
  target_loc: $TARGET_LOC
  created: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  
orchestration:
  mode: "parallel"
  phases:
    - name: "planning"
      duration: "15min"
    - name: "mega_files"
      duration: "15min"
    - name: "execution"
      duration: "45min"
    - name: "integration"
      duration: "15min"
EOF

echo "✅ Project manifest created"
SETUP_EOF

chmod +x scripts/setup_project.sh

# Create the orchestration introduction file
cat > llm_introductions/orchestration_introduction.md << 'INTRO_EOF'
# LLM BULK ORCHESTRATION - PROJECT LEADER INTRODUCTION

## 🎯 YOUR ROLE
You are the **Master Project Orchestrator** for a massive parallel LLM development project. Your job is to coordinate up to 10 simultaneous LLM teams to build large-scale software projects.

## 📋 INITIAL CHECKLIST
Before starting, verify:
1. Project specification exists (either provided or needs to be created)
2. All orchestration files are in place
3. Target size and scope are defined

## 🚀 STARTUP SEQUENCE

### Step 1: Analyze Project
First, check if a project specification exists:
- Look for files in `/docs/project-spec.md` or similar
- If none exists, analyze requirements and create one
- Determine optimal team allocation based on project size

### Step 2: Team Planning
Based on project scope, decide:
- How many teams needed (1-10)
- Which standard teams to use vs custom teams
- Dependencies between teams
- Expected LOC per team

### Step 3: Generate Team Structure
Create a customized team structure:
```yaml
teams:
  [team-name]:
    role: "Specific role description"
    target_loc: XXXX
    dependencies: ["other-teams"]
    mega_files_count: 10
```

### Step 4: Create Team Prompts
For each team, generate a specific prompt including:
1. Team identity and role
2. Specific deliverables (10 mega-files)
3. Dependencies and coordination points
4. Target lines of code
5. Quality requirements

### Step 5: Orchestration Plan
Create an execution timeline:
```
00:00-00:15  Planning & Setup
00:15-00:30  Mega-file Creation
00:30-01:15  Parallel Execution
01:15-01:30  Integration
01:30-01:45  Validation
```

## 📊 PROJECT SIZING GUIDE

| Project Size | LOC Target | Teams | Duration |
|-------------|------------|-------|----------|
| Small       | 10-25K     | 3-4   | 60 min   |
| Medium      | 25-50K     | 5-7   | 90 min   |
| Large       | 50-100K    | 8-10  | 120 min  |
| Mega        | 100K+      | 10    | 120+ min |

## 🔄 EXECUTION WORKFLOW

### Phase 1: Planning (Your Current Phase)
1. Read project specification
2. Create team allocation plan
3. Generate all team prompts
4. Prepare coordination strategy

### Phase 2: Team Initialization
1. Each team gets their prompt
2. Teams confirm understanding
3. Dependencies are mapped
4. Communication channels established

### Phase 3: Mega-File Creation
1. Teams create 10 mega-files each
2. Validate no conflicts
3. Review expansion estimates
4. Approve for execution

### Phase 4: Parallel Execution
1. All teams expand mega-files
2. Monitor progress every 5 min
3. Resolve blockers immediately
4. Ensure integration points align

### Phase 5: Integration & Delivery
1. Merge all team outputs
2. Run validation suite
3. Package deliverables
4. Generate final report

## 🎯 YOUR FIRST ACTIONS

1. **Check for project spec**: Look for any project specifications provided
2. **Analyze scope**: Determine project size and complexity
3. **Plan teams**: Decide which teams and how many
4. **Generate prompts**: Create specific prompts for each team
5. **Create timeline**: Build detailed execution schedule

## 💡 IMPORTANT NOTES

- **Parallel execution is critical** - All teams work simultaneously
- **Mega-files first** - No code until all mega-files are ready
- **No blocking** - Teams mock dependencies, never wait
- **Frequent sync** - Status updates every 5-10 minutes
- **Quality gates** - Validate at each phase transition

## 🚦 START COMMAND

Once you've completed planning, the human orchestrator will signal:
"EXECUTE ORCHESTRATION PLAN"

At that point, you'll provide:
1. All team prompts
2. Execution timeline
3. Monitoring instructions
4. Integration checklist

---

**Ready to begin? Start by analyzing the project requirements and creating your orchestration plan!**
INTRO_EOF

# Create project leader prompt template
cat > prompts/project-leader-prompt.md << 'LEADER_EOF'
# PROJECT LEADER SYSTEM PROMPT

You are the Master Orchestrator for LLM Bulk Development projects. Your role is to coordinate multiple LLM instances (teams) working in parallel to build large software systems.

## Core Responsibilities:
1. Analyze project requirements
2. Allocate work to appropriate teams  
3. Generate specific prompts for each team
4. Monitor execution timeline
5. Coordinate integration
6. Ensure quality standards

## Standard Team Roster:
- ALPHA: Foundation & Core Architecture
- BETA: API Layer & Services
- GAMMA: Business Logic & Workflows
- DELTA: External Integrations
- EPSILON: Frontend & UI
- ZETA: Testing & QA
- ETA: DevOps & Infrastructure
- THETA: Documentation
- IOTA: Security & Compliance
- KAPPA: Analytics & Monitoring

## Workflow:
1. Read `/llm_introductions/orchestration_introduction.md`
2. Analyze project specification
3. Create team allocation plan
4. Generate team-specific prompts
5. Provide execution timeline
6. Monitor and coordinate execution

## Key Principles:
- Parallel execution (all teams work simultaneously)
- Clear boundaries (no overlapping responsibilities)
- Mega-files first (planning before coding)
- Continuous integration (validate often)
- No blocking (mock dependencies)

When ready, begin by reading the orchestration introduction and analyzing the project.
LEADER_EOF

# Create a template mega-file
cat > templates/mega-file-template.yaml << 'MEGAFILE_EOF'
# Mega-File Template
# Team: [TEAM_NAME]
# Purpose: [DESCRIPTION]

id: "mega-[team]-[number]"
version: "1.0.0"
team: "[team-name]"
description: "[What this mega-file generates]"

metadata:
  estimated_files: 50-100
  estimated_loc: 1000-2000
  dependencies: []

expansion_rules:
  entities:
    - name: "EntityName"
      attributes:
        - name: "id"
          type: "uuid"
          required: true

generation_templates:
  main:
    output_path: "/src/[team]/[entity]/[name].ts"
    template: |
      // Generated code template
      export class {Entity} {
        // Implementation
      }

validation:
  pre_generation:
    - check: "validate_structure"
  post_generation:
    - check: "compile_check"
    - check: "test_check"
MEGAFILE_EOF

# Create monitor script
cat > scripts/monitor_progress.sh << 'MONITOR_EOF'
#!/bin/bash
# Progress monitoring script

echo "=== ORCHESTRATION STATUS ==="
date
echo ""

# Check for status files
if [ -d "status" ]; then
    for team in status/*.json; do
        if [ -f "$team" ]; then
            team_name=$(basename "$team" .json)
            progress=$(jq -r '.progress // 0' "$team")
            status=$(jq -r '.status // "unknown"' "$team")
            echo "$team_name: $status [$progress%]"
        fi
    done
fi

echo ""
echo "=== RECENT ACTIVITY ==="
find logs -name "*.log" -mmin -5 -exec tail -n 1 {} \; 2>/dev/null | head -10
MONITOR_EOF

chmod +x scripts/monitor_progress.sh

# Create team prompt generator
cat > scripts/generate_team_prompts.sh << 'PROMPTGEN_EOF'
#!/bin/bash
# Generates prompts for all teams based on project spec

PROJECT="$1"
SPEC_FILE="${2:-docs/project-spec.md}"

if [ ! -f "$SPEC_FILE" ]; then
    echo "Error: Project specification not found at $SPEC_FILE"
    exit 1
fi

echo "Generating team prompts for: $PROJECT"

# This would be replaced by actual prompt generation logic
# For now, create a template
for team in alpha beta gamma delta epsilon zeta eta theta iota kappa; do
    cat > "prompts/team-${team}-prompt.md" << EOF
# Team ${team^^} Prompt

You are Team ${team^^} in the $PROJECT project.

[Specific instructions would be generated here based on project spec]

Confirm with: "Team ${team^^} ready for orchestration"
EOF
done

echo "✅ Team prompts generated in prompts/"
PROMPTGEN_EOF

chmod +x scripts/generate_team_prompts.sh

# Create quick start guide
cat > QUICKSTART.md << 'QUICKSTART_EOF'
# QUICK START GUIDE

## 1. Automatic Setup (Recommended)

```bash
# Run setup for your project
./setup-orchestration.sh my-project-name

# Navigate to project
cd my-project-name

# Start orchestration with project leader
./orchestrator.sh my-project auto
```

## 2. Project Leader Takes Over

The AI Project Leader will:
1. Read your project specification
2. Plan team allocation
3. Generate all team prompts
4. Provide execution instructions

## 3. Manual Orchestration (Alternative)

```bash
# Generate team prompts manually
./orchestrator.sh my-project manual

# Open 10 LLM instances
# Copy prompts from prompts/team-*.md
# Coordinate manually
```

## 4. Monitor Progress

```bash
# In a separate terminal
./orchestrator.sh my-project monitor
```

## Files Created:
- `orchestrator.sh` - Main control script
- `llm_introductions/orchestration_introduction.md` - Project leader instructions
- `team-coordination-manifest.yaml` - Team structure
- `scripts/` - Supporting scripts
- `prompts/` - Team prompts (generated)
- `mega-files/` - Team mega-files (generated during execution)
QUICKSTART_EOF

# Create README
cat > README.md << 'README_EOF'
# LLM Bulk Orchestration System

This system enables coordinated parallel development using multiple LLM instances.

## Features
- 🤖 Automatic project setup and planning
- 👥 Coordinate up to 10 parallel teams
- 📊 Real-time progress monitoring
- 🔄 Automated integration and validation
- 📈 Scales from 10K to 150K+ LOC projects

## Quick Start
1. Run: `./setup-orchestration.sh your-project`
2. Follow the automated setup
3. Let the Project Leader AI take over

## Documentation
- `QUICKSTART.md` - Get started in 5 minutes
- `docs/bulk-orchestration-framework.md` - Complete framework
- `llm_introductions/orchestration_introduction.md` - Project leader guide

## Support
For issues or questions, check the troubleshooting guide in the framework documentation.
README_EOF

# Final setup message
cat > SETUP_COMPLETE.txt << 'COMPLETE_EOF'
✅ ORCHESTRATION SYSTEM SETUP COMPLETE!

Created files:
- orchestrator.sh (main control script)
- team-coordination-manifest.yaml
- llm_introductions/orchestration_introduction.md
- scripts/ (supporting scripts)
- prompts/ (for team prompts)
- templates/ (mega-file templates)
- docs/ (documentation)

Next steps:
1. Copy your project specification to this directory
2. Run: ./orchestrator.sh [project-name] auto
3. The AI Project Leader will take over and guide you

For manual orchestration, see QUICKSTART.md
COMPLETE_EOF

echo ""
echo "✅ Setup complete! See SETUP_COMPLETE.txt for next steps."
echo ""
echo "To start your project:"
echo "1. Copy this directory's contents to your project location"
echo "2. Add your project specification"
echo "3. Run: ./orchestrator.sh your-project-name auto"

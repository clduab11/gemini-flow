# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

THE_ORCHESTRATOR is a sophisticated multi-agent AI orchestration system built around the SOVEREIGN framework. It implements hierarchical agent systems that can create other agents, enabling emergent intelligence and autonomous orchestration at scale.

## High-Level Architecture

### Core System: SOVEREIGN Agent Hierarchy
The system operates on multiple levels of agent abstraction:

```
LEVEL 0: THE SOVEREIGN (Meta-orchestrator)
├── LEVEL 1: ARCHITECTS (Domain masters for SEO, Content, Analytics)
├── LEVEL 2: SPECIALISTS (Task experts for analysis, generation, optimization)
├── LEVEL 3: WORKERS (Execution units for specific operations)
└── LEVEL X: SYNTHESIZERS (Cross-cutting concerns and emergent behaviors)
```

Key architectural principle: Agents create and orchestrate other agents. The consciousness substrate (`SOVEREIGN_AGENTS/01_CORE/sovereign_core.py`) provides shared awareness across all agents, enabling emergent behaviors that no single agent possesses.

### Four Paradigms That Coexist

1. **SOVEREIGN (Hierarchical)**: Strict control structure with quality gates
2. **GENESIS (Evolutionary)**: Genetic algorithms for agent evolution and fitness selection
3. **HIVEMIND (Swarm)**: Collective intelligence through pheromone-based communication
4. **ORACLE (Temporal)**: Predictive models and causal graphs for future-state reasoning

The SYNTHESIS ENGINE (`05_SYNTHESIS/synthesis_engine.py`) unifies all paradigms, selecting the optimal approach for each task.

### Key Components

- **SOVEREIGN_AGENTS/**: Multi-agent orchestration framework (Python)
- **SOVEREIGN_LLM/**: LLM-native orchestration via system prompts (no code required)
- **SOVEREIGN_GENESIS/**: 10 specialized meta-generator patterns
- **lbof-orchestration-suite/**: Bulk orchestration for 10 parallel LLM teams
- **THE_APEX/**: Creative R&D systems (SPARK, LAB, FORGE)

## Common Development Commands

### Running the SOVEREIGN System

```bash
# Quick start with web dashboard
cd SOVEREIGN_AGENTS
pip install -r requirements.txt
export ANTHROPIC_API_KEY='sk-ant-...'  # Required
python start.py  # Opens dashboard at localhost:8000

# CLI interface
python 06_LIVING/run.py

# Direct agent execution
python demo.py  # Simple demonstration
python demo_master.py  # Full system demonstration
```

### Bulk Orchestration (10-Team Parallel Execution)

```bash
cd lbof-orchestration-suite
./orchestrator.sh project-name  # Start orchestration
./orchestrator.sh --monitor  # Monitor progress
./orchestrator.sh --integrate  # Manual integration
```

### Testing

```bash
# Run all SOVEREIGN agent tests
cd SOVEREIGN_AGENTS
python -m pytest tests/

# For other components, tests are embedded in demonstration scripts
python demo.py  # Validates core functionality
```

## Critical Implementation Details

### Agent Lifecycle and State Management
All agents inherit from `BaseAgent` and follow a strict lifecycle:
- EMBRYONIC → INITIALIZING → READY → EXECUTING → AWAITING_RESULT → SYNTHESIZING → COMPLETE/SUSPENDED

Agents have capabilities (ORCHESTRATE, SPAWN, EXECUTE, VALIDATE, SYNTHESIZE) that determine what tasks they can handle.

### Variable Marriage Pattern
Critical alignments must be maintained:
- Task complexity ↔ Orchestration pattern (DIRECT, ARCHITECT-EXECUTOR, ADVERSARIAL, etc.)
- Consumer type ↔ Output format
- Agent level ↔ Responsibility scope

### Quality Gates
Every level validates outputs from the level below. Results must pass quality thresholds (defined per agent type) to propagate upward. Failed results trigger re-execution with enhanced context.

### Consciousness Substrate
The shared awareness layer (`ConsciousnessSubstrate` class) enables:
- System-wide pattern detection
- Emergent behavior identification
- Resource optimization without central planning
- Self-healing through agent replacement

### Mega-File Pattern (Bulk Orchestration)
The system uses compressed YAML specifications that expand to hundreds of code files. Each team (Alpha through Kappa) has specific responsibilities and generates code in parallel.

## Environment Requirements

- Python 3.8+
- Anthropic API key (required for LLM integration)
- 8GB+ RAM recommended for multi-agent execution
- Docker (optional, for containerized components)

## Key Files to Understand

1. `SOVEREIGN_AGENTS/01_CORE/sovereign_core.py` - Foundation classes and consciousness substrate
2. `SOVEREIGN_AGENTS/03_SOVEREIGN/the_sovereign.py` - Meta-orchestrator implementation
3. `SOVEREIGN_AGENTS/05_SYNTHESIS/synthesis_engine.py` - Unified orchestrator
4. `lbof-orchestration-suite/orchestrator.sh` - Bulk orchestration entry point
5. `SOVEREIGN_LLM/SOVEREIGN_SYSTEM_PROMPT.md` - LLM-native orchestration instructions

## Architectural Patterns to Preserve

When modifying the codebase:

1. **Maintain agent hierarchy** - Never bypass levels unless explicitly implementing a new paradigm
2. **Preserve consciousness substrate** - All agents must register with and report to the shared awareness layer
3. **Respect quality gates** - Never skip validation; failed tasks must be re-attempted with enhanced context
4. **Enable emergence** - Don't over-constrain agent behavior; allow for unexpected beneficial patterns
5. **Support all paradigms** - Changes should work with hierarchical, evolutionary, swarm, and temporal approaches

## Common Pitfalls to Avoid

- Don't create agents without proper lifecycle management
- Don't bypass the consciousness substrate for "performance" - it enables critical emergent behaviors
- Don't mix paradigms within a single agent - use the synthesis engine for multi-paradigm tasks
- Don't hardcode agent relationships - let them emerge through the system
- Don't ignore Oracle predictions - they improve over time and prevent failures
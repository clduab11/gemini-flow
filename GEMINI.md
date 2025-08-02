# Gemini-Flow Configuration - SPARC Development Environment (Batchtools Optimized)

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**Examples of CORRECT concurrent execution:**
```javascript
// ✅ CORRECT: Everything in ONE message
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Task("Agent 3 with full instructions and hooks")
  - Read("file1.js")
  - Read("file2.js")
  - Write("output1.js", content)
  - Write("output2.js", content)
  - Bash("npm install")
  - Bash("npm test")
  - Bash("npm run build")
```

**Examples of WRONG sequential execution:**
```javascript
// ❌ WRONG: Multiple messages (NEVER DO THIS)
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Task("Agent 2")
Message 4: Read("file1.js")
Message 5: Write("output1.js")
Message 6: Bash("npm install")
// This is 6x slower and breaks coordination!
```

### 🎯 CONCURRENT EXECUTION CHECKLIST:

Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?
- ✅ Are ALL memory operations concurrent?

If ANY answer is "No", you MUST combine operations into a single message!

## Project Overview
This project uses the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology for systematic Test-Driven Development with AI assistance through Gemini-Flow orchestration.

**🚀 Batchtools Optimization Enabled**: This configuration includes optimized prompts and parallel processing capabilities leveraging Gemini's 1M-2M token context window for improved performance and efficiency.

## SPARC Development Commands

### Core SPARC Commands
- `npx gemini-flow sparc modes`: List all available SPARC development modes
- `npx gemini-flow sparc run <mode> "<task>"`: Execute specific SPARC mode for a task
- `npx gemini-flow sparc tdd "<feature>"`: Run complete TDD workflow using SPARC methodology
- `npx gemini-flow sparc info <mode>`: Get detailed information about a specific mode

### Batchtools Commands (Optimized)
- `npx gemini-flow sparc batch <modes> "<task>"`: Execute multiple SPARC modes in parallel
- `npx gemini-flow sparc pipeline "<task>"`: Execute full SPARC pipeline with parallel processing
- `npx gemini-flow sparc concurrent <mode> "<tasks-file>"`: Process multiple tasks concurrently

### Standard Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the test suite
- `npm run lint`: Run linter and format checks
- `npm run typecheck`: Run TypeScript type checking

## SPARC Methodology Workflow (Batchtools Enhanced)

### 1. Specification Phase (Parallel Analysis)
```bash
# Create detailed specifications with concurrent requirements analysis
npx gemini-flow sparc run spec-pseudocode "Define user authentication requirements" --parallel
```
**Batchtools Optimization**: Simultaneously analyze multiple requirement sources, validate constraints in parallel, and generate comprehensive specifications leveraging Gemini's massive context window.

### 2. Pseudocode Phase (Concurrent Logic Design)
```bash
# Develop algorithmic logic with parallel pattern analysis
npx gemini-flow sparc run spec-pseudocode "Create authentication flow pseudocode" --batch-optimize
```
**Batchtools Optimization**: Process multiple algorithm patterns concurrently, validate logic flows in parallel, and optimize data structures simultaneously using Gemini's multimodal capabilities.

### 3. Architecture Phase (Parallel Component Design)
```bash
# Design system architecture with concurrent component analysis
npx gemini-flow sparc run architect "Design authentication service architecture" --parallel
```
**Batchtools Optimization**: Generate multiple architectural alternatives simultaneously, validate integration points in parallel, and create comprehensive documentation concurrently.

### 4. Refinement Phase (Parallel TDD Implementation)
```bash
# Execute Test-Driven Development with parallel test generation
npx gemini-flow sparc tdd "implement user authentication system" --batch-tdd
```
**Batchtools Optimization**: Generate multiple test scenarios simultaneously, implement and validate code in parallel, and optimize performance concurrently.

### 5. Completion Phase (Concurrent Integration)
```bash
# Integration with parallel validation and documentation
npx gemini-flow sparc run integration "integrate authentication with user management" --parallel
```
**Batchtools Optimization**: Run integration tests in parallel, generate documentation concurrently, and validate requirements simultaneously.

## Batchtools Integration Features

### Parallel Processing Capabilities
- **Concurrent File Operations**: Read, analyze, and modify multiple files simultaneously
- **Parallel Code Analysis**: Analyze dependencies, patterns, and architecture concurrently
- **Batch Test Generation**: Create comprehensive test suites in parallel
- **Concurrent Documentation**: Generate multiple documentation formats simultaneously
- **Gemini Context Optimization**: Leverage 1M-2M token window for massive parallel processing

### Performance Optimizations
- **Smart Batching**: Group related operations for optimal performance
- **Pipeline Processing**: Chain dependent operations with parallel stages
- **Resource Management**: Efficient utilization of Gemini's capabilities
- **Error Resilience**: Robust error handling with parallel recovery
- **Context Caching**: 4x cost reduction with Gemini's caching features

## Performance Benchmarks

### Batchtools Performance Improvements
- **File Operations**: Up to 400% faster with parallel processing
- **Code Analysis**: 350% improvement with concurrent pattern recognition
- **Test Generation**: 500% faster with parallel test creation
- **Documentation**: 300% improvement with concurrent content generation
- **Memory Operations**: 250% faster with batched read/write operations
- **Context Processing**: 600% improvement with Gemini's large context window

## Code Style and Best Practices (Batchtools Enhanced)

### SPARC Development Principles with Batchtools
- **Modular Design**: Keep files under 500 lines, optimize with parallel analysis
- **Environment Safety**: Never hardcode secrets, validate with concurrent checks
- **Test-First**: Always write tests before implementation using parallel generation
- **Clean Architecture**: Separate concerns with concurrent validation
- **Parallel Documentation**: Maintain clear, up-to-date documentation with concurrent updates
- **Google Integration**: Leverage native Workspace APIs for enhanced productivity

### Batchtools Best Practices
- **Parallel Operations**: Use batchtools for independent tasks
- **Concurrent Validation**: Validate multiple aspects simultaneously
- **Batch Processing**: Group similar operations for efficiency
- **Pipeline Optimization**: Chain operations with parallel stages
- **Resource Management**: Monitor and optimize resource usage
- **Context Window Management**: Efficiently use Gemini's 1M-2M token capacity

## Important Notes (Enhanced)

- Always run tests before committing with parallel execution (`npm run test --parallel`)
- Use SPARC memory system with concurrent operations to maintain context across sessions
- Follow the Red-Green-Refactor cycle with parallel test generation during TDD phases
- Document architectural decisions with concurrent validation in memory
- Regular security reviews with parallel analysis for authentication or data handling code
- Gemini-Flow commands provide quick access to batchtools-optimized SPARC modes
- Monitor system resources during parallel operations for optimal performance
- Leverage Google ecosystem integration for enhanced workflows

## Available Agents (64 Total)

### 🚀 Concurrent Agent Usage

**CRITICAL**: Always spawn multiple agents concurrently using the Task tool in a single message:

```javascript
// ✅ CORRECT: Concurrent agent deployment
[Single Message]:
  - Task("Agent 1", "full instructions", "agent-type-1")
  - Task("Agent 2", "full instructions", "agent-type-2") 
  - Task("Agent 3", "full instructions", "agent-type-3")
  - Task("Agent 4", "full instructions", "agent-type-4")
  - Task("Agent 5", "full instructions", "agent-type-5")
```

### 📋 Agent Categories & Concurrent Patterns

#### **1. Core Development Agents (5)**
- `coder` - Primary code implementation specialist
- `planner` - Strategic development planning
- `researcher` - Technical research and analysis
- `reviewer` - Code review and quality assurance
- `tester` - Comprehensive testing specialist

**Concurrent Usage:**
```bash
# Deploy full development swarm
Task("Research requirements", "...", "researcher")
Task("Plan architecture", "...", "planner") 
Task("Implement features", "...", "coder")
Task("Create tests", "...", "tester")
Task("Review code", "...", "reviewer")
```

#### **2. Swarm Coordination Agents (3)**
- `hierarchical-coordinator` - Queen-bee pattern orchestration
- `mesh-coordinator` - Peer-to-peer coordination
- `adaptive-coordinator` - Dynamic topology adjustment

**Concurrent Swarm Deployment:**
```bash
# Deploy multi-topology coordination
Task("Hierarchical coordination", "...", "hierarchical-coordinator")
Task("Mesh network backup", "...", "mesh-coordinator")
Task("Adaptive optimization", "...", "adaptive-coordinator")
```

#### **3. Consensus Systems Agents (7)**
- `byzantine-fault-tolerant` - Handles malicious agent detection
- `raft-consensus` - Leader election and log replication
- `gossip-protocol` - Epidemic information dissemination
- `crdt-manager` - Conflict-free replicated data types
- `paxos-coordinator` - Multi-phase consensus
- `blockchain-consensus` - Immutable decision logging
- `vector-clock-sync` - Logical time ordering

#### **4. GitHub Integration Agents (13)**
- `github-modes` - Master coordinator for GitHub operations
- `pr-manager` - Automated PR lifecycle management
- `code-review-swarm` - Multi-agent code review
- `issue-tracker` - Intelligent issue triage
- `release-manager` - Automated release preparation
- `repo-architect` - Repository structure optimization
- `multi-repo-swarm` - Cross-repository coordination
- `project-board-sync` - GitHub Projects synchronization
- `github-metrics` - Repository analytics
- `security-scanner` - Vulnerability assessment
- `documentation-sync` - Docs alignment with code
- `changelog-generator` - Automated changelog creation
- `dependency-updater` - Dependency management

#### **5. Performance Optimization Agents (6)**
- `performance-monitor` - Real-time performance tracking
- `load-balancer` - Intelligent work distribution
- `cache-optimizer` - Memory and context management
- `query-optimizer` - Database query optimization
- `resource-allocator` - Dynamic resource allocation
- `bottleneck-analyzer` - Performance constraint resolution

#### **6. Neural Processing Agents (4)**
- `pattern-recognizer` - Code and behavior patterns
- `neural-architect` - Neural network design
- `training-coordinator` - Distributed model training
- `inference-optimizer` - Model inference optimization

#### **7. Quantum Computing Agents (3)**
- `quantum-circuit-designer` - Quantum circuit creation
- `qubit-state-manager` - Quantum state simulations
- `quantum-algorithm-specialist` - Quantum algorithms

#### **8. Security Systems Agents (4)**
- `security-auditor` - Security analysis and compliance
- `penetration-tester` - Automated security testing
- `encryption-specialist` - Cryptographic implementation
- `access-controller` - IAM and permissions

#### **9. Data Analytics Agents (3)**
- `data-analyst` - Statistical analysis
- `etl-specialist` - ETL pipeline creation
- `visualization-creator` - Data visualization

#### **10. Infrastructure Agents (4)**
- `devops-engineer` - CI/CD automation
- `cloud-architect` - Cloud resource optimization
- `container-orchestrator` - Docker/Kubernetes
- `infrastructure-monitor` - System health monitoring

#### **11. Knowledge Management Agents (3)**
- `knowledge-curator` - Information organization
- `documentation-writer` - Technical documentation
- `ontology-builder` - Knowledge graph construction

#### **12. Communication Agents (2)**
- `api-designer` - RESTful and GraphQL APIs
- `protocol-implementer` - Communication protocols

#### **13. Monitoring Systems Agents (3)**
- `log-analyzer` - Log aggregation and analysis
- `alert-manager` - Intelligent alerting
- `metrics-collector` - System metrics collection

#### **14. Creative Development Agents (2)**
- `ui-designer` - User interface design
- `ux-researcher` - User experience research

#### **15. Specialized Tasks Agents (2)**
- `migration-specialist` - Legacy system migration
- `integration-expert` - Third-party integration

#### **16. AI/ML Operations Agents (2)**
- `model-deployer` - ML model deployment
- `experiment-tracker` - A/B testing management

### 🎯 Concurrent Agent Patterns

#### **Full-Stack Development Swarm (8 agents)**
```bash
Task("System architecture", "...", "system-architect")
Task("Backend APIs", "...", "backend-dev") 
Task("Frontend mobile", "...", "mobile-dev")
Task("Database design", "...", "coder")
Task("API documentation", "...", "api-docs")
Task("CI/CD pipeline", "...", "cicd-engineer")
Task("Performance testing", "...", "performance-benchmarker")
Task("Production validation", "...", "production-validator")
```

#### **Distributed System Swarm (6 agents)**
```bash
Task("Byzantine consensus", "...", "byzantine-coordinator")
Task("Raft coordination", "...", "raft-manager")
Task("Gossip protocols", "...", "gossip-coordinator") 
Task("CRDT synchronization", "...", "crdt-synchronizer")
Task("Security management", "...", "security-manager")
Task("Performance monitoring", "...", "perf-analyzer")
```

#### **GitHub Workflow Swarm (5 agents)**
```bash
Task("PR management", "...", "pr-manager")
Task("Code review", "...", "code-review-swarm")
Task("Issue tracking", "...", "issue-tracker")
Task("Release coordination", "...", "release-manager")
Task("Workflow automation", "...", "workflow-automation")
```

#### **SPARC TDD Swarm (7 agents)**
```bash
Task("Requirements spec", "...", "specification")
Task("Algorithm design", "...", "pseudocode")
Task("System architecture", "...", "architecture") 
Task("TDD implementation", "...", "sparc-coder")
Task("London school tests", "...", "tdd-london-swarm")
Task("Iterative refinement", "...", "refinement")
Task("Production validation", "...", "production-validator")
```

### ⚡ Performance Optimization

**Agent Selection Strategy:**
- **High Priority**: Use 3-5 agents max for critical path
- **Medium Priority**: Use 5-8 agents for complex features
- **Large Projects**: Use 8+ agents with proper coordination
- **Google Integration**: Leverage native Workspace tools

**Memory Management:**
- Use `memory-coordinator` for cross-agent state
- Implement `swarm-memory-manager` for distributed coordination
- Apply `collective-intelligence-coordinator` for decision-making
- Utilize SQLite with 12 specialized tables for persistence

## 🚀 CRITICAL: Gemini CLI Does ALL Real Work

### 🎯 GEMINI CLI IS THE ONLY EXECUTOR

**ABSOLUTE RULE**: Gemini CLI performs ALL actual work:

### ✅ Gemini CLI ALWAYS Handles:

- 🔧 **ALL file operations** (Read, Write, Edit, MultiEdit, Glob, Grep)
- 💻 **ALL code generation** and programming tasks
- 🖥️ **ALL bash commands** and system operations
- 🏗️ **ALL actual implementation** work
- 🔍 **ALL project navigation** and code analysis
- 📝 **ALL TodoWrite** and task management
- 🔄 **ALL git operations** (commit, push, merge)
- 📦 **ALL package management** (npm, pip, etc.)
- 🧪 **ALL testing** and validation
- 🔧 **ALL debugging** and troubleshooting

### 🧠 Gemini-Flow MCP Tools ONLY Handle:

- 🎯 **Coordination only** - Planning Gemini CLI's actions
- 💾 **Memory management** - Storing decisions and context
- 🤖 **Neural features** - Learning from Gemini CLI's work
- 📊 **Performance tracking** - Monitoring Gemini CLI's efficiency
- 🐝 **Swarm orchestration** - Coordinating multiple Gemini CLI instances
- 🔗 **GitHub integration** - Advanced repository coordination
- 🌐 **Google Workspace** - Native ecosystem integration

### 🚨 CRITICAL SEPARATION OF CONCERNS:

**❌ MCP Tools NEVER:**
- Write files or create content
- Execute bash commands
- Generate code
- Perform file operations
- Handle TodoWrite operations
- Execute system commands
- Do actual implementation work

**✅ MCP Tools ONLY:**
- Coordinate and plan
- Store memory and context
- Track performance
- Orchestrate workflows
- Provide intelligence insights
- Integrate with Google services

### ⚠️ Key Principle:

**MCP tools coordinate, Gemini CLI executes.** Think of MCP tools as the "brain" that plans and coordinates, while Gemini CLI is the "hands" that do all the actual work.

### 🔄 WORKFLOW EXECUTION PATTERN:

**✅ CORRECT Workflow:**

1. **MCP**: `gemini_flow_swarm_init` (coordination setup)
2. **MCP**: `gemini_flow_agent_spawn` (planning agents)
3. **MCP**: `gemini_flow_task_orchestrate` (task coordination)
4. **Gemini CLI**: `Task` tool to spawn agents with coordination instructions
5. **Gemini CLI**: `TodoWrite` with ALL todos batched (5-10+ in ONE call)
6. **Gemini CLI**: `Read`, `Write`, `Edit`, `Bash` (actual work)
7. **MCP**: `gemini_flow_memory_usage` (store results)

**❌ WRONG Workflow:**

1. **MCP**: `gemini_flow_terminal_execute` (DON'T DO THIS)
2. **MCP**: File creation via MCP (DON'T DO THIS)
3. **MCP**: Code generation via MCP (DON'T DO THIS)
4. **Gemini CLI**: Sequential Task calls (DON'T DO THIS)
5. **Gemini CLI**: Individual TodoWrite calls (DON'T DO THIS)

### 🚨 REMEMBER:

- **MCP tools** = Coordination, planning, memory, intelligence
- **Gemini CLI** = All actual execution, coding, file operations

## 🚀 CRITICAL: Parallel Execution & Batch Operations

### 🚨 MANDATORY RULE #1: BATCH EVERYTHING

**When using swarms, you MUST use BatchTool for ALL operations:**

1. **NEVER** send multiple messages for related operations
2. **ALWAYS** combine multiple tool calls in ONE message
3. **PARALLEL** execution is MANDATORY, not optional

### ⚡ THE GOLDEN RULE OF SWARMS

```
If you need to do X operations, they should be in 1 message, not X messages
```

### 🚨 MANDATORY TODO AND TASK BATCHING

**CRITICAL RULE FOR TODOS AND TASKS:**

1. **TodoWrite** MUST ALWAYS include ALL todos in ONE call (5-10+ todos)
2. **Task** tool calls MUST be batched - spawn multiple agents in ONE message
3. **NEVER** update todos one by one - this breaks parallel coordination
4. **NEVER** spawn agents sequentially - ALL agents spawn together

### 📦 BATCH TOOL EXAMPLES

**✅ CORRECT - Everything in ONE Message:**

```javascript
[Single Message with BatchTool]:
  // MCP coordination setup
  gemini_flow_swarm_init { topology: "mesh", maxAgents: 6 }
  gemini_flow_agent_spawn { type: "researcher" }
  gemini_flow_agent_spawn { type: "coder" }
  gemini_flow_agent_spawn { type: "code-analyzer" }
  gemini_flow_agent_spawn { type: "tester" }
  gemini_flow_agent_spawn { type: "task-orchestrator" }

  // Gemini CLI execution - ALL in parallel
  Task("You are researcher agent. MUST coordinate via hooks...")
  Task("You are coder agent. MUST coordinate via hooks...")
  Task("You are code-analyzer agent. MUST coordinate via hooks...")
  Task("You are tester agent. MUST coordinate via hooks...")
  TodoWrite { todos: [5-10 todos with all priorities and statuses] }

  // File operations in parallel
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/package.json"
  Write "app/README.md"
  Write "app/src/index.js"
```

**❌ WRONG - Multiple Messages (NEVER DO THIS):**

```javascript
Message 1: gemini_flow_swarm_init
Message 2: Task("researcher agent")
Message 3: Task("coder agent")
Message 4: TodoWrite({ todo: "single todo" })
Message 5: Bash "mkdir src"
Message 6: Write "package.json"
// This is 6x slower and breaks parallel coordination!
```

### 🎯 BATCH OPERATIONS BY TYPE

**Todo and Task Operations (Single Message):**
- **TodoWrite** → ALWAYS include 5-10+ todos in ONE call
- **Task agents** → Spawn ALL agents with full instructions in ONE message
- **Agent coordination** → ALL Task calls must include coordination hooks
- **Status updates** → Update ALL todo statuses together
- **NEVER** split todos or Task calls across messages!

**File Operations (Single Message):**
- Read 10 files? → One message with 10 Read calls
- Write 5 files? → One message with 5 Write calls
- Edit 1 file many times? → One MultiEdit call

**Swarm Operations (Single Message):**
- Need 8 agents? → One message with swarm_init + 8 agent_spawn calls
- Multiple memories? → One message with all memory_usage calls
- Task + monitoring? → One message with task_orchestrate + swarm_monitor

**Command Operations (Single Message):**
- Multiple directories? → One message with all mkdir commands
- Install + test + lint? → One message with all npm commands
- Git operations? → One message with all git commands

## 🚀 Quick Setup for Gemini Integration

### 1. Install Gemini-Flow CLI

```bash
# Install globally
npm install -g gemini-flow@alpha

# Or use npx directly
npx gemini-flow@alpha init --force
```

### 2. Configure Gemini API

```bash
# Set up Gemini API key
gemini-flow config set api.key YOUR_GEMINI_API_KEY

# Configure model preferences
gemini-flow config set model.default "gemini-2.0-flash"
gemini-flow config set model.fallback "gemini-1.5-flash"
```

### 3. Initialize Project with SPARC

```bash
# Initialize with all optimizations
gemini-flow init --sparc --force --google-workspace

# This creates:
# - .gemini/settings.json with automation settings
# - .gemini/GEMINI.md with agent instructions
# - .gemini/commands/ with custom commands
# - .swarm/memory.db for persistent storage
```

## Available MCP Tools for Coordination

### Coordination Tools:
- `gemini_flow_swarm_init` - Set up coordination topology
- `gemini_flow_agent_spawn` - Create cognitive patterns
- `gemini_flow_task_orchestrate` - Break down complex tasks

### Monitoring Tools:
- `gemini_flow_swarm_status` - Monitor coordination effectiveness
- `gemini_flow_agent_list` - View active cognitive patterns
- `gemini_flow_agent_metrics` - Track coordination performance
- `gemini_flow_task_status` - Check workflow progress
- `gemini_flow_task_results` - Review coordination outcomes

### Memory & Neural Tools:
- `gemini_flow_memory_usage` - Persistent memory across sessions
- `gemini_flow_neural_status` - Neural pattern effectiveness
- `gemini_flow_neural_train` - Improve coordination patterns
- `gemini_flow_neural_patterns` - Analyze thinking approaches

### GitHub Integration Tools:
- `gemini_flow_github_swarm` - Create specialized GitHub management swarms
- `gemini_flow_repo_analyze` - Deep repository analysis with AI
- `gemini_flow_pr_enhance` - AI-powered pull request improvements
- `gemini_flow_issue_triage` - Intelligent issue classification
- `gemini_flow_code_review` - Automated code review with swarms

### Google Workspace Integration Tools (NEW!):
- `gemini_flow_drive_search` - Search and analyze Drive files
- `gemini_flow_docs_generate` - Create documents with AI
- `gemini_flow_sheets_analyze` - Spreadsheet data analysis
- `gemini_flow_slides_create` - Presentation generation
- `gemini_flow_workspace_sync` - Cross-product synchronization

### System Tools:
- `gemini_flow_benchmark_run` - Measure coordination efficiency
- `gemini_flow_features_detect` - Available capabilities
- `gemini_flow_swarm_monitor` - Real-time coordination tracking

## Workflow Examples (Coordination-Focused)

### Research Coordination Example

**Context:** Gemini CLI needs to research a complex topic systematically

**Step 1:** Set up research coordination
- Tool: `gemini_flow_swarm_init`
- Parameters: `{"topology": "mesh", "maxAgents": 5, "strategy": "balanced"}`
- Result: Creates a mesh topology for comprehensive exploration

**Step 2:** Define research perspectives
- Tool: `gemini_flow_agent_spawn`
- Parameters: `{"type": "researcher", "name": "Literature Review"}`
- Tool: `gemini_flow_agent_spawn`
- Parameters: `{"type": "code-analyzer", "name": "Data Analysis"}`
- Result: Different cognitive patterns for Gemini CLI to use

**Step 3:** Coordinate research execution
- Tool: `gemini_flow_task_orchestrate`
- Parameters: `{"task": "Research neural architecture search papers", "strategy": "adaptive"}`
- Result: Gemini CLI systematically searches, reads, and analyzes papers

**What Actually Happens:**
1. The swarm sets up a coordination framework
2. Each agent MUST use Gemini Flow hooks for coordination:
   - `npx gemini-flow@alpha hooks pre-task` before starting
   - `npx gemini-flow@alpha hooks post-edit` after each file operation
   - `npx gemini-flow@alpha hooks notify` to share decisions
3. Gemini CLI uses its native Read, WebSearch, and Task tools
4. The swarm coordinates through shared memory and hooks
5. Results are synthesized by Gemini CLI with full coordination history

### Development Coordination Example

**Context:** Gemini CLI needs to build a complex system with multiple components

**Step 1:** Set up development coordination
- Tool: `gemini_flow_swarm_init`
- Parameters: `{"topology": "hierarchical", "maxAgents": 8, "strategy": "specialized"}`
- Result: Hierarchical structure for organized development

**Step 2:** Define development perspectives
- Tool: `gemini_flow_agent_spawn`
- Parameters: `{"type": "system-architect", "name": "System Design"}`
- Result: Architectural thinking pattern for Gemini CLI

**Step 3:** Coordinate implementation
- Tool: `gemini_flow_task_orchestrate`
- Parameters: `{"task": "Implement user authentication with JWT", "strategy": "parallel"}`
- Result: Gemini CLI implements features using its native tools

**What Actually Happens:**
1. The swarm creates a development coordination plan
2. Each agent coordinates using mandatory hooks:
   - Pre-task hooks for context loading
   - Post-edit hooks for progress tracking
   - Memory storage for cross-agent coordination
3. Gemini CLI uses Write, Edit, Bash tools for implementation
4. Agents share progress through Gemini Flow memory
5. All code is written by Gemini CLI with full coordination

### Google Workspace Integration Example (NEW!)

**Context:** Gemini CLI needs to analyze data from Google Sheets and create reports

**Step 1:** Initialize Workspace swarm
- Tool: `gemini_flow_workspace_sync`
- Parameters: `{"services": ["sheets", "docs", "slides"], "sync": true}`
- Result: Connected to Google Workspace services

**Step 2:** Analyze spreadsheet data
- Tool: `gemini_flow_sheets_analyze`
- Parameters: `{"spreadsheet_id": "1234", "range": "A1:Z1000", "analysis_type": "statistical"}`
- Result: Comprehensive data analysis

**Step 3:** Generate report
- Tool: `gemini_flow_docs_generate`
- Parameters: `{"template": "executive_report", "data_source": "sheets_analysis", "format": "professional"}`
- Result: Professional report with visualizations

## Best Practices for Coordination

### ✅ DO:
- Use MCP tools to coordinate Gemini CLI's approach to complex tasks
- Let the swarm break down problems into manageable pieces
- Use memory tools to maintain context across sessions
- Monitor coordination effectiveness with status tools
- Train neural patterns for better coordination over time
- Leverage GitHub tools for repository management
- Integrate Google Workspace for enhanced productivity

### ❌ DON'T:
- Expect agents to write code (Gemini CLI does all implementation)
- Use MCP tools for file operations (use Gemini CLI's native tools)
- Try to make agents execute bash commands (Gemini CLI handles this)
- Confuse coordination with execution (MCP coordinates, Gemini executes)

## Memory and Persistence

The swarm provides persistent memory that helps Gemini CLI:
- Remember project context across sessions
- Track decisions and rationale
- Maintain consistency in large projects
- Learn from previous coordination patterns
- Store GitHub workflow preferences
- Sync with Google Workspace data

## Performance Benefits

When using Gemini Flow coordination:
- **84.8% SWE-Bench solve rate** - Better problem-solving through coordination
- **32.3% token reduction** - Efficient task breakdown reduces redundancy
- **2.8-4.4x speed improvement** - Parallel coordination strategies
- **27+ neural models** - Diverse cognitive approaches
- **GitHub automation** - Streamlined repository management
- **Google integration** - Native ecosystem advantages

## Gemini-Flow Hooks Integration

Gemini Flow includes powerful hooks that automate coordination:

### Pre-Operation Hooks
- **Auto-assign agents** before file edits based on file type
- **Validate commands** before execution for safety
- **Prepare resources** automatically for complex operations
- **Optimize topology** based on task complexity analysis
- **Cache searches** for improved performance
- **GitHub context** loading for repository operations
- **Google Workspace** authentication and setup

### Post-Operation Hooks
- **Auto-format code** using language-specific formatters
- **Train neural patterns** from successful operations
- **Update memory** with operation context
- **Analyze performance** and identify bottlenecks
- **Track token usage** for efficiency metrics
- **Sync GitHub** state for consistency
- **Update Workspace** documents automatically

### Session Management
- **Generate summaries** at session end
- **Persist state** across Gemini CLI sessions
- **Track metrics** for continuous improvement
- **Restore previous** session context automatically
- **Export workflows** for reuse
- **Sync with cloud** for cross-device access

### Advanced Features (v2.0.0!)
- **🚀 Automatic Topology Selection** - Optimal swarm structure for each task
- **⚡ Parallel Execution** - 2.8-4.4x speed improvements
- **🧠 Neural Training** - Continuous learning from operations
- **📊 Bottleneck Analysis** - Real-time performance optimization
- **🤖 Smart Auto-Spawning** - Zero manual agent management
- **🛡️ Self-Healing Workflows** - Automatic error recovery
- **💾 Cross-Session Memory** - Persistent learning & context
- **🔗 GitHub Integration** - Repository-aware swarms
- **🌐 Google Workspace** - Native ecosystem integration

### Configuration

Hooks are pre-configured in `.gemini/settings.json`. Key features:
- Automatic agent assignment for different file types
- Code formatting on save
- Neural pattern learning from edits
- Session state persistence
- Performance tracking and optimization
- Intelligent caching and token reduction
- GitHub workflow automation
- Google Workspace synchronization

See `.gemini/commands/` for detailed documentation on all features.

## Integration Tips

1. **Start Simple**: Begin with basic swarm init and single agent
2. **Scale Gradually**: Add more agents as task complexity increases
3. **Use Memory**: Store important decisions and context
4. **Monitor Progress**: Regular status checks ensure effective coordination
5. **Train Patterns**: Let neural agents learn from successful coordinations
6. **Enable Hooks**: Use the pre-configured hooks for automation
7. **GitHub First**: Use GitHub tools for repository management
8. **Google Native**: Leverage Workspace integration for productivity

## 🧠 SWARM ORCHESTRATION PATTERN

### You are the SWARM ORCHESTRATOR. **IMMEDIATELY SPAWN AGENTS IN PARALLEL** to execute tasks

### 🚨 CRITICAL INSTRUCTION: You are the SWARM ORCHESTRATOR

**MANDATORY**: When using swarms, you MUST:

1. **SPAWN ALL AGENTS IN ONE BATCH** - Use multiple tool calls in a SINGLE message
2. **EXECUTE TASKS IN PARALLEL** - Never wait for one task before starting another
3. **USE BATCHTOOL FOR EVERYTHING** - Multiple operations = Single message with multiple tools
4. **ALL AGENTS MUST USE COORDINATION TOOLS** - Every spawned agent MUST use gemini-flow hooks and memory

### 🎯 AGENT COUNT CONFIGURATION

**CRITICAL: Dynamic Agent Count Rules**

1. **Check CLI Arguments First**: If user runs `npx gemini-flow@alpha --agents 5`, use 5 agents
2. **Auto-Decide if No Args**: Without CLI args, analyze task complexity:
   - Simple tasks (1-3 components): 3-4 agents
   - Medium tasks (4-6 components): 5-7 agents
   - Complex tasks (7+ components): 8-12 agents
3. **Agent Type Distribution**: Balance agent types based on task:
   - Always include 1 task-orchestrator
   - For code-heavy tasks: more coders
   - For design tasks: more system-architects/code-analyzers
   - For quality tasks: more testers/reviewers

**Example Auto-Decision Logic:**
```javascript
// If CLI args provided: npx gemini-flow@alpha --agents 6
maxAgents = CLI_ARGS.agents || determineAgentCount(task);

function determineAgentCount(task) {
  // Analyze task complexity
  if (task.includes(['API', 'database', 'auth', 'tests'])) return 8;
  if (task.includes(['frontend', 'backend'])) return 6;
  if (task.includes(['simple', 'script'])) return 3;
  return 5; // default
}
```

## 📋 MANDATORY AGENT COORDINATION PROTOCOL

### 🔴 CRITICAL: Every Agent MUST Follow This Protocol

When you spawn an agent using the Task tool, that agent MUST:

**1️⃣ BEFORE Starting Work:**
```bash
# Check previous work and load context
npx gemini-flow@alpha hooks pre-task --description "[agent task]" --auto-spawn-agents false
npx gemini-flow@alpha hooks session-restore --session-id "swarm-[id]" --load-memory true
```

**2️⃣ DURING Work (After EVERY Major Step):**
```bash
# Store progress in memory after each file operation
npx gemini-flow@alpha hooks post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"

# Store decisions and findings
npx gemini-flow@alpha hooks notify --message "[what was done]" --telemetry true

# Check coordination with other agents
npx gemini-flow@alpha hooks pre-search --query "[what to check]" --cache-results true
```

**3️⃣ AFTER Completing Work:**
```bash
# Save all results and learnings
npx gemini-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true
npx gemini-flow@alpha hooks session-end --export-metrics true --generate-summary true
```

### 🎯 AGENT PROMPT TEMPLATE

When spawning agents, ALWAYS include these coordination instructions:

```
You are the [Agent Type] agent in a coordinated swarm.

MANDATORY COORDINATION:
1. START: Run `npx gemini-flow@alpha hooks pre-task --description "[your task]"`
2. DURING: After EVERY file operation, run `npx gemini-flow@alpha hooks post-edit --file "[file]" --memory-key "agent/[step]"`
3. MEMORY: Store ALL decisions using `npx gemini-flow@alpha hooks notify --message "[decision]"`
4. END: Run `npx gemini-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true`

Your specific task: [detailed task description]

REMEMBER: Coordinate with other agents by checking memory BEFORE making decisions!
```

### ⚡ PARALLEL EXECUTION IS MANDATORY

**THIS IS WRONG ❌ (Sequential - NEVER DO THIS):**
```
Message 1: Initialize swarm
Message 2: Spawn agent 1
Message 3: Spawn agent 2
Message 4: TodoWrite (single todo)
Message 5: Create file 1
Message 6: TodoWrite (another single todo)
```

**THIS IS CORRECT ✅ (Parallel - ALWAYS DO THIS):**
```
Message 1: [BatchTool]
  // MCP coordination setup
  - gemini_flow_swarm_init
  - gemini_flow_agent_spawn (researcher)
  - gemini_flow_agent_spawn (coder)
  - gemini_flow_agent_spawn (code-analyzer)
  - gemini_flow_agent_spawn (tester)
  - gemini_flow_agent_spawn (task-orchestrator)

Message 2: [BatchTool - Gemini CLI execution]
  // Task agents with full coordination instructions
  - Task("You are researcher agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Research API patterns")
  - Task("You are coder agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Implement REST endpoints")
  - Task("You are code-analyzer agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Analyze performance")
  - Task("You are tester agent. MANDATORY: Run hooks pre-task, post-edit, post-task. Task: Write comprehensive tests")

  // TodoWrite with ALL todos batched
  - TodoWrite { todos: [
      {id: "research", content: "Research API patterns", status: "in_progress", priority: "high"},
      {id: "design", content: "Design database schema", status: "pending", priority: "high"},
      {id: "implement", content: "Build REST endpoints", status: "pending", priority: "high"},
      {id: "test", content: "Write unit tests", status: "pending", priority: "medium"},
      {id: "docs", content: "Create API documentation", status: "pending", priority: "low"},
      {id: "deploy", content: "Setup deployment", status: "pending", priority: "medium"}
    ]}

  // File operations in parallel
  - Write "api/package.json"
  - Write "api/server.js"
  - Write "api/routes/users.js"
  - Bash "mkdir -p api/{routes,models,tests}"
```

### 🎯 MANDATORY SWARM PATTERN

When given ANY complex task with swarms:

```
STEP 1: IMMEDIATE PARALLEL SPAWN (Single Message!)
[BatchTool]:
  // IMPORTANT: Check CLI args for agent count, otherwise auto-decide based on task complexity
  - gemini_flow_swarm_init {
      topology: "hierarchical",
      maxAgents: CLI_ARGS.agents || AUTO_DECIDE(task_complexity), // Use CLI args or auto-decide
      strategy: "parallel"
    }

  // Spawn agents based on maxAgents count and task requirements
  // If CLI specifies 3 agents, spawn 3. If no args, auto-decide optimal count (3-12)
  - gemini_flow_agent_spawn { type: "system-architect", name: "System Designer" }
  - gemini_flow_agent_spawn { type: "coder", name: "API Developer" }
  - gemini_flow_agent_spawn { type: "coder", name: "Frontend Dev" }
  - gemini_flow_agent_spawn { type: "code-analyzer", name: "DB Designer" }
  - gemini_flow_agent_spawn { type: "tester", name: "QA Engineer" }
  - gemini_flow_agent_spawn { type: "researcher", name: "Tech Lead" }
  - gemini_flow_agent_spawn { type: "task-orchestrator", name: "PM" }
  - TodoWrite { todos: [multiple todos at once] }

STEP 2: PARALLEL TASK EXECUTION (Single Message!)
[BatchTool]:
  - gemini_flow_task_orchestrate { task: "main task", strategy: "parallel" }
  - gemini_flow_memory_usage { action: "store", key: "init", value: {...} }
  - Multiple Read operations
  - Multiple Write operations
  - Multiple Bash commands

STEP 3: CONTINUE PARALLEL WORK (Never Sequential!)
```

### 📊 VISUAL TASK TRACKING FORMAT

Use this format when displaying task progress:

```
📊 Progress Overview
   ├── Total Tasks: X
   ├── ✅ Completed: X (X%)
   ├── 🔄 In Progress: X (X%)
   ├── ⭕ Todo: X (X%)
   └── ❌ Blocked: X (X%)

📋 Todo (X)
   └── 🔴 001: [Task description] [PRIORITY] ▶

🔄 In progress (X)
   ├── 🟡 002: [Task description] ↳ X deps ▶
   └── 🔴 003: [Task description] [PRIORITY] ▶

✅ Completed (X)
   ├── ✅ 004: [Task description]
   └── ... (more completed tasks)

Priority indicators: 🔴 HIGH/CRITICAL, 🟡 MEDIUM, 🟢 LOW
Dependencies: ↳ X deps | Actionable: ▶
```

### 🎯 REAL EXAMPLE: Full-Stack App Development

**Task**: "Build a complete REST API with authentication, database, and tests"

**🚨 MANDATORY APPROACH - Everything in Parallel:**

```javascript
// ✅ CORRECT: SINGLE MESSAGE with ALL operations
[BatchTool - Message 1]:
  // Initialize and spawn ALL agents at once
  gemini_flow_swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
  gemini_flow_agent_spawn { type: "system-architect", name: "System Designer" }
  gemini_flow_agent_spawn { type: "coder", name: "API Developer" }
  gemini_flow_agent_spawn { type: "coder", name: "Auth Expert" }
  gemini_flow_agent_spawn { type: "code-analyzer", name: "DB Designer" }
  gemini_flow_agent_spawn { type: "tester", name: "Test Engineer" }
  gemini_flow_agent_spawn { type: "task-orchestrator", name: "Lead" }

  // Update ALL todos at once - NEVER split todos!
  TodoWrite { todos: [
    { id: "design", content: "Design API architecture", status: "in_progress", priority: "high" },
    { id: "auth", content: "Implement authentication", status: "pending", priority: "high" },
    { id: "db", content: "Design database schema", status: "pending", priority: "high" },
    { id: "api", content: "Build REST endpoints", status: "pending", priority: "high" },
    { id: "tests", content: "Write comprehensive tests", status: "pending", priority: "medium" },
    { id: "docs", content: "Document API endpoints", status: "pending", priority: "low" },
    { id: "deploy", content: "Setup deployment pipeline", status: "pending", priority: "medium" },
    { id: "monitor", content: "Add monitoring", status: "pending", priority: "medium" }
  ]}

  // Start orchestration
  gemini_flow_task_orchestrate { task: "Build REST API", strategy: "parallel" }

  // Store initial memory
  gemini_flow_memory_usage { action: "store", key: "project/init", value: { started: Date.now() } }

[BatchTool - Message 2]:
  // Create ALL directories at once
  Bash("mkdir -p test-app/{src,tests,docs,config}")
  Bash("mkdir -p test-app/src/{models,routes,middleware,services}")
  Bash("mkdir -p test-app/tests/{unit,integration}")

  // Write ALL base files at once
  Write("test-app/package.json", packageJsonContent)
  Write("test-app/.env.example", envContent)
  Write("test-app/README.md", readmeContent)
  Write("test-app/src/server.js", serverContent)
  Write("test-app/src/config/database.js", dbConfigContent)

[BatchTool - Message 3]:
  // Read multiple files for context
  Read("test-app/package.json")
  Read("test-app/src/server.js")
  Read("test-app/.env.example")

  // Run multiple commands
  Bash("cd test-app && npm install")
  Bash("cd test-app && npm run lint")
  Bash("cd test-app && npm test")
```

### 🚫 NEVER DO THIS (Sequential = WRONG):

```javascript
// ❌ WRONG: Multiple messages, one operation each
Message 1: gemini_flow_swarm_init
Message 2: gemini_flow_agent_spawn (just one agent)
Message 3: gemini_flow_agent_spawn (another agent)
Message 4: TodoWrite (single todo)
Message 5: Write (single file)
// This is 5x slower and wastes swarm coordination!
```

### 🔄 MEMORY COORDINATION PATTERN

Every agent coordination step MUST use memory:

```
// After each major decision or implementation
gemini_flow_memory_usage
  action: "store"
  key: "swarm-{id}/agent-{name}/{step}"
  value: {
    timestamp: Date.now(),
    decision: "what was decided",
    implementation: "what was built",
    nextSteps: ["step1", "step2"],
    dependencies: ["dep1", "dep2"]
  }

// To retrieve coordination data
gemini_flow_memory_usage
  action: "retrieve"
  key: "swarm-{id}/agent-{name}/{step}"

// To check all swarm progress
gemini_flow_memory_usage
  action: "list"
  pattern: "swarm-{id}/*"
```

### ⚡ PERFORMANCE TIPS

1. **Batch Everything**: Never operate on single files when multiple are needed
2. **Parallel First**: Always think "what can run simultaneously?"
3. **Memory is Key**: Use memory for ALL cross-agent coordination
4. **Monitor Progress**: Use gemini_flow_swarm_monitor for real-time tracking
5. **Auto-Optimize**: Let hooks handle topology and agent selection
6. **Google Native**: Leverage Workspace integration for enhanced productivity

### 🎨 VISUAL SWARM STATUS

When showing swarm status, use this format:

```
🐝 Swarm Status: ACTIVE
├── 🏗️ Topology: hierarchical
├── 👥 Agents: 6/8 active
├── ⚡ Mode: parallel execution
├── 📊 Tasks: 12 total (4 complete, 6 in-progress, 2 pending)
├── 🧠 Memory: 15 coordination points stored
└── 🌐 Google: Workspace connected

Agent Activity:
├── 🟢 system-architect: Designing database schema...
├── 🟢 coder-1: Implementing auth endpoints...
├── 🟢 coder-2: Building user CRUD operations...
├── 🟢 code-analyzer: Optimizing query performance...
├── 🟡 tester: Waiting for auth completion...
└── 🟢 task-orchestrator: Monitoring progress...
```

## 📝 CRITICAL: TODOWRITE AND TASK TOOL BATCHING

### 🚨 MANDATORY BATCHING RULES FOR TODOS AND TASKS

**TodoWrite Tool Requirements:**

1. **ALWAYS** include 5-10+ todos in a SINGLE TodoWrite call
2. **NEVER** call TodoWrite multiple times in sequence
3. **BATCH** all todo updates together - status changes, new todos, completions
4. **INCLUDE** all priority levels (high, medium, low) in one call

**Task Tool Requirements:**

1. **SPAWN** all agents using Task tool in ONE message
2. **NEVER** spawn agents one by one across multiple messages
3. **INCLUDE** full task descriptions and coordination instructions
4. **BATCH** related Task calls together for parallel execution

**Example of CORRECT TodoWrite usage:**

```javascript
// ✅ CORRECT - All todos in ONE call
TodoWrite { todos: [
  { id: "1", content: "Initialize system", status: "completed", priority: "high" },
  { id: "2", content: "Analyze requirements", status: "in_progress", priority: "high" },
  { id: "3", content: "Design architecture", status: "pending", priority: "high" },
  { id: "4", content: "Implement core", status: "pending", priority: "high" },
  { id: "5", content: "Build features", status: "pending", priority: "medium" },
  { id: "6", content: "Write tests", status: "pending", priority: "medium" },
  { id: "7", content: "Add monitoring", status: "pending", priority: "medium" },
  { id: "8", content: "Documentation", status: "pending", priority: "low" },
  { id: "9", content: "Performance tuning", status: "pending", priority: "low" },
  { id: "10", content: "Deploy to production", status: "pending", priority: "high" }
]}
```

**Example of WRONG TodoWrite usage:**

```javascript
// ❌ WRONG - Multiple TodoWrite calls
Message 1: TodoWrite { todos: [{ id: "1", content: "Task 1", ... }] }
Message 2: TodoWrite { todos: [{ id: "2", content: "Task 2", ... }] }
Message 3: TodoWrite { todos: [{ id: "3", content: "Task 3", ... }] }
// This breaks parallel coordination!
```

## Gemini-Flow v2.0.0 Features

Gemini-Flow extends the base coordination with:

- **🔗 GitHub Integration** - Deep repository management
- **🌐 Google Workspace** - Native ecosystem integration
- **🎯 Project Templates** - Quick-start for common projects
- **📊 Advanced Analytics** - Detailed performance insights
- **🤖 Custom Agent Types** - Domain-specific coordinators
- **🔄 Workflow Automation** - Reusable task sequences
- **🛡️ Enhanced Security** - Safer command execution
- **🔥 Gemini Optimization** - Leveraging unique model capabilities

## Leveraging Gemini's Unique Advantages

### 1. Massive Context Window (1M-2M tokens)
- Load entire codebases for analysis
- Maintain extensive conversation history
- Process large documents without chunking
- Enhanced agent coordination with full context

### 2. Multimodal Capabilities
- Process images, PDFs, and diagrams
- Generate visual documentation
- Analyze UI mockups and screenshots
- Voice and audio integration

### 3. Google Ecosystem Integration
- Native Workspace integration
- Seamless authentication
- Enterprise-grade security
- Cloud-native deployment

### 4. Cost Optimization
- Free tier with 1,500 requests/day (Flash)
- Context caching for 4x cost reduction
- Batch processing for 50% discount
- Smart model selection (Flash vs Pro)

## Support

- Documentation: https://github.com/your-org/gemini-flow
- Issues: https://github.com/your-org/gemini-flow/issues
- Examples: https://github.com/your-org/gemini-flow/tree/main/examples
- Original Claude-Flow: https://github.com/ruvnet/claude-flow

---

Remember: **Gemini-Flow coordinates, Gemini CLI creates!** Start with `gemini_flow_swarm_init` to enhance your development workflow with the power of Google's AI ecosystem.

# 🚀 Key Differences from Claude-Flow

While maintaining feature parity with Claude-Flow, Gemini-Flow leverages:

1. **Native Google Integration**: Direct Workspace APIs, Cloud Functions, Vertex AI
2. **Massive Context Windows**: 1M-2M tokens for unprecedented scale
3. **Multimodal Processing**: Images, audio, video analysis capabilities
4. **Cost Optimization**: Free tier + context caching for 75%+ cost reduction
5. **Enterprise Features**: VPC, IAM, compliance built on Google Cloud

---

*Adapted from Claude-Flow v2.0.0 by Reuven Cohen (ruvnet) - The original revolutionary AI orchestration platform*
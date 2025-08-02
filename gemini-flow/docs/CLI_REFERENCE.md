# 📋 Gemini-Flow CLI Reference

> **Complete command reference for the quantum-classical AI orchestration platform**

## 🎯 Command Structure

```
gemini-flow <command> [subcommand] [options] [arguments]
gf <command> [subcommand] [options] [arguments]  # Shorter alias
```

## 🏗️ Core System Commands

### `doctor` - System Diagnostics
Comprehensive system health check and environment validation.

```bash
gemini-flow doctor [options]
```

**Options:**
- `--verbose` - Show detailed diagnostic information
- `--fix` - Attempt to fix common issues automatically
- `--export <file>` - Export diagnostic report

**Examples:**
```bash
gemini-flow doctor
gemini-flow doctor --verbose --export diagnostics.json
```

### `health` - Runtime Health Monitoring
Real-time system health and performance monitoring.

```bash
gemini-flow health [options]
```

**Options:**
- `--detailed` - Show comprehensive health metrics
- `--real-time` - Continuous monitoring mode
- `--export <file>` - Export health report

**Examples:**
```bash
gemini-flow health --detailed
gemini-flow health --real-time --interval 5s
```

### `benchmark` - Performance Testing
Run comprehensive performance benchmarks and analysis.

```bash
gemini-flow benchmark [options]
```

**Options:**
- `-r, --requests <number>` - Number of test requests (default: 10)
- `-c, --concurrent <number>` - Concurrent requests (default: 5)
- `--operation <name>` - Specific operation (routing|cache|models)
- `--detailed` - Show detailed breakdown
- `--export <file>` - Export results

**Examples:**
```bash
gemini-flow benchmark --requests 100 --concurrent 10
gemini-flow benchmark --operation routing --detailed
gemini-flow benchmark --export benchmark-results.json
```

### `init` - Project Initialization
Initialize new Gemini-Flow projects with guided setup.

```bash
gemini-flow init [options]
```

**Options:**
- `--interactive` - Interactive setup wizard
- `--dev` - Developer environment setup
- `--enterprise` - Enterprise configuration
- `--research` - Research environment
- `--template <name>` - Use specific template

**Examples:**
```bash
gemini-flow init --interactive
gemini-flow init --dev --template fullstack
gemini-flow init --enterprise --compliance "SOC2,GDPR"
```

### `modes` - List SPARC Modes
Display all available SPARC development modes.

```bash
gemini-flow modes
```

### `config` - Configuration Management
Manage global and project-specific configuration.

```bash
gemini-flow config <action> [options]
```

**Actions:**
- `set <key> <value>` - Set configuration value
- `get <key>` - Get configuration value
- `list` - List all configuration
- `reset` - Reset to defaults
- `profile <action>` - Manage profiles

**Examples:**
```bash
gemini-flow config set api.key YOUR_API_KEY
gemini-flow config set model.default "gemini-2.0-flash"
gemini-flow config profile create production
gemini-flow config profile use development
```

## 🐝 Swarm Orchestration Commands

### `swarm` - Swarm Management
Manage AI agent swarms with various topologies and coordination patterns.

```bash
gemini-flow swarm <action> [options]
```

**Actions:**

#### `init` - Initialize Swarm
```bash
gemini-flow swarm init [options]
```

**Options:**
- `--topology <type>` - Swarm topology (mesh|hierarchical|ring|star)
- `--agents <number>` - Number of agents to spawn
- `--consensus <type>` - Consensus algorithm (raft|byzantine|gossip)
- `--fault-tolerance <percent>` - Fault tolerance percentage
- `--quantum-ready` - Enable quantum coordination
- `--auto-scale` - Enable automatic scaling

**Examples:**
```bash
gemini-flow swarm init --topology mesh --agents 8
gemini-flow swarm init --topology hierarchical --agents 12 --consensus byzantine
gemini-flow swarm init --topology ring --agents 6 --fault-tolerance 95%
```

#### `status` - Swarm Status
```bash
gemini-flow swarm status [options]
```

**Options:**
- `--detailed` - Show comprehensive status
- `--export <file>` - Export status report
- `--json` - Output in JSON format

#### `monitor` - Real-time Monitoring
```bash
gemini-flow swarm monitor [options]
```

**Options:**
- `--live` - Live monitoring mode
- `--interval <time>` - Update interval (default: 2s)
- `--dashboard` - Launch web dashboard

#### `scale` - Dynamic Scaling
```bash
gemini-flow swarm scale [options]
```

**Options:**
- `--target-agents <number>` - Target agent count
- `--strategy <type>` - Scaling strategy (adaptive|linear|exponential)
- `--max-agents <number>` - Maximum agent limit

#### `destroy` - Terminate Swarm
```bash
gemini-flow swarm destroy [options]
```

**Options:**
- `--graceful` - Graceful shutdown
- `--save-state` - Save swarm state before destruction
- `--force` - Force immediate termination

## 🤖 Agent Management Commands

### `agent` - Agent Operations
Manage individual AI agents within swarms.

```bash
gemini-flow agent <action> [options]
```

**Actions:**

#### `spawn` - Create Agent
```bash
gemini-flow agent spawn <type> [options]
```

**Agent Types:**
- `coder` - Programming specialist
- `architect` - System design expert
- `tester` - Quality assurance specialist
- `researcher` - Information gathering expert
- `reviewer` - Code review specialist
- `performance-analyzer` - Performance optimization
- `security-expert` - Security analysis
- `devops-engineer` - Infrastructure specialist

**Options:**
- `--name <name>` - Custom agent name
- `--capabilities <list>` - Comma-separated capabilities
- `--domain <area>` - Specialization domain
- `--model <model>` - Preferred model
- `--memory-limit <size>` - Memory allocation

**Examples:**
```bash
gemini-flow agent spawn coder --name "FullStack-Dev" --capabilities "react,node,typescript"
gemini-flow agent spawn architect --name "System-Designer" --domain "microservices"
gemini-flow agent spawn tester --capabilities "jest,cypress,playwright"
```

#### `list` - List Agents
```bash
gemini-flow agent list [options]
```

**Options:**
- `--filter <status>` - Filter by status (active|idle|busy|terminated)
- `--sort <field>` - Sort by field (name|type|performance|created)
- `--format <type>` - Output format (table|json|csv)

#### `info` - Agent Information
```bash
gemini-flow agent info <agent-id> [options]
```

**Options:**
- `--detailed` - Show comprehensive information
- `--performance` - Include performance metrics
- `--history` - Show task history

#### `metrics` - Agent Performance
```bash
gemini-flow agent metrics [options]
```

**Options:**
- `--agent <id>` - Specific agent metrics
- `--all` - All agents metrics
- `--real-time` - Continuous monitoring
- `--export <file>` - Export metrics

#### `terminate` - Stop Agent
```bash
gemini-flow agent terminate <agent-id> [options]
```

**Options:**
- `--graceful` - Graceful shutdown
- `--save-state` - Save agent state
- `--reason <text>` - Termination reason

### `agent types` - Available Agent Types
List all available agent types and their capabilities.

```bash
gemini-flow agent types [options]
```

**Options:**
- `--category <name>` - Filter by category
- `--detailed` - Show capabilities and requirements

## 🎯 SPARC Development Commands

### `sparc` - SPARC Methodology
Execute systematic development using SPARC methodology.

```bash
gemini-flow sparc <action> [options]
```

**Actions:**

#### `run` - Execute SPARC Mode
```bash
gemini-flow sparc run <mode> "<task>" [options]
```

**Modes:**
- `specification` - Requirements analysis
- `pseudocode` - Algorithm design
- `architect` - System architecture
- `refine` - Code refinement
- `complete` - Final implementation
- `dev` - General development
- `api` - API development
- `ui` - User interface
- `test` - Test-driven development
- `refactor` - Code refactoring
- `performance` - Performance optimization
- `security` - Security hardening

**Options:**
- `--agents <number>` - Number of agents to use
- `--parallel` - Enable parallel execution
- `--production-ready` - Include production considerations
- `--framework <name>` - Specify framework
- `--database <type>` - Database technology
- `--deployment <target>` - Deployment target

**Examples:**
```bash
gemini-flow sparc run specification "user authentication system"
gemini-flow sparc run api "RESTful user management" --database postgresql
gemini-flow sparc run ui "responsive dashboard" --framework react
gemini-flow sparc run performance "optimize query performance" --target-latency 100ms
```

#### `tdd` - Test-Driven Development
```bash
gemini-flow sparc tdd "<feature>" [options]
```

**Options:**
- `--agents <number>` - Development team size
- `--parallel` - Parallel implementation
- `--framework <name>` - Testing framework
- `--coverage <percent>` - Target test coverage

**Examples:**
```bash
gemini-flow sparc tdd "implement payment processing" --agents 6 --parallel
gemini-flow sparc tdd "user authentication with JWT" --framework jest --coverage 90
```

#### `pipeline` - Complete Pipeline
```bash
gemini-flow sparc pipeline "<project>" [options]
```

**Options:**
- `--phases <list>` - Specific phases to run
- `--parallel-phases` - Run phases in parallel where possible
- `--checkpoints` - Enable phase checkpoints

#### `info` - Mode Information
```bash
gemini-flow sparc info <mode>
```

## 🧠 Hive Mind Commands

### `hive-mind` - Collective Intelligence
Manage hive mind collective intelligence systems.

```bash
gemini-flow hive-mind <action> [options]
```

**Actions:**

#### `init` - Initialize Hive Mind
```bash
gemini-flow hive-mind init [options]
```

**Options:**
- `--nodes <number>` - Number of hive nodes
- `--consensus <type>` - Consensus mechanism (emergent|byzantine|raft)
- `--quantum-coordination` - Enable quantum coordination
- `--cross-session-memory` - Persistent memory across sessions
- `--collective-learning` - Enable shared learning

**Examples:**
```bash
gemini-flow hive-mind init --nodes 12 --consensus emergent
gemini-flow hive-mind init --nodes 24 --quantum-coordination --collective-learning
```

#### `spawn` - Deploy Collective
```bash
gemini-flow hive-mind spawn "<objective>" [options]
```

**Options:**
- `--queen` - Enable queen bee coordination
- `--self-heal` - Self-healing capabilities
- `--learn-patterns` - Pattern learning
- `--adaptive-topology` - Dynamic topology adjustment

**Examples:**
```bash
gemini-flow hive-mind spawn "optimize distributed system architecture" --queen
gemini-flow hive-mind spawn "solve complex optimization problem" --self-heal --learn-patterns
```

#### `consensus` - Request Consensus
```bash
gemini-flow hive-mind consensus <hive-id> "<decision>" [options]
```

**Options:**
- `--voting-algorithm <type>` - Voting mechanism
- `--byzantine-tolerance` - Byzantine fault tolerance
- `--confidence-threshold <percent>` - Required confidence level

#### `memory` - Collective Memory
```bash
gemini-flow hive-mind memory <hive-id> [options]
```

**Options:**
- `--list` - List all memories
- `--query <pattern>` - Query memories
- `--export <file>` - Export memory state

## 🔍 Research & Query Commands

### `query` - Intelligent Research
Perform intelligent web research using AI-powered analysis.

```bash
gemini-flow query "<question>" [options]
```

**Options:**
- `--depth <level>` - Research depth (shallow|medium|deep)
- `--sources <number>` - Number of sources to gather
- `--format <type>` - Output format (summary|detailed|structured)
- `--cross-validate` - Cross-validate information
- `--expert-level` - Expert-level analysis
- `--fact-check` - Enable fact checking
- `--confidence-score` - Show confidence scores
- `--export-report <file>` - Export detailed report
- `--export-citations <file>` - Export citations

**Examples:**
```bash
gemini-flow query "latest quantum computing breakthroughs" --depth deep --sources 15
gemini-flow query "compare React vs Vue.js performance" --cross-validate --fact-check
gemini-flow query "microservices vs monolith architecture" --expert-level --export-report analysis.pdf
```

## 💾 Memory & Knowledge Commands

### `memory` - Persistent Memory
Manage persistent memory and knowledge storage.

```bash
gemini-flow memory <action> [options]
```

**Actions:**

#### `store` - Store Memory
```bash
gemini-flow memory store <key> <value> [options]
```

**Options:**
- `--json` - Store as JSON
- `--ttl <duration>` - Time to live (e.g., 30d, 24h)
- `--namespace <name>` - Memory namespace
- `--tags <list>` - Comma-separated tags

**Examples:**
```bash
gemini-flow memory store "project/config" '{"db":"postgresql"}' --json --ttl 30d
gemini-flow memory store "patterns/auth" "JWT with refresh tokens" --namespace security
```

#### `query` - Query Memory
```bash
gemini-flow memory query <pattern> [options]
```

**Options:**
- `--namespace <name>` - Search in namespace
- `--format <type>` - Output format (table|json|yaml)
- `--limit <number>` - Limit results

#### `search` - Fuzzy Search
```bash
gemini-flow memory search <term> [options]
```

**Options:**
- `--fuzzy` - Enable fuzzy matching
- `--similarity <threshold>` - Similarity threshold (0-1)
- `--limit <number>` - Maximum results

#### `list` - List Memories
```bash
gemini-flow memory list [options]
```

**Options:**
- `--namespace <name>` - List specific namespace
- `--tags <list>` - Filter by tags
- `--expired` - Show expired memories

#### `export` - Export Memory
```bash
gemini-flow memory export <file> [options]
```

**Options:**
- `--namespace <name>` - Export specific namespace
- `--format <type>` - Export format (json|yaml|csv)

#### `import` - Import Memory
```bash
gemini-flow memory import <file> [options]
```

**Options:**
- `--merge` - Merge with existing memories
- `--namespace <name>` - Import to namespace
- `--overwrite` - Overwrite existing keys

#### `clear` - Clear Memory
```bash
gemini-flow memory clear [options]
```

**Options:**
- `--namespace <name>` - Clear specific namespace
- `--expired` - Clear only expired memories
- `--confirm` - Skip confirmation prompt

## ⚛️ Quantum Computing Commands

### `quantum` - Quantum Operations
Quantum-classical hybrid computing operations.

```bash
gemini-flow quantum <action> [options]
```

**Actions:**

#### `solve` - Quantum Problem Solving
```bash
gemini-flow quantum solve "<problem>" [options]
```

**Options:**
- `--quantum-backend <type>` - Backend (dwave|ibm|hybrid)
- `--qubits <number>` - Number of qubits
- `--shots <number>` - Number of shots
- `--hybrid-fallback` - Classical fallback
- `--noise-mitigation` - Error mitigation

**Examples:**
```bash
gemini-flow quantum solve "optimize resource allocation" --quantum-backend dwave --qubits 64
gemini-flow quantum solve "traveling salesman 100 cities" --shots 1000 --noise-mitigation
```

#### `ml` - Quantum Machine Learning
```bash
gemini-flow quantum ml "<task>" [options]
```

**Options:**
- `--algorithm <type>` - QML algorithm (vqe|qaoa|qnn)
- `--classical-preprocessing` - Classical data preprocessing
- `--validation <method>` - Validation method

#### `anneal` - Quantum Annealing
```bash
gemini-flow quantum anneal "<optimization>" [options]
```

**Options:**
- `--annealing-time <time>` - Annealing time
- `--chains <number>` - Number of chains
- `--temperature-schedule <type>` - Temperature schedule

## 🌟 Ultra AI Commands

### `ultra` - Next-Generation AI
Ultra-tier AI model integration and orchestration.

```bash
gemini-flow ultra <action> [options]
```

**Actions:**

#### `spawn` - Deploy Ultra Agent
```bash
gemini-flow ultra spawn <type> [options]
```

**Ultra Agent Types:**
- `jules-coordinator` - Jules-powered reasoning
- `deepmind-strategist` - DeepMind strategic planning
- `quantum-hybrid` - Quantum-classical coordination
- `meta-optimizer` - Meta-optimization specialist

**Options:**
- `--reasoning-depth <level>` - Reasoning depth (basic|advanced|expert)
- `--meta-cognitive` - Meta-cognitive capabilities
- `--coordination-pattern <type>` - Coordination pattern
- `--strategic-planning <horizon>` - Planning horizon

**Examples:**
```bash
gemini-flow ultra spawn jules-coordinator --reasoning-depth advanced --meta-cognitive
gemini-flow ultra spawn deepmind-strategist --strategic-planning long-term
```

#### `deploy` - Deploy Ultra System
```bash
gemini-flow ultra deploy <system> [options]
```

#### `orchestrate` - Ultra Orchestration
```bash
gemini-flow ultra orchestrate "<task>" [options]
```

**Options:**
- `--models <list>` - Comma-separated model list
- `--consensus-required` - Require model consensus
- `--strategic-focus <area>` - Strategic focus area

## 📊 Analytics & Monitoring Commands

### `stats` - Performance Statistics
Real-time performance statistics and analytics.

```bash
gemini-flow stats [options]
```

**Options:**
- `--real-time` - Live statistics
- `--dashboard` - Launch web dashboard
- `--export <file>` - Export statistics
- `--timeframe <duration>` - Time frame (1h, 24h, 7d)

### `cost-report` - Cost Analysis
Comprehensive cost analysis and optimization recommendations.

```bash
gemini-flow cost-report [options]
```

**Options:**
- `--timeframe <duration>` - Analysis timeframe
- `--breakdown <type>` - Cost breakdown (detailed|summary)
- `--optimization-recommendations` - Include optimization tips
- `--export <file>` - Export report
- `--format <type>` - Report format (pdf|json|csv)

### `security-flags` - Security Analysis
Security auditing and compliance checking.

```bash
gemini-flow security-flags [options]
```

**Options:**
- `--scan-depth <level>` - Scan depth (basic|comprehensive|deep)
- `--compliance-check <standards>` - Compliance standards (SOC2,GDPR,HIPAA)
- `--export <file>` - Export security report
- `--fix-issues` - Attempt to fix issues automatically

## 🔧 Utility Commands

### `hooks` - Lifecycle Hooks
Manage lifecycle event hooks and automation.

```bash
gemini-flow hooks <action> [options]
```

**Actions:**
- `pre-task` - Pre-task preparation
- `post-edit` - Post-edit processing
- `notify` - Send notifications
- `session-restore` - Restore session state
- `session-end` - End session processing

### `execute` - Direct Execution
Execute commands with AI coordination.

```bash
gemini-flow execute "<command>" [options]
```

### `analyze` - Code Analysis
Analyze codebases and projects.

```bash
gemini-flow analyze <target> [options]
```

### `learn` - Learning Mode
Interactive learning and education.

```bash
gemini-flow learn <action> [options]
```

### `generate` - Code Generation
Generate code, documentation, and templates.

```bash
gemini-flow generate <type> [options]
```

## 🌍 Global Options

These options work with most commands:

- `-v, --verbose` - Enable verbose output
- `--agents <number>` - Number of agents to spawn
- `--parallel` - Enable parallel execution
- `--no-cache` - Disable context caching
- `--profile <name>` - Use configuration profile
- `--model <name>` - Preferred model
- `--tier <tier>` - Override user tier (free|pro|enterprise)
- `--benchmark` - Run performance benchmarks
- `--health-check` - Perform system health check
- `--auto-route` - Enable intelligent model routing
- `--cost-optimize` - Enable cost optimization
- `--analyze-self` - Enable system self-analysis
- `--meta-optimization` - Enable recursive optimization

## 📋 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Configuration error |
| 4 | API error |
| 5 | Performance threshold exceeded |
| 6 | Security validation failed |
| 7 | Resource limit exceeded |

## 🔗 Related Documentation

- [NPM Usage Guide](./NPM_USAGE_GUIDE.md) - Complete NPM usage documentation
- [Quick Start Guide](./QUICK_START_NPM.md) - Get started in 5 minutes
- [Configuration Guide](./CONFIGURATION.md) - Detailed configuration options
- [API Reference](https://api-docs.gemini-flow.dev) - Programmatic API
- [Examples](../examples/) - Real-world usage examples

---

<div align="center">

**Need help with a specific command?**

Use `gemini-flow <command> --help` for detailed information about any command.

[![Get Support](https://img.shields.io/badge/💬-Get%20Support-blue?style=for-the-badge)](https://discord.gg/gemini-flow)

</div>
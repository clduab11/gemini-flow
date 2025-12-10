# 🤖 LLM INSTRUCTIONS FOR THE FACTORY

## CRITICAL: READ THIS FIRST

You are about to activate **The Factory** - a self-building meta-orchestration system that creates software through cascading chains of agent creation. This system uses the combined intelligence of THE_ORCHESTRATOR, SOVEREIGN, APEX, and other advanced frameworks to build complete projects from specifications.

## 🚨 ACTIVATION PROTOCOL

When a user asks you to build something using The Factory, follow these EXACT steps:

### STEP 1: Read and Understand

1. **ALWAYS** start by reading: `the_factory/specs/project_spec.md`
2. If no spec exists, ask user to create one OR help them create one using the optimal template
3. Parse and understand:
   - Project type and complexity
   - Core objectives
   - Technical requirements
   - Quality standards

### STEP 2: Initialize Chain Reaction

```python
# You should conceptually execute this pattern:
from the_factory.bootstrap import genesis_prime, chain_reactor

# 1. Load Genesis Prime (the meta-orchestrator)
genesis = genesis_prime.GenesisPrime(
    spec_path="the_factory/specs/project_spec.md"
)

# 2. Parse specification
spec = genesis.parse_specification(spec_text)

# 3. Determine orchestration strategy
strategy = genesis.determine_orchestration_strategy(spec)

# 4. INITIATE CHAIN REACTION
reactor = chain_reactor.ChainReactor()
result = reactor.initiate_chain_reaction(
    initial_role=AgentRole.ORCHESTRATOR,
    task=spec_to_task(spec),
    max_agents=strategy['num_agents']
)
```

### STEP 3: Orchestration Patterns

Based on project complexity, activate the appropriate pattern:

#### For SIMPLE projects:
```
1. Spawn: Analyzer → understands requirements
2. Spawn: Architect → designs structure
3. Spawn: Builder → implements code
4. Spawn: Validator → ensures quality
```

#### For MEDIUM projects:
```
1. Spawn: Orchestrator → coordinates everything
   ├── Spawn: 3 Analyzers → parallel requirement analysis
   ├── Spawn: 2 Architects → frontend + backend design
   ├── Spawn: 5 Builders → parallel component building
   └── Spawn: 2 Validators → testing and integration
```

#### For COMPLEX projects:
```
1. Spawn: Meta-Orchestrator → manages orchestrators
   ├── Spawn: Domain Orchestrator (Frontend)
   │   ├── Multiple Architects
   │   ├── Builder Swarm (10-20 agents)
   │   └── Test Brigade
   ├── Spawn: Domain Orchestrator (Backend)
   │   ├── API Architects
   │   ├── Service Builders
   │   └── Integration Team
   └── Spawn: Infrastructure Orchestrator
       ├── DevOps Architects
       ├── Container Builders
       └── Deployment Squad
```

#### For EXTREME projects:
```
Activate FULL SOVEREIGN + LBOF:
- 10 parallel teams (Alpha through Kappa)
- Each team: 10-20 specialized agents
- Total: 100-200 agents working simultaneously
- Byzantine consensus for quality assurance
- Neural mesh for cross-team insights
```

## 🧠 INTELLIGENCE MODULES TO ACTIVATE

### Based on Project Type:

**Web Application:**
- Use: SOVEREIGN hierarchical for structure
- Use: GENESIS collective for UI creativity
- Use: APEX SPARK for unique features

**API Service:**
- Use: Agent hierarchy for endpoint structure
- Use: Validators for contract testing
- Use: Optimizers for performance

**Data Pipeline:**
- Use: Swarm intelligence for parallel processing
- Use: Temporal nexus for scheduling
- Use: Neural collective for pattern detection

**AI System:**
- Use: Neural mesh for architecture
- Use: Recursive orchestrators for training
- Use: Infinite regress for self-improvement

## 📝 OUTPUT GENERATION PROTOCOL

### For Each Agent Spawn:

1. **Announce the spawn:**
   ```
   🤖 SPAWNING: [Role] Agent
   📋 Task: [What it will do]
   🎯 Objective: [Expected outcome]
   ```

2. **Show the work:**
   ```
   ⚙️ [Agent Role] is [current action]...
   ✅ [Agent Role] completed [task description]
   ```

3. **Chain reactions:**
   ```
   ⚡ CHAIN REACTION: [Parent Agent] → [Child Agent 1], [Child Agent 2]...
   ```

### Progressive Output Building:

```markdown
## 🏗️ Building [Project Name]

### Phase 1: Analysis & Architecture
[Show analyzer and architect outputs]

### Phase 2: Component Building
[Show builders creating each component]

### Phase 3: Integration & Testing
[Show integration and validation]

### Phase 4: Optimization & Documentation
[Show final optimization and docs]

### ✅ BUILD COMPLETE
[Final summary and location of outputs]
```

## 🔄 KEDJEREAKTIONER (Chain Reactions)

### Pattern Recognition Triggers:

When you see these patterns in the spec, automatically trigger chains:

- **"microservices"** → Spawn service-per-agent pattern
- **"real-time"** → Spawn WebSocket specialists + event handlers
- **"machine learning"** → Spawn data pipeline + model builders + evaluators
- **"e-commerce"** → Spawn cart + payment + inventory + order agents
- **"social"** → Spawn user + feed + messaging + notification agents

### Recursive Patterns:

For these keywords, use recursive spawning:
- **"scalable"** → Agents spawn load-test agents spawn optimization agents
- **"secure"** → Security agents spawn penetration agents spawn hardening agents
- **"optimized"** → Performance agents spawn profiler agents spawn optimizer agents

## 🎯 QUALITY GATES

At each level, enforce quality:

```python
if agent.output.quality < threshold:
    # Spawn improvement agent
    improver = spawn_agent(
        role="optimizer",
        task=f"Improve {agent.output}",
        parent=agent
    )
    improved_output = improver.execute()
```

## 💾 MEMORY INTEGRATION

If Neural Overlay is active:

```python
# Save successful patterns
from NEURAL_OVERLAY.minimal_hook import remember_pattern

remember_pattern(f"factory_{project_type}", {
    "orchestration": strategy,
    "agent_count": final_agent_count,
    "success_metrics": results
})

# Check previous experiences
recommendation = get_recommendation(f"factory_{project_type}")
if recommendation:
    apply_learned_optimizations(recommendation)
```

## 🚀 EXECUTION CHECKLIST

Before starting ANY Factory build:

- [ ] Project spec exists and is complete
- [ ] Complexity level determined
- [ ] Orchestration paradigm selected
- [ ] Agent count estimated
- [ ] Output directory prepared
- [ ] Quality thresholds set
- [ ] Neural learning enabled (if available)

During execution:

- [ ] Show agent spawning in real-time
- [ ] Display chain reactions visually
- [ ] Report progress at each phase
- [ ] Validate outputs at quality gates
- [ ] Integrate components properly
- [ ] Generate all documentation

After completion:

- [ ] Summarize what was built
- [ ] List all generated files
- [ ] Provide usage instructions
- [ ] Save learnings for next time
- [ ] Offer iteration options

## 🔥 ADVANCED TECHNIQUES

### Multi-Project Orchestration:

```python
# Build multiple projects simultaneously
projects = ["project1.md", "project2.md", "project3.md"]
parallel_teams = allocate_teams(projects)
results = parallel_execute(parallel_teams)
```

### Evolution Mode:

```python
# Let the system evolve the solution
for generation in range(10):
    solutions = generate_solutions(spec, population_size=20)
    best = select_fittest(solutions)
    next_gen = mutate_and_crossover(best)
```

### Adversarial Refinement:

```python
# Use competing agents for quality
thesis_agent = spawn_agent("builder", task)
antithesis_agent = spawn_agent("critic", f"Find flaws in {thesis_agent.output}")
synthesis_agent = spawn_agent("integrator", f"Merge best of both")
```

## 📊 PERFORMANCE EXPECTATIONS

Based on complexity:

| Complexity | Agents | Time | Lines of Code | Quality |
|------------|--------|------|---------------|---------|
| Simple | 5-10 | Minutes | 500-2K | 85% |
| Medium | 20-50 | 30 min | 2K-10K | 90% |
| Complex | 50-100 | 1-2 hours | 10K-50K | 92% |
| Extreme | 100-200 | 2-8 hours | 50K+ | 95% |

## 🎭 ROLE-SPECIFIC BEHAVIORS

When simulating agents, embody their roles:

**Orchestrator**: "I coordinate and ensure all pieces fit together..."
**Architect**: "I'm designing the system structure with these patterns..."
**Builder**: "I'm implementing the [component] with [language/framework]..."
**Validator**: "I'm verifying that [requirement] is met..."
**Optimizer**: "I'm improving performance by [optimization technique]..."

## 🛠️ TROUBLESHOOTING

If the chain reaction stalls:

1. **Check the spec** - Is it complete?
2. **Reduce complexity** - Start simpler, iterate
3. **Increase agents** - More parallelization
4. **Switch paradigms** - Try different orchestration
5. **Enable learning** - Use Neural Overlay

## 🎯 SUCCESS CRITERIA

The build is successful when:

1. ✅ All core features implemented
2. ✅ Tests pass (if specified)
3. ✅ Documentation generated
4. ✅ Code is organized and clean
5. ✅ Output matches specification

## 🔮 REMEMBER

You are not just running a script. You are:
- **Orchestrating** intelligent agents
- **Creating** chain reactions of creation
- **Building** complete systems from ideas
- **Learning** from each build
- **Evolving** the process itself

The Factory doesn't just build code.
**It builds the builders that build the code.**

---

*"From specification to implementation, through chain reactions of creation."*

## FINAL COMMAND

When ready to build, your response should follow this pattern:

```markdown
🏭 **ACTIVATING THE FACTORY**

📖 Reading specification...
[Summarize understanding of spec]

⚛️ **INITIATING CHAIN REACTION**
- Complexity: [determined level]
- Paradigm: [selected paradigm]
- Estimated agents: [number]

🤖 **SPAWNING GENESIS PRIME**
[Begin the chain reaction...]
```

Then proceed with the full orchestration, showing each spawn, chain, and output generation in real-time.
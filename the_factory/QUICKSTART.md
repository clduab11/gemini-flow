# 🚀 THE FACTORY - QUICKSTART GUIDE

## 30-Second Setup

```bash
# 1. Navigate to gemini-flow
cd gemini-flow

# 2. Switch to the-factory branch
git checkout the-factory

# 3. Navigate to The Factory
cd the_factory

# 4. Create your project specification
# Either edit the default or create a new one:
nano specs/project_spec.md
```

## For LLM Agents (Claude, GPT, etc.)

Say this to your LLM:

> "I want to use The Factory to build a project. Please read `the_factory/INSTRUCTIONS.md` and then `the_factory/specs/project_spec.md` and start the build process."

The LLM will then:
1. Read the instructions
2. Parse your specification
3. Initiate the chain reaction
4. Show you agents spawning agents
5. Generate your complete project

## For Direct Python Execution

```python
# Run The Factory
python bootstrap/genesis_prime.py --build

# With custom spec file
python bootstrap/genesis_prime.py --build --spec specs/my_project.md

# With parallel execution
python bootstrap/genesis_prime.py --build --parallel

# With quality iterations
python bootstrap/genesis_prime.py --build --iterate --quality-threshold 0.95
```

## Example: Build a Todo App

```bash
# Use the provided example
cp specs/example_todo_app.md specs/project_spec.md

# Run The Factory
python bootstrap/genesis_prime.py --build

# Watch the magic happen!
```

## What Happens Next?

1. **Genesis Prime activates** - Reads and understands your spec
2. **Chain reaction begins** - Agents start spawning other agents
3. **Parallel execution** - Multiple teams work simultaneously
4. **Integration phase** - All components are merged
5. **Validation** - Quality gates ensure everything works
6. **Output generation** - Your project appears in `outputs/project_root/`

## Project Types You Can Build

### Simple (5-10 agents, minutes)
- CLI tools
- Simple APIs
- Static websites
- Basic scripts
- Utility libraries

### Medium (20-50 agents, ~30 min)
- Full-stack web apps
- REST APIs with auth
- Data pipelines
- Chrome extensions
- Desktop apps

### Complex (50-100 agents, 1-2 hours)
- E-commerce platforms
- Social media apps
- Enterprise systems
- SaaS products
- Analytics platforms

### Extreme (100-200 agents, 2-8 hours)
- Operating systems
- Compilers
- Game engines
- Distributed systems
- AI platforms

## Tips for Best Results

### 1. Be Specific in Your Spec
```markdown
# Good
"User authentication with email/password, OAuth2 (Google, GitHub), and 2FA support"

# Less Good
"User login functionality"
```

### 2. Set Clear Priorities
```yaml
# In your spec
objectives:
  must_have: ["auth", "data_storage", "api"]
  nice_to_have: ["analytics", "notifications"]
  future: ["ai_features", "mobile_app"]
```

### 3. Define Success Criteria
```yaml
success_criteria:
  - "All API endpoints respond in <200ms"
  - "Test coverage > 80%"
  - "Zero security vulnerabilities"
```

### 4. Use the Optimal Template
```bash
# Start with the optimized template
cp templates/optimal_project_spec.md specs/my_project.md
# Then customize it
```

## Monitor Progress

### Real-time Monitoring
```bash
# In another terminal, watch the outputs directory
watch -n 1 "ls -la outputs/project_root/"

# Or monitor agent activity (if logging enabled)
tail -f logs/factory.log
```

### Chain Visualization
The Factory will show you:
```
⚛️ CHAIN REACTION VISUALIZATION
==================================================
Chain 1:
  ✅ orchestrator (a1b2c3d4...)
    ⚙️ analyzer (e5f6g7h8...)
      ⚙️ architect (i9j0k1l2...)
        ⚙️ builder (m3n4o5p6...)
```

## Common Commands

```bash
# Initialize The Factory (first time only)
python bootstrap/genesis_prime.py --init

# Build with default spec
python bootstrap/genesis_prime.py --build

# Build with custom settings
python bootstrap/genesis_prime.py \
  --build \
  --spec specs/my_app.md \
  --output outputs/my_app \
  --parallel \
  --iterate

# Run chain reactor demo
python bootstrap/chain_reactor.py

# Clean outputs
rm -rf outputs/*
```

## Troubleshooting

### "Specification not found"
Create `specs/project_spec.md` or specify path with `--spec`

### "Import errors"
Make sure THE_ORCHESTRATOR is accessible:
```bash
export PYTHONPATH="${PYTHONPATH}:../THE_ORCHESTRATOR"
```

### "Agents not spawning"
Check that your spec has sufficient complexity. Simple specs spawn fewer agents.

### "Build taking too long"
Reduce complexity in your spec or limit max agents:
```python
python bootstrap/genesis_prime.py --build --max-agents 20
```

## Advanced Usage

### Multi-Project Build
```bash
# Create multiple specs
ls specs/
# project1.md project2.md project3.md

# Build all in parallel
for spec in specs/*.md; do
  python bootstrap/genesis_prime.py --build --spec $spec &
done
```

### Custom Agent Configuration
Edit `bootstrap/chain_reactor.py` to add new agent types or modify spawning behavior.

### Integration with CI/CD
```yaml
# .github/workflows/factory-build.yml
name: Factory Build
on:
  push:
    paths:
      - 'specs/*.md'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run The Factory
        run: |
          python the_factory/bootstrap/genesis_prime.py \
            --build \
            --spec ${{ github.event.head_commit.modified[0] }}
```

## Next Steps

1. **Edit your spec**: Customize `specs/project_spec.md`
2. **Run The Factory**: `python bootstrap/genesis_prime.py --build`
3. **Check outputs**: Your project in `outputs/project_root/`
4. **Iterate**: Refine spec and rebuild as needed
5. **Deploy**: Use generated deployment configs

## Getting Help

- Check `INSTRUCTIONS.md` for LLM integration
- Read `README.md` for full documentation
- Review examples in `specs/`
- Examine logs in `logs/` (if enabled)

---

**Remember**: The Factory doesn't just generate code - it orchestrates an entire ecosystem of agents that build your project through intelligent collaboration and chain reactions of creation.

*"From idea to implementation in minutes, not months."*
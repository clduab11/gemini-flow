# 🔧 THE FACTORY - STANDALONE SETUP

## Making The Factory Completely Independent

The Factory can run in two modes:

### 1. **INTEGRATED MODE** (Default)
- Uses THE_ORCHESTRATOR components directly
- Requires THE_ORCHESTRATOR in parent directory
- Smaller footprint (no duplicate files)
- Always has latest ORCHESTRATOR updates

### 2. **STANDALONE MODE** (Portable)
- Completely self-contained
- Can be moved anywhere
- No external dependencies
- All components copied to `lib/`

## 🚀 Quick Setup for Standalone Mode

```bash
cd the_factory
python make_standalone.py
```

This will:
1. Create `lib/` directory
2. Copy all necessary files from THE_ORCHESTRATOR
3. Update import paths automatically
4. Verify the installation

## 📦 What Gets Copied

```
the_factory/lib/
├── SOVEREIGN_AGENTS/       # Multi-agent orchestration
│   ├── 01_CORE/           # Core classes
│   ├── 02_HIERARCHY/      # Hierarchical agents
│   ├── 03_SOVEREIGN/      # Meta-orchestrator
│   ├── 04_VARIANTS/       # All paradigms
│   └── 05_*/              # Advanced modules
│
├── NEURAL_OVERLAY/         # Learning & memory
│   ├── neural_core.py
│   ├── minimal_hook.py
│   └── neural_daemon.py
│
├── THE_APEX/              # Creative systems
│   ├── APEX_SPARK.md
│   └── apex-framework/
│
├── SOVEREIGN_GENESIS/      # Genesis patterns
│   └── *.md
│
├── SOVEREIGN_LLM/         # LLM prompts
│   └── *.md
│
└── lbof-orchestration-suite/  # Bulk orchestration
    └── *.md, *.py, *.sh
```

## 🔄 Switching Between Modes

### Use Standalone Mode:
```bash
python bootstrap/use_standalone.py standalone
```

### Use Integrated Mode:
```bash
python bootstrap/use_standalone.py integrated
```

### Auto-Detection:
The system automatically detects which mode to use:
- If `lib/` exists with content → Standalone mode
- If THE_ORCHESTRATOR exists → Integrated mode
- Otherwise → Warning message

## 📁 Project Specification Location

Your `project_spec.md` should ALWAYS go in:
```
the_factory/specs/project_spec.md
```

You can have multiple specs:
```
the_factory/specs/
├── project_spec.md         # Default
├── example_todo_app.md     # Example
├── my_saas_platform.md     # Custom project 1
├── data_pipeline.md        # Custom project 2
└── ai_system.md           # Custom project 3
```

## 🎯 Complete Workflow

### For Standalone Deployment:

1. **Make standalone:**
   ```bash
   python make_standalone.py
   ```

2. **Create your specification:**
   ```bash
   # Edit or copy a template
   cp templates/optimal_project_spec.md specs/project_spec.md
   nano specs/project_spec.md
   ```

3. **Run The Factory:**
   ```bash
   python bootstrap/genesis_prime.py --build
   ```

4. **Move anywhere:**
   ```bash
   # The entire the_factory folder is now portable
   cp -r the_factory /any/location/
   cd /any/location/the_factory
   python bootstrap/genesis_prime.py --build
   ```

## 🤖 For LLM Usage

When instructing an LLM to use The Factory:

### Setup Phase:
1. Upload: `SYSTEM_LLM.md` (system understanding)
2. Upload: `SPEC_OPTIMIZATION_LLM.md` (how to write specs)
3. Upload: `INSTRUCTIONS.md` (how to run)

### Creation Phase:
1. Create optimized `project_spec.md` with the LLM
2. Place in `the_factory/specs/`
3. Tell LLM: "Read specs/project_spec.md and execute The Factory"

## ✅ Verification

Check if standalone is working:
```bash
python -c "
from pathlib import Path
lib = Path('lib')
if lib.exists():
    modules = list(lib.iterdir())
    print(f'✅ Standalone mode ready with {len(modules)} modules')
    for m in modules:
        print(f'   - {m.name}')
else:
    print('❌ Not in standalone mode')
"
```

## 🚚 Portability

Once in standalone mode, The Factory can be:
- Zipped and shared
- Dockerized
- Deployed to cloud
- Used in CI/CD pipelines
- Embedded in other projects

```bash
# Create portable archive
tar -czf the_factory_standalone.tar.gz the_factory/

# Extract anywhere
tar -xzf the_factory_standalone.tar.gz
cd the_factory
python bootstrap/genesis_prime.py --build
```

## 📝 Important Notes

1. **lib/ is git-ignored** - It won't be committed (contains copies)
2. **Updates** - Standalone mode won't get ORCHESTRATOR updates automatically
3. **Size** - Standalone mode uses more disk space (duplicated files)
4. **Performance** - No performance difference between modes

## 🔍 Troubleshooting

### "No dependencies found"
Run `python make_standalone.py`

### "Module not found" errors
Ensure you're in the correct mode or run setup again

### "Can't find project_spec.md"
Check it's in `specs/` directory, not root

### Different behavior between modes
Both modes should behave identically. If not, re-run `make_standalone.py`

---

The Factory is now truly universal - it can build anything, anywhere!
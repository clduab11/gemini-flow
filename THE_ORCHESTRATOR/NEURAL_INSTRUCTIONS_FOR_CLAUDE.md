# 🧠 Neural Learning Instructions for Claude Code

## Add this to your CLAUDE.md or system prompts

### Learning Protocol

This repository uses a Neural Overlay learning system that remembers what works and what doesn't across sessions. You should interact with it at key points.

#### Before Starting Major Tasks

Always check for previous learnings:

```bash
# Check if similar task has been done before
python -c "
from NEURAL_OVERLAY.minimal_hook import get_recommendation
rec = get_recommendation('${TASK_TYPE}')
if rec:
    print(f'💡 Previous learning: {rec}')
else:
    print('No previous patterns found for this task type')
"
```

#### After Successful Completions

Save patterns that worked well:

**After creating a successful PR:**
```bash
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('pr_success', {
    'description': 'Added new feature X',
    'files_changed': 12,
    'approach': 'bottom-up implementation',
    'tests_passed': True
})
"
```

**After fixing a complex bug:**
```bash
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('bug_fix_${BUG_ID}', {
    'root_cause': 'race condition in async handler',
    'solution': 'added proper locking',
    'time_to_fix': '2 hours'
})
"
```

**After successful refactoring:**
```bash
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('refactor_success', {
    'component': 'auth system',
    'pattern': 'extracted to middleware',
    'loc_reduced': 150
})
"
```

#### When Things Fail

Track failures to avoid them next time:

```bash
python -c "
from NEURAL_OVERLAY.minimal_hook import track_execution
track_execution(
    func_name='${WHAT_FAILED}',
    success=False,
    duration=${TIME_WASTED},
    error='${ERROR_DESCRIPTION}'
)
"
```

#### At Natural Checkpoints

Use these commands at these specific points:

1. **Before git commit of major feature:**
   ```bash
   python -m NEURAL_OVERLAY.checkpoint save --milestone "feature_complete"
   ```

2. **After all tests pass:**
   ```bash
   python -m NEURAL_OVERLAY.checkpoint save --milestone "tests_green"
   ```

3. **When switching context/task:**
   ```bash
   python -m NEURAL_OVERLAY.checkpoint save --milestone "context_switch"
   ```

4. **Start of new session:**
   ```bash
   python -m NEURAL_OVERLAY.checkpoint recall --context "continuing_from_yesterday"
   ```

### Practical Examples

#### Scenario 1: Working on SEO Features
```bash
# At start of session
python -c "from NEURAL_OVERLAY.minimal_hook import get_recommendation; print(get_recommendation('seo'))"

# After implementing something that works
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('seo_meta_tags', {
    'strategy': 'dynamic generation from content',
    'implementation': 'used BeautifulSoup for parsing'
})
"
```

#### Scenario 2: Debugging Production Issue
```bash
# Check if similar issue was solved before
python -c "from NEURAL_OVERLAY.minimal_hook import get_recommendation; print(get_recommendation('timeout_error'))"

# After fixing
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('timeout_fix', {
    'issue': 'API timeout under load',
    'solution': 'added connection pooling',
    'config': 'max_connections=100'
})
"
```

### Quick Reference Card

| When | Command | Purpose |
|------|---------|---------|
| **Starting task** | `get_recommendation('task_type')` | Check previous learnings |
| **Task succeeded** | `remember_pattern('name', data)` | Save what worked |
| **Task failed** | `track_execution('name', False, time, error)` | Learn from failure |
| **Major milestone** | `checkpoint save` | Create restore point |
| **New session** | `checkpoint recall` | Load previous context |

### Integration Levels

#### Level 1: Minimal (Just Learning)
Only use at PR creation and major milestones.

#### Level 2: Moderate (Checkpoint-Based)
Use at every significant completion point.

#### Level 3: Comprehensive (Continuous)
Track every significant operation for maximum learning.

### Smart Patterns to Remember

Always save these patterns when you encounter them:

1. **Performance optimizations that worked**
2. **Bug fixes for tricky issues**
3. **Architectural decisions and their outcomes**
4. **Test strategies that caught issues**
5. **Refactoring approaches that simplified code**
6. **Configuration changes that solved problems**
7. **Dependencies that work well together**
8. **Anti-patterns to avoid**

### Example Session Flow

```bash
# 1. Start session - check memories
python -c "from NEURAL_OVERLAY.minimal_hook import enable_neural; enable_neural()"

# 2. Before major task - get recommendations
python -c "from NEURAL_OVERLAY.minimal_hook import get_recommendation; print(get_recommendation('api_development'))"

# 3. Work on task...

# 4. After success - save pattern
python -c "
from NEURAL_OVERLAY.minimal_hook import remember_pattern
remember_pattern('api_rest_pattern', {
    'framework': 'FastAPI',
    'validation': 'Pydantic',
    'auth': 'JWT Bearer'
})
"

# 5. At end of session - patterns are auto-saved
# Next session will have access to these learnings!
```

### Benefits Over Time

- **Session 1-5:** Building pattern library
- **Session 6-20:** Significant speed improvements
- **Session 20+:** Emergent best practices
- **Session 50+:** Near-optimal approaches for common tasks

The system literally gets smarter with every use!
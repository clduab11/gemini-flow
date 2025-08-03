# Gemini CLI Commands Reference

## Overview

Gemini Flow v1.0.4 introduces dedicated `gemini` CLI subcommands for managing Gemini CLI integration and context loading. These commands provide comprehensive tools for setting up, monitoring, and troubleshooting the enhanced AI coordination features.

## Command Structure

```bash
gemini-flow gemini <subcommand> [options]
```

## Available Subcommands

### `gemini-flow gemini detect`
Detects official Gemini CLI installation on the system.

#### Syntax
```bash
gemini-flow gemini detect [options]
```

#### Options
- `--verbose` - Show detailed detection information
- `--json` - Output results in JSON format
- `--timeout <ms>` - Detection timeout (default: 5000ms)

#### Examples
```bash
# Basic detection
gemini-flow gemini detect

# Verbose output with detailed information
gemini-flow gemini detect --verbose

# JSON output for scripting
gemini-flow gemini detect --json
```

#### Sample Output
```
✅ Gemini CLI Found:
  Path: /usr/local/bin/gemini
  Version: 1.2.3
  Installation: Global npm package
```

#### JSON Response
```json
{
  "isInstalled": true,
  "version": "1.2.3",
  "path": "/usr/local/bin/gemini",
  "installMethod": "npm-global",
  "detectionTime": 45
}
```

#### Error Scenarios
```bash
# CLI not found
❌ Gemini CLI Not Found

💡 Installation Help:
  Visit: https://ai.google.dev/gemini-api/docs/quickstart
  Or run: npm install -g @google-ai/generativelanguage

# Permission issues
⚠️  Gemini CLI Found but inaccessible
  Error: Permission denied
  Solution: Check file permissions or run with appropriate privileges
```

---

### `gemini-flow gemini context`
Manages GEMINI.md context loading and caching.

#### Syntax
```bash
gemini-flow gemini context [options]
```

#### Options
- `--reload` - Force reload context from disk
- `--path <path>` - Specify custom project root path
- `--show` - Display loaded context content (truncated)
- `--validate` - Validate context structure and content
- `--size` - Show context size and statistics
- `--cache-info` - Display cache status and metrics

#### Examples
```bash
# Load context from current directory
gemini-flow gemini context

# Force reload from disk (clear cache)
gemini-flow gemini context --reload

# Load from custom path
gemini-flow gemini context --path /path/to/project

# Show context content preview
gemini-flow gemini context --show

# Validate context structure
gemini-flow gemini context --validate

# Show cache information
gemini-flow gemini context --cache-info
```

#### Sample Output
```
✅ GEMINI.md Context:
  Source: /project/GEMINI.md
  Size: 50,247 characters
  Loaded: 2025-08-03T10:30:00Z
  Sections: 10 detected
  Agents: 66 types documented
  Commands: 45+ documented
  Cache: Hit (loaded 2 minutes ago)
```

#### Context Preview (--show)
```
📄 Context Content:
──────────────────────────────────────────────────────────
# 🌟 GEMINI.md - Gemini-Flow System Specification

> **Version**: 1.0.4 | **Status**: Production Ready

## 🚨 CRITICAL: This Document Provides Context for Gemini AI Integration

When using the `--gemini` flag, this document is loaded as context...
──────────────────────────────────────────────────────────
... (truncated, showing first 1000 characters)
Use --show --full to display complete content
```

#### Validation Output (--validate)
```
🔍 Context Validation:

Structure: ✅ Valid
  - Table of Contents: Found
  - Agent Definitions: 66 types found
  - Command Reference: Complete
  - API Documentation: Present

Content Quality: ✅ High
  - Documentation Coverage: 95%
  - Code Examples: 47 found
  - Cross-references: Valid
  - Links: All accessible

Recommendations:
  - Consider adding performance benchmarks section
  - Update copyright year to 2025
```

#### Cache Information (--cache-info)
```
💾 Cache Status:

Current Cache:
  Status: Active
  Age: 2 minutes 34 seconds
  Size: 50,247 characters
  Source: /project/GEMINI.md
  TTL: 2 minutes 26 seconds remaining

Cache Statistics:
  Hit Rate: 87.3%
  Misses: 12 (last 24 hours)
  Invalidations: 3 (last 24 hours)
  Memory Usage: 49.1 KB
```

---

### `gemini-flow gemini status`
Shows comprehensive Gemini integration status and health check.

#### Syntax
```bash
gemini-flow gemini status [options]
```

#### Options
- `--json` - Output status as JSON
- `--verbose` - Include detailed diagnostic information
- `--health-check` - Perform comprehensive health check
- `--performance` - Include performance metrics
- `--environment` - Show environment variable details

#### Examples
```bash
# Basic status check
gemini-flow gemini status

# JSON output for automation
gemini-flow gemini status --json

# Verbose diagnostic information
gemini-flow gemini status --verbose

# Comprehensive health check
gemini-flow gemini status --health-check

# Performance metrics included
gemini-flow gemini status --performance
```

#### Sample Output
```
🔍 Gemini Integration Status:

CLI Detection: ✅ Detected
  Version: 1.2.3
  Path: /usr/local/bin/gemini
  Status: Responsive

Context Loading: ✅ Loaded
  Source: /project/GEMINI.md
  Size: 50,247 characters
  Last Updated: 2025-08-03T10:30:00Z
  Cache: Active

Environment: ✅ Configured
  GEMINI_FLOW_CONTEXT_LOADED: true
  GEMINI_FLOW_MODE: enhanced
  GEMINI_MODEL: gemini-1.5-flash

Integration Health: ✅ Excellent
  Overall Score: 98/100
  CLI Availability: 100%
  Context Validity: 96%
  Performance: 99%

🚀 Integration Ready!
All systems operational for enhanced AI coordination.
```

#### Health Check Output (--health-check)
```
🏥 Comprehensive Health Check:

System Requirements: ✅ Met
  Node.js: v20.5.0 (✅ Compatible)
  Memory: 2.4GB available (✅ Sufficient)
  Disk Space: 15.7GB free (✅ Adequate)

CLI Integration: ✅ Healthy
  Installation: ✅ Found
  Execution: ✅ Responsive (45ms)
  Version: ✅ Compatible (1.2.3)
  Permissions: ✅ Accessible

Context System: ✅ Optimal
  File Access: ✅ Readable
  Content Parse: ✅ Valid
  Cache System: ✅ Functional
  Memory Usage: ✅ Normal (49.1 KB)

Environment: ✅ Configured
  Required Variables: ✅ Set
  API Keys: ✅ Present
  Model Access: ✅ Available

Performance Metrics: ✅ Excellent
  Context Load Time: 12ms (Target: <50ms)
  CLI Detection: 45ms (Target: <100ms)
  Cache Hit Rate: 87.3% (Target: >80%)
  Memory Efficiency: 99.2% (Target: >95%)

Security: ✅ Secure
  File Permissions: ✅ Appropriate
  Environment Isolation: ✅ Active
  API Key Protection: ✅ Secured

Overall Health Score: 98/100 (Excellent)
```

#### Performance Metrics (--performance)
```
⚡ Performance Metrics:

Response Times:
  CLI Detection: 45ms (avg), 89ms (p95)
  Context Loading: 12ms (avg), 23ms (p95)
  Environment Setup: 3ms (avg), 8ms (p95)
  Status Check: 8ms (avg), 15ms (p95)

Throughput:
  Context Loads: 847 ops/min
  Status Checks: 2,341 ops/min
  CLI Calls: 156 ops/min

Resource Usage:
  Memory: 49.1 KB cache, 2.3 MB total
  CPU: 0.2% average, 1.4% peak
  Disk I/O: 0.8 KB/s average

Cache Performance:
  Hit Rate: 87.3%
  Miss Rate: 12.7%
  Eviction Rate: 0.3%
  Average TTL: 4m 23s

Error Rates:
  CLI Detection: 0.1%
  Context Loading: 0.0%
  Environment Setup: 0.0%
  Overall: 0.03%
```

---

### `gemini-flow gemini setup`
Initializes complete Gemini integration including CLI detection, context loading, and environment configuration.

#### Syntax
```bash
gemini-flow gemini setup [options]
```

#### Options
- `--path <path>` - Specify project root path
- `--force` - Force setup even if already configured
- `--interactive` - Interactive setup wizard
- `--validate` - Validate setup after completion
- `--backup` - Create backup of existing configuration
- `--dry-run` - Show what would be done without making changes

#### Examples
```bash
# Basic setup
gemini-flow gemini setup

# Setup with custom project path
gemini-flow gemini setup --path /path/to/project

# Force reconfiguration
gemini-flow gemini setup --force

# Interactive setup wizard
gemini-flow gemini setup --interactive

# Dry run to preview changes
gemini-flow gemini setup --dry-run
```

#### Sample Output
```
🔧 Setting up Gemini integration...

🎯 Setup Results:

CLI Detection:
  ✅ Gemini CLI found
  📦 Version: 1.2.3
  📍 Path: /usr/local/bin/gemini
  ⚡ Response time: 45ms

Context Loading:
  ✅ GEMINI.md loaded successfully
  📄 Source: /project/GEMINI.md
  📏 Size: 50,247 characters
  🔍 Validation: Passed
  💾 Cache: Initialized

Environment Configuration:
  ✅ Environment variables configured
  🌍 GEMINI_FLOW_CONTEXT_LOADED=true
  🚀 GEMINI_FLOW_MODE=enhanced
  🤖 GEMINI_MODEL=gemini-1.5-flash
  📊 Performance optimizations: Enabled

Integration Validation:
  ✅ All components functional
  ✅ Context accessible
  ✅ CLI responsive
  ✅ Environment ready

🚀 Integration Ready!
Use --gemini flag with any command for enhanced AI coordination.

Quick Test:
  gemini-flow hive-mind spawn "test task" --gemini
  gemini-flow swarm "analyze project" --gemini
  gemini-flow query "project status" --gemini
```

#### Interactive Setup (--interactive)
```
🤖 Gemini Integration Setup Wizard

? Project type: 
  ❯ Web Application
    Mobile App
    Backend Service
    Library/Package
    Monorepo
    Other

? Primary technology stack:
  ❯ TypeScript/Node.js
    Python
    Java/Spring
    Go
    Rust
    Other

? Gemini CLI installation preference:
  ❯ Global npm install (recommended)
    Local project install
    Manual installation
    Skip CLI integration

? Context file location:
  ❯ Project root (GEMINI.md)
    Custom path
    Generate from template
    Skip context loading

? Environment configuration:
  ❯ Automatic setup (recommended)
    Manual configuration
    Use existing settings

Setting up integration...
✅ Setup completed successfully!
```

#### Dry Run Output (--dry-run)
```
🔍 Dry Run - Setup Preview:

Would perform the following actions:

CLI Detection:
  ✓ Check for Gemini CLI installation
  ✓ Verify CLI version compatibility
  ✓ Test CLI responsiveness

Context Loading:
  ✓ Search for GEMINI.md in /project
  ✓ Read and validate context file
  ✓ Initialize context cache

Environment Configuration:
  ✓ Set GEMINI_FLOW_CONTEXT_LOADED=true
  ✓ Set GEMINI_FLOW_MODE=enhanced
  ✓ Set GEMINI_MODEL=gemini-1.5-flash

Validation:
  ✓ Test complete integration
  ✓ Verify all components functional

No changes will be made. Use --force to execute setup.
```

---

## Global Options

All gemini subcommands support these global options:

- `--help, -h` - Show command help
- `--version, -v` - Show version information
- `--debug` - Enable debug logging
- `--quiet` - Suppress all output except errors
- `--no-color` - Disable colored output
- `--config <file>` - Use custom configuration file

## Configuration

### Environment Variables
The gemini commands respect these environment variables:

```bash
# Core Configuration
GOOGLE_AI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_FLOW_LOG_LEVEL=info

# Path Configuration  
GEMINI_FLOW_PROJECT_ROOT=/custom/project/path
GEMINI_FLOW_CONTEXT_PATH=/custom/GEMINI.md

# Performance Tuning
GEMINI_FLOW_CACHE_TTL=300
GEMINI_FLOW_DETECTION_TIMEOUT=5000
GEMINI_FLOW_CONTEXT_SIZE_LIMIT=1048576

# Integration Behavior
GEMINI_FLOW_AUTO_SETUP=true
GEMINI_FLOW_VALIDATION_STRICT=false
GEMINI_FLOW_FALLBACK_CONTEXT=true
```

### Configuration File
Gemini commands can use a configuration file (`.gemini-flow.json`):

```json
{
  "gemini": {
    "detection": {
      "timeout": 5000,
      "retries": 3,
      "cache": true
    },
    "context": {
      "path": "./GEMINI.md",
      "cacheTTL": 300,
      "validation": true,
      "fallback": true
    },
    "environment": {
      "autoSetup": true,
      "variables": {
        "GEMINI_FLOW_MODE": "enhanced",
        "GEMINI_MODEL": "gemini-1.5-flash"
      }
    }
  }
}
```

## Integration with Main Commands

The gemini subcommands work seamlessly with main gemini-flow commands:

### Automatic Integration
```bash
# These commands automatically trigger gemini integration:
gemini-flow hive-mind spawn "task" --gemini
gemini-flow swarm "objective" --gemini
gemini-flow query "question" --gemini
```

### Manual Verification
```bash
# Verify integration before running main commands:
gemini-flow gemini status
gemini-flow hive-mind spawn "task" --gemini
```

### Troubleshooting Workflow
```bash
# If main commands fail with --gemini flag:
gemini-flow gemini status --health-check
gemini-flow gemini setup --force
gemini-flow gemini context --validate
```

## Scripting and Automation

### CI/CD Integration
```bash
#!/bin/bash
# Setup script for CI/CD

# Check if Gemini integration is ready
if gemini-flow gemini status --json | jq -r '.integrationReady' | grep -q true; then
  echo "Gemini integration ready"
else
  echo "Setting up Gemini integration..."
  gemini-flow gemini setup --force
fi

# Run tests with enhanced AI coordination
gemini-flow hive-mind spawn "run test suite" --gemini
```

### Health Monitoring
```bash
#!/bin/bash
# Health monitoring script

STATUS=$(gemini-flow gemini status --json)
HEALTH_SCORE=$(echo $STATUS | jq -r '.healthScore')

if [ "$HEALTH_SCORE" -lt 80 ]; then
  echo "Health score low: $HEALTH_SCORE"
  gemini-flow gemini setup --force
fi
```

### Context Validation
```bash
#!/bin/bash
# Pre-commit hook for context validation

if ! gemini-flow gemini context --validate --quiet; then
  echo "GEMINI.md validation failed"
  exit 1
fi
```

## Error Codes

| Code | Command | Description | Resolution |
|------|---------|-------------|------------|
| 0 | All | Success | - |
| 1 | detect | CLI not found | Install Gemini CLI |
| 2 | context | Context file not found | Create GEMINI.md or use --path |
| 3 | context | Invalid context format | Validate and fix GEMINI.md |
| 4 | setup | Setup failed | Check permissions and retry |
| 5 | status | Integration not ready | Run setup command |
| 10 | All | Invalid arguments | Check command syntax |
| 11 | All | Permission denied | Check file/directory permissions |
| 12 | All | Timeout | Increase timeout or check system |

## Performance Considerations

### Command Performance
- `detect`: 50-100ms typical
- `context`: 10-50ms (cached), 100-500ms (fresh)
- `status`: 10-30ms
- `setup`: 200-1000ms

### Resource Usage
- Memory: 2-8MB during execution
- CPU: <1% typical, 5-10% during setup
- Disk: Minimal I/O except during context loading

### Optimization Tips
1. Use caching for repeated operations
2. Run setup once per project/session
3. Use `--quiet` flag in scripts
4. Consider `--json` output for parsing
5. Cache status checks in CI/CD

---

*The gemini CLI commands provide a comprehensive toolkit for managing Gemini integration in gemini-flow v1.0.4, enabling seamless setup, monitoring, and troubleshooting of enhanced AI coordination features.*
# ⚡ Gemini-Flow Quick Start - NPM Edition

> **Get up and running with quantum-classical AI orchestration in under 5 minutes!**

## 🚀 1-Minute Installation

```bash
# Option 1: Global installation (recommended)
npm install -g gemini-flow

# Option 2: Use without installing
npx gemini-flow@latest --version

# Option 3: Add to your project
npm install gemini-flow
```

## ⚡ 30-Second Setup

```bash
# 1. Install globally
npm install -g gemini-flow

# 2. Quick health check
gemini-flow doctor

# 3. Interactive setup
gemini-flow init --interactive

# 4. Deploy your first AI swarm
gemini-flow swarm init --topology mesh --agents 4

# 🎉 You're ready to orchestrate AI!
```

## 🎯 Essential Commands (Copy & Paste Ready)

### **Instant AI Research**
```bash
npx gemini-flow@latest query "latest AI developments 2024" --depth medium
```

### **Deploy Development Swarm**
```bash
npx gemini-flow@latest swarm init --topology hierarchical --agents 6
npx gemini-flow@latest sparc tdd "build REST API with authentication"
```

### **Performance Benchmark**
```bash
npx gemini-flow@latest benchmark --detailed --export results.json
```

### **System Health Check**
```bash
npx gemini-flow@latest doctor && gemini-flow health
```

## 📦 Package.json Integration

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "ai:init": "gemini-flow init --dev",
    "ai:swarm": "gemini-flow swarm init --topology mesh",
    "ai:develop": "gemini-flow sparc tdd",
    "ai:research": "gemini-flow query",
    "ai:benchmark": "gemini-flow benchmark --export perf.json",
    "ai:health": "gemini-flow doctor && gemini-flow health"
  }
}
```

Then run: `npm run ai:init`

## 🌟 Real Examples That Work

### **Full-Stack Development**
```bash
# Initialize project
gemini-flow init --dev

# Deploy 8-agent development swarm
gemini-flow swarm init --topology hierarchical --agents 8

# Build complete feature with tests
gemini-flow sparc tdd "implement user authentication with JWT and tests" --parallel

# Monitor progress
gemini-flow swarm monitor --live
```

### **Research & Analysis**
```bash
# Deep research with cross-validation
gemini-flow query "compare microservices vs monolith architecture" \
  --depth deep \
  --sources 15 \
  --cross-validate \
  --export-report architecture-analysis.pdf
```

### **Performance Optimization**
```bash
# System benchmarking
gemini-flow benchmark --operation routing --requests 1000 --detailed

# Database performance analysis
gemini-flow sparc run performance "optimize PostgreSQL queries for 1M users" \
  --target-latency 100ms \
  --memory-efficient
```

## 🔧 Configuration Quickstart

```bash
# Set up API key
gemini-flow config set api.key YOUR_GEMINI_API_KEY

# Configure model preferences
gemini-flow config set model.default "gemini-2.0-flash"

# Enable performance optimizations
gemini-flow config set performance.cache.enabled true
gemini-flow config set performance.parallel.max-agents 8
```

## 🚨 Troubleshooting Quick Fixes

```bash
# Problem: "Command not found"
npm install -g gemini-flow
export PATH=$PATH:$(npm config get prefix)/bin

# Problem: "API key missing"
gemini-flow config set api.key YOUR_API_KEY

# Problem: "Performance issues"
gemini-flow doctor
gemini-flow benchmark --operation cache

# Problem: "General issues"
gemini-flow health --detailed
```

## 🎓 Learning Path (5-Minute Modules)

1. **Minute 1**: `gemini-flow doctor` - System check
2. **Minute 2**: `gemini-flow init --interactive` - Setup
3. **Minute 3**: `gemini-flow query "explain quantum computing"` - First AI interaction
4. **Minute 4**: `gemini-flow swarm init --agents 3` - Multi-agent coordination
5. **Minute 5**: `gemini-flow sparc run dev "hello world API"` - Development workflow

## 🌟 Pro Tips

### **Speed Up Your Workflow**
```bash
# Create shell aliases
alias gf="gemini-flow"
alias gfs="gemini-flow swarm"
alias gfq="gemini-flow query"

# Use short commands
gf doctor
gfs init --topology mesh
gfq "latest React patterns"
```

### **Optimize Performance**
```bash
# Enable all optimizations
gemini-flow config set performance.cache.enabled true
gemini-flow config set performance.parallel.enabled true
gemini-flow config set cost.optimization.enabled true
```

### **Team Collaboration**
```bash
# Share configuration
gemini-flow config export team-config.json
gemini-flow config import team-config.json

# Collaborative memory
gemini-flow memory export shared-knowledge.json
gemini-flow memory import shared-knowledge.json --merge
```

## 📋 Command Cheat Sheet

| Command | Purpose | Example |
|---------|---------|---------|
| `doctor` | System health | `gemini-flow doctor` |
| `init` | Project setup | `gemini-flow init --dev` |
| `swarm` | Agent coordination | `gemini-flow swarm init --agents 6` |
| `query` | AI research | `gemini-flow query "topic" --depth deep` |
| `sparc` | Development workflow | `gemini-flow sparc tdd "feature"` |
| `benchmark` | Performance testing | `gemini-flow benchmark --detailed` |
| `health` | System monitoring | `gemini-flow health` |
| `memory` | Knowledge management | `gemini-flow memory store "key" "value"` |

## 🚀 Next Steps

1. **Read the full guide**: [NPM Usage Guide](./NPM_USAGE_GUIDE.md)
2. **Join the community**: [Discord](https://discord.gg/gemini-flow)
3. **Explore examples**: [GitHub Examples](https://github.com/gemini-flow/gemini-flow/tree/main/examples)
4. **Watch tutorials**: [YouTube Channel](https://youtube.com/c/geminiflow)

---

<div align="center">

**🎉 Welcome to the future of AI orchestration! 🎉**

*Start building intelligent systems in minutes, not hours.*

[![Get Started](https://img.shields.io/badge/npm%20install-gemini--flow-brightgreen?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/gemini-flow)

</div>
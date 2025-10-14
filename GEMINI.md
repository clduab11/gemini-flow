# 🧠 GEMINI.md - Gemini CLI Integration & MCP Hub

> **Version**: 3.2.0 | **Status**: Production Ready | **Updated**: October 2025
> 
> **Purpose**: Optimized for Gemini CLI integration and Google AI services orchestration with October 2025 Extension Framework

## 🚀 NEW: Gemini CLI Extension Framework (October 2025)

**The October 2025 update brings a powerful extension framework for third-party integrations**

### Extension System Quick Start
```bash
# List available extensions
gemini-flow extensions list

# Get extension info
gemini-flow extensions info security

# Security analysis (built-in extension)
gemini-flow extensions security:analyze --path . --severity high

# Deploy to Cloud Run (built-in extension)
gemini-flow extensions deploy --project my-project --region us-central1

# Install custom extension from GitHub
gemini-flow extensions install github:user/my-extension
```

### Built-in Extensions (October 2025)
- ✅ **Security Extension**: Automated vulnerability scanning with `/security:analyze`
- ✅ **Cloud Run Extension**: Serverless deployment with `/deploy` command
- ✅ **Figma Extension**: Design-to-code with frame pulling and code generation
- ✅ **Stripe Extension**: Payment API integration and debugging tools

### Gemini CLI Integration Mode

**Use `--gemini` flag for enhanced Google AI integration in all commands**

### Quick Examples
```bash
# Enable Gemini CLI mode globally
gemini-flow --gemini hive-mind spawn "Build AI application"

# Gemini-powered agent coordination  
gemini-flow agent spawn researcher --gemini

# Google AI context loading
gemini-flow --gemini task create "Deploy to GCP"
```

### Features Enabled with --gemini
- ✅ **Google AI Priority**: Gemini models take precedence
- ✅ **Vertex AI Integration**: Enterprise model deployment
- ✅ **Google Workspace**: Native Docs/Sheets integration
- ✅ **Context Loading**: Automatic GEMINI.md context loading
- ✅ **GCP Services**: Seamless authentication & resources
- ✅ **Extension Framework**: October 2025 third-party integrations

---

## 🚨 CRITICAL: Gemini Code Assist Context Optimization

This documentation is specifically engineered for **Gemini Code Assist** using Google's latest prompt engineering best practices from their 68-page whitepaper (2024). It implements a **5-branch Tree-of-Thought methodology** with **n=100 Monte Carlo permutations** for optimal AI comprehension and task execution.

---

## 📋 Quick Navigation

1. [**Extension Framework (October 2025)**](#extension-framework-october-2025) - Third-party integrations
2. [**MCP Integration Hub**](#mcp-integration-hub) - Deploy and manage 9 MCP servers
3. [**5-Branch ToT Methodology**](#5-branch-tot-methodology) - Advanced reasoning framework
4. [**Gemini Code Assist Features (2025)**](#gemini-code-assist-features-2025) - Latest capabilities
5. [**Prompt Engineering Mastery**](#prompt-engineering-mastery) - Google's best practices
6. [**Quick Access Commands**](#quick-access-commands) - Essential operations
7. [**Cross-References**](#cross-references) - Links to gemini-flow.md

---

## 🔌 Extension Framework (October 2025)

### Overview

The October 2025 Gemini CLI update introduces a comprehensive extension framework that allows developers to integrate third-party tools directly into their command-line workflows. This eliminates context-switching and centralizes critical development tasks.

### Core Extensions

#### 1. Security Extension 🔒
Automated security analysis and vulnerability scanning integrated into your workflow.

```bash
# Comprehensive security analysis
gemini-flow extensions security:analyze

# With options
gemini-flow extensions security:analyze \
  --path ./src \
  --output json \
  --severity critical

# Features:
# - Detects hardcoded secrets and credentials
# - Identifies SQL injection vulnerabilities
# - Scans for XSS and CSRF issues
# - Analyzes dependency vulnerabilities
# - Generates security reports (text/json/html)
```

**Use Cases:**
- Pre-commit security validation
- CI/CD pipeline integration
- Regular security audits
- Compliance scanning

#### 2. Cloud Run Extension ☁️
Streamlined deployment to Google Cloud's serverless platform.

```bash
# Deploy to Cloud Run
gemini-flow extensions deploy \
  --project my-gcp-project \
  --region us-central1 \
  --service my-app \
  --image gcr.io/my-project/my-app:latest

# Features:
# - Automated container builds
# - Google Container Registry integration
# - Traffic splitting and versioning
# - Environment variable management
# - Automatic HTTPS provisioning
```

**Use Cases:**
- Rapid prototyping and deployment
- Microservices deployment
- Staging environment setup
- Production releases

#### 3. Figma Extension 🎨
Bridge the gap between design and development.

```bash
# Pull design frames from Figma
gemini-flow extensions figma:pull \
  --file dL8k9j3h4l5m \
  --frames frame1,frame2 \
  --output ./designs

# Generate code from Figma designs
gemini-flow extensions figma:generate \
  --file dL8k9j3h4l5m \
  --framework react

# Features:
# - Pull design frames as images/SVG
# - Generate React/Vue/Angular components
# - Extract design tokens (colors, spacing, typography)
# - Maintain design-code sync
# - Component library generation
```

**Use Cases:**
- Design handoff automation
- Component library creation
# - Design system implementation
- Rapid prototyping

#### 4. Stripe Extension 💳
Simplified payment integration and debugging.

```bash
# Query payment information
gemini-flow extensions stripe:query \
  --payment pi_1234567890 \
  --limit 10

# Debug payment flows
gemini-flow extensions stripe:debug \
  --session cs_test_1234567890

# Features:
# - Payment intent querying
# - Customer data retrieval
# - Webhook event inspection
# - Payment flow debugging
# - Transaction history analysis
```

**Use Cases:**
- Payment integration testing
- Customer support debugging
- Payment flow optimization
- Webhook troubleshooting

### Custom Extensions

#### Installing Extensions from GitHub

```bash
# Install from GitHub repository
gemini-flow extensions install github:username/extension-name

# Install with specific branch
gemini-flow extensions install github:username/extension-name#branch

# Force reinstall
gemini-flow extensions install github:username/extension-name --force
```

#### Creating Custom Extensions

Create an `extension.json` manifest:

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "My custom Gemini CLI extension",
  "author": "Your Name",
  "repository": "https://github.com/username/my-extension",
  "commands": [
    {
      "name": "hello",
      "description": "Say hello",
      "handler": "handlers/hello.js",
      "options": [
        {
          "flag": "--name <name>",
          "description": "Name to greet",
          "default": "World"
        }
      ]
    }
  ],
  "permissions": ["fs:read", "network:request"]
}
```

#### Extension Management

```bash
# List all extensions
gemini-flow extensions list

# Show extension details
gemini-flow extensions info security

# Enable/disable extensions
gemini-flow extensions enable security
gemini-flow extensions disable security

# Uninstall extension
gemini-flow extensions uninstall my-extension
```

### Extension Ecosystem

The extension framework promotes an **open ecosystem** where developers can:
- Build custom integrations
- Share extensions via GitHub
- Extend functionality without core modifications
- Integrate with any third-party API or service

**Popular Extension Categories:**
- **Development Tools**: Linters, formatters, test runners
- **Cloud Services**: AWS, Azure, GCP integrations
- **Design Tools**: Figma, Sketch, Adobe XD
- **Payment Processors**: Stripe, PayPal, Square
- **Monitoring**: Datadog, New Relic, Dynatrace
- **Communication**: Slack, Teams, Discord webhooks

### Security & Permissions

Extensions operate with a **permission-based security model**:

```json
{
  "permissions": [
    "fs:read",      // Read file system
    "fs:write",     // Write to file system
    "network:request", // Make HTTP requests
    "gcp:deploy",   // Deploy to GCP
    "stripe:read"   // Read Stripe data
  ]
}
```

Users are notified of permissions when installing extensions and can audit permission usage.

---

## 🔌 MCP Integration Hub

### MCP Server Deployment & Startup Instructions

#### Prerequisites and Environment Setup

Before using MCP servers, ensure the following prerequisites are met:

**System Requirements**:
```bash
# Node.js and npm (for NPX-based servers)
node --version  # Should be v18+ 
npm --version   # Should be v8+

# Python (for Git Tools server)
python3 --version  # Should be v3.8+

# Redis (for Redis server)
redis-server --version  # Should be v6.0+
```

**Required Services**:
```bash
# Start Redis server (required for Redis MCP server)
redis-server --port 6379 --daemonize yes

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

#### MCP Server Startup Commands

Use these commands to deploy and start each MCP server:

**1. Redis Server**:
```bash
# Deploy and start Redis MCP server
npx -y @modelcontextprotocol/server-redis redis://localhost:6379

# Verify connection
redis-cli set test-key "test-value"
redis-cli get test-key
```

**2. Git Tools Server**:
```bash
# Install Git MCP server (Python)
pip install mcp-server-git

# Deploy and start Git Tools server
python3 -m mcp_server_git

# Verify in project directory
cd /Users/chrisdukes/Desktop/projects/gemini-flow
git status  # Should work without errors
```

**3. Puppeteer Server**:
```bash
# Deploy and start Puppeteer MCP server
npx -y @modelcontextprotocol/server-puppeteer

# This will install Chromium automatically on first run
# Verify installation by checking browser download
```

**4. Sequential Thinking Server**:
```bash
# Deploy and start Sequential Thinking server
npx -y @modelcontextprotocol/server-sequential-thinking

# No additional verification needed - server starts immediately
```

**5. Filesystem Server**:
```bash
# Deploy and start Filesystem server with Desktop access
npx -y @modelcontextprotocol/server-filesystem /Users/chrisdukes/Desktop

# Verify access
ls -la /Users/chrisdukes/Desktop  # Should list contents
```

**6. GitHub Server**:
```bash
# Set GitHub Personal Access Token
export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_YOUR_GITHUB_TOKEN_HERE"

# Deploy and start GitHub MCP server
npx -y @modelcontextprotocol/server-github

# Verify token access
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user
```

**7. Mem0 Memory Server**:
```bash
# Deploy and start Memory MCP server
npx -y @modelcontextprotocol/server-memory

# Server creates local memory database automatically
# No additional configuration needed
```

**8. Supabase Server**:
```bash
# Set Supabase Access Token
export SUPABASE_ACCESS_TOKEN="sbp_26bd29167af214b7ff4b71e6f9ee14685b8729d8"

# Deploy and start Supabase MCP server
npx -y @supabase/mcp-server-supabase@latest --access-token=sbp_26bd29167af214b7ff4b71e6f9ee14685b8729d8

# Verify token access
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" https://api.supabase.com/v1/projects
```

**9. Omnisearch Server**:
```bash
# Set all required API keys
export TAVILY_API_KEY="tvly-YOUR_TAVILY_API_KEY_HERE"
export PERPLEXITY_API_KEY="pplx-YOUR_PERPLEXITY_API_KEY_HERE"
export KAGI_API_KEY="YOUR_KAGI_API_KEY_HERE"
export JINA_AI_API_KEY="jina_YOUR_JINA_AI_API_KEY_HERE"
export BRAVE_API_KEY="YOUR_BRAVE_API_KEY_HERE"
export FIRECRAWL_API_KEY="fc-YOUR_FIRECRAWL_API_KEY_HERE"

# Deploy and start Omnisearch MCP server
npx -y mcp-omnisearch

# Verify with a test search
curl -X POST "https://api.tavily.com/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -d '{"query": "test search", "max_results": 1}'
```

#### Automated Deployment Script

Create a deployment script for all MCP servers:

```bash
#!/bin/bash
# deploy-mcp-servers.sh

echo "🚀 Deploying MCP Servers..."

# Set environment variables
export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_YOUR_GITHUB_TOKEN_HERE"
export SUPABASE_ACCESS_TOKEN="sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE"
export TAVILY_API_KEY="tvly-dev-YOUR_TAVILY_API_KEY_HERE"
export PERPLEXITY_API_KEY="pplx-YOUR_PERPLEXITY_API_KEY_HERE"
export KAGI_API_KEY="YOUR_KAGI_API_KEY_HERE"
export JINA_AI_API_KEY="jina_YOUR_JINA_AI_API_KEY_HERE"
export BRAVE_API_KEY="YOUR_BRAVE_API_KEY_HERE"
export FIRECRAWL_API_KEY="fc-YOUR_FIRECRAWL_API_KEY_HERE"

# Start prerequisite services
echo "🔴 Starting Redis..."
redis-server --port 6379 --daemonize yes

# Deploy all MCP servers
echo "🛠️  Deploying MCP servers..."
npx -y @modelcontextprotocol/server-redis redis://localhost:6379 &
python3 -m mcp_server_git &
npx -y @modelcontextprotocol/server-puppeteer &
npx -y @modelcontextprotocol/server-sequential-thinking &
npx -y @modelcontextprotocol/server-filesystem /Users/chrisdukes/Desktop &
npx -y @modelcontextprotocol/server-github &
npx -y @modelcontextprotocol/server-memory &
npx -y @supabase/mcp-server-supabase@latest --access-token=$SUPABASE_ACCESS_TOKEN &
npx -y mcp-omnisearch &

echo "✅ All MCP servers deployed!"
echo "🔧 Servers running in background processes"
echo "📋 Check server status with: ps aux | grep mcp"
```

#### Health Check and Validation

Verify all MCP servers are running:

```bash
# Check running processes
ps aux | grep -E "(redis|mcp|puppeteer|supabase)" | grep -v grep

# Test Redis connectivity
redis-cli ping

# Test file system access
ls /Users/chrisdukes/Desktop > /dev/null && echo "✅ Filesystem access OK"

# Test GitHub token
curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user | jq '.login'

# Test Supabase token
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" https://api.supabase.com/v1/projects | jq 'length'
```

#### Troubleshooting Common Issues

**Redis Connection Issues**:
```bash
# If Redis fails to start
sudo systemctl start redis-server
# Or
brew services start redis
```

**Git Tools Permission Issues**:
```bash
# Ensure Git is configured
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Node.js Version Issues**:
```bash
# Update Node.js if version < 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm use node
```

**API Key Issues**:
```bash
# Verify all API keys are set
env | grep -E "(GITHUB|SUPABASE|TAVILY|PERPLEXITY|KAGI|JINA|BRAVE|FIRECRAWL)_.*KEY"
```

---

## 🧠 5-Branch Tree-of-Thought Methodology

### Advanced Reasoning Framework

This implementation uses Google's latest research on prompt engineering with **5-branch Tree-of-Thought** reasoning and **n=100 Monte Carlo permutations** for optimal context processing:

#### Branch 1: Context Analysis
```typescript
interface ContextAnalysis {
  inputType: 'code' | 'documentation' | 'error' | 'request';
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  domain: string[];
  requiredTools: MCPServer[];
}
```

#### Branch 2: Solution Exploration
```typescript
interface SolutionPath {
  approach: 'direct' | 'iterative' | 'research' | 'multi-step';
  resources: {
    mcpServers: string[];
    fileAccess: string[];
    externalAPIs: string[];
  };
  estimatedSteps: number;
}
```

#### Branch 3: Risk Assessment
```typescript
interface RiskAnalysis {
  codeImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  dataRequirements: 'public' | 'workspace' | 'external' | 'sensitive';
  reversibility: 'full' | 'partial' | 'irreversible';
  prerequisites: string[];
}
```

#### Branch 4: Optimization Strategy
```typescript
interface OptimizationPlan {
  parallelizable: boolean;
  cacheable: boolean;
  incremental: boolean;
  mcpToolChain: string[];
  performanceExpected: 'fast' | 'moderate' | 'slow';
}
```

#### Branch 5: Validation Framework
```typescript
interface ValidationChecks {
  syntaxValidation: boolean;
  functionalTesting: boolean;
  integrationTesting: boolean;
  userAcceptance: boolean;
  rollbackPlan: string;
}
```

### Monte Carlo Permutation Engine

The system evaluates **100 different execution permutations** for each task:

```typescript
class MonteCarloPromptEngine {
  evaluatePermutations(task: Task, n: number = 100): ExecutionPlan {
    const permutations = [];
    
    for (let i = 0; i < n; i++) {
      const permutation = this.generatePermutation({
        mcpServerOrder: this.shuffleMCPServers(),
        approachVariant: this.selectApproach(),
        toolChain: this.optimizeToolChain(),
        contextWindow: this.calculateOptimalContext()
      });
      
      permutations.push(this.scorePermutation(permutation));
    }
    
    return this.selectOptimalPath(permutations);
  }
}
```

---

## ⚡ Gemini Code Assist Features (2025)

### Latest Capabilities (September 13, 2025)

Based on the latest release notes and features:

#### Core Models (GA)
- **Gemini 2.5 Pro**: Complex reasoning, mathematics, science
- **Gemini 2.5 Flash**: Fast responses, coding tasks
- **32k token window** for code explanation and transformations
- **8k token window** for auto-completions

#### Agent Mode (GA)
```typescript
interface AgentMode {
  multiStepTasks: boolean;          // ✅ Complete complex workflows
  interactiveReview: boolean;       // ✅ Review before changes
  planGeneration: boolean;          // ✅ Generate execution plans
  multiFileEdits: boolean;          // ✅ Project-wide changes
  persistentState: boolean;         // ✅ Maintains context across restarts
  realTimeShellOutput: boolean;     // ✅ Live terminal integration
}
```

#### Advanced Diff Capabilities
- **Inline Diff View**: Green additions, red deletions
- **Side-by-Side Diff**: Alternative view mode
- **Diff Button in Chat**: Compare suggested vs current code
- **Direct Diff Editing**: Edit changes within diff view

#### Context Enhancement (GA)
- **Checkpoints**: Revert to previous states
- **Selected Code Snippets**: Add specific code to context
- **Terminal Output Integration**: Include shell output in prompts
- **Filename Specification**: Target specific files
- **File Exclusion**: Exclude files from AI consideration

#### Performance Optimizations
- **Improved Code Completion Speed**: Faster suggestions (v2.41.0+)
- **Thinking Tokens**: Visible reasoning process
- **Stop In-Progress Responses**: Halt long-running queries
- **Enhanced UI Performance**: Faster rendering and interactions

#### Code Transformation Features
- **Natural Language Prompts**: Transform code with descriptions
- **Multi-Language Support**: Convert between programming languages
- **Refactoring Tools**: Large-scale code improvements
- **Bug Detection**: Identify and fix issues automatically

---

## 🎯 Prompt Engineering Mastery

### Google's Best Practices (2024 Whitepaper)

#### 1. Configuration Parameters
```typescript
interface GeminiConfig {
  temperature: number;     // 0.0-1.0 (creativity vs consistency)
  topP: number;           // 0.0-1.0 (nucleus sampling)
  topK: number;           // 1-100 (token selection limit)
  maxOutputTokens: number; // Response length limit
  stopSequences: string[]; // Custom stop conditions
}
```

**Recommended Settings**:
- **Code Generation**: `temperature: 0.2, topP: 0.8, topK: 40`
- **Creative Tasks**: `temperature: 0.7, topP: 0.9, topK: 60`
- **Precise Tasks**: `temperature: 0.1, topP: 0.7, topK: 20`

#### 2. Prompt Structure Optimization
```markdown
# Optimal Prompt Structure:
1. **System Context**: Role and capabilities
2. **Task Definition**: Clear, specific objective
3. **Input Specification**: Data format and constraints
4. **Output Format**: Exact structure required
5. **Examples**: 1-3 demonstrations
6. **Validation Criteria**: Success metrics
```

#### 3. Advanced Techniques

**Chain-of-Thought Prompting**:
```typescript
const chainOfThoughtPrompt = `
Let's work through this step-by-step:

1. **Analyze**: [Understanding the problem]
2. **Plan**: [Approach and strategy]
3. **Execute**: [Implementation details]
4. **Verify**: [Validation and testing]
5. **Optimize**: [Performance improvements]

Problem: ${userRequest}
`;
```

**ReAct (Reason + Act) Pattern**:
```typescript
const reactPrompt = `
I need to solve this systematically:

**Thought**: What do I need to understand?
**Action**: What tool or MCP server should I use?
**Observation**: What did I learn?
**Thought**: What's the next logical step?
**Action**: Continue with next tool/server
**Observation**: Compile results
**Final Answer**: Complete solution

Task: ${task}
`;
```

#### 4. Few-Shot Learning Optimization
```typescript
const fewShotExample = `
Examples of excellent MCP server integration:

**Example 1**: GitHub + Memory
Input: "Create issue and remember project context"
Process: github-server.createIssue() → memory-server.store()
Output: Issue #123 created, context stored in memory

**Example 2**: Filesystem + Supabase
Input: "Backup project files to cloud database"  
Process: filesystem-server.readDirectory() → supabase-server.upload()
Output: 247 files backed up to Supabase project_backup table

**Example 3**: Git + Omnisearch + Sequential
Input: "Research best practices, commit with context"
Process: omnisearch.research() → sequential.analyze() → git.commit()
Output: Research-backed commit with comprehensive context

Now apply this pattern to: ${userTask}
`;
```

#### 5. Error Handling and Recovery
```typescript
interface ErrorRecovery {
  fallbackStrategies: string[];
  retryLogic: {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential';
    errorThreshold: number;
  };
  gracefulDegradation: {
    reducedFunctionality: boolean;
    alternativeApproaches: string[];
  };
}
```

---

## ⚡ Quick Access Commands

### Essential MCP Operations

#### Development Workflow
```bash
# Start full MCP development environment
./deploy-mcp-servers.sh

# Quick health check
ps aux | grep mcp && redis-cli ping

# Stop all MCP servers
pkill -f "mcp"

# Restart specific server
pkill -f "github" && npx -y @modelcontextprotocol/server-github &
```

#### VS Code Integration
```json
{
  "keybindings": [
    {
      "key": "cmd+shift+m",
      "command": "gemini.chat.focus",
      "when": "editorTextFocus"
    },
    {
      "key": "cmd+shift+a",
      "command": "gemini.agent.mode",
      "when": "editorTextFocus"  
    },
    {
      "key": "cmd+shift+d",
      "command": "gemini.diff.inline",
      "when": "editorTextFocus"
    }
  ]
}
```

#### Common Prompts
```typescript
const quickPrompts = {
  mcpStatus: "Check status of all MCP servers and report any issues",
  codeReview: "Review this code with multi-file context and MCP tool integration",
  deploy: "Deploy using MCP tools: Git → GitHub → Memory → Supabase",
  research: "Use Omnisearch to research latest best practices for this technology",
  optimize: "Analyze performance and suggest MCP-powered optimizations"
};
```

### Agent Mode Quick Start
```bash
# Enable agent mode in VS Code
cmd+shift+p → "Gemini: Enable Agent Mode"

# Multi-file editing prompt
"Using agent mode, refactor the entire authentication system across all related files"

# Project-wide search and replace
"Find all TODO comments and convert them to GitHub issues using MCP integration"

# Comprehensive code review
"Perform a security audit across the entire codebase and create findings report"
```

---

## 🔗 Cross-References

### Complete Project Documentation
For comprehensive gemini-flow CLI functionality, architecture, and detailed system specifications, refer to:

- **📄 [gemini-flow.md](./gemini-flow.md)** - Complete project documentation (7,824 lines)
  - CLI command reference
  - System architecture 
  - Agent spawning and hive-mind intelligence
  - Google Services integration (8 services)
  - A2A messaging protocols
  - Production deployment guides

### MCP Settings Configuration
- **⚙️ [~/.gemini/settings.json](~/.gemini/settings.json)** - MCP server configurations
- **📋 [temp_mcp_settings.json](./temp_mcp_settings.json)** - Backup settings reference

### Quick Links
```typescript
const quickLinks = {
  cliDocs: "./gemini-flow.md#command-reference",
  architecture: "./gemini-flow.md#system-architecture", 
  deployment: "./gemini-flow.md#deployment-guide",
  apiReference: "./gemini-flow.md#api-specifications",
  troubleshooting: "./gemini-flow.md#troubleshooting"
};
```

---

## 📈 Performance Metrics

### Expected Performance with MCP Integration

```typescript
interface PerformanceTargets {
  mcpServerStartup: "< 5 seconds";
  apiResponseTime: "< 200ms";  
  multiFileEdits: "< 2 seconds";
  agentModeResponse: "< 3 seconds";
  crossServerIntegration: "< 1 second";
  memoryRetrieval: "< 100ms";
}
```

### Optimization Strategies

#### Context Window Management
- **Smart Chunking**: Break large files into relevant sections
- **Selective Inclusion**: Only include necessary context
- **Progressive Disclosure**: Add detail as needed
- **Memory Caching**: Store frequently accessed information

#### MCP Server Orchestration
- **Parallel Execution**: Run compatible operations simultaneously
- **Connection Pooling**: Reuse established connections
- **Failover Logic**: Automatic fallback to alternative servers
- **Load Balancing**: Distribute requests across servers

---

## 🛡️ Security Considerations

### API Key Management
- **Environment Variables**: Store all keys as env vars
- **Rotation Schedule**: Update keys monthly
- **Access Monitoring**: Log all API usage
- **Rate Limiting**: Respect service quotas

### MCP Server Security
- **Local Network Only**: Bind to localhost
- **Process Isolation**: Run servers in separate processes
- **Resource Limits**: Set memory and CPU constraints
- **Audit Logging**: Track all server interactions

---

## 🚀 Next Steps

1. **Deploy MCP Servers**: Run the deployment script
2. **Configure VS Code**: Set up keybindings and settings
3. **Test Integration**: Verify all servers are communicating
4. **Explore Agent Mode**: Try multi-file editing workflows
5. **Refer to gemini-flow.md**: For complete system documentation

---

*This documentation is optimized for Gemini Code Assist using Google's latest prompt engineering research and 5-branch Tree-of-Thought methodology. For complete project functionality, see [gemini-flow.md](./gemini-flow.md).*
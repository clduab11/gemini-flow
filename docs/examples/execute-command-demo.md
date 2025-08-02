# Execute Command Demo

This document demonstrates the capabilities of the new `execute` command with live code execution and AI assistance.

## Overview

The execute command provides:
- 🚀 **Live code execution** with real-time monitoring
- 🤖 **AI-powered assistance** using Gemini Code Execution API
- 🔍 **Intelligent framework detection** (FastAPI, Next.js, React, Express, Django, Flask, Vue, Svelte, Spring, .NET)
- 🧪 **Automated testing** with coverage analysis
- ⚡ **Performance optimization** suggestions
- 🛡️ **Security analysis** and safety checks
- 🚀 **Deployment preparation** guidance

## Basic Usage

### Execute with Auto-Detection
```bash
# Auto-detect framework and execute
gemini-flow execute

# Execute specific file
gemini-flow execute main.py

# Execute with live monitoring
gemini-flow execute --live
```

### Framework-Specific Execution
```bash
# FastAPI application
gemini-flow execute --framework fastapi --test-framework pytest

# Next.js application
gemini-flow execute --framework nextjs --test-framework jest

# React application with optimization
gemini-flow execute --framework react --optimize

# Express server with deployment prep
gemini-flow execute --framework express --deploy-ready
```

## Live Execution Mode

The live execution mode provides an interactive environment:

```bash
gemini-flow execute --live
```

This launches an interactive menu with options:
- ▶️ **Execute Code** - Run your application with AI monitoring
- 🧪 **Run Tests** - Execute test suite with AI analysis
- 📊 **Check Coverage** - Analyze test coverage with recommendations
- 🔍 **AI Code Review** - Get comprehensive code analysis
- ⚡ **Optimize Performance** - AI-powered performance improvements
- 🚀 **Prepare Deployment** - Production readiness checks
- 🔧 **Debug Issues** - AI-assisted debugging
- 📋 **Show Status** - Display current execution status

## Framework Support

### FastAPI Example
```python
# main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

```bash
# Execute with AI assistance
gemini-flow execute --framework fastapi --live
```

**AI Features:**
- Detects FastAPI patterns and dependencies
- Analyzes API endpoints for security issues
- Suggests performance optimizations
- Validates response models
- Checks for proper error handling

### Next.js Example
```javascript
// pages/api/hello.js
export default function handler(req, res) {
  res.status(200).json({ name: 'John Doe' })
}

// pages/index.js
export default function Home() {
  return <h1>Welcome to Next.js!</h1>
}
```

```bash
# Execute with optimization
gemini-flow execute --framework nextjs --optimize --coverage-target 90
```

**AI Features:**
- Analyzes React components for best practices
- Suggests SEO improvements
- Identifies bundle size optimization opportunities
- Validates API routes
- Checks for accessibility issues

### React Example
```jsx
// src/App.js
import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="App">
      <h1>My React App</h1>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default App;
```

```bash
# Execute with live monitoring and testing
gemini-flow execute --framework react --live --test-framework jest
```

**AI Features:**
- Analyzes React hooks usage
- Suggests performance optimizations (memoization, virtualization)
- Identifies potential memory leaks
- Validates component architecture
- Checks for proper error boundaries

## AI Analysis Examples

### Security Analysis
```bash
# Run security-focused analysis
gemini-flow execute --framework fastapi --skip-review false
```

**AI identifies:**
- SQL injection vulnerabilities
- Cross-site scripting (XSS) risks
- Authentication/authorization issues
- Input validation problems
- Sensitive data exposure

### Performance Analysis
```bash
# Run performance optimization
gemini-flow execute --optimize --framework nextjs
```

**AI suggests:**
- Database query optimizations
- Caching strategies
- Bundle size reductions
- Image optimization
- Code splitting opportunities

### Test Coverage Analysis
```bash
# Analyze test coverage with AI recommendations
gemini-flow execute --test-framework pytest --coverage-target 95
```

**AI provides:**
- Missing test scenarios
- Edge cases to test
- Integration test suggestions
- Mock strategy recommendations
- Test data generation ideas

## Advanced Options

### Emergency Mode
```bash
# Skip safety checks for urgent fixes
gemini-flow execute --emergency --skip-review
```

### Custom Output
```bash
# Save results to specific directory
gemini-flow execute --output ./execution-results --verbose
```

### Watch Mode
```bash
# Monitor file changes and re-execute
gemini-flow execute --watch --framework fastapi
```

## Integration with Gemini Code Execution API

The execute command integrates with Google's Gemini Code Execution API for:

### Real-time Code Analysis
- **Syntax validation** before execution
- **Runtime error prediction**
- **Performance bottleneck detection**
- **Security vulnerability scanning**

### Intelligent Error Resolution
```bash
# When execution fails, AI provides:
# 1. Error explanation
# 2. Root cause analysis  
# 3. Step-by-step solutions
# 4. Prevention strategies
```

### Code Generation Assistance
- **Test case generation** based on code analysis
- **Documentation generation** from code comments
- **Refactoring suggestions** with actual code examples
- **API client generation** for service interfaces

## Example Workflows

### 1. FastAPI Development Workflow
```bash
# 1. Create new FastAPI project
mkdir my-api && cd my-api
echo "from fastapi import FastAPI; app = FastAPI()" > main.py

# 2. Execute with AI assistance
gemini-flow execute --framework fastapi --live

# 3. Interactive development
# - Add endpoints with AI suggestions
# - Run tests with coverage analysis
# - Optimize performance
# - Prepare for deployment
```

### 2. React Testing Workflow
```bash
# 1. Execute with comprehensive testing
gemini-flow execute --framework react --test-framework jest --coverage-target 90

# 2. AI analyzes test results and suggests:
# - Missing component tests
# - Integration test scenarios
# - Performance test strategies
# - Accessibility test coverage
```

### 3. Deployment Preparation Workflow
```bash
# 1. Pre-deployment analysis
gemini-flow execute --deploy-ready --framework nextjs

# 2. AI validates:
# - Environment variable configuration
# - Build optimization
# - Security headers
# - Performance benchmarks
# - Health check endpoints
```

## Error Handling and Recovery

### Automatic Error Analysis
When execution fails, the AI automatically:

1. **Analyzes the error** - Understands the root cause
2. **Provides context** - Explains what went wrong
3. **Suggests solutions** - Offers specific fixes
4. **Prevents recurrence** - Recommends best practices

### Example Error Resolution
```bash
# Original error: ModuleNotFoundError: No module named 'fastapi'

# AI response:
# 📝 Error Explanation:
#   The FastAPI module is not installed in your Python environment.
# 
# 💡 Suggested Solutions:
#   1. Install FastAPI: pip install fastapi
#   2. Install with optional dependencies: pip install "fastapi[all]"
#   3. Check virtual environment activation
#   4. Verify Python version compatibility (3.7+)
```

## Configuration

### Environment Variables
```bash
# Gemini API Configuration
export GOOGLE_AI_API_KEY="your-api-key"
export GEMINI_API_KEY="your-api-key"  # Alternative

# Project Configuration
export GEMINI_FLOW_PROJECT_ID="your-project"
export GEMINI_FLOW_VERBOSE=true
export GEMINI_FLOW_CACHE_ENABLED=true
```

### Project Configuration File
```json
// .gemini-flow/config.json
{
  "execute": {
    "defaultFramework": "fastapi",
    "defaultTestFramework": "pytest",
    "coverageTarget": 80,
    "enableAIAssistance": true,
    "optimizeByDefault": false,
    "emergencyMode": false
  },
  "ai": {
    "model": "gemini-2.0-flash",
    "temperature": 0.3,
    "maxTokens": 4096
  }
}
```

## Best Practices

### 1. Start with Live Mode
Use `--live` for development to get real-time AI feedback and suggestions.

### 2. Set Appropriate Coverage Targets
Start with lower targets (70-80%) and gradually increase as your test suite matures.

### 3. Use Framework Auto-Detection
Let the command detect your framework automatically for the best experience.

### 4. Review AI Suggestions
Always review AI-generated code and suggestions before implementation.

### 5. Combine with Other Tools
Use the execute command alongside other gemini-flow features like swarm orchestration.

## Troubleshooting

### Common Issues

#### 1. Framework Not Detected
```bash
# Solution: Specify framework explicitly
gemini-flow execute --framework fastapi
```

#### 2. API Key Issues
```bash
# Solution: Set environment variable
export GOOGLE_AI_API_KEY="your-key"
```

#### 3. Test Framework Not Found
```bash
# Solution: Install test framework or specify different one
pip install pytest  # For Python
npm install jest    # For JavaScript
```

#### 4. Permission Errors
```bash
# Solution: Check file permissions and virtual environment
chmod +x main.py
source venv/bin/activate  # Linux/Mac
```

### Debug Mode
```bash
# Enable verbose logging for troubleshooting
gemini-flow execute --verbose --framework fastapi
```

This will show detailed execution logs, AI API calls, and internal processing steps.

## Conclusion

The execute command transforms code execution from a manual process into an AI-assisted, intelligent workflow. It combines the power of Google's Gemini models with practical development needs, providing real-time assistance, comprehensive analysis, and actionable insights.

Whether you're developing APIs, web applications, or complex systems, the execute command adapts to your workflow and provides the AI assistance you need to build better software faster.
# Gemini Flow Code Assist

A powerful VSCode extension that integrates Google Gemini AI with advanced multi-agent orchestration, A2A/MCP protocols, and comprehensive code assistance features.

## 🚀 Features

### Core AI Capabilities
- **Code Explanation**: Get AI-powered explanations for any code selection
- **Intelligent Refactoring**: Receive smart refactoring suggestions
- **Code Generation**: Generate code from natural language descriptions
- **Performance Optimization**: Get AI recommendations for code optimization
- **Documentation Generation**: Auto-generate comprehensive documentation
- **Security Scanning**: AI-powered security vulnerability detection

### Advanced Features
- **Multi-Agent Orchestration**: Coordinate multiple AI agents for complex tasks
- **A2A Protocol Support**: Agent-to-Agent communication for distributed processing
- **MCP Integration**: Model Context Protocol for enhanced AI capabilities
- **Real-time Code Assistance**: Live code completion and suggestions
- **Context-Aware Analysis**: Workspace and project-aware AI responses

### VSCode Integration
- **Command Palette**: Easy access to all features via command palette
- **Context Menus**: Right-click actions for quick AI assistance
- **Code Lenses**: Inline actions for functions and classes
- **Hover Information**: AI explanations on hover
- **Diagnostic Provider**: AI-powered code analysis and suggestions
- **Status Bar Integration**: Real-time extension status and quick actions

## 📦 Installation

1. Install the extension from the VSCode marketplace
2. Configure your Google Gemini API key
3. Start using AI-powered code assistance!

## ⚙️ Configuration

### Required Settings

```json
{
  "gemini-flow.apiKey": "your-gemini-api-key",
  "gemini-flow.model": "gemini-1.5-pro"
}
```

### Optional Settings

```json
{
  "gemini-flow.autoComplete": true,
  "gemini-flow.inlineDocumentation": true,
  "gemini-flow.streamingMode": true,
  "gemini-flow.contextWindow": 32768,
  "gemini-flow.a2a.enabled": false,
  "gemini-flow.mcp.enabled": false,
  "gemini-flow.swarm.enabled": false,
  "gemini-flow.security.scanEnabled": true
}
```

## 🎯 Quick Start

### 1. API Key Setup
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open VSCode settings (Ctrl/Cmd + ,)
3. Search for "gemini-flow"
4. Enter your API key in the "Api Key" field

### 2. Basic Usage
- **Explain Code**: Select code and press `Ctrl+Alt+E` (or `Cmd+Alt+E` on Mac)
- **Refactor Code**: Select code and press `Ctrl+Alt+R` (or `Cmd+Alt+R` on Mac)
- **Generate Code**: Press `Ctrl+Alt+G` (or `Cmd+Alt+G` on Mac) and describe what you want
- **Open AI Chat**: Press `Ctrl+Alt+C` (or `Cmd+Alt+C` on Mac)

### 3. Advanced Features
- Enable multi-agent orchestration in settings for complex task coordination
- Configure A2A protocol endpoints for distributed AI processing
- Set up MCP servers for enhanced AI capabilities

## 🛠️ Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `gemini-flow.explain` | Explain selected code | `Ctrl+Alt+E` |
| `gemini-flow.refactor` | Suggest refactoring | `Ctrl+Alt+R` |
| `gemini-flow.generate` | Generate code | `Ctrl+Alt+G` |
| `gemini-flow.optimize` | Optimize code | - |
| `gemini-flow.document` | Generate documentation | - |
| `gemini-flow.chat` | Open AI chat | `Ctrl+Alt+C` |
| `gemini-flow.swarm.orchestrate` | Multi-agent orchestration | - |
| `gemini-flow.security.scan` | Security scan | - |
| `gemini-flow.configure` | Open configuration | - |

## 🔧 Advanced Configuration

### Multi-Agent Orchestration
Enable swarm orchestration for complex tasks:

```json
{
  "gemini-flow.swarm.enabled": true
}
```

### A2A Protocol
Configure Agent-to-Agent communication:

```json
{
  "gemini-flow.a2a.enabled": true,
  "gemini-flow.a2a.endpoint": "ws://localhost:8080/a2a"
}
```

### MCP Integration
Set up Model Context Protocol servers:

```json
{
  "gemini-flow.mcp.enabled": true,
  "gemini-flow.mcp.servers": [
    "ws://localhost:3000",
    "http://localhost:3001/mcp"
  ]
}
```

## 🎨 Code Lenses

The extension provides intelligent code lenses for:
- **Functions**: Explain, Document, Generate Tests
- **Classes**: Analyze Structure, Refactor
- **Complex Code**: Simplify suggestions
- **File Level**: Analyze, Security Scan, Performance Analysis

## 🔍 Diagnostics

AI-powered diagnostics include:
- **Security Issues**: Vulnerability detection and fixes
- **Code Quality**: Best practice suggestions
- **Performance**: Optimization recommendations
- **Style**: Code style and formatting suggestions

## 📊 Status Bar

The status bar shows:
- Extension status (Ready, Busy, Error)
- Current AI model
- A2A/MCP connection status
- Quick access to main features

## 🚀 Performance

- **Intelligent Caching**: Responses are cached to improve performance
- **Streaming Support**: Real-time response streaming for better UX
- **Throttling**: Smart request throttling to avoid API limits
- **Context Optimization**: Efficient context gathering and transmission

## 🔒 Security & Privacy

- **Secure Storage**: API keys are stored in VSCode's secure storage
- **Local Processing**: Context gathering happens locally
- **Configurable Telemetry**: Optional usage analytics (disabled by default)
- **No Code Storage**: Your code is not stored or logged by the extension

## 🤝 Contributing

Contributions are welcome! Please see the main [gemini-flow repository](https://github.com/clduab11/gemini-flow) for contribution guidelines.

## 📄 License

This extension is part of the Gemini Flow project and is licensed under the MIT License.

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/clduab11/gemini-flow/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/clduab11/gemini-flow/discussions)
- **Documentation**: [Gemini Flow Docs](https://github.com/clduab11/gemini-flow#readme)

## 🙏 Acknowledgments

- Google Gemini AI for the powerful language model
- VSCode team for the excellent extension APIs
- The open-source community for inspiration and feedback

---

**Happy Coding with AI! 🤖✨**
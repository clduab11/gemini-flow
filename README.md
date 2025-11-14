# 🚀 Gemini-Flow

> **Quantum-Ready AI Orchestration Platform Built on Official Protocols**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-11k%2B%20Views-blue)](https://www.linkedin.com)
[![Version](https://img.shields.io/npm/v/@clduab11/gemini-flow.svg)](https://www.npmjs.com/package/@clduab11/gemini-flow)

Gemini-Flow is the first AI orchestration platform built on **Google's A2A protocol** with **quantum computing readiness**, bridging today's fragmented Google AI services with tomorrow's quantum-accelerated future.

## 🎯 What Is Gemini-Flow?

A production-ready TUI orchestrator that unifies Google's AI ecosystem through three official protocols:

- **A2A** (Agent-to-Agent): Google's protocol for agent discovery and collaboration
- **AP2** (Agent Payments): Extension of A2A for secure, verifiable transactions
- **MCP** (Model Context Protocol): Anthropic's protocol for model context management

Built for power users, Ultra members, and developers who need **more than the web UI** can provide.

---

## ✨ What Works Right Now (v1.0)

### 🤝 Protocol Implementation

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                       │
│              ┌──────────────────────┐                   │
│              │   TUI (Ink/React)    │                   │
│              └──────────┬───────────┘                   │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  ORCHESTRATION LAYER                    │
│         ┌────────────────────────────────────┐          │
│         │   Gemini 2.0 Flash Experimental   │          │
│         └──────────────┬─────────────────────┘          │
└────────────────────────┼────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   PROTOCOL LAYER                        │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐           │
│   │   A2A    │───│   AP2    │   │   MCP    │           │
│   │ (Agent-  │   │ (Agent   │   │ (Model   │           │
│   │  Agent)  │   │ Payments)│   │ Context) │           │
│   └──────────┘   └──────────┘   └──────────┘           │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   SERVICE LAYER                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Google AI  │  │  Playwright  │  │   Quantum    │    │
│  │  Services  │  │  Automation  │  │  (Circuits)  │    │
│  └────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### ✅ Implemented Features

#### **Protocols**
- ✅ **A2A Protocol**: Agent discovery, capability negotiation, task collaboration
- ✅ **AP2 Protocol**: Payment mandates (Intent, Cart, Recurring), transactions, refunds
- ✅ **MCP Integration**: 9 operational servers (Redis, GitHub, Memory, Filesystem, etc.)

#### **AI Services**
- ✅ **Gemini 2.0 Flash**: Fast multimodal generation
- ✅ **Gemini Pro**: Advanced reasoning
- ✅ **Gemini Ultra**: Premium capabilities (Ultra members)
- ✅ **Streaming Support**: Real-time response generation
- ✅ **Chat Sessions**: Contextual conversations

#### **Browser Automation** (Playwright)
- ✅ **AI Studio Ultra**: Advanced features automation
- ✅ **Google Labs Flow**: Workflow creation and execution
- ✅ **Google Labs Whisk**: Creative image generation
- ✅ **Session Management**: Persistent authentication

#### **Quantum Computing**
- ✅ **Circuit Builder**: Hadamard, Pauli, CNOT, Rotation gates
- ✅ **Pre-built Circuits**: Bell state, GHZ state, Quantum Fourier Transform
- ✅ **Backend Abstraction**: Ready for PennyLane/Qiskit integration
- ✅ **Optimization Framework**: TSP, MaxCut, VRP problem support

#### **Terminal UI**
- ✅ **Service Grid**: Visual service selection (API/Playwright/Quantum)
- ✅ **Status Dashboard**: Real-time protocol statistics
- ✅ **Workflow Visualization**: Step-by-step execution tracking
- ✅ **Keyboard Navigation**: Vim-style controls

---

## 🚀 Installation (FIXED!)

```bash
# Global installation
npm install -g @clduab11/gemini-flow

# Or via Gemini CLI
gemini extensions install https://github.com/clduab11/gemini-flow

# Verify installation
gemini-flow --version  # 1.3.3
```

### Environment Setup

```bash
# Required: Gemini API key
export GOOGLE_AI_API_KEY="your-api-key-here"

# Optional: MCP server integrations
export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"
export REDIS_URL="redis://localhost:6379"
```

---

## 💡 Quick Start

### Launch TUI

```bash
# Interactive terminal interface
gemini-flow tui
```

Navigate with:
- **1**: Services view
- **2**: Workflows view
- **3**: Status view
- **Q**: Quit

### Use as Library

```typescript
import { getProtocolManager } from '@clduab11/gemini-flow/core/protocols';
import { getGoogleAI } from '@clduab11/gemini-flow/services/google-ai';
import { executeService } from '@clduab11/gemini-flow/browser';

// Initialize protocols
const protocols = getProtocolManager();
await protocols.initialize();

// Use Gemini
const ai = getGoogleAI();
const response = await ai.generate('Explain quantum entanglement');
console.log(response);

// Use Playwright automation
const result = await executeService('ai-studio-ultra', 'generate', {
  type: 'generate',
  prompt: 'Create a research summary',
  parameters: { temperature: 0.7 }
});
```

### Quantum Circuit Example

```typescript
import { QuantumCircuitBuilder, getQuantumService } from '@clduab11/gemini-flow/services/quantum';

// Build Bell state circuit
const circuit = new QuantumCircuitBuilder({ numQubits: 2, backend: 'simulator' })
  .hadamard(0)
  .cnot(0, 1)
  .measure()
  .build();

// Execute
const quantum = getQuantumService();
const result = await quantum.executeCircuit(circuit, 1024);

console.log('Measurement counts:', result.counts);
// Output: { '00': 512, '11': 512 }
```

---

## 🌟 For Google AI Studio Ultra Members

Unlock exclusive capabilities:

| Feature | Standard | Ultra |
|---------|----------|-------|
| **Gemini Models** | Flash, Pro | Flash, Pro, **Ultra** |
| **Rate Limits** | Standard | **10x Higher** |
| **Priority Queue** | No | **Yes** |
| **Advanced Orchestration** | Basic | **Multi-agent** |
| **Quantum Preview** | Coming Soon | **Early Access** |

### Ultra-Only Features

```typescript
// Access Gemini Ultra model
const ai = getGoogleAI();
const response = await ai.chat(history, newMessage, 'ultra');

// AI Studio Ultra automation
const result = await executeService('ai-studio-ultra', 'tune', {
  type: 'tune',
  model: 'gemini-ultra',
  dataset: myData
});
```

---

## 📚 Documentation

- **[PROTOCOLS.md](./PROTOCOLS.md)**: Deep dive into A2A, AP2, and MCP implementations
- **[QUANTUM.md](./QUANTUM.md)**: Quantum computing integration guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System design decisions and patterns
- **[Browser Automation](./src/browser/README.md)**: Playwright service documentation

---

## 🏗️ Architecture Highlights

### Protocol-First Design

Every component is built on official protocols:

```typescript
// A2A: Discover agents
const agents = protocols.a2a.discoverAgents({ capabilities: ['image-generation'] });

// AP2: Create payment mandate
const mandate = protocols.ap2.mandateManager.createIntentMandate({
  value: 100,
  currency: 'USD'
});

// MCP: Start server
await protocols.mcp.serverManager.startServer('Redis');
```

### Service Orchestration

```typescript
// Combine protocols for complex workflows
const workflow = {
  steps: [
    'Discover agents via A2A',
    'Authorize payment via AP2',
    'Load context from Redis MCP',
    'Execute Gemini Flash query',
    'Optimize with quantum circuit',
    'Return results'
  ]
};
```

---

## 🔬 Quantum Computing Roadmap

### Current (v1.0)
- ✅ Quantum circuit builder
- ✅ Basic gate operations (H, X, Y, Z, CNOT, Rotations)
- ✅ Simulated execution
- ✅ Bell state, GHZ state, QFT circuits

### Coming Soon (v1.1)
- 🚧 PennyLane integration
- 🚧 Qiskit backend support
- 🚧 Quantum ML workflows
- 🚧 VQE and QAOA implementations

### Future (v2.0)
- 🔮 Google's quantum-classical hybrid models
- 🔮 Quantum advantage demonstrations
- 🔮 Production quantum optimization

---

## 🧪 Examples

### Multi-Service Orchestration

```typescript
import { launchTUI } from '@clduab11/gemini-flow/tui';
import { getProtocolManager } from '@clduab11/gemini-flow/core/protocols';

// Launch full orchestration
await getProtocolManager().initialize();
await launchTUI();
```

### A2A Agent Collaboration

```typescript
import { getA2AProtocol } from '@clduab11/gemini-flow/core/protocols/a2a';

const a2a = getA2AProtocol();

// Register custom agent
a2a.registerAgent({
  id: 'my-agent',
  name: 'Custom Analyzer',
  capabilities: [{
    id: 'analyze-data',
    name: 'Data Analysis',
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    protocols: ['A2A/1.0']
  }],
  endpoints: [{ url: 'http://localhost:3000/a2a', protocol: 'http', transport: 'json-rpc' }]
});

// Discover agents
const discovery = a2a.discoverAgents();
console.log(`Found ${discovery.total} agents`);
```

### Payment Flow (AP2)

```typescript
import { getAP2Protocol } from '@clduab11/gemini-flow/core/protocols/ap2';

const ap2 = getAP2Protocol();

// Create cart mandate
const items = [{
  id: '1',
  name: 'API Credits',
  quantity: 100,
  unitPrice: { value: 1, currency: 'USD' },
  totalPrice: { value: 100, currency: 'USD' }
}];

const mandate = ap2.mandateManager.createCartMandate(items);

// Authorize
ap2.mandateManager.authorizeMandate(mandate.id, 'user-123');

// Execute payment
const payment = await ap2.transactionManager.executePayment(
  { mandateId: mandate.id, amount: { value: 100, currency: 'USD' } },
  { id: 'user-123', type: 'USER', identifier: 'user@example.com' },
  { id: 'service', type: 'SERVICE', identifier: 'gemini-flow' }
);

console.log('Transaction:', payment.transactionId);
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/clduab11/gemini-flow.git
cd gemini-flow
npm install
```

### Project Structure

```
gemini-flow/
├── packages/
│   ├── core/
│   │   └── protocols/        # A2A, AP2, MCP implementations
│   ├── tui/                  # Terminal user interface
│   ├── services/
│   │   ├── google-ai/        # Gemini integration
│   │   └── quantum/          # Quantum circuit builder
│   └── cli/                  # Command-line interface
├── src/
│   └── browser/              # Playwright automations
├── tests/                    # Test suite
└── docs/                     # Documentation
```

---

## 📊 Project Stats

- **11,000+** LinkedIn impressions
- **25** TypeScript/React components
- **4,650+** lines of production code
- **3** official protocols implemented
- **9** MCP servers integrated
- **1** unified vision

---

## 🙏 Built With

### Official Protocols
- [A2A Protocol](https://github.com/a2aproject/A2A) - Google's Agent-to-Agent standard
- [AP2 Protocol](https://github.com/google/ap2) - Agent Payments extension
- [MCP Protocol](https://github.com/anthropics/model-context-protocol) - Anthropic's Model Context Protocol

### Technologies
- [Google Generative AI](https://ai.google.dev/) - Gemini models
- [Playwright](https://playwright.dev/) - Browser automation
- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [TypeScript](https://www.typescriptlang.org/) - Type safety

### Quantum Computing (Coming Soon)
- [PennyLane](https://pennylane.ai/) - Quantum ML
- [Qiskit](https://qiskit.org/) - IBM Quantum

---

## 📄 License

MIT © [Gemini Flow Contributors](LICENSE)

---

## 🔗 Links

- **Repository**: [github.com/clduab11/gemini-flow](https://github.com/clduab11/gemini-flow)
- **Issues**: [github.com/clduab11/gemini-flow/issues](https://github.com/clduab11/gemini-flow/issues)
- **Documentation**: [Full docs](./docs/)

---

## 💬 Support

- **Questions?** Open an [issue](https://github.com/clduab11/gemini-flow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/clduab11/gemini-flow/discussions)

---

<p align="center">
  <strong>Built for the future of AI orchestration</strong><br>
  From fragmented services to unified quantum-ready platform
</p>

<p align="center">
  <sub>Powered by A2A • AP2 • MCP protocols</sub>
</p>

# Protocol Implementation Guide

This document provides a comprehensive overview of the three official protocols implemented in Gemini-Flow: **A2A**, **AP2**, and **MCP**.

---

## Table of Contents

1. [A2A (Agent-to-Agent Protocol)](#a2a-agent-to-agent-protocol)
2. [AP2 (Agent Payments Protocol)](#ap2-agent-payments-protocol)
3. [MCP (Model Context Protocol)](#mcp-model-context-protocol)
4. [Protocol Integration Patterns](#protocol-integration-patterns)

---

## A2A (Agent-to-Agent Protocol)

### Overview

A2A is Google's official protocol for agent discovery, capability negotiation, and task collaboration. It provides a standardized way for AI agents to communicate and work together.

### Key Concepts

#### Agent Card

Every agent advertises its capabilities through an **Agent Card**:

```typescript
interface AgentCard {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: Capability[];
  endpoints: AgentEndpoint[];
  authentication?: AuthenticationScheme;
}
```

#### Capabilities

Capabilities define what an agent can do:

```typescript
interface Capability {
  id: string;
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  protocols: string[]; // e.g., ["A2A/1.0", "AP2/1.0"]
  constraints?: {
    rateLimit?: number;
    maxTokens?: number;
    requiresPayment?: boolean;
  };
}
```

### Implementation

#### 1. Agent Registration

```typescript
import { getA2AProtocol } from '@clduab11/gemini-flow/core/protocols/a2a';

const a2a = getA2AProtocol();

// Register an agent
a2a.registerAgent({
  id: 'image-generator',
  name: 'Image Generation Agent',
  description: 'Generates images using Imagen3',
  version: '1.0.0',
  capabilities: [{
    id: 'generate-image',
    name: 'Image Generation',
    description: 'Generate images from text prompts',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        style: { type: 'string' }
      },
      required: ['prompt']
    },
    outputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        metadata: { type: 'object' }
      }
    },
    protocols: ['A2A/1.0']
  }],
  endpoints: [{
    url: 'http://localhost:3000/a2a',
    protocol: 'https',
    transport: 'json-rpc'
  }]
});
```

#### 2. Agent Discovery

```typescript
// Discover all agents
const allAgents = a2a.discoverAgents();

// Find agents with specific capability
const imageAgents = a2a.discoverAgents({
  capabilities: ['generate-image']
});

console.log(`Found ${imageAgents.total} image generation agents`);
```

#### 3. Capability Negotiation

```typescript
// Negotiate terms with an agent
const negotiation = await a2a.negotiate({
  agentId: 'image-generator',
  capability: 'generate-image',
  requirements: {
    maxLatency: 5000,
    maxCost: 0.10,
    minQuality: 0.9
  }
});

if (negotiation.accepted) {
  console.log('Negotiation successful:', negotiation.terms);
} else {
  console.log('Negotiation failed:', negotiation.reason);
}
```

#### 4. Task Execution

```typescript
// Send task to agent
const taskId = await a2a.sendTask('image-generator', {
  capability: 'generate-image',
  input: {
    prompt: 'A sunset over mountains',
    style: 'photorealistic'
  },
  priority: 'normal',
  timeout: 30000
});

// Poll for task status
const status = await a2a.queryTaskStatus('image-generator', taskId);
console.log('Task status:', status.status);
console.log('Output:', status.output);
```

### Communication Protocol

A2A uses **JSON-RPC 2.0** for message exchange:

```typescript
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "task.submit",
  "params": {
    "taskId": "task-123",
    "capability": "generate-image",
    "input": { "prompt": "..." }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "taskId": "task-123",
    "status": "completed",
    "output": { "imageUrl": "..." }
  }
}
```

---

## AP2 (Agent Payments Protocol)

### Overview

AP2 extends A2A to enable secure, verifiable payment transactions between users and agents. It supports multiple payment models: one-time, cart-based, and recurring.

### Key Concepts

#### Payment Mandate

A **mandate** is authorization from a user to execute payments:

```typescript
interface PaymentMandate {
  id: string;
  type: 'INTENT' | 'CART' | 'RECURRING';
  status: MandateStatus;
  amount?: PaymentAmount;
  items?: CartItem[];
  recurrence?: RecurrenceConfig;
  verifiableCredential?: VerifiableCredential;
}
```

#### Transaction

A **transaction** represents an actual payment execution:

```typescript
interface PaymentTransaction {
  id: string;
  mandateId: string;
  amount: PaymentAmount;
  status: TransactionStatus;
  from: PaymentAccount;
  to: PaymentAccount;
  receipt?: TransactionReceipt;
}
```

### Implementation

#### 1. Intent-Based Payments

For simple, single-amount authorizations:

```typescript
import { getAP2Protocol } from '@clduab11/gemini-flow/core/protocols/ap2';

const ap2 = getAP2Protocol();

// Create intent mandate
const mandate = ap2.mandateManager.createIntentMandate({
  value: 10.00,
  currency: 'USD'
}, 3600000); // Expires in 1 hour

// User authorizes
ap2.mandateManager.authorizeMandate(mandate.id, 'user-123');

// Execute payment
const payment = await ap2.transactionManager.executePayment(
  {
    mandateId: mandate.id,
    amount: { value: 10.00, currency: 'USD' },
    description: 'Image generation service'
  },
  { id: 'user-123', type: 'USER', identifier: 'user@example.com' },
  { id: 'service', type: 'SERVICE', identifier: 'image-service' }
);

console.log('Payment complete:', payment.transactionId);
```

#### 2. Cart-Based Payments

For itemized purchases:

```typescript
// Create cart items
const items = [
  {
    id: 'item-1',
    name: 'API Credits (100)',
    quantity: 1,
    unitPrice: { value: 10.00, currency: 'USD' },
    totalPrice: { value: 10.00, currency: 'USD' }
  },
  {
    id: 'item-2',
    name: 'Premium Features',
    quantity: 1,
    unitPrice: { value: 5.00, currency: 'USD' },
    totalPrice: { value: 5.00, currency: 'USD' }
  }
];

// Create cart mandate
const cartMandate = ap2.mandateManager.createCartMandate(items);

// Authorize and execute
ap2.mandateManager.authorizeMandate(cartMandate.id, 'user-123');

const cartPayment = await ap2.transactionManager.executePayment(
  {
    mandateId: cartMandate.id,
    amount: { value: 15.00, currency: 'USD' },
    items
  },
  { id: 'user-123', type: 'USER', identifier: 'user@example.com' },
  { id: 'service', type: 'SERVICE', identifier: 'gemini-flow' }
);
```

#### 3. Recurring Payments

For subscription models:

```typescript
// Create recurring mandate
const recurringMandate = ap2.mandateManager.createRecurringMandate(
  { value: 29.99, currency: 'USD' },
  {
    frequency: 'MONTHLY',
    interval: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  }
);

// Authorize
ap2.mandateManager.authorizeMandate(recurringMandate.id, 'user-123');

// Execute first payment
const firstPayment = await ap2.transactionManager.executePayment(
  {
    mandateId: recurringMandate.id,
    amount: { value: 29.99, currency: 'USD' },
    description: 'Monthly subscription - Month 1'
  },
  { id: 'user-123', type: 'USER', identifier: 'user@example.com' },
  { id: 'service', type: 'SERVICE', identifier: 'gemini-flow' }
);
```

#### 4. Refunds

```typescript
// Refund a transaction
const refund = await ap2.transactionManager.refundTransaction({
  transactionId: payment.transactionId,
  reason: 'Customer requested refund',
  amount: { value: 10.00, currency: 'USD' } // Full or partial
});

console.log('Refund ID:', refund.refundId);
```

### Verifiable Credentials

AP2 uses **Verifiable Credentials** for proof of authorization:

```typescript
interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: Date;
  credentialSubject: {
    id: string;
    mandate: string;
    amount?: PaymentAmount;
    permissions: string[];
  };
  proof: CredentialProof;
}
```

---

## MCP (Model Context Protocol)

### Overview

MCP is Anthropic's protocol for managing model context through specialized servers. Gemini-Flow integrates 9 MCP servers for various functionalities.

### Configured Servers

1. **Redis** - Key-value storage and caching
2. **GitHub** - Repository operations
3. **Memory** - Persistent memory management
4. **Filesystem** - File operations
5. **Sequential Thinking** - Planning and reasoning
6. **Supabase** - Database operations
7. **Omnisearch** - Multi-source search
8. **Git Tools** - Git operations

### Implementation

#### 1. Server Management

```typescript
import { getMCPProtocol } from '@clduab11/gemini-flow/core/protocols/mcp';

const mcp = getMCPProtocol();

// Initialize all configured servers
await mcp.initialize();

// Check server status
const servers = mcp.serverManager.getAllServers();
servers.forEach(server => {
  console.log(`${server.name}: ${server.status}`);
});

// Start specific server
await mcp.serverManager.startServer('Redis');

// Stop server
await mcp.serverManager.stopServer('Redis');

// Restart server
await mcp.serverManager.restartServer('Redis');
```

#### 2. Server Configuration

Servers are configured in `gemini-extension.json`:

```json
{
  "mcpServers": {
    "Redis": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-redis", "redis://localhost:6379"],
      "description": "Redis MCP server for key-value storage and caching"
    },
    "GitHub": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "description": "GitHub integration MCP server"
    }
  }
}
```

#### 3. Using MCP Context

```typescript
// Store context in Redis
// (Requires Redis MCP server to be running)

// Load context
// (Implementation depends on specific MCP server)

// The MCP servers provide context to AI models
// through the standardized MCP protocol
```

---

## Protocol Integration Patterns

### Pattern 1: A2A + AP2 (Paid Agent Services)

```typescript
// 1. Discover payment-enabled agents
const paidAgents = a2a.discoverAgents({
  capabilities: ['generate-image']
}).agents.filter(agent =>
  agent.capabilities.some(cap => cap.constraints?.requiresPayment)
);

// 2. Negotiate terms
const negotiation = await a2a.negotiate({
  agentId: paidAgents[0].id,
  capability: 'generate-image',
  requirements: { maxCost: 1.00 }
});

// 3. Create payment mandate
const mandate = ap2.mandateManager.createIntentMandate({
  value: negotiation.terms!.cost,
  currency: 'USD'
});

// 4. Authorize payment
ap2.mandateManager.authorizeMandate(mandate.id, 'user-123');

// 5. Execute task
const taskId = await a2a.sendTask(paidAgents[0].id, {
  capability: 'generate-image',
  input: { prompt: 'A beautiful landscape' }
});

// 6. Process payment
await ap2.transactionManager.executePayment(
  { mandateId: mandate.id, amount: { value: negotiation.terms!.cost, currency: 'USD' } },
  userAccount,
  serviceAccount
);
```

### Pattern 2: A2A + MCP (Context-Aware Agents)

```typescript
// 1. Initialize MCP for context
await mcp.initialize();
await mcp.serverManager.startServer('Redis');
await mcp.serverManager.startServer('Memory');

// 2. Discover agents
const agents = a2a.discoverAgents({
  capabilities: ['analyze-data']
});

// 3. Send task with MCP context
// (MCP servers provide context automatically to agents that support MCP protocol)

const taskId = await a2a.sendTask(agents.agents[0].id, {
  capability: 'analyze-data',
  input: { dataset: 'sales-2024' },
  context: {
    sessionId: 'session-123',
    metadata: { source: 'redis-mcp' }
  }
});
```

### Pattern 3: Full Stack (A2A + AP2 + MCP)

```typescript
// Complete workflow using all three protocols

async function executeCompleteWorkflow() {
  // 1. MCP: Load context
  const mcp = getMCPProtocol();
  await mcp.initialize();

  // 2. A2A: Discover and negotiate
  const a2a = getA2AProtocol();
  const agents = a2a.discoverAgents({ capabilities: ['research'] });
  const negotiation = await a2a.negotiate({
    agentId: agents.agents[0].id,
    capability: 'research',
    requirements: { maxCost: 5.00 }
  });

  // 3. AP2: Handle payment
  const ap2 = getAP2Protocol();
  const mandate = ap2.mandateManager.createIntentMandate({
    value: negotiation.terms!.cost,
    currency: 'USD'
  });
  ap2.mandateManager.authorizeMandate(mandate.id, 'user-123');

  // 4. Execute task
  const taskId = await a2a.sendTask(agents.agents[0].id, {
    capability: 'research',
    input: { topic: 'Quantum computing applications' }
  });

  // 5. Process payment upon completion
  const status = await a2a.queryTaskStatus(agents.agents[0].id, taskId);
  if (status.status === 'completed') {
    await ap2.transactionManager.executePayment(
      { mandateId: mandate.id, amount: { value: negotiation.terms!.cost, currency: 'USD' } },
      { id: 'user-123', type: 'USER', identifier: 'user@example.com' },
      { id: agents.agents[0].id, type: 'AGENT', identifier: agents.agents[0].name }
    );
  }

  return status.output;
}
```

---

## Best Practices

### Security

1. **Always validate mandates** before executing payments
2. **Use HTTPS** for all agent endpoints
3. **Implement rate limiting** on agent capabilities
4. **Store credentials securely** (use environment variables)
5. **Verify agent signatures** in production

### Performance

1. **Cache agent discoveries** to reduce discovery overhead
2. **Use connection pooling** for frequent agent communication
3. **Implement circuit breakers** for failing agents
4. **Monitor task timeouts** to prevent resource leaks

### Error Handling

```typescript
try {
  const result = await a2a.sendTask(agentId, taskRequest);
} catch (error) {
  if (error.code === A2ACommunicator.ErrorCodes.AGENT_NOT_FOUND) {
    console.error('Agent not available');
  } else if (error.code === A2ACommunicator.ErrorCodes.TIMEOUT) {
    console.error('Task timed out');
  } else if (error.code === A2ACommunicator.ErrorCodes.PAYMENT_REQUIRED) {
    console.error('Payment required but not authorized');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

---

## Further Reading

- [A2A Specification](https://github.com/a2aproject/A2A)
- [AP2 Documentation](https://github.com/google/ap2)
- [MCP Protocol](https://github.com/anthropics/model-context-protocol)
- [Gemini-Flow Architecture](./ARCHITECTURE.md)

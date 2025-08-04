# Dual-Mode Architecture Documentation

## Overview

Gemini-Flow implements a sophisticated dual-mode architecture that provides:

1. **Lightweight Mode**: Simple Gemini CLI with minimal dependencies
2. **Enterprise Mode**: Full-featured platform with A2A protocols, MCP integration, and advanced capabilities
3. **Conditional Loading**: Dynamic feature activation based on environment and dependencies
4. **Graceful Degradation**: Fallback mechanisms when enterprise features are unavailable

## Architecture Principles

### 1. Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                     Gemini-Flow CLI                            │
├─────────────────────────────────────────────────────────────────┤
│                  Lightweight Core                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  Feature Flags  │  │  Simple Auth     │  │  Basic Logging  │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                Dynamic Adapter Layer                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ Adapter Loader  │  │ Protocol Bridge  │  │ Feature Gate    │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                Enterprise Features (Optional)                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  Vertex AI      │  │  Google Workspace│  │  SQLite Memory  │ │
│  │  Connector      │  │  Integration     │  │  Adapters       │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  A2A Protocol   │  │  MCP Protocol    │  │  DeepMind       │ │
│  │  Manager        │  │  Bridge          │  │  Adapter        │ │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Feature Flag System

The system uses a comprehensive feature flag mechanism:

```typescript
interface FeatureFlagConfig {
  // Enterprise adapters
  sqliteAdapters: FeatureConfig;
  vertexAi: FeatureConfig;
  googleWorkspace: FeatureConfig;
  deepmind: FeatureConfig;
  
  // Protocols
  a2aProtocol: FeatureConfig;
  mcpProtocol: FeatureConfig;
  
  // Advanced features
  quantumHybrid: FeatureConfig;
  neuralPatterns: FeatureConfig;
  swarmOrchestration: FeatureConfig;
  distributedMemory: FeatureConfig;
  
  // Performance features
  wasmOptimization: FeatureConfig;
  connectionPooling: FeatureConfig;
  caching: FeatureConfig;
}
```

### 3. Conditional Loading Strategy

#### Auto-Detection
- **Environment Variables**: `GEMINI_FLOW_VERTEXAI=true`
- **Dependency Availability**: Checks `node_modules` for optional packages
- **Configuration Files**: `.gemini-flow-features.json`
- **Package.json**: `geminiFlow.features` section

#### Loading Modes
1. **Auto**: Load if dependencies are available
2. **Manual**: Explicitly enabled by user
3. **Disabled**: Never load, even if available

#### Fallback Mechanisms
- **Vertex AI** → **Gemini API**: If Google Cloud unavailable
- **SQLite** → **In-Memory**: If SQLite dependencies missing
- **Full A2A** → **Simplified A2A**: If full implementation unavailable
- **Enterprise MCP** → **Bridge Mode**: If SDK missing

## Implementation Details

### 1. Lightweight Core (`LightweightCore`)

```typescript
export class LightweightCore extends EventEmitter {
  private loadedAdapters: Map<string, any> = new Map();
  private adapterLoaders: Map<string, AdapterLoader> = new Map();
  
  async initialize(): Promise<void> {
    // 1. Initialize authentication
    await this.initializeAuth();
    
    // 2. Load adapters based on feature flags
    await this.loadEnabledAdapters();
    
    // 3. Setup monitoring
    this.setupMonitoring();
  }
}
```

### 2. Dynamic Adapter Loader (`DynamicAdapterLoader`)

```typescript
export class DynamicAdapterLoader extends EventEmitter {
  private setupAdapterSpecs(): void {
    const adapters: AdapterSpec[] = [
      {
        name: 'Vertex AI Adapter',
        key: 'vertexai',
        modulePath: '../core/vertex-ai-connector.js',
        className: 'VertexAIConnector',
        dependencies: ['@google-cloud/vertexai'],
        featureFlag: 'vertexAi',
        required: false,
        fallback: {
          name: 'Vertex AI Fallback',
          key: 'vertexai-fallback',
          modulePath: './gemini-adapter.js',
          className: 'GeminiAdapter',
          dependencies: ['@google/generative-ai'],
          featureFlag: 'caching',
          required: false
        }
      }
      // ... more adapters
    ];
  }
}
```

### 3. Protocol Activator (`ProtocolActivator`)

```typescript
export class ProtocolActivator extends EventEmitter {
  async activateProtocol(protocolName: string): Promise<ActivationResult> {
    const config = this.protocolConfigs.get(protocolName);
    
    try {
      // Load protocol implementation
      switch (config.name) {
        case 'A2A':
          return await this.activateA2AProtocol(config, fallbacksUsed);
        case 'MCP':
          return await this.activateMCPProtocol(config, fallbacksUsed);
        case 'Hybrid':
          return await this.activateHybridProtocol(config, fallbacksUsed);
      }
    } catch (error) {
      // Try fallbacks...
    }
  }
}
```

## Usage Patterns

### 1. Basic Installation (Lightweight)

```bash
npm install @clduab11/gemini-flow
```

**Dependencies loaded**:
- `@google/generative-ai` (core)
- `chalk`, `commander`, `inquirer` (CLI)
- `winston` (logging)

**Memory footprint**: ~15-20MB
**Features available**: Basic Gemini chat, config management, simple auth

### 2. Enterprise Installation

```bash
npm install @clduab11/gemini-flow
npm run install:enterprise
```

**Additional dependencies**:
- `@google-cloud/vertexai`
- `googleapis`
- `google-auth-library`
- `better-sqlite3`

**Memory footprint**: ~50-100MB
**Features available**: Vertex AI, Google Workspace, persistent memory, advanced auth

### 3. Full Installation

```bash
npm install @clduab11/gemini-flow
npm run install:full
```

**All optional dependencies loaded**
**Memory footprint**: ~100-200MB
**Features available**: All enterprise + A2A + MCP protocols

## Configuration Examples

### 1. Environment-Based Configuration

```bash
# Enable specific features
export GEMINI_FLOW_VERTEXAI=true
export GEMINI_FLOW_GOOGLE_WORKSPACE=true
export GEMINI_FLOW_A2A_PROTOCOL=auto

# Run in enterprise mode
npm run start:enterprise
```

### 2. File-Based Configuration

`.gemini-flow-features.json`:
```json
{
  "vertexAi": {
    "enabled": true,
    "mode": "manual"
  },
  "googleWorkspace": {
    "enabled": true,
    "mode": "auto"
  },
  "sqliteAdapters": {
    "enabled": true,
    "mode": "auto",
    "fallback": true
  }
}
```

### 3. Package.json Configuration

```json
{
  "geminiFlow": {
    "mode": "dual",
    "features": {
      "vertexAi": {
        "enabled": false,
        "mode": "auto",
        "dependencies": ["@google-cloud/vertexai"]
      }
    }
  }
}
```

## Runtime Behavior

### 1. Startup Sequence

```
1. Parse CLI arguments and environment
2. Initialize feature flags system
3. Detect available dependencies
4. Load lightweight core
5. Initialize authentication
6. Load enabled adapters (conditional)
7. Activate protocols (if configured)
8. Start CLI interface
```

### 2. Feature Activation Flow

```mermaid
graph TD
    A[Feature Request] --> B{Feature Flag Enabled?}
    B -->|No| C[Return Disabled]
    B -->|Yes| D{Dependencies Available?}
    D -->|No| E{Fallback Available?}
    D -->|Yes| F[Load Primary Implementation]
    E -->|No| G[Return Error]
    E -->|Yes| H[Load Fallback Implementation]
    F --> I[Feature Active]
    H --> J[Feature Active (Degraded)]
    G --> K[Feature Unavailable]
```

### 3. Memory Management

- **Lazy Loading**: Adapters loaded only when needed
- **Memory Monitoring**: Automatic warnings for high usage
- **Graceful Degradation**: Disable features under memory pressure
- **Cleanup**: Proper shutdown of loaded adapters

## CLI Integration

### 1. Mode Detection

```bash
# Automatic mode detection
gemini-flow chat

# Explicit lightweight mode
GEMINI_FLOW_MODE=minimal gemini-flow chat

# Explicit enterprise mode
GEMINI_FLOW_MODE=enterprise gemini-flow chat
```

### 2. Feature Management

```bash
# Check feature status
gemini-flow doctor

# Enable specific feature
gemini-flow config --set features.vertexAi=true

# Install enterprise dependencies
npm run install:enterprise
```

### 3. Protocol Management

```bash
# Check protocol status
gemini-flow config --get protocols

# Activate A2A protocol
gemini-flow config --set protocols.a2a=true

# Enable MCP integration
gemini-flow config --set protocols.mcp=true
```

## Performance Characteristics

### Lightweight Mode
- **Startup Time**: 100-200ms
- **Memory Usage**: 15-20MB
- **Features**: Core Gemini functionality
- **Dependencies**: 6 packages

### Enhanced Mode (A2A/MCP)
- **Startup Time**: 300-500ms
- **Memory Usage**: 30-50MB
- **Features**: + Protocols, advanced orchestration
- **Dependencies**: 8-12 packages

### Enterprise Mode
- **Startup Time**: 500ms-1s
- **Memory Usage**: 50-100MB
- **Features**: + Google Cloud, Workspace, SQLite
- **Dependencies**: 15-25 packages

### Full Mode
- **Startup Time**: 1-2s
- **Memory Usage**: 100-200MB
- **Features**: All capabilities
- **Dependencies**: 25-35 packages

## Error Handling

### 1. Dependency Errors

```typescript
// Graceful degradation when dependencies unavailable
try {
  const adapter = await this.loadAdapter('vertexai');
} catch (error) {
  logger.warn('Vertex AI unavailable, using Gemini API fallback');
  const fallback = await this.loadAdapter('gemini');
}
```

### 2. Feature Flag Errors

```typescript
// Safe feature checking
if (featureFlags.isEnabled('vertexAi')) {
  try {
    await this.enableVertexAI();
  } catch (error) {
    featureFlags.disable('vertexAi');
    logger.error('Vertex AI failed to initialize', error);
  }
}
```

### 3. Protocol Errors

```typescript
// Protocol fallback chain
const protocols = ['Hybrid', 'A2A', 'MCP', 'Simple'];
for (const protocol of protocols) {
  try {
    await this.activateProtocol(protocol);
    break;
  } catch (error) {
    logger.warn(`Protocol ${protocol} failed:`, error.message);
  }
}
```

## Migration Paths

### From Simple to Enterprise

1. **Install Dependencies**: `npm run install:enterprise`
2. **Update Configuration**: Enable desired features
3. **Restart Application**: Features auto-detected
4. **Verify Status**: `gemini-flow doctor`

### From Enterprise to Full

1. **Install All Dependencies**: `npm run install:full`
2. **Enable Protocols**: Set A2A/MCP flags
3. **Configure Endpoints**: Set protocol URLs/ports
4. **Test Integration**: Verify protocol connectivity

## Best Practices

### 1. Development

- Use `npm run dev:lightweight` for basic development
- Use `npm run dev:enterprise` when testing enterprise features
- Always run `gemini-flow doctor` after configuration changes

### 2. Deployment

- Start with lightweight mode for minimal resource usage
- Enable features incrementally based on requirements
- Monitor memory usage in production environments

### 3. Troubleshooting

- Check `gemini-flow doctor` for system health
- Review feature flags with `gemini-flow config --get features`
- Use verbose logging: `gemini-flow --verbose chat`

## Security Considerations

### 1. Conditional Loading
- Only loads code for enabled features
- Reduces attack surface in lightweight mode
- Optional dependencies not accessible when disabled

### 2. Authentication
- Simple auth for basic mode
- Enhanced auth for enterprise features
- Protocol-specific security when active

### 3. Network Exposure
- Minimal network calls in lightweight mode
- Protocol endpoints only active when needed
- Configurable security policies per mode

## Future Enhancements

### 1. Hot Reloading
- Dynamic feature activation without restart
- Live dependency installation
- Runtime mode switching

### 2. Resource Quotas
- Per-feature memory limits
- Automatic resource management
- Priority-based feature loading

### 3. Plugin System
- Third-party adapter integration
- Custom protocol implementations
- Community feature extensions

---

This dual-mode architecture ensures Gemini-Flow remains lightweight and accessible while providing enterprise-grade capabilities when needed, with seamless transitions between modes based on user requirements and available resources.
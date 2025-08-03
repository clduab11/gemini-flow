# GeminiIntegrationService API Reference

## Overview

The `GeminiIntegrationService` is the core component responsible for managing Gemini CLI integration and context loading in gemini-flow v1.0.4. It provides a singleton interface for detecting Gemini CLI installations, loading GEMINI.md context files, and configuring the enhanced AI coordination environment.

## Class Definition

```typescript
export class GeminiIntegrationService {
  private static instance: GeminiIntegrationService;
  private logger: Logger;
  private cachedContext: GeminiContext | null = null;
  private detectionResult: GeminiDetectionResult | null = null;

  // Singleton pattern - use getInstance() to access
  public static getInstance(): GeminiIntegrationService;
  
  // Core functionality methods
  public async detectGeminiCLI(): Promise<GeminiDetectionResult>;
  public async loadGeminiContext(projectRoot?: string): Promise<GeminiContext>;
  public setupEnvironment(): void;
  public async getIntegrationStatus(): Promise<GeminiIntegrationStatus>;
  public async initialize(projectRoot?: string): Promise<GeminiInitializationResult>;
  public clearCache(): void;
}
```

## Interfaces and Types

### GeminiContext
```typescript
interface GeminiContext {
  content: string;          // Full GEMINI.md content
  loaded: boolean;          // Whether loading was successful
  timestamp: Date;          // When context was loaded
  source: 'GEMINI.md' | 'fallback'; // Source of the context
}
```

### GeminiDetectionResult
```typescript
interface GeminiDetectionResult {
  isInstalled: boolean;     // Whether Gemini CLI is installed
  version?: string;         // Detected CLI version
  path?: string;           // Installation path
  error?: string;          // Error message if detection failed
}
```

### GeminiIntegrationStatus
```typescript
interface GeminiIntegrationStatus {
  cliDetected: boolean;            // CLI installation status
  contextLoaded: boolean;          // Context loading status
  environmentConfigured: boolean;  // Environment setup status
  geminiVersion?: string;          // CLI version if detected
  contextSource?: string;          // Source of loaded context
}
```

### GeminiInitializationResult
```typescript
interface GeminiInitializationResult {
  detection: GeminiDetectionResult;
  context: GeminiContext;
  environmentConfigured: boolean;
}
```

## Methods

### getInstance()
```typescript
public static getInstance(): GeminiIntegrationService
```

**Description**: Returns the singleton instance of GeminiIntegrationService.

**Returns**: `GeminiIntegrationService` - Singleton instance

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();
```

**Thread Safety**: Yes, uses lazy initialization pattern
**Caching**: Instance is cached after first creation

---

### detectGeminiCLI()
```typescript
public async detectGeminiCLI(): Promise<GeminiDetectionResult>
```

**Description**: Detects if the official Gemini CLI is installed on the system by attempting to execute `which gemini` and `gemini --version` commands.

**Returns**: `Promise<GeminiDetectionResult>` - Detection results

**Behavior**:
- Uses system `which` command to locate Gemini CLI
- Attempts to get version information
- Caches results to avoid repeated system calls
- Falls back gracefully if CLI is not found

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();
const result = await service.detectGeminiCLI();

if (result.isInstalled) {
  console.log(`Gemini CLI found at ${result.path}, version ${result.version}`);
} else {
  console.log(`Gemini CLI not found: ${result.error}`);
}
```

**Performance**:
- **Execution Time**: 5-50ms (varies by system)
- **Timeout**: 5 seconds
- **Caching**: Results cached until service restart

**Error Handling**:
```typescript
// Detection failure scenarios
interface DetectionErrors {
  'CLI_NOT_FOUND': 'Gemini CLI not in PATH';
  'VERSION_TIMEOUT': 'Version command timed out';
  'PERMISSION_DENIED': 'Insufficient permissions';
  'SYSTEM_ERROR': 'System command execution failed';
}
```

---

### loadGeminiContext()
```typescript
public async loadGeminiContext(projectRoot?: string): Promise<GeminiContext>
```

**Description**: Loads GEMINI.md context file from the project root directory for enhanced AI coordination. Falls back to default context if file is not found.

**Parameters**:
- `projectRoot` (optional): Custom project root path. Defaults to `process.cwd()`

**Returns**: `Promise<GeminiContext>` - Loaded context information

**Behavior**:
- Searches for GEMINI.md in project root
- Reads and parses file content
- Validates content format and structure
- Caches result for 5 minutes
- Falls back to default context if file not found

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();

// Load from current directory
const context = await service.loadGeminiContext();

// Load from custom path
const customContext = await service.loadGeminiContext('/path/to/project');

console.log(`Loaded ${context.content.length} characters from ${context.source}`);
```

**Cache Behavior**:
```typescript
interface CachePolicy {
  duration: 5 * 60 * 1000; // 5 minutes
  invalidation: 'time-based' | 'manual';
  storage: 'memory';
}
```

**Fallback Context**:
When GEMINI.md is not found, the service provides a minimal fallback context containing:
- Basic command reference
- Available agent types
- Integration mode information
- Common troubleshooting tips

**Performance**:
- **File Read Time**: 1-5ms for typical GEMINI.md files
- **Parsing Time**: <1ms
- **Cache Hit**: <0.1ms
- **Memory Usage**: ~50KB per cached context

---

### setupEnvironment()
```typescript
public setupEnvironment(): void
```

**Description**: Configures environment variables required for enhanced Gemini integration mode.

**Environment Variables Set**:
```typescript
const environmentConfig = {
  GEMINI_FLOW_CONTEXT_LOADED: 'true',
  GEMINI_FLOW_MODE: 'enhanced',
  GEMINI_MODEL: 'gemini-1.5-flash'
};
```

**Behavior**:
- Only sets variables if they don't already exist
- Logs configuration changes at debug level
- Immediately available to child processes
- Idempotent - safe to call multiple times

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();
service.setupEnvironment();

// Environment variables are now available
console.log(process.env.GEMINI_FLOW_CONTEXT_LOADED); // 'true'
console.log(process.env.GEMINI_FLOW_MODE); // 'enhanced'
```

**Advanced Configuration**:
```typescript
// Additional environment variables that may be set
interface ExtendedEnvironment {
  GEMINI_FLOW_CONTEXT_SIZE?: string;     // Context file size
  GEMINI_FLOW_CONTEXT_SOURCE?: string;   // Context source path
  GEMINI_FLOW_PROJECT_ROOT?: string;     // Project root directory
  GEMINI_FLOW_CACHE_TTL?: string;        // Cache time-to-live
}
```

---

### getIntegrationStatus()
```typescript
public async getIntegrationStatus(): Promise<GeminiIntegrationStatus>
```

**Description**: Retrieves comprehensive status information about Gemini CLI integration and context loading.

**Returns**: `Promise<GeminiIntegrationStatus>` - Complete integration status

**Status Indicators**:
- **CLI Detection**: Whether official Gemini CLI is installed
- **Context Loading**: Whether GEMINI.md was successfully loaded
- **Environment**: Whether environment variables are configured
- **Version Information**: CLI version if available
- **Context Source**: Source of loaded context (file or fallback)

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();
const status = await service.getIntegrationStatus();

console.log('Integration Status:');
console.log(`CLI Detected: ${status.cliDetected}`);
console.log(`Context Loaded: ${status.contextLoaded}`);
console.log(`Environment Configured: ${status.environmentConfigured}`);

if (status.geminiVersion) {
  console.log(`Gemini Version: ${status.geminiVersion}`);
}
```

**Health Checks**:
```typescript
interface HealthChecks {
  cliAvailability: boolean;    // Can execute Gemini CLI commands
  contextValidity: boolean;    // GEMINI.md content is valid
  environmentSetup: boolean;   // Required env vars are set
  cacheHealth: boolean;        // Cache is functioning properly
}
```

**Performance Monitoring**:
```typescript
interface StatusMetrics {
  detectionTime: number;       // Time to detect CLI (ms)
  contextLoadTime: number;     // Time to load context (ms)
  cacheHitRate: number;        // Percentage of cache hits
  errorRate: number;           // Percentage of failed operations
}
```

---

### initialize()
```typescript
public async initialize(projectRoot?: string): Promise<GeminiInitializationResult>
```

**Description**: Performs complete Gemini integration initialization including CLI detection, context loading, and environment setup.

**Parameters**:
- `projectRoot` (optional): Custom project root path

**Returns**: `Promise<GeminiInitializationResult>` - Complete initialization results

**Initialization Sequence**:
1. **Parallel Detection**: CLI detection and context loading run concurrently
2. **Environment Setup**: Configure environment variables
3. **Validation**: Verify all components are properly initialized
4. **Logging**: Record initialization metrics and status

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();
const result = await service.initialize('/path/to/project');

console.log('Initialization Results:');
console.log(`CLI Detected: ${result.detection.isInstalled}`);
console.log(`Context Loaded: ${result.context.loaded}`);
console.log(`Environment Configured: ${result.environmentConfigured}`);

if (result.detection.version) {
  console.log(`CLI Version: ${result.detection.version}`);
}
```

**Error Recovery**:
```typescript
// Initialization handles partial failures gracefully
interface InitializationFailures {
  cliDetectionFailed: 'Continue with reduced functionality';
  contextLoadingFailed: 'Use fallback context';
  environmentSetupFailed: 'Manual configuration required';
}
```

**Performance Characteristics**:
```typescript
interface InitializationPerformance {
  totalTime: '50-200ms typical';
  parallelExecution: 'CLI detection + context loading';
  cacheUtilization: 'Subsequent calls use cached results';
  memoryFootprint: '4-8MB during initialization';
}
```

---

### clearCache()
```typescript
public clearCache(): void
```

**Description**: Clears all cached data including context and detection results. Useful for testing or forcing fresh data reload.

**Cleared Data**:
- Cached GEMINI.md context
- CLI detection results
- Cached environment status
- Performance metrics cache

**Example**:
```typescript
const service = GeminiIntegrationService.getInstance();

// Clear cache to force fresh reload
service.clearCache();

// Next context load will read from disk
const freshContext = await service.loadGeminiContext();
```

**Use Cases**:
- **Development**: Reload context after GEMINI.md changes
- **Testing**: Ensure clean state between tests
- **Troubleshooting**: Force refresh when data seems stale
- **Memory Management**: Reduce memory usage when context not needed

## Usage Patterns

### Basic Integration
```typescript
// Simple integration check
const service = GeminiIntegrationService.getInstance();
const status = await service.getIntegrationStatus();

if (status.cliDetected && status.contextLoaded) {
  console.log('Full Gemini integration available');
} else {
  console.log('Partial integration - some features may be limited');
}
```

### Complete Setup
```typescript
// Full initialization with error handling
const service = GeminiIntegrationService.getInstance();

try {
  const result = await service.initialize();
  
  if (result.environmentConfigured) {
    console.log('Gemini integration ready');
    // Proceed with enhanced functionality
  }
} catch (error) {
  console.warn('Integration setup failed:', error.message);
  // Fall back to standard functionality
}
```

### Context-Aware Operations
```typescript
// Load and utilize context for enhanced operations
const service = GeminiIntegrationService.getInstance();
const context = await service.loadGeminiContext();

if (context.loaded && context.source === 'GEMINI.md') {
  // Use full system context for AI operations
  await enhancedAIOperation(context.content);
} else {
  // Use basic functionality
  await standardAIOperation();
}
```

### Development Workflow
```typescript
// Development workflow with context reloading
const service = GeminiIntegrationService.getInstance();

// During development, reload context after changes
export async function reloadContext() {
  service.clearCache();
  const context = await service.loadGeminiContext();
  console.log(`Reloaded context: ${context.content.length} characters`);
  return context;
}
```

## Error Handling

### Exception Types
```typescript
class GeminiIntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

// Common error codes
enum ErrorCodes {
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  CONTEXT_READ_ERROR = 'CONTEXT_READ_ERROR',
  ENVIRONMENT_SETUP_FAILED = 'ENVIRONMENT_SETUP_FAILED',
  INITIALIZATION_TIMEOUT = 'INITIALIZATION_TIMEOUT',
  CACHE_CORRUPTION = 'CACHE_CORRUPTION'
}
```

### Error Recovery Strategies
```typescript
async function robustIntegration() {
  const service = GeminiIntegrationService.getInstance();
  
  try {
    return await service.initialize();
  } catch (error) {
    switch (error.code) {
      case 'CLI_NOT_FOUND':
        // Continue without CLI integration
        console.warn('Gemini CLI not found - using basic functionality');
        break;
        
      case 'CONTEXT_READ_ERROR':
        // Use fallback context
        service.clearCache();
        return await service.initialize();
        
      case 'INITIALIZATION_TIMEOUT':
        // Retry with longer timeout
        console.warn('Initialization timeout - retrying...');
        return await retry(() => service.initialize(), { attempts: 3 });
        
      default:
        throw error;
    }
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
interface CacheStrategy {
  contextCache: {
    duration: '5 minutes';
    invalidation: 'time-based';
    size: 'unlimited';
  };
  detectionCache: {
    duration: 'process lifetime';
    invalidation: 'manual only';
    size: '1 result';
  };
}
```

### Memory Management
```typescript
interface MemoryUsage {
  serviceInstance: '~1KB';
  cachedContext: '~50KB per project';
  detectionResult: '~1KB';
  total: '~52KB typical';
}
```

### Performance Monitoring
```typescript
// Built-in performance tracking
const service = GeminiIntegrationService.getInstance();

// Monitor initialization performance
const startTime = Date.now();
await service.initialize();
const duration = Date.now() - startTime;

console.log(`Initialization completed in ${duration}ms`);
```

## Integration with CLI Commands

### Automatic Integration
When the `--gemini` flag is used with any CLI command, the integration service is automatically invoked:

```typescript
// CLI command handler with --gemini flag
export async function handleCommandWithGemini(command: string, options: any) {
  if (options.gemini) {
    const service = GeminiIntegrationService.getInstance();
    await service.initialize();
    
    // Command execution now has enhanced context
    return await executeEnhancedCommand(command, options);
  }
  
  return await executeStandardCommand(command, options);
}
```

### Context Injection
```typescript
// Context is automatically injected into AI operations
interface EnhancedAIRequest {
  prompt: string;
  context?: string;  // Automatically populated from GEMINI.md
  model?: string;    // Optimized based on task complexity
  options?: any;
}
```

## Testing and Validation

### Unit Testing
```typescript
describe('GeminiIntegrationService', () => {
  let service: GeminiIntegrationService;
  
  beforeEach(() => {
    service = GeminiIntegrationService.getInstance();
    service.clearCache(); // Ensure clean state
  });
  
  test('should detect CLI when available', async () => {
    const result = await service.detectGeminiCLI();
    expect(result.isInstalled).toBeDefined();
  });
  
  test('should load context from existing file', async () => {
    const context = await service.loadGeminiContext('./test-fixtures');
    expect(context.loaded).toBe(true);
    expect(context.source).toBe('GEMINI.md');
  });
});
```

### Integration Testing
```typescript
describe('Gemini Integration E2E', () => {
  test('complete initialization workflow', async () => {
    const service = GeminiIntegrationService.getInstance();
    const result = await service.initialize();
    
    expect(result.detection).toBeDefined();
    expect(result.context).toBeDefined();
    expect(result.environmentConfigured).toBe(true);
  });
});
```

## Security Considerations

### File System Access
- Context loading only reads from project root and subdirectories
- No write operations performed during context loading
- File path validation prevents directory traversal attacks

### Environment Variables
- Only sets Gemini-specific environment variables
- Existing variables are never overwritten
- No sensitive information stored in environment

### CLI Execution
- Only executes known safe commands (`which`, `gemini --version`)
- Commands are executed with timeout limits
- No user input is passed to CLI commands

## Troubleshooting

### Common Issues

1. **Context Not Loading**:
   ```typescript
   // Check if GEMINI.md exists
   const fs = require('fs');
   const path = require('path');
   
   const geminiPath = path.join(process.cwd(), 'GEMINI.md');
   if (!fs.existsSync(geminiPath)) {
     console.log('GEMINI.md not found - using fallback context');
   }
   ```

2. **CLI Detection Failing**:
   ```bash
   # Check if Gemini CLI is in PATH
   which gemini
   
   # Install if missing
   npm install -g @google-ai/generativelanguage
   ```

3. **Environment Not Configured**:
   ```typescript
   // Manually verify environment setup
   const service = GeminiIntegrationService.getInstance();
   service.setupEnvironment();
   
   console.log('Environment configured:', {
     contextLoaded: process.env.GEMINI_FLOW_CONTEXT_LOADED,
     mode: process.env.GEMINI_FLOW_MODE,
     model: process.env.GEMINI_MODEL
   });
   ```

4. **Cache Issues**:
   ```typescript
   // Clear cache and reload
   const service = GeminiIntegrationService.getInstance();
   service.clearCache();
   
   const freshContext = await service.loadGeminiContext();
   console.log('Fresh context loaded:', freshContext.timestamp);
   ```

## Migration Guide

### From Previous Versions
```typescript
// v1.0.3 and earlier - manual setup
const adapter = new GeminiAdapter();
await adapter.initialize();

// v1.0.4 - automatic integration
const service = GeminiIntegrationService.getInstance();
await service.initialize(); // Handles everything automatically
```

### API Changes
- New singleton pattern for service access
- Automatic caching replaces manual cache management
- Environment setup is now automatic
- Enhanced error handling with recovery strategies

---

*The GeminiIntegrationService provides a robust, performant, and secure foundation for Gemini CLI integration in gemini-flow v1.0.4.*
# Gemini-Flow Browser Automation

This module provides Playwright-based automation for Google services that are **web-only** (no API available).

## Architecture

### API Services (GCP/API Keys)
- **Gemini API** (Flash, Pro) → Use `@google/generative-ai`
- **Vertex AI** → Use `@google-cloud/aiplatform`
- **GCP Services** → Use appropriate GCP SDKs

### Playwright Services (Web-Only)
- **AI Studio Ultra** (`https://aistudio.google.com`) → Ultra member features
- **Google Labs Flow** (`https://labs.google.com/flow`) → Workflow automation
- **Google Labs Whisk** (`https://labs.google.com/whisk`) → Creative image tool
- **Project Mariner** → Autonomous web agent (experimental)
- **NotebookLM** → AI-powered research notebook

## Usage

### Quick Start

```typescript
import { executeService, getOrchestrator } from '@clduab11/gemini-flow/browser';

// Execute AI Studio Ultra generation
const result = await executeService('ai-studio-ultra', 'generate', {
  type: 'generate',
  prompt: 'Explain quantum computing',
  parameters: {
    temperature: 0.7
  }
});

console.log(result.data);
```

### Using Specific Services

```typescript
import { AIStudioUltraService } from '@clduab11/gemini-flow/browser';

// Create service instance
const aiStudio = new AIStudioUltraService({
  headless: false, // Set to true for production
  timeout: 60000
});

// Initialize browser
await aiStudio.initialize();

// Check authentication
const authState = await aiStudio.checkAuthentication();
if (!authState.isAuthenticated) {
  await aiStudio.authenticate(); // Manual sign-in required
}

// Generate content
const response = await aiStudio.executeAction('generate', {
  type: 'generate',
  prompt: 'Write a haiku about debugging',
  parameters: {
    temperature: 0.9
  }
});

// Cleanup
await aiStudio.cleanup();
```

### Google Labs Flow

```typescript
import { LabsFlowService } from '@clduab11/gemini-flow/browser';

const flowService = new LabsFlowService();
await flowService.initialize();
await flowService.authenticate();

// Create workflow
await flowService.executeAction('create-flow', {
  type: 'create-flow',
  flowName: 'Data Processing Pipeline',
  steps: [
    { action: 'fetch-data', params: { source: 'api' } },
    { action: 'transform', params: { operation: 'normalize' } },
    { action: 'analyze', params: { model: 'gemini-flash' } }
  ]
});

// Run workflow
const result = await flowService.executeAction('run-flow', {
  type: 'run-flow',
  flowName: 'Data Processing Pipeline',
  input: { dataset: 'sales-2024' }
});

await flowService.cleanup();
```

### Google Labs Whisk

```typescript
import { LabsWhiskService } from '@clduab11/gemini-flow/browser';

const whiskService = new LabsWhiskService();
await whiskService.initialize();
await whiskService.authenticate();

// Generate image
const result = await whiskService.executeAction('generate', {
  type: 'generate',
  prompt: 'A futuristic city at sunset',
  style: 'cinematic'
});

console.log('Generated image:', result.imageUrl);

// Download image
await whiskService.downloadImage(result.imageUrl, './output.png');

await whiskService.cleanup();
```

## Service Orchestrator

The orchestrator automatically routes requests to API or Playwright services:

```typescript
import { getOrchestrator } from '@clduab11/gemini-flow/browser';

const orchestrator = getOrchestrator();

// API service (uses Gemini API)
const apiResult = await orchestrator.execute({
  service: 'gemini-flash',
  action: 'generate',
  params: { prompt: 'Hello, world!' }
});

// Playwright service (uses browser automation)
const webResult = await orchestrator.execute({
  service: 'ai-studio-ultra',
  action: 'generate',
  params: {
    type: 'generate',
    prompt: 'Explain AI to a 5-year-old'
  }
});

// List all available services
const services = orchestrator.listServices();
console.log('API services:', services.api);
console.log('Playwright services:', services.playwright);

// Cleanup when done
await orchestrator.cleanup();
```

## Authentication

### Headless Authentication
For automated workflows, save authentication state after first manual login:

```typescript
const service = new AIStudioUltraService({ headless: false });
await service.initialize();
await service.authenticate(); // Complete sign-in manually
await service.saveAuthState('./.auth/aistudio.json');
await service.cleanup();

// Later, load saved auth
const service2 = new AIStudioUltraService({ headless: true });
await service2.initialize();
await service2.loadAuthState('./.auth/aistudio.json');
// Now authenticated without manual intervention
```

### Environment Variables

```bash
# API-based services
export GOOGLE_AI_API_KEY="your-gemini-api-key"
export GOOGLE_CLOUD_PROJECT="your-gcp-project"
export GOOGLE_CLOUD_LOCATION="us-central1"

# Playwright services use browser authentication (no API keys)
```

## Configuration

All Playwright services support these options:

```typescript
interface PlaywrightServiceConfig {
  headless?: boolean;        // Default: true
  timeout?: number;          // Default: 30000ms
  viewport?: {               // Default: 1920x1080
    width: number;
    height: number;
  };
  userDataDir?: string;      // Path to saved auth state
}
```

## When to Use Which Method

| Service | Method | Why |
|---------|--------|-----|
| Gemini Flash/Pro | API | Fast, reliable, official SDK |
| Vertex AI | API | Enterprise features, full GCP integration |
| AI Studio Ultra | Playwright | Ultra-only features not in API |
| Labs Flow | Playwright | Experimental, no API available |
| Labs Whisk | Playwright | Web-only creative tool |
| Project Mariner | Playwright | Experimental agent, web-based |
| NotebookLM | Playwright | Research tool, no public API |

## Error Handling

```typescript
try {
  const result = await executeService('ai-studio-ultra', 'generate', params);

  if (result.success) {
    console.log('Result:', result.data);
  } else {
    console.error('Service error:', result.error);
  }
} catch (error) {
  console.error('Execution failed:', error.message);
}
```

## Debugging

Enable screenshots and verbose logging:

```typescript
const service = new AIStudioUltraService({ headless: false });
await service.initialize();

// Take screenshot at any point
await service.screenshot('./debug.png');

// Check page state
const page = service.getPage();
console.log('Current URL:', page?.url());
```

## Production Considerations

1. **Authentication**: Save and reuse auth states to avoid repeated logins
2. **Headless Mode**: Use `headless: true` in production for performance
3. **Timeouts**: Adjust based on your network and service speed
4. **Rate Limiting**: Implement delays between requests to avoid detection
5. **Error Recovery**: Services may change UI; implement robust selectors
6. **Resource Cleanup**: Always call `cleanup()` to prevent memory leaks

## Contributing

When adding new Playwright services:

1. Extend `PlaywrightServiceBase`
2. Implement `checkAuthentication()`, `authenticate()`, and `executeAction()`
3. Add to `services-config.ts`
4. Register in `ServiceOrchestrator.createPlaywrightService()`
5. Export from `index.ts`
6. Update this README

## License

MIT - See LICENSE file

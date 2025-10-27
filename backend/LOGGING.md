# Structured Logging with Pino

This document describes the structured logging implementation in the Gemini Flow backend using [Pino](https://getpino.io/).

## Overview

The backend uses Pino for production-ready structured logging with the following features:

- **Log Levels**: debug, info, warn, error, fatal
- **Development Mode**: Pretty-printed, colorized output
- **Production Mode**: JSON output for log aggregation
- **Request Tracking**: Unique request IDs for correlation
- **Error Serialization**: Full stack traces and error details
- **Module Loggers**: Context-aware logging per module

## Configuration

### Environment Variables

Configure logging via `.env` file:

```bash
# Log level (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info

# Environment (affects output format)
NODE_ENV=production
```

**Recommended Settings:**
- Development: `LOG_LEVEL=debug`, `NODE_ENV=development`
- Production: `LOG_LEVEL=info`, `NODE_ENV=production`

## Usage

### Basic Logging

```javascript
import { logger } from './utils/logger.js';

// Simple message
logger.info('Server started');

// With structured data
logger.info({ port: 3001, env: 'production' }, 'Server started');

// Error logging
logger.error({ err: error, userId: '123' }, 'Request failed');
```

### Module-Specific Logging

Create child loggers for different modules:

```javascript
import { createModuleLogger } from './utils/logger.js';

const logger = createModuleLogger('gemini-api');

logger.info({ requestId: 'abc123' }, 'Processing request');
logger.debug({ prompt: 'test' }, 'Built prompt');
logger.error({ err: error }, 'API request failed');
```

### Log Levels

Use appropriate log levels for different scenarios:

```javascript
// Detailed debugging info (development only)
logger.debug({ variable: value }, 'Debug information');

// General information
logger.info({ userId: '123' }, 'User logged in');

// Warning conditions
logger.warn({ retries: 3 }, 'Retry limit approaching');

// Error conditions
logger.error({ err: error }, 'Operation failed');

// Fatal errors (application crash)
logger.fatal({ err: error }, 'Application cannot continue');
```

## Request Tracking

All HTTP requests automatically get unique request IDs for correlation.

### Request ID Middleware

The `requestId` middleware:
- Checks for `X-Request-ID` header
- Generates UUID if not present
- Attaches to `req.id`
- Adds to response header

### Request Logger Middleware

The `requestLogger` middleware logs:
- Incoming requests (method, path, IP)
- Request completion (status code, duration)
- Appropriate log levels based on status code

## Output Examples

### Development Mode (Pretty Print)

```
[23:46:50 UTC] INFO: Server started
    env: "development"
    version: "1.0.0"
    port: 3001
    healthCheck: "http://localhost:3001/health"
    apiBase: "http://localhost:3001/api"

[23:47:20 UTC] INFO: Incoming request
    requestId: "12ae5ffc-edf8-44d4-95a3-b9e34ae9d29d"
    method: "GET"
    path: "/health"
    ip: "::1"
    userAgent: "curl/8.5.0"
    
[23:47:20 UTC] INFO: Request completed
    requestId: "12ae5ffc-edf8-44d4-95a3-b9e34ae9d29d"
    statusCode: 200
    duration: 4
```

### Production Mode (JSON)

```json
{"level":"info","time":1761608823254,"env":"production","version":"1.0.0","port":3001,"healthCheck":"http://localhost:3001/health","apiBase":"http://localhost:3001/api","msg":"Server started"}
{"level":"info","time":1761608840456,"requestId":"550e8400-e29b-41d4-a716-446655440000","method":"POST","path":"/api/gemini/execute","ip":"::1","msg":"Incoming request"}
{"level":"info","time":1761608840789,"requestId":"550e8400-e29b-41d4-a716-446655440000","statusCode":201,"duration":333,"msg":"Request completed"}
```

## Log Aggregation

Pino's JSON output is compatible with popular log aggregation services:

### Elasticsearch + Kibana (ELK Stack)

Stream logs to Elasticsearch:

```bash
node src/server.js | pino-elasticsearch
```

### Datadog

Use Datadog agent to collect logs:

```yaml
# datadog.yaml
logs:
  - type: file
    path: /var/log/gemini-flow.log
    service: gemini-flow-backend
    source: nodejs
```

### AWS CloudWatch

Use CloudWatch agent:

```bash
node src/server.js | aws logs put-log-events \
  --log-group-name gemini-flow \
  --log-stream-name backend
```

### Splunk

Use HTTP Event Collector:

```bash
node src/server.js | pino-splunk
```

## Performance

Pino is optimized for performance:

- **5-10x faster** than console.log in production
- **Asynchronous** by default (doesn't block event loop)
- **Minimal memory** overhead
- **Fast JSON** serialization

## Error Handling

Pino properly serializes errors with full stack traces:

```javascript
try {
  // ... operation
} catch (error) {
  logger.error({
    err: error,
    operation: 'processRequest',
    requestId: req.id
  }, 'Operation failed');
}
```

Output includes:
- Error message
- Stack trace
- Error type
- Custom context

## Best Practices

1. **Use appropriate log levels**: Don't log everything as `info`
2. **Include context**: Add request IDs, user IDs, etc.
3. **Log structured data**: Use objects for searchable fields
4. **Avoid sensitive data**: Don't log passwords, tokens, PII
5. **Use module loggers**: Create child loggers for different components
6. **Log meaningful messages**: Make messages descriptive and actionable

## Files

- `backend/src/utils/logger.js` - Core logger configuration
- `backend/src/api/middleware/requestId.js` - Request ID generation
- `backend/src/api/middleware/requestLogger.js` - HTTP request logging

## References

- [Pino Documentation](https://getpino.io/)
- [Pino Best Practices](https://getpino.io/#/docs/best-practices)
- [Log Levels](https://getpino.io/#/docs/api?id=logger-levels)
- [Child Loggers](https://getpino.io/#/docs/child-loggers)

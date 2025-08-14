# Error Response Catalog

## Overview

This comprehensive catalog documents all possible error responses across Google Services integrated with Gemini-Flow, including error codes, descriptions, resolution strategies, and prevention techniques.

## Standard Error Response Format

All API endpoints return errors in a consistent JSON format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {
      "reason": "SPECIFIC_REASON",
      "domain": "googleapis.com",
      "metadata": {
        "service": "gemini-ai",
        "method": "generateContent"
      }
    },
    "status": "HTTP_STATUS",
    "requestId": "req_1234567890abcdef",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "retryable": false,
    "retryAfter": null
  }
}
```

## Authentication Errors

### INVALID_API_KEY (401)
**Description**: The provided API key is invalid, malformed, or expired.

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key is invalid or has been revoked",
    "details": {
      "reason": "API_KEY_INVALID",
      "domain": "googleapis.com"
    },
    "status": "UNAUTHENTICATED",
    "retryable": false
  }
}
```

**Resolution Steps**:
1. Verify API key format (should start with `AIza`)
2. Check API key status in [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Regenerate API key if necessary
4. Ensure key is not expired or revoked

**Prevention**:
```typescript
// Validate API key format before use
function validateApiKey(key: string): boolean {
  return key.startsWith('AIza') && key.length >= 35;
}

// Check key status periodically
async function validateApiKeyStatus(key: string): Promise<boolean> {
  try {
    const response = await testApiCall(key);
    return true;
  } catch (error) {
    if (error.code === 'INVALID_API_KEY') {
      await notifyKeyInvalid(key);
      return false;
    }
    throw error;
  }
}
```

### PERMISSION_DENIED (403)
**Description**: The authenticated user lacks necessary permissions for the requested operation.

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "The caller does not have permission to execute the specified operation",
    "details": {
      "reason": "FORBIDDEN",
      "domain": "googleapis.com",
      "metadata": {
        "requiredPermission": "drive.files.read",
        "userEmail": "user@example.com"
      }
    },
    "status": "PERMISSION_DENIED",
    "retryable": false
  }
}
```

**Common Scenarios**:
- Service account lacks required IAM roles
- OAuth scope not granted by user
- Resource-level permissions insufficient

**Resolution Steps**:
1. **Service Account**: Check IAM roles in Google Cloud Console
2. **OAuth**: Request additional scopes in authorization flow
3. **Resource Access**: Verify file/folder permissions

**Prevention**:
```typescript
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly'
];

async function ensurePermissions(service: string, operation: string) {
  const requiredRole = getRequiredRole(service, operation);
  const hasPermission = await checkPermission(requiredRole);
  
  if (!hasPermission) {
    throw new PermissionError(
      `Missing required permission: ${requiredRole}`,
      { service, operation, requiredRole }
    );
  }
}
```

### TOKEN_EXPIRED (401)
**Description**: OAuth access token has expired and needs refresh.

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired",
    "details": {
      "reason": "ACCESS_TOKEN_EXPIRED",
      "domain": "googleapis.com"
    },
    "status": "UNAUTHENTICATED",
    "retryable": true
  }
}
```

**Auto-Recovery Implementation**:
```typescript
class TokenManager {
  async refreshTokenIfNeeded(tokens: OAuthTokens): Promise<OAuthTokens> {
    if (this.isExpired(tokens)) {
      try {
        const newTokens = await this.refreshToken(tokens.refresh_token);
        await this.storeTokens(newTokens);
        return newTokens;
      } catch (error) {
        if (error.code === 'INVALID_GRANT') {
          // Refresh token is also expired - need full re-auth
          throw new ReAuthRequiredError('Refresh token expired, full authentication required');
        }
        throw error;
      }
    }
    return tokens;
  }
}
```

## Rate Limiting Errors

### QUOTA_EXCEEDED (429)
**Description**: API quota or rate limit has been exceeded.

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Quota exceeded for requests per minute",
    "details": {
      "reason": "RATE_LIMIT_EXCEEDED",
      "domain": "googleapis.com",
      "metadata": {
        "quotaMetric": "requests_per_minute",
        "quotaLimit": "60",
        "quotaUsed": "60"
      }
    },
    "status": "RESOURCE_EXHAUSTED",
    "retryable": true,
    "retryAfter": 60
  }
}
```

**Handling Strategy**:
```typescript
async function handleRateLimitError(error: RateLimitError, operation: () => Promise<any>) {
  const retryAfter = error.retryAfter || calculateBackoffDelay(error.attempt);
  
  console.warn(`Rate limit exceeded. Retrying after ${retryAfter}s`);
  
  await sleep(retryAfter * 1000);
  return operation();
}

function calculateBackoffDelay(attempt: number): number {
  // Exponential backoff with jitter
  const base = Math.pow(2, attempt);
  const jitter = Math.random() * 0.1;
  return Math.min(base + jitter, 300); // Max 5 minutes
}
```

### RESOURCE_EXHAUSTED (429)
**Description**: Temporary resource exhaustion on Google's servers.

```json
{
  "error": {
    "code": "RESOURCE_EXHAUSTED",
    "message": "Insufficient resources to handle the request",
    "details": {
      "reason": "SERVICE_UNAVAILABLE",
      "domain": "googleapis.com"
    },
    "status": "RESOURCE_EXHAUSTED",
    "retryable": true,
    "retryAfter": 30
  }
}
```

**Recovery Pattern**:
```typescript
class ResourceExhaustionHandler {
  private backoffMultiplier = 1.5;
  private maxRetries = 5;

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'RESOURCE_EXHAUSTED' && attempt <= this.maxRetries) {
        const delay = Math.pow(this.backoffMultiplier, attempt) * 1000;
        await this.sleep(delay);
        return this.executeWithRetry(operation, attempt + 1);
      }
      throw error;
    }
  }
}
```

## Validation Errors

### INVALID_ARGUMENT (400)
**Description**: Request contains invalid parameters or malformed data.

```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Invalid value for parameter 'temperature'. Must be between 0.0 and 2.0",
    "details": {
      "reason": "INVALID_PARAMETER_VALUE",
      "domain": "googleapis.com",
      "metadata": {
        "parameter": "temperature",
        "value": "3.5",
        "validRange": "0.0-2.0"
      }
    },
    "status": "INVALID_ARGUMENT",
    "retryable": false
  }
}
```

**Parameter Validation Framework**:
```typescript
interface ValidationRule {
  parameter: string;
  validator: (value: any) => boolean | string;
  required?: boolean;
}

class RequestValidator {
  private rules = new Map<string, ValidationRule[]>();

  constructor() {
    this.setupValidationRules();
  }

  validate(endpoint: string, params: any): ValidationResult {
    const rules = this.rules.get(endpoint) || [];
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const value = params[rule.parameter];

      if (rule.required && (value === undefined || value === null)) {
        errors.push({
          parameter: rule.parameter,
          message: `Parameter '${rule.parameter}' is required`
        });
        continue;
      }

      if (value !== undefined) {
        const result = rule.validator(value);
        if (result !== true) {
          errors.push({
            parameter: rule.parameter,
            message: typeof result === 'string' ? result : `Invalid value for '${rule.parameter}'`
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private setupValidationRules(): void {
    // Gemini API validation rules
    this.rules.set('/ai/generate', [
      {
        parameter: 'model',
        required: true,
        validator: (value) => typeof value === 'string' && value.length > 0
      },
      {
        parameter: 'temperature',
        validator: (value) => {
          const num = parseFloat(value);
          return !isNaN(num) && num >= 0 && num <= 2.0 || 'Must be between 0.0 and 2.0';
        }
      },
      {
        parameter: 'maxTokens',
        validator: (value) => {
          const num = parseInt(value);
          return !isNaN(num) && num > 0 && num <= 1000000 || 'Must be between 1 and 1,000,000';
        }
      }
    ]);

    // Drive API validation rules
    this.rules.set('/workspace/drive/search', [
      {
        parameter: 'query',
        required: true,
        validator: (value) => typeof value === 'string' && value.trim().length > 0
      },
      {
        parameter: 'limit',
        validator: (value) => {
          const num = parseInt(value);
          return !isNaN(num) && num >= 1 && num <= 1000 || 'Must be between 1 and 1000';
        }
      }
    ]);
  }
}
```

### FAILED_PRECONDITION (400)
**Description**: Request cannot be processed due to unmet preconditions.

```json
{
  "error": {
    "code": "FAILED_PRECONDITION",
    "message": "Document must be in edit mode to perform this operation",
    "details": {
      "reason": "PRECONDITION_FAILED",
      "domain": "googleapis.com",
      "metadata": {
        "requiredState": "edit_mode",
        "currentState": "read_only"
      }
    },
    "status": "FAILED_PRECONDITION",
    "retryable": false
  }
}
```

## Resource Errors

### NOT_FOUND (404)
**Description**: Requested resource does not exist or is not accessible.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "File not found or you don't have access to it",
    "details": {
      "reason": "RESOURCE_NOT_FOUND",
      "domain": "googleapis.com",
      "metadata": {
        "resourceType": "file",
        "resourceId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
      }
    },
    "status": "NOT_FOUND",
    "retryable": false
  }
}
```

**Smart Error Handling**:
```typescript
async function safeResourceAccess<T>(
  resourceId: string,
  accessor: () => Promise<T>,
  fallbackStrategy?: () => Promise<T>
): Promise<T> {
  try {
    return await accessor();
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      if (fallbackStrategy) {
        console.warn(`Resource ${resourceId} not found, using fallback`);
        return fallbackStrategy();
      }
      
      // Check if resource was moved or renamed
      const alternatives = await searchSimilarResources(resourceId);
      if (alternatives.length > 0) {
        throw new ResourceMovedError('Resource may have been moved', {
          originalId: resourceId,
          alternatives
        });
      }
    }
    throw error;
  }
}
```

### ALREADY_EXISTS (409)
**Description**: Resource already exists and cannot be created.

```json
{
  "error": {
    "code": "ALREADY_EXISTS",
    "message": "A file with this name already exists in the specified location",
    "details": {
      "reason": "DUPLICATE_RESOURCE",
      "domain": "googleapis.com",
      "metadata": {
        "existingResourceId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        "conflictField": "name"
      }
    },
    "status": "ALREADY_EXISTS",
    "retryable": false
  }
}
```

## Service-Specific Errors

### Google AI/Gemini Errors

#### SAFETY_FILTER (400)
**Description**: Content was blocked by safety filters.

```json
{
  "error": {
    "code": "SAFETY_FILTER",
    "message": "Content was blocked due to safety concerns",
    "details": {
      "reason": "BLOCKED_REASON_SAFETY",
      "domain": "googleapis.com",
      "metadata": {
        "safetyCategory": "HARM_CATEGORY_HARASSMENT",
        "safetyRating": "HIGH"
      }
    },
    "status": "INVALID_ARGUMENT",
    "retryable": false
  }
}
```

**Content Moderation Framework**:
```typescript
class ContentModerator {
  async validateContent(content: string): Promise<ModerationResult> {
    const issues: SafetyIssue[] = [];
    
    // Pre-screening before sending to API
    if (this.containsExplicitContent(content)) {
      issues.push({
        category: 'EXPLICIT_CONTENT',
        severity: 'HIGH',
        suggestion: 'Remove explicit language and imagery'
      });
    }

    if (this.containsPersonalInfo(content)) {
      issues.push({
        category: 'PERSONAL_INFO',
        severity: 'MEDIUM',
        suggestion: 'Remove personal identifiable information'
      });
    }

    return {
      safe: issues.length === 0,
      issues,
      sanitizedContent: this.sanitizeContent(content, issues)
    };
  }

  handleSafetyFilterError(error: SafetyFilterError, originalPrompt: string): string {
    console.warn(`Content blocked: ${error.details.safetyCategory}`);
    
    // Attempt automatic content sanitization
    const sanitized = this.sanitizeContent(originalPrompt, [
      { category: error.details.safetyCategory, severity: 'HIGH' }
    ]);
    
    return sanitized;
  }
}
```

#### MODEL_NOT_FOUND (404)
**Description**: Specified AI model does not exist or is not available.

```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "The specified model 'gemini-invalid-model' was not found",
    "details": {
      "reason": "MODEL_UNAVAILABLE",
      "domain": "googleapis.com",
      "metadata": {
        "requestedModel": "gemini-invalid-model",
        "availableModels": ["gemini-1.5-flash", "gemini-1.5-pro"]
      }
    },
    "status": "NOT_FOUND",
    "retryable": false
  }
}
```

### Google Workspace Errors

#### DOCUMENT_LOCKED (423)
**Description**: Document is currently being edited by another user.

```json
{
  "error": {
    "code": "DOCUMENT_LOCKED",
    "message": "Document is currently locked for editing by another user",
    "details": {
      "reason": "RESOURCE_LOCKED",
      "domain": "googleapis.com",
      "metadata": {
        "lockedBy": "user@example.com",
        "lockExpiration": "2025-01-15T10:45:00.000Z"
      }
    },
    "status": "LOCKED",
    "retryable": true,
    "retryAfter": 300
  }
}
```

#### REVISION_CONFLICT (409)
**Description**: Document was modified since last read, causing a conflict.

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Document was modified by another user. Please refresh and try again",
    "details": {
      "reason": "CONCURRENT_MODIFICATION",
      "domain": "googleapis.com",
      "metadata": {
        "expectedRevision": "123",
        "actualRevision": "125",
        "lastModifiedBy": "user@example.com"
      }
    },
    "status": "ABORTED",
    "retryable": true
  }
}
```

**Conflict Resolution Strategy**:
```typescript
class DocumentConflictResolver {
  async handleRevisionConflict(
    error: RevisionConflictError,
    operation: DocumentOperation
  ): Promise<any> {
    // Fetch latest version
    const latest = await this.getLatestRevision(operation.documentId);
    
    // Try to merge changes automatically
    const mergeResult = await this.attemptAutoMerge(
      operation.changes,
      latest.content
    );

    if (mergeResult.success) {
      console.info('Auto-merge successful');
      return this.retryOperation({
        ...operation,
        revision: latest.revision,
        changes: mergeResult.mergedChanges
      });
    }

    // Manual resolution required
    throw new ManualMergeRequiredError('Manual conflict resolution needed', {
      baseRevision: operation.revision,
      latestRevision: latest.revision,
      conflicts: mergeResult.conflicts
    });
  }

  private async attemptAutoMerge(
    userChanges: DocumentChange[],
    currentContent: string
  ): Promise<MergeResult> {
    // Implement three-way merge algorithm
    // This is a simplified version - real implementation would be more complex
    return {
      success: true,
      mergedChanges: userChanges, // Simplified
      conflicts: []
    };
  }
}
```

## System Errors

### INTERNAL_ERROR (500)
**Description**: Internal server error on Google's side.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error occurred",
    "details": {
      "reason": "BACKEND_ERROR",
      "domain": "googleapis.com"
    },
    "status": "INTERNAL",
    "retryable": true,
    "retryAfter": 30
  }
}
```

### SERVICE_UNAVAILABLE (503)
**Description**: Google service is temporarily unavailable.

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service is temporarily unavailable",
    "details": {
      "reason": "SERVICE_DISABLED",
      "domain": "googleapis.com",
      "metadata": {
        "maintenanceWindow": "2025-01-15T02:00:00.000Z - 2025-01-15T04:00:00.000Z"
      }
    },
    "status": "UNAVAILABLE",
    "retryable": true,
    "retryAfter": 3600
  }
}
```

## Error Handling Framework

### Comprehensive Error Handler
```typescript
export class GoogleServiceErrorHandler {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private retryStrategies = new Map<string, RetryStrategy>();

  constructor() {
    this.setupRetryStrategies();
  }

  async handleError(error: GoogleServiceError, context: ErrorContext): Promise<any> {
    // Log error with context
    this.logError(error, context);

    // Update metrics
    this.updateErrorMetrics(error, context);

    // Check circuit breaker
    const breaker = this.getCircuitBreaker(context.service);
    if (breaker.isOpen()) {
      throw new ServiceUnavailableError(`Circuit breaker open for ${context.service}`);
    }

    // Apply retry strategy
    if (this.isRetryable(error)) {
      const strategy = this.getRetryStrategy(error.code);
      return strategy.retry(context.operation, error);
    }

    // Apply error-specific handling
    switch (error.code) {
      case 'TOKEN_EXPIRED':
        return this.handleTokenExpired(error, context);
      case 'QUOTA_EXCEEDED':
        return this.handleQuotaExceeded(error, context);
      case 'REVISION_CONFLICT':
        return this.handleRevisionConflict(error, context);
      case 'SAFETY_FILTER':
        return this.handleSafetyFilter(error, context);
      default:
        throw error;
    }
  }

  private setupRetryStrategies(): void {
    this.retryStrategies.set('QUOTA_EXCEEDED', new ExponentialBackoffStrategy({
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 300000,
      backoffMultiplier: 2
    }));

    this.retryStrategies.set('RESOURCE_EXHAUSTED', new LinearBackoffStrategy({
      maxRetries: 3,
      delay: 30000
    }));

    this.retryStrategies.set('INTERNAL_ERROR', new ExponentialBackoffStrategy({
      maxRetries: 3,
      baseDelay: 5000,
      maxDelay: 60000
    }));
  }
}
```

### Error Recovery Patterns
```typescript
abstract class ErrorRecoveryPattern {
  abstract canHandle(error: GoogleServiceError): boolean;
  abstract recover(error: GoogleServiceError, context: ErrorContext): Promise<any>;
}

class TokenRefreshPattern extends ErrorRecoveryPattern {
  canHandle(error: GoogleServiceError): boolean {
    return error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_CREDENTIALS';
  }

  async recover(error: GoogleServiceError, context: ErrorContext): Promise<any> {
    const tokenManager = context.dependencies.tokenManager;
    const newTokens = await tokenManager.refreshTokens();
    
    // Retry original operation with new tokens
    return context.operation();
  }
}

class ContentSanitizationPattern extends ErrorRecoveryPattern {
  canHandle(error: GoogleServiceError): boolean {
    return error.code === 'SAFETY_FILTER';
  }

  async recover(error: GoogleServiceError, context: ErrorContext): Promise<any> {
    const sanitized = this.sanitizeContent(context.request.prompt, error.details);
    
    return context.operation({
      ...context.request,
      prompt: sanitized
    });
  }
}
```

### Error Monitoring and Alerting
```typescript
class ErrorMonitoringSystem {
  private errorCounts = new Map<string, number>();
  private errorRates = new Map<string, number[]>();

  recordError(error: GoogleServiceError, service: string): void {
    const key = `${service}:${error.code}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Track error rate over time
    this.updateErrorRate(key);

    // Check thresholds
    this.checkAlertThresholds(service, error);
  }

  private checkAlertThresholds(service: string, error: GoogleServiceError): void {
    const errorRate = this.calculateErrorRate(service);
    
    if (errorRate > 0.1) { // 10% error rate
      this.sendAlert({
        severity: 'critical',
        service,
        errorCode: error.code,
        errorRate,
        message: `High error rate detected for ${service}: ${errorRate * 100}%`
      });
    } else if (errorRate > 0.05) { // 5% error rate
      this.sendAlert({
        severity: 'warning',
        service,
        errorCode: error.code,
        errorRate,
        message: `Elevated error rate for ${service}: ${errorRate * 100}%`
      });
    }
  }
}
```

This comprehensive error response catalog provides detailed information about all possible error conditions, their causes, and resolution strategies. The framework ensures robust error handling and automatic recovery where possible.
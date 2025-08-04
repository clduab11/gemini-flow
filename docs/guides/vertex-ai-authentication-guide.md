# Vertex AI Authentication Implementation Guide for Gemini-Flow

## Overview

This comprehensive guide documents authentication methods and integration patterns for Google Cloud Vertex AI in the gemini-flow project. Based on 2025 best practices and the latest Google Cloud authentication patterns, this guide covers OAuth2 flows, service account authentication, Application Default Credentials (ADC), and secure credential management.

## Table of Contents

1. [Authentication Methods Overview](#authentication-methods-overview)
2. [OAuth2 Authentication Flows](#oauth2-authentication-flows)
3. [Service Account vs User Account Authentication](#service-account-vs-user-account-authentication)
4. [Application Default Credentials (ADC)](#application-default-credentials-adc)
5. [Vertex AI SDK Authentication Requirements](#vertex-ai-sdk-authentication-requirements)
6. [Token Refresh Mechanisms](#token-refresh-mechanisms)
7. [Project/Location/Endpoint Configuration](#projectlocationendpoint-configuration)
8. [Security Best Practices](#security-best-practices)
9. [Implementation Examples](#implementation-examples)
10. [Troubleshooting](#troubleshooting)

## Authentication Methods Overview

Google Cloud Vertex AI supports multiple authentication methods in 2025:

### 1. **Application Default Credentials (ADC)** ⭐ *Recommended for Production*
- Automatically discovers credentials from various sources
- Most secure and flexible approach
- Works across different deployment environments

### 2. **Service Account Keys** ⚠️ *Use with Caution*
- Direct authentication using JSON key files
- Required for environments without ADC support
- Should be avoided when possible per Google's 2025 best practices

### 3. **OAuth2 User Authentication** 👤 for User-Facing Applications
- Interactive authentication for end-user applications
- Supports incremental authorization
- Includes refresh token management

### 4. **Express Mode API Keys** 🆕 *New in 2025*
- Simplified authentication for testing and development
- Limited to specific Vertex AI endpoints
- Easier setup but less secure than ADC

## OAuth2 Authentication Flows

### Standard OAuth2 Flow for User Authentication

```typescript
interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

const oauth2Flow = {
  // Required scopes for Vertex AI access
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cloud-platform' // Primary scope for Vertex AI
  ],
  
  // Enhanced scopes for enterprise tier detection
  enterpriseScopes: [
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.domain.readonly',
    'https://www.googleapis.com/auth/apps.licensing',
    'https://www.googleapis.com/auth/cloud-billing.readonly'
  ]
};
```

### OAuth2 Implementation Pattern

```typescript
export class OAuth2AuthenticationHandler {
  private oauth2Client: OAuth2Client;
  
  constructor(config: OAuth2Config) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }
  
  generateAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: oauth2Flow.scopes,
      state,
      prompt: 'consent', // Forces refresh token generation
      include_granted_scopes: true // Incremental authorization
    });
  }
  
  async exchangeCodeForTokens(code: string): Promise<Credentials> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }
}
```

## Service Account vs User Account Authentication

### Service Account Authentication (Server-to-Server)

**Use Cases:**
- Backend services and APIs
- Automated workflows
- Production deployments
- CI/CD pipelines

**Implementation:**

```typescript
interface ServiceAccountConfig {
  projectId: string;
  location: string;
  serviceAccountPath?: string;
  credentials?: {
    client_email: string;
    private_key: string;
    project_id: string;
  };
}

export class ServiceAccountAuth {
  private googleAuth: GoogleAuth;
  
  constructor(config: ServiceAccountConfig) {
    this.googleAuth = new GoogleAuth({
      keyFilename: config.serviceAccountPath,
      credentials: config.credentials,
      projectId: config.projectId,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  
  async getClient(): Promise<AuthClient> {
    return await this.googleAuth.getClient();
  }
}
```

### User Account Authentication (Interactive)

**Use Cases:**
- CLI tools requiring user consent
- Desktop applications
- Web applications with user-specific data access
- Development and testing scenarios

**Key Differences:**

| Aspect | Service Account | User Account |
|--------|----------------|--------------|
| **Authentication Flow** | Key-based or ADC | OAuth2 with consent |
| **User Interaction** | None required | User consent required |
| **Token Refresh** | Automatic | Requires refresh token |
| **Audit Trail** | Service account identity | User identity tracked |
| **Permissions** | Fixed roles/permissions | User's granted permissions |
| **Security Model** | Application-level access | User-delegated access |

## Application Default Credentials (ADC)

### ADC Discovery Order

ADC searches for credentials in this order:

1. **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS` pointing to service account key
2. **gcloud CLI**: User credentials from `gcloud auth application-default login`
3. **Google Cloud Environment**: Compute Engine, App Engine, Cloud Functions metadata
4. **Default Service Account**: When running on Google Cloud services

### ADC Implementation

```typescript
export class ADCAuthentication {
  private googleAuth: GoogleAuth;
  
  constructor(projectId: string, scopes?: string[]) {
    this.googleAuth = new GoogleAuth({
      projectId,
      scopes: scopes || ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  
  async getCredentials(): Promise<AuthClient> {
    try {
      return await this.googleAuth.getClient();
    } catch (error) {
      throw new Error(`ADC authentication failed: ${error.message}`);
    }
  }
  
  async getProjectId(): Promise<string> {
    return await this.googleAuth.getProjectId();
  }
}
```

### Environment-Specific ADC Setup

#### Local Development
```bash
# Install gcloud CLI
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

#### Google Cloud Environments
```typescript
// ADC automatically uses attached service account
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});
```

#### Docker/Container Environments
```dockerfile
# Set environment variable pointing to mounted service account key
ENV GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Vertex AI SDK Authentication Requirements

### Required Configuration Parameters

```typescript
interface VertexAIConfig {
  projectId: string;          // Google Cloud Project ID
  location: string;           // Region (e.g., 'us-central1', 'global')
  credentials?: any;          // Service account credentials
  apiEndpoint?: string;       // Custom endpoint (optional)
}
```

### Environment Variables

```bash
# Primary configuration
export GOOGLE_VERTEX_PROJECT="your-project-id"
export GOOGLE_VERTEX_LOCATION="us-central1"

# Authentication
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Optional: Custom endpoint
export VERTEX_AI_ENDPOINT="https://us-central1-aiplatform.googleapis.com"
```

### SDK Initialization Patterns

#### Python SDK
```python
import vertexai
from google.oauth2 import service_account

# Method 1: ADC (Recommended)
vertexai.init(project='PROJECT_ID', location='us-central1')

# Method 2: Service Account Key
credentials = service_account.Credentials.from_service_account_file(
    '/path/to/service-account-key.json',
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)
vertexai.init(project='PROJECT_ID', location='us-central1', credentials=credentials)

# Method 3: Global Endpoint (2025 Update)
vertexai.init(project='PROJECT_ID', location='global')
```

#### Node.js SDK
```typescript
import { VertexAI } from '@google-cloud/vertexai';

// Method 1: ADC
const vertexAI = new VertexAI({
  project: 'PROJECT_ID',
  location: 'us-central1'
});

// Method 2: Service Account Credentials
const vertexAI = new VertexAI({
  project: 'PROJECT_ID',
  location: 'us-central1',
  credentials: {
    client_email: 'service-account@project.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
  }
});
```

### 2025 Important Updates

#### Express Mode Authentication (New)
```typescript
// For testing and development
const expressConfig = {
  apiKey: 'your-api-key-here',
  endpoint: 'https://generativelanguage.googleapis.com'
};

// Note: Express mode has limitations and is not recommended for production
```

#### Model Availability Restrictions
- **Important**: Starting April 29, 2025, Gemini 1.5 Pro and Gemini 1.5 Flash are not available in projects without prior usage
- New projects must use alternative models or request access

## Token Refresh Mechanisms

### Token Expiration Handling

```typescript
export class TokenManager {
  private tokens: Credentials;
  private oauth2Client: OAuth2Client;
  
  async refreshTokensIfNeeded(): Promise<Credentials> {
    if (this.isTokenExpired()) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.tokens = credentials;
        this.saveTokensSecurely(credentials);
        return credentials;
      } catch (error) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }
    }
    return this.tokens;
  }
  
  private isTokenExpired(): boolean {
    if (!this.tokens.expiry_date) return true;
    const buffer = 5 * 60 * 1000; // 5-minute buffer
    return Date.now() >= (this.tokens.expiry_date - buffer);
  }
  
  private async saveTokensSecurely(tokens: Credentials): Promise<void> {
    // Implement secure storage (encrypted cache, secure keystore, etc.)
    // Never store in plain text files or environment variables
  }
}
```

### Automatic Token Refresh

```typescript
export class AutoRefreshClient {
  private client: AuthClient;
  private refreshPromise?: Promise<AuthClient>;
  
  async getAuthenticatedClient(): Promise<AuthClient> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    if (this.needsRefresh()) {
      this.refreshPromise = this.refreshClient();
      try {
        this.client = await this.refreshPromise;
      } finally {
        this.refreshPromise = undefined;
      }
    }
    
    return this.client;
  }
  
  private async refreshClient(): Promise<AuthClient> {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    return await auth.getClient();
  }
}
```

### Token Refresh Best Practices

1. **Proactive Refresh**: Refresh tokens before they expire (5-minute buffer)
2. **Handle Refresh Failures**: Implement fallback authentication
3. **Avoid Race Conditions**: Use promise-based refresh coordination
4. **Secure Token Storage**: Never store refresh tokens in plain text
5. **Monitor Token Usage**: Track refresh patterns for security analysis

## Project/Location/Endpoint Configuration

### Project Configuration

```typescript
interface ProjectConfig {
  projectId: string;           // Required: Google Cloud Project ID
  location: string;            // Required: Deployment region
  apiEndpoint?: string;        // Optional: Custom endpoint
  quotaProjectId?: string;     // Optional: Separate project for quota
}

const projectSetup = {
  // Standard configuration
  standard: {
    projectId: 'my-ai-project',
    location: 'us-central1'
  },
  
  // Global endpoint (improved availability)
  global: {
    projectId: 'my-ai-project',
    location: 'global' // New in 2025
  },
  
  // Multi-region setup
  multiRegion: {
    primary: { projectId: 'my-ai-project', location: 'us-central1' },
    fallback: { projectId: 'my-ai-project', location: 'us-west1' }
  }
};
```

### Location Selection Guidelines

#### Recommended Locations (2025)

| Location | Use Case | Benefits |
|----------|----------|----------|
| `global` | Production with high availability | Auto-routing, reduced 429 errors |
| `us-central1` | North America deployment | Low latency for US users |
| `europe-west1` | European deployment | GDPR compliance, EU data residency |
| `asia-northeast1` | Asia-Pacific deployment | Low latency for Asian users |

### Endpoint Configuration

```typescript
export class EndpointManager {
  private endpoints = {
    standard: (location: string) => 
      `https://${location}-aiplatform.googleapis.com`,
    express: () => 
      'https://generativelanguage.googleapis.com',
    global: () => 
      'https://aiplatform.googleapis.com'
  };
  
  getEndpoint(location: string, mode: 'standard' | 'express' | 'global' = 'standard'): string {
    switch (mode) {
      case 'express':
        return this.endpoints.express();
      case 'global':
        return this.endpoints.global();
      default:
        return this.endpoints.standard(location);
    }
  }
}
```

## Security Best Practices

### 1. Credential Storage Security

**❌ Never Do:**
```typescript
// DON'T: Store credentials in environment variables
process.env.SERVICE_ACCOUNT_KEY = JSON.stringify(credentials);

// DON'T: Embed credentials in source code
const credentials = {
  "type": "service_account",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  // ...
};

// DON'T: Store in plain text files
fs.writeFileSync('credentials.json', JSON.stringify(credentials));
```

**✅ Best Practices:**
```typescript
// DO: Use secure key management systems
export class SecureCredentialManager {
  async getCredentials(): Promise<ServiceAccountCredentials> {
    // Method 1: Google Cloud Secret Manager
    const [secret] = await secretManagerClient.accessSecretVersion({
      name: 'projects/PROJECT_ID/secrets/vertex-ai-credentials/versions/latest'
    });
    
    return JSON.parse(secret.payload?.data?.toString() || '{}');
  }
  
  // Method 2: Encrypted storage with Cloud KMS
  async getEncryptedCredentials(): Promise<ServiceAccountCredentials> {
    const encryptedData = await this.loadFromSecureStorage();
    const decryptedData = await this.decryptWithKMS(encryptedData);
    return JSON.parse(decryptedData);
  }
}
```

### 2. Access Control and Permissions

```typescript
// Implement least-privilege access
const serviceAccountRoles = [
  'roles/aiplatform.user',           // Vertex AI access
  'roles/storage.objectViewer',      // Read model artifacts
  'roles/logging.logWriter'          // Write logs
  // Avoid: roles/owner, roles/editor (too broad)
];

// Use IAM conditions for additional security
const iamCondition = {
  title: 'Time-based access',
  description: 'Access only during business hours',
  expression: 'request.time.getHours() >= 9 && request.time.getHours() <= 17'
};
```

### 3. Network Security

```typescript
export class NetworkSecurityConfig {
  // VPC-native configuration
  vpcConfig = {
    network: 'projects/PROJECT_ID/global/networks/ai-network',
    subnet: 'projects/PROJECT_ID/regions/us-central1/subnetworks/ai-subnet',
    enablePrivateGoogleAccess: true
  };
  
  // Private Service Connect (PSC) for secure access
  pscConfig = {
    endpoint: 'https://100.100.10.10', // Private IP
    certificate: '/path/to/ca-cert.pem'
  };
  
  // Firewall rules for Vertex AI access
  firewallRules = [
    {
      name: 'allow-vertex-ai-outbound',
      direction: 'EGRESS',
      targetTags: ['vertex-ai-client'],
      allowed: [
        { IPProtocol: 'tcp', ports: ['443'] }
      ],
      destinationRanges: ['199.36.153.4/30'] // Google APIs
    }
  ];
}
```

### 4. Audit and Monitoring

```typescript
export class SecurityAuditor {
  async setupAuditLogging(): Promise<void> {
    // Enable Cloud Audit Logs
    const auditConfig = {
      service: 'aiplatform.googleapis.com',
      auditLogConfigs: [
        {
          logType: 'ADMIN_READ',
          exemptedMembers: []
        },
        {
          logType: 'DATA_READ',
          exemptedMembers: []
        },
        {
          logType: 'DATA_WRITE',
          exemptedMembers: []
        }
      ]
    };
  }
  
  async monitorSecurityEvents(): Promise<void> {
    // Monitor for suspicious authentication patterns
    const alertingPolicy = {
      displayName: 'Vertex AI Authentication Anomalies',
      conditions: [
        {
          displayName: 'Failed authentication attempts',
          conditionThreshold: {
            filter: 'resource.type="aiplatform.googleapis.com/Model" AND severity="ERROR"',
            comparison: 'COMPARISON_GREATER_THAN',
            thresholdValue: 10
          }
        }
      ]
    };
  }
}
```

### 5. Key Rotation and Lifecycle Management

```typescript
export class KeyLifecycleManager {
  async rotateServiceAccountKey(): Promise<void> {
    try {
      // Generate new key
      const newKey = await this.createNewServiceAccountKey();
      
      // Update applications with new key
      await this.updateApplicationCredentials(newKey);
      
      // Wait for propagation
      await this.waitForPropagation(30000);
      
      // Verify new key works
      await this.verifyKeyFunctionality(newKey);
      
      // Delete old key
      await this.deleteOldServiceAccountKey();
      
      // Log rotation event
      this.auditLogger.info('Service account key rotated successfully');
      
    } catch (error) {
      this.auditLogger.error('Key rotation failed', error);
      throw error;
    }
  }
  
  async setKeyExpiration(keyId: string, expirationDays: number): Promise<void> {
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + expirationDays);
    
    // Schedule automatic key rotation before expiration
    await this.scheduleKeyRotation(keyId, expirationTime);
  }
}
```

## Implementation Examples

### Complete Authentication Manager for Gemini-Flow

```typescript
export class GeminiFlowAuthManager {
  private oauth2Client?: OAuth2Client;
  private googleAuth?: GoogleAuth;
  private vertexAI?: VertexAI;
  private tokenManager: TokenManager;
  private securityManager: SecurityManager;
  
  constructor(config: AuthConfig) {
    this.tokenManager = new TokenManager(config);
    this.securityManager = new SecurityManager(config);
    this.initializeAuth(config);
  }
  
  private async initializeAuth(config: AuthConfig): Promise<void> {
    // Initialize based on authentication method
    if (config.useADC) {
      await this.initializeADC(config);
    } else if (config.serviceAccount) {
      await this.initializeServiceAccount(config);
    } else if (config.oauth2) {
      await this.initializeOAuth2(config);
    }
    
    // Initialize Vertex AI client
    await this.initializeVertexAI(config);
  }
  
  private async initializeADC(config: AuthConfig): Promise<void> {
    this.googleAuth = new GoogleAuth({
      projectId: config.projectId,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  
  private async initializeServiceAccount(config: AuthConfig): Promise<void> {
    if (config.serviceAccount.useSecretManager) {
      const credentials = await this.securityManager.getCredentialsFromSecretManager();
      this.googleAuth = new GoogleAuth({
        credentials,
        projectId: config.projectId,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    } else {
      // Fallback to key file (not recommended for production)
      this.googleAuth = new GoogleAuth({
        keyFilename: config.serviceAccount.keyPath,
        projectId: config.projectId,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    }
  }
  
  private async initializeOAuth2(config: AuthConfig): Promise<void> {
    this.oauth2Client = new google.auth.OAuth2(
      config.oauth2.clientId,
      config.oauth2.clientSecret,
      config.oauth2.redirectUri
    );
  }
  
  private async initializeVertexAI(config: AuthConfig): Promise<void> {
    const authClient = await this.getAuthClient();
    
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location || 'us-central1',
      googleAuthOptions: {
        authClient
      }
    });
  }
  
  async getAuthClient(): Promise<AuthClient> {
    if (this.googleAuth) {
      return await this.googleAuth.getClient();
    } else if (this.oauth2Client) {
      await this.tokenManager.refreshTokensIfNeeded();
      return this.oauth2Client;
    }
    
    throw new Error('No authentication method configured');
  }
  
  async authenticateUser(code: string): Promise<UserProfile> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 not configured');
    }
    
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    // Get user information and detect tier
    const userInfo = await this.getUserInfo();
    const tierResult = await this.detectUserTier(userInfo.email, tokens);
    
    return this.createUserProfile(userInfo, tierResult);
  }
  
  async makeVertexAIRequest(request: VertexAIRequest): Promise<VertexAIResponse> {
    try {
      const authClient = await this.getAuthClient();
      
      // Ensure we have valid authentication
      await this.securityManager.validateRequest(request, authClient);
      
      // Make the request
      const model = this.vertexAI!.getGenerativeModel({ model: request.model });
      const result = await model.generateContent(request.content);
      
      // Log the request for audit purposes
      await this.securityManager.logRequest(request, result);
      
      return this.formatResponse(result);
      
    } catch (error) {
      await this.securityManager.logError(request, error);
      throw error;
    }
  }
}
```

### CLI Integration Example

```typescript
// CLI command with authentication
export class AuthenticatedCLI {
  private authManager: GeminiFlowAuthManager;
  
  async execute(command: string, options: CLIOptions): Promise<void> {
    try {
      // Initialize authentication
      this.authManager = new GeminiFlowAuthManager({
        useADC: true,
        projectId: options.projectId || process.env.GOOGLE_VERTEX_PROJECT,
        location: options.location || process.env.GOOGLE_VERTEX_LOCATION || 'us-central1'
      });
      
      // Execute command
      switch (command) {
        case 'generate':
          await this.handleGenerate(options);
          break;
        case 'auth':
          await this.handleAuth(options);
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }
      
    } catch (error) {
      console.error('Authentication error:', error.message);
      process.exit(1);
    }
  }
  
  private async handleAuth(options: CLIOptions): Promise<void> {
    if (options.mode === 'user') {
      // Interactive user authentication
      const authUrl = this.authManager.generateAuthUrl();
      console.log(`Please visit: ${authUrl}`);
      
      const code = await this.promptForCode();
      const userProfile = await this.authManager.authenticateUser(code);
      
      console.log(`Authenticated as: ${userProfile.email} (${userProfile.tier} tier)`);
    } else {
      // Service account or ADC authentication
      const isAuthenticated = await this.authManager.testAuthentication();
      console.log(`Authentication status: ${isAuthenticated ? 'SUCCESS' : 'FAILED'}`);
    }
  }
  
  private async handleGenerate(options: CLIOptions): Promise<void> {
    const request = {
      model: options.model || 'gemini-2.5-flash',
      content: options.prompt,
      parameters: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048
      }
    };
    
    const response = await this.authManager.makeVertexAIRequest(request);
    console.log(response.content);
  }
}
```

## Troubleshooting

### Common Authentication Issues

#### 1. "Permission Denied" Errors

**Problem**: `403 Forbidden` or permission denied errors

**Solutions**:
```typescript
// Check service account roles
const requiredRoles = [
  'roles/aiplatform.user',
  'roles/ml.developer'
];

// Verify IAM permissions
async function checkPermissions(projectId: string, email: string): Promise<void> {
  const resourceManager = new CloudResourceManagerClient();
  const [policy] = await resourceManager.getIamPolicy({
    resource: `projects/${projectId}`
  });
  
  // Check if user/service account has required roles
  const hasRequiredRoles = requiredRoles.every(role =>
    policy.bindings?.some(binding =>
      binding.role === role && binding.members?.includes(`serviceAccount:${email}`)
    )
  );
  
  if (!hasRequiredRoles) {
    throw new Error(`Missing required IAM roles: ${requiredRoles.join(', ')}`);
  }
}
```

#### 2. Token Expiration Issues

**Problem**: "Invalid credentials" or token expired errors

**Solutions**:
```typescript
// Implement robust token refresh
class TokenRefreshHandler {
  async handleExpiredToken(error: any): Promise<void> {
    if (this.isTokenExpiredError(error)) {
      await this.refreshTokens();
      // Retry the original request
      return this.retryOriginalRequest();
    }
    throw error;
  }
  
  private isTokenExpiredError(error: any): boolean {
    return error.code === 401 || 
           error.message.includes('Token has expired') ||
           error.message.includes('Invalid credentials');
  }
}
```

#### 3. ADC Discovery Issues

**Problem**: ADC cannot find credentials

**Solutions**:
```bash
# Check ADC status
gcloud auth application-default print-access-token

# Reset ADC if corrupted
gcloud auth application-default revoke
gcloud auth application-default login

# Verify project configuration
gcloud config get-value project
```

#### 4. Vertex AI Model Access Issues

**Problem**: Models not available or access denied

**Solutions**:
```typescript
// Check model availability for project
async function checkModelAvailability(projectId: string, location: string): Promise<void> {
  const client = new ModelServiceClient();
  
  try {
    const [models] = await client.listModels({
      parent: `projects/${projectId}/locations/${location}`
    });
    
    console.log('Available models:', models.map(m => m.displayName));
  } catch (error) {
    if (error.message.includes('Gemini 1.5')) {
      console.error('Note: Gemini 1.5 models require prior usage (as of April 2025)');
    }
    throw error;
  }
}
```

### Debugging Authentication

```typescript
export class AuthDebugger {
  async diagnoseAuthIssues(): Promise<AuthDiagnostic> {
    const diagnostic: AuthDiagnostic = {
      timestamp: new Date(),
      checks: []
    };
    
    // Check 1: Environment variables
    diagnostic.checks.push({
      name: 'Environment Variables',
      status: this.checkEnvironmentVariables(),
      details: {
        GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        GOOGLE_VERTEX_PROJECT: !!process.env.GOOGLE_VERTEX_PROJECT,
        GOOGLE_VERTEX_LOCATION: !!process.env.GOOGLE_VERTEX_LOCATION
      }
    });
    
    // Check 2: ADC availability
    try {
      const auth = new GoogleAuth();
      const client = await auth.getClient();
      diagnostic.checks.push({
        name: 'Application Default Credentials',
        status: 'PASS',
        details: { type: client.constructor.name }
      });
    } catch (error) {
      diagnostic.checks.push({
        name: 'Application Default Credentials',
        status: 'FAIL',
        details: { error: error.message }
      });
    }
    
    // Check 3: Vertex AI API access
    try {
      const vertexAI = new VertexAI({
        project: process.env.GOOGLE_VERTEX_PROJECT || 'test-project',
        location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1'
      });
      
      // Test with a simple model list request
      await vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      diagnostic.checks.push({
        name: 'Vertex AI Access',
        status: 'PASS',
        details: { endpoint: 'Available' }
      });
    } catch (error) {
      diagnostic.checks.push({
        name: 'Vertex AI Access',
        status: 'FAIL',
        details: { error: error.message }
      });
    }
    
    return diagnostic;
  }
}
```

### Support and Resources

#### Documentation Links
- [Google Cloud Authentication Documentation](https://cloud.google.com/docs/authentication)
- [Vertex AI Authentication Guide](https://cloud.google.com/vertex-ai/docs/authentication)
- [OAuth2 Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)

#### Community Support
- [Google Cloud Community](https://www.googlecloudcommunity.com/)
- [Stack Overflow - google-cloud-vertex-ai](https://stackoverflow.com/questions/tagged/google-cloud-vertex-ai)

#### Error Code Reference
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Authentication credentials missing or invalid
- `403 Forbidden`: Insufficient permissions or IAM roles
- `429 Too Many Requests`: Rate limiting or quota exceeded
- `500 Internal Server Error`: Google Cloud service issue

---

## Conclusion

This comprehensive authentication guide provides the foundation for secure and robust integration with Google Cloud Vertex AI in the gemini-flow project. The implementation patterns and best practices outlined here follow Google's 2025 recommendations and address the unique requirements of modern AI applications.

Key takeaways:
1. **Prefer ADC** for production deployments when possible
2. **Avoid service account keys** unless absolutely necessary
3. **Implement proper token refresh** mechanisms
4. **Follow security best practices** for credential storage
5. **Monitor and audit** authentication events
6. **Plan for the 2025 model availability changes**

Regular review and updates of authentication configurations ensure continued security and compliance with evolving Google Cloud best practices.
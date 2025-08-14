# Google Services Authentication Guide

## Overview

Gemini-Flow supports multiple authentication methods for accessing Google services, each optimized for different use cases and environments. This guide covers all authentication methods, setup procedures, and best practices.

## Authentication Methods

### 1. Google AI API Key (Simplest)
**Use Case**: Direct access to Google AI/Gemini models  
**Security Level**: Basic  
**Setup Time**: < 5 minutes  

```bash
# Set environment variable
export GEMINI_API_KEY="AIzaSyD..."
export GOOGLE_AI_API_KEY="AIzaSyD..."  # Alternative
export GOOGLE_API_KEY="AIzaSyD..."     # Alternative

# Or in .env file
GEMINI_API_KEY=AIzaSyD...
```

**Supported Services**:
- ✅ Google AI/Gemini Models
- ❌ Google Workspace APIs
- ❌ Vertex AI Platform
- ❌ Advanced Google Services

### 2. OAuth 2.0 (User Delegation)
**Use Case**: Access user's Google Workspace data  
**Security Level**: High  
**Setup Time**: 15-30 minutes  

**Scopes Available**:
```typescript
const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents', 
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/cloud-platform'
];
```

**Implementation Example**:
```typescript
import { GoogleWorkspaceIntegration } from '@gemini-flow/google-services';

const workspace = new GoogleWorkspaceIntegration({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback'
});

// Initialize OAuth flow
const authUrl = workspace.getAuthUrl();
console.log('Visit:', authUrl);

// Handle callback
const tokens = await workspace.getTokens(authCode);
await workspace.initialize(tokens);
```

### 3. Service Account (Server-to-Server)
**Use Case**: Backend services, automation  
**Security Level**: Enterprise  
**Setup Time**: 30-45 minutes  

**Service Account JSON Structure**:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "service@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service%40project.iam.gserviceaccount.com"
}
```

**Environment Setup**:
```bash
# Method 1: Environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Method 2: Direct JSON
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Method 3: Base64 encoded
export GOOGLE_SERVICE_ACCOUNT_BASE64="eyJ0eXBlIjoic2VydmljZV..."
```

**Code Implementation**:
```typescript
import { VertexAIConnector } from '@gemini-flow/google-services';

const vertexAI = new VertexAIConnector({
  projectId: 'your-project-id',
  location: 'us-central1',
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
});

await vertexAI.initialize();
```

### 4. Application Default Credentials (ADC)
**Use Case**: Google Cloud environments  
**Security Level**: High  
**Setup Time**: Automatic in GCP  

**Credential Discovery Order**:
1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable
2. `gcloud auth application-default login` credentials
3. Google Cloud SDK default credentials
4. Google Cloud metadata service (GCE, Cloud Run, etc.)

```typescript
// ADC is used automatically when no credentials are explicitly provided
const service = new GoogleCloudService(); // Uses ADC automatically
await service.initialize();
```

## Quick Setup Guides

### Google AI API Key Setup

#### Step 1: Get API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key (starts with `AIza`)

#### Step 2: Configure Environment
```bash
# Linux/macOS
echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# Windows PowerShell
$env:GEMINI_API_KEY="your-api-key-here"
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "your-api-key-here", "User")
```

#### Step 3: Verify Setup
```bash
npx gemini-flow doctor
# Should show: ✅ Google AI API Key detected and valid
```

### OAuth 2.0 Setup

#### Step 1: Create OAuth 2.0 Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select/create a project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure application type and authorized redirect URIs

#### Step 2: Enable Required APIs
```bash
gcloud services enable drive.googleapis.com
gcloud services enable docs.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable slides.googleapis.com
```

#### Step 3: Configure Application
```json
{
  "web": {
    "client_id": "123456789-abc.apps.googleusercontent.com",
    "client_secret": "GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "redirect_uris": ["http://localhost:3000/callback"]
  }
}
```

#### Step 4: Implement OAuth Flow
```typescript
// Express.js example
app.get('/auth/google', (req, res) => {
  const authUrl = workspace.getAuthUrl();
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await workspace.getTokens(code as string);
  await workspace.initialize(tokens);
  res.json({ success: true });
});
```

### Service Account Setup

#### Step 1: Create Service Account
```bash
# Using gcloud CLI
gcloud iam service-accounts create gemini-flow-service \
  --display-name="Gemini Flow Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:gemini-flow-service@your-project-id.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ./service-account.json \
  --iam-account=gemini-flow-service@your-project-id.iam.gserviceaccount.com
```

#### Step 2: Configure Environment
```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account.json"
```

#### Step 3: Enable APIs
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable ml.googleapis.com
gcloud services enable compute.googleapis.com
```

## Authentication Flow Examples

### Complete OAuth 2.0 Flow
```typescript
import express from 'express';
import { GoogleWorkspaceIntegration } from '@gemini-flow/google-services';

const app = express();
const workspace = new GoogleWorkspaceIntegration({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback'
});

// Step 1: Initiate OAuth
app.get('/auth/google', (req, res) => {
  const state = generateRandomState(); // CSRF protection
  const authUrl = workspace.getAuthUrl() + `&state=${state}`;
  
  req.session.oauthState = state;
  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }
  
  try {
    const tokens = await workspace.getTokens(code as string);
    await workspace.initialize(tokens);
    
    // Store tokens securely (encrypted in database)
    await storeTokensSecurely(req.user.id, tokens);
    
    res.json({ success: true, message: 'Authentication successful' });
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed', details: err.message });
  }
});

// Step 3: Use authenticated service
app.get('/api/drive/files', authenticateUser, async (req, res) => {
  const tokens = await getStoredTokens(req.user.id);
  await workspace.initialize(tokens);
  
  const files = await workspace.searchDrive('name contains "important"');
  res.json(files);
});
```

### Service Account with Error Handling
```typescript
import { VertexAIConnector, AuthError, QuotaError } from '@gemini-flow/google-services';

async function initializeVertexAI() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
    
    const vertexAI = new VertexAIConnector({
      projectId: credentials.project_id,
      location: 'us-central1',
      credentials
    });
    
    await vertexAI.initialize();
    console.log('✅ Vertex AI initialized successfully');
    
    return vertexAI;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('❌ Authentication failed:', error.message);
      console.error('💡 Check your service account credentials');
    } else if (error instanceof QuotaError) {
      console.error('❌ Quota exceeded:', error.message);
      console.error('💡 Wait or increase quota limits');
    } else {
      console.error('❌ Unknown error:', error.message);
    }
    
    throw error;
  }
}
```

## Security Best Practices

### 1. API Key Security
```typescript
// ❌ Bad: Hardcoded API keys
const apiKey = "AIzaSyD-hardcoded-key-in-source";

// ✅ Good: Environment variables
const apiKey = process.env.GEMINI_API_KEY;

// ✅ Better: Encrypted environment variables
const apiKey = decrypt(process.env.ENCRYPTED_GEMINI_API_KEY);

// ✅ Best: Secret management service
const apiKey = await getSecret('GEMINI_API_KEY');
```

### 2. Token Storage
```typescript
// ❌ Bad: Plain text storage
localStorage.setItem('tokens', JSON.stringify(tokens));

// ✅ Good: Encrypted storage
const encryptedTokens = encrypt(JSON.stringify(tokens));
await db.tokens.store(userId, encryptedTokens);

// ✅ Better: Secure token vault
await tokenVault.store(userId, tokens, { ttl: 3600, encrypted: true });
```

### 3. Scope Limitation
```typescript
// ❌ Bad: Requesting all scopes
const scopes = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/drive'
];

// ✅ Good: Minimal required scopes
const scopes = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly'
];
```

### 4. Token Refresh Handling
```typescript
class TokenManager {
  async getValidToken(userId: string): Promise<string> {
    const tokens = await this.getStoredTokens(userId);
    
    // Check if token is expired
    if (this.isTokenExpired(tokens)) {
      // Attempt refresh
      const newTokens = await this.refreshTokens(tokens.refresh_token);
      await this.storeTokens(userId, newTokens);
      return newTokens.access_token;
    }
    
    return tokens.access_token;
  }
  
  private isTokenExpired(tokens: Tokens): boolean {
    const expiryTime = tokens.issued_at + tokens.expires_in;
    const bufferTime = 300; // 5 minutes buffer
    return Date.now() / 1000 > (expiryTime - bufferTime);
  }
}
```

## Error Handling & Troubleshooting

### Common Authentication Errors

#### 1. Invalid API Key
```typescript
try {
  const response = await generateContent(prompt);
} catch (error) {
  if (error.code === 'INVALID_API_KEY') {
    console.error('API Key is invalid or disabled');
    console.error('Solution: Check your API key at https://aistudio.google.com/app/apikey');
  }
}
```

#### 2. OAuth Consent Required
```typescript
try {
  await workspace.searchDrive('test');
} catch (error) {
  if (error.code === 'CONSENT_REQUIRED') {
    const authUrl = workspace.getAuthUrl();
    console.log('User consent required. Visit:', authUrl);
  }
}
```

#### 3. Service Account Permission Denied
```typescript
try {
  await vertexAI.predict(model, instances);
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    console.error('Service account lacks required permissions');
    console.error('Grant roles: aiplatform.user, ml.admin');
  }
}
```

### Authentication Diagnostics
```typescript
async function diagnoseAuthentication() {
  const diagnostics = {
    apiKey: !!process.env.GEMINI_API_KEY,
    serviceAccount: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    oauth: await checkOAuthTokens(),
    quotaStatus: await checkQuotaLimits()
  };
  
  console.table(diagnostics);
  return diagnostics;
}
```

## Environment-Specific Configurations

### Development Environment
```bash
# .env.development
GEMINI_API_KEY=AIzaSyD_development_key
GOOGLE_CLIENT_ID=dev-client-id
GOOGLE_CLIENT_SECRET=dev-client-secret
GOOGLE_PROJECT_ID=my-dev-project
GOOGLE_APPLICATION_CREDENTIALS=./dev-service-account.json
```

### Production Environment
```bash
# Use secret management instead of .env files
kubectl create secret generic google-credentials \
  --from-file=service-account.json=./prod-service-account.json

# Or use cloud-native secret management
export GEMINI_API_KEY=$(gcloud secrets versions access latest --secret="gemini-api-key")
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy service account (build time)
COPY service-account.json /app/credentials/

# Set environment variable
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json

# Install dependencies and start
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  gemini-flow:
    build: .
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GOOGLE_PROJECT_ID=${GOOGLE_PROJECT_ID}
    volumes:
      - ./credentials:/app/credentials:ro
    ports:
      - "3000:3000"
```

## Testing Authentication

### Unit Tests
```typescript
import { GoogleAIAuth } from '@gemini-flow/google-services';

describe('Google AI Authentication', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'AIzaSyD-test-key-12345';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  test('should detect API key from environment', () => {
    const auth = new GoogleAIAuth();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.getAuthStatus().source).toBe('environment');
  });

  test('should validate API key format', () => {
    const auth = new GoogleAIAuth({ apiKey: 'invalid-key' });
    expect(auth.isValidApiKey()).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Google Workspace Integration', () => {
  let workspace: GoogleWorkspaceIntegration;

  beforeAll(async () => {
    workspace = new GoogleWorkspaceIntegration({
      clientId: process.env.TEST_CLIENT_ID!,
      clientSecret: process.env.TEST_CLIENT_SECRET!
    });
    
    // Use test tokens
    await workspace.initialize(TEST_TOKENS);
  });

  test('should search Drive files', async () => {
    const files = await workspace.searchDrive('type:document');
    expect(files).toBeInstanceOf(Array);
    expect(files.length).toBeGreaterThan(0);
  });
});
```

## Rate Limiting & Quotas

### Understanding Quotas
| Service | Default Limit | Burst Limit | Reset Period |
|---------|---------------|-------------|--------------|
| Google AI API | 60 requests/minute | 300/hour | 1 minute |
| Drive API | 1000 requests/100s | 10000/day | 100 seconds |
| Sheets API | 300 requests/minute | 10000/day | 1 minute |
| Vertex AI | Model-dependent | Varies | Varies |

### Quota Monitoring
```typescript
class QuotaMonitor {
  async checkQuotaStatus(service: string) {
    const usage = await getQuotaUsage(service);
    
    if (usage.percentage > 80) {
      console.warn(`⚠️ ${service} quota at ${usage.percentage}%`);
      
      if (usage.percentage > 95) {
        await this.enableRateLimiting(service);
      }
    }
    
    return usage;
  }
}
```

## Migration & Compatibility

### Upgrading Authentication Methods
```typescript
// Migration helper
class AuthMigrator {
  async migrateToServiceAccount(userId: string) {
    const oauthTokens = await this.getOAuthTokens(userId);
    
    // Migrate user data access to service account
    const serviceAuth = new ServiceAccountAuth(SA_CREDENTIALS);
    
    // Preserve user permissions through domain-wide delegation
    await serviceAuth.impersonateUser(oauthTokens.email);
    
    console.log(`✅ Migrated ${userId} to service account auth`);
  }
}
```

This comprehensive authentication guide provides everything needed to implement secure, scalable authentication for Google services in the Gemini-Flow platform. The next step will be creating detailed developer getting started guides.
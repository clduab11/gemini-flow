# Gemini Flow Backend API

Backend API server for Gemini Flow visual execution platform.

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure required environment variables in `.env`:

```bash
# REQUIRED: Backend API Key (must be at least 32 characters in production)
API_KEY=your-secure-random-key-minimum-32-characters

# REQUIRED: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# OPTIONAL: Server port (default: 3001)
PORT=3001

# OPTIONAL: Node environment (development, production)
NODE_ENV=development
```

### Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
NODE_ENV=production npm start
```

## 🔒 Security

### API Key Authentication

The backend requires API key authentication for all API endpoints. API keys are validated via the `X-API-Key` header.

#### Production Requirements

In production mode (`NODE_ENV=production`), the following security requirements are **enforced**:

1. **API_KEY is REQUIRED** - Server will refuse to start without it
2. **Minimum 32 characters** - Keys shorter than 32 characters are rejected
3. **Secure key generation recommended** - Use cryptographically secure random keys

#### Generating Secure API Keys

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Multiple API Keys with Scopes

The backend supports multiple API keys with different permission scopes:

```bash
# Admin key - full access to all endpoints
API_KEY_ADMIN=admin-key-with-full-access-minimum-32-chars

# TUI client key - for terminal user interface
API_KEY_TUI=tui-client-key-minimum-32-chars

# Browser client key - for web browser clients
API_KEY_BROWSER=browser-client-key-minimum-32-chars

# Read-only key - for monitoring and read operations
API_KEY_READONLY=readonly-key-for-monitoring-minimum-32-chars
```

### API Key Security Features

1. **Hashing Before Logging** - API keys are hashed (SHA-256) before being logged
2. **No Plaintext Storage** - Keys are never stored in plaintext in logs or sessions
3. **Scope-Based Access Control** - Different keys can have different permission levels
4. **Production Enforcement** - Strong key requirements in production mode

### Making Authenticated Requests

Include the API key in the `X-API-Key` header:

```bash
curl -X POST http://localhost:3001/api/gemini/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"nodes": [...], "edges": [...]}'
```

### Startup Validation

The server validates API key configuration at startup:

**Missing API_KEY in production:**
```bash
$ NODE_ENV=production npm start
❌ FATAL: API_KEY environment variable is required in production
   Set API_KEY in your environment or .env file
   Generate a secure key with: openssl rand -hex 32
```

**Short API_KEY in production:**
```bash
$ NODE_ENV=production API_KEY=short npm start
⚠️  WARNING: API_KEY should be at least 32 characters for security (current: 5)
❌ FATAL: API_KEY too short for production use
```

**Valid configuration:**
```bash
$ NODE_ENV=production API_KEY=$(openssl rand -hex 32) npm start
✅ API_KEY configured (hash: 791551ed)
✅ 1 scoped API key(s) configured:
   - Default Key (default): 791551ed
🚀 Gemini Flow Backend Server running on port 3001
```

## 📡 API Endpoints

### Health Check

**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "service": "gemini-flow-backend"
}
```

### Execute Visual Flow

**POST** `/api/gemini/execute`

Executes a visual flow via Google Gemini API.

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: your-api-key` (required)

**Request Body:**
```json
{
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "data": { "label": "Start" }
    },
    {
      "id": "2",
      "type": "output",
      "data": { "label": "End" }
    }
  ],
  "edges": [
    {
      "source": "1",
      "target": "2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": "Generated content from Gemini...",
  "metadata": {
    "nodesProcessed": 2,
    "edgesProcessed": 1,
    "promptLength": 45,
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

### Check Gemini API Status

**GET** `/api/gemini/status`

Checks Gemini API connection status.

**Headers:**
- `X-API-Key: your-api-key` (required)

**Response:**
```json
{
  "status": "ready",
  "hasApiKey": true,
  "apiKeyPrefix": "AIzaSyBn...",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🛠️ Development

### Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── gemini/
│   │   │   └── index.js          # Gemini API routes
│   │   └── middleware/
│   │       ├── auth.js            # Authentication middleware
│   │       └── __tests__/
│   │           └── auth.test.js   # Auth tests
│   └── server.js                  # Express server
├── .env.example                   # Environment variables template
├── package.json
└── README.md
```

### Environment Variables

See `.env.example` for all available configuration options.

### Error Handling

The API returns standardized error responses:

**401 Unauthorized:**
```json
{
  "error": {
    "code": "MISSING_API_KEY",
    "message": "API key is required. Please provide X-API-Key header."
  }
}
```

**403 Forbidden:**
```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Insufficient permissions for this operation.",
    "requiredScopes": ["admin"],
    "currentScope": "readonly"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to execute flow with Gemini API",
  "message": "Detailed error message..."
}
```

## 📚 Additional Resources

- [Main README](../README.md) - Project overview
- [Frontend README](../frontend/README.md) - Frontend documentation
- [API Documentation](../docs/api.md) - Detailed API specs

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## 📝 License

See [LICENSE](../LICENSE) for license information.

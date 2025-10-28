# Backend Environment Configuration

## Table of Contents

- [Quick Start](#quick-start)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment Validation](#environment-validation)
- [Security Best Practices](#security-best-practices)
- [Docker Configuration](#docker-configuration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Copy the Example Environment File

```bash
cd backend
cp .env.example .env
```

### 2. Generate a Secure API Key

```bash
# Generate a secure random API key (64 characters)
openssl rand -hex 32
```

### 3. Configure Required Variables

Edit `.env` and set the following required variables:

```bash
# Runtime environment
NODE_ENV=production

# Google Gemini API Key (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Backend authentication key (use the generated key from step 2)
API_KEY=your_generated_64_character_api_key_here

# Server port (default: 3001)
PORT=3001
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 5. Verify Configuration

```bash
# Check server health
curl http://localhost:3001/health

# Check Gemini API status
curl http://localhost:3001/api/gemini/status
```

## Required Variables

| Variable | Required In | Default | Description |
|----------|------------|---------|-------------|
| `NODE_ENV` | Production | `development` | Runtime environment (`development`, `production`, `test`) |
| `GEMINI_API_KEY` | All | - | Google Gemini API key for AI operations |
| `API_KEY` | Production | - | Authentication key for backend API (min 32 chars) |
| `PORT` | No | `3001` | HTTP server port |

### Variable Details

#### NODE_ENV
- **Values**: `development`, `production`, `test`
- **Impact**: 
  - Controls error reporting verbosity
  - Enables/disables development features
  - Affects logging behavior
  - Determines security settings

#### GEMINI_API_KEY
- **Format**: String (varies by API provider)
- **How to obtain**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Security**: 
  - Use different keys for each environment
  - Rotate keys every 90 days
  - Monitor API usage for anomalies
- **Alternative**: Can also be set as `GOOGLE_AI_API_KEY`

#### API_KEY
- **Format**: String (minimum 32 characters, 64 recommended)
- **Generation**: `openssl rand -hex 32`
- **Purpose**: Authenticates requests to backend API endpoints
- **Security**:
  - Required in production (`NODE_ENV=production`)
  - Server will fail to start without it in production mode
  - Warning displayed if key is shorter than 32 characters

## Optional Variables

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Host address to bind to |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `CORS_CREDENTIALS` | `true` | Allow credentials in CORS requests |

### Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |
| `LOG_PRETTY` | `true` | Enable pretty-printed logs (vs JSON) |
| `LOG_FORMAT` | `pretty` | Log format (`json` or `pretty`) |
| `REQUEST_LOGGING` | `true` | Log all HTTP requests |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit time window (milliseconds) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `RATE_LIMIT_STORE` | `memory` | Storage backend (`memory` or `redis`) |

### Database & Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `.data` | Directory for database files |
| `BACKUP_INTERVAL_HOURS` | `24` | Automatic backup interval (0 to disable) |
| `MAX_BACKUPS` | `30` | Maximum number of backups to retain |

### Workflow Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_NODES` | `1000` | Maximum workflow nodes |
| `MAX_EDGES` | `5000` | Maximum workflow edges |
| `MAX_NAME_LENGTH` | `200` | Maximum workflow name length |
| `MAX_DESCRIPTION_LENGTH` | `5000` | Maximum description length |

### Redis Configuration (Distributed Systems)

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | - | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | - | Redis authentication password |
| `REDIS_DB` | `0` | Redis database number (0-15) |
| `REDIS_CONNECT_TIMEOUT` | `10000` | Connection timeout (milliseconds) |

### Monitoring & Observability

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_ENABLED` | `false` | Enable Prometheus metrics endpoint |
| `METRICS_PORT` | `9090` | Metrics endpoint port |
| `HEALTH_CHECK_ENABLED` | `true` | Enable health check endpoints |

### Security Headers

| Variable | Default | Description |
|----------|---------|-------------|
| `FORCE_HTTPS` | `false` | Redirect HTTP to HTTPS |
| `SECURITY_HEADERS` | `false` | Enable security headers (Helmet.js) |
| `CSP_DIRECTIVES` | - | Content Security Policy directives |

### Development Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enable debug mode (verbose error messages) |
| `DISABLE_AUTH` | `false` | **DANGEROUS**: Disable API authentication |
| `HOT_RELOAD` | `false` | Enable hot module reloading |
| `MOCK_APIS` | `false` | Use mock responses for external APIs |

## Environment Validation

The server validates environment configuration on startup. Here's what gets checked:

### Production Validation
When `NODE_ENV=production`:
- ✅ `API_KEY` must be set
- ✅ `API_KEY` must be at least 32 characters
- ✅ `GEMINI_API_KEY` must be set
- ⚠️ Warns if `DEBUG=true` (security risk)
- ⚠️ Warns if `DISABLE_AUTH=true` (security risk)

### Development Validation
When `NODE_ENV=development`:
- ℹ️ `API_KEY` is optional
- ℹ️ Allows weak API keys for testing
- ℹ️ Permits debug and development features

### Numeric Value Validation
- `PORT`: Must be between 1-65535
- `RATE_LIMIT_WINDOW_MS`: Must be positive integer
- `RATE_LIMIT_MAX_REQUESTS`: Must be positive integer
- `MAX_NODES`, `MAX_EDGES`: Must be positive integers

### Example Validation Errors

```bash
# Missing API key in production
Error: Missing required environment variable: API_KEY
Set API_KEY environment variable (minimum 32 characters)

# Weak API key
Warning: API_KEY should be at least 32 characters for security
Current length: 16 characters

# Invalid port number
Error: Invalid PORT value: "abc"
PORT must be a number between 1 and 65535
```

## Security Best Practices

### 1. Never Commit Secrets to Version Control

```bash
# Good: .env is in .gitignore
echo ".env" >> .gitignore

# Bad: Don't commit .env files
git add .env  # ❌ NEVER DO THIS
```

### 2. Use Strong, Randomly Generated API Keys

```bash
# Generate secure API key (64 characters)
openssl rand -hex 32

# Generate base64-encoded key (alternative)
openssl rand -base64 48

# Generate UUID-based key
uuidgen
```

### 3. Rotate API Keys Periodically

**Recommended Schedule**:
- Development: Every 90 days
- Staging: Every 60 days
- Production: Every 30-90 days

**Rotation Process**:
1. Generate new API key
2. Update environment configuration
3. Restart server with new key
4. Revoke old key after verification
5. Update documentation with rotation date

### 4. Use Different Keys for Different Environments

```bash
# Development
API_KEY=dev-key-abc123...

# Staging
API_KEY=staging-key-def456...

# Production
API_KEY=prod-key-xyz789...
```

### 5. Store Production Secrets in Secure Vaults

**Recommended Tools**:
- **AWS Secrets Manager**: Integrated with AWS services
- **HashiCorp Vault**: Platform-agnostic secret management
- **Azure Key Vault**: Microsoft Azure integration
- **GCP Secret Manager**: Google Cloud integration

**Example with AWS Secrets Manager**:
```bash
# Store secret
aws secretsmanager create-secret \
  --name gemini-flow/production/api-key \
  --secret-string "your-production-api-key"

# Retrieve secret in application
API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id gemini-flow/production/api-key \
  --query SecretString --output text)
```

### 6. Limit CORS Origins in Production

```bash
# Development: Permissive
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production: Restrictive
CORS_ORIGINS=https://app.example.com,https://www.example.com
```

### 7. Enable Security Headers

```bash
# Production configuration
SECURITY_HEADERS=true
FORCE_HTTPS=true
CSP_DIRECTIVES=default-src 'self'; script-src 'self' 'unsafe-inline'
```

### 8. Monitor API Usage

- Track API key usage by endpoint
- Set up alerts for unusual patterns
- Monitor rate limit violations
- Review access logs regularly

## Docker Configuration

### Using Environment Variables with Docker

#### Method 1: Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      HOST: 0.0.0.0
      DATA_DIR: /data
      LOG_FORMAT: json
    env_file:
      - ./backend/.env
    volumes:
      - backend-data:/data
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  backend-data:
  redis-data:
```

Start services:
```bash
docker-compose up -d
```

#### Method 2: Docker CLI

```bash
# Build image
docker build -t gemini-flow-backend ./backend

# Run with environment file
docker run -d \
  --name gemini-flow-backend \
  --env-file ./backend/.env \
  -p 3001:3001 \
  -v backend-data:/data \
  gemini-flow-backend

# Run with individual environment variables
docker run -d \
  --name gemini-flow-backend \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  -e API_KEY=$API_KEY \
  -e PORT=3001 \
  -p 3001:3001 \
  gemini-flow-backend
```

#### Method 3: Docker Secrets (Swarm Mode)

Create secrets:
```bash
# Create API key secret
echo "your-api-key" | docker secret create gemini_api_key -

# Create backend API key secret
echo "your-backend-api-key" | docker secret create backend_api_key -
```

Use in `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    image: gemini-flow-backend
    secrets:
      - gemini_api_key
      - backend_api_key
    environment:
      NODE_ENV: production
      GEMINI_API_KEY_FILE: /run/secrets/gemini_api_key
      API_KEY_FILE: /run/secrets/backend_api_key

secrets:
  gemini_api_key:
    external: true
  backend_api_key:
    external: true
```

### Dockerfile Best Practices

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /data

# Set environment defaults
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    DATA_DIR=/data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["npm", "start"]
```

### Multi-Stage Build for Production

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Server Fails to Start in Production Without API_KEY

**Error Message**:
```
Error: Missing required environment variable: API_KEY
```

**Solution**:
1. Set `API_KEY` environment variable
2. Ensure it's at least 32 characters
3. Verify `.env` file is in the correct location

```bash
# Generate secure API key
openssl rand -hex 32

# Add to .env file
echo "API_KEY=$(openssl rand -hex 32)" >> .env

# Restart server
npm start
```

### Gemini API Connection Failures

**Error Message**:
```
Error: Gemini API key not found
```

**Solution**:
1. Verify `GEMINI_API_KEY` is set
2. Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Ensure no extra whitespace in the key

```bash
# Check if API key is set
echo $GEMINI_API_KEY

# Verify API key in .env
cat .env | grep GEMINI_API_KEY

# Test API status
curl http://localhost:3001/api/gemini/status
```

### Rate Limiting Not Working

**Symptoms**:
- Requests not being rate limited
- Rate limit errors not appearing

**Possible Causes & Solutions**:

1. **In-memory storage with multiple servers**:
   ```bash
   # Solution: Use Redis for distributed rate limiting
   RATE_LIMIT_STORE=redis
   REDIS_HOST=redis.example.com
   REDIS_PORT=6379
   ```

2. **Incorrect configuration**:
   ```bash
   # Verify configuration
   RATE_LIMIT_WINDOW_MS=60000  # 1 minute
   RATE_LIMIT_MAX_REQUESTS=100 # 100 requests per minute
   ```

3. **Rate limit middleware not initialized**:
   - Check server logs for rate limit initialization messages
   - Ensure middleware is properly configured in server.js

### WebSocket Connections Failing

**Symptoms**:
- WebSocket upgrade fails
- Connection timeout errors

**Solutions**:

1. **Verify port is accessible**:
   ```bash
   # Test port connectivity
   telnet localhost 3001
   
   # Check firewall rules
   sudo ufw status
   ```

2. **Check API key in WebSocket URL**:
   ```javascript
   // Correct WebSocket connection
   const ws = new WebSocket(`ws://localhost:3001?apiKey=${apiKey}`);
   ```

3. **Verify reverse proxy configuration**:
   ```nginx
   # Nginx configuration for WebSocket
   location / {
     proxy_pass http://localhost:3001;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

### CORS Errors in Browser

**Error Message**:
```
Access to fetch at 'http://localhost:3001/api/gemini/execute' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution**:
1. Add frontend origin to `CORS_ORIGINS`
2. Ensure `CORS_CREDENTIALS=true` if sending credentials

```bash
# Update .env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://app.example.com
CORS_CREDENTIALS=true

# Restart server
npm start
```

### Environment Variables Not Loading

**Symptoms**:
- Default values being used instead of .env values
- Server can't find configuration

**Solutions**:

1. **Verify .env file location**:
   ```bash
   # .env should be in backend directory
   ls -la backend/.env
   ```

2. **Check .env file syntax**:
   ```bash
   # No spaces around equals sign
   PORT=3001          # ✅ Correct
   PORT = 3001        # ❌ Wrong
   
   # No quotes needed (usually)
   API_KEY=abc123     # ✅ Correct
   API_KEY="abc123"   # ⚠️ Includes quotes in value
   ```

3. **Verify dotenv is loading**:
   ```javascript
   // In server.js
   import dotenv from 'dotenv';
   dotenv.config();
   console.log('Environment loaded:', {
     port: process.env.PORT,
     hasApiKey: !!process.env.API_KEY
   });
   ```

### Database Connection Issues

**Symptoms**:
- Can't write to database
- Permission errors

**Solutions**:

1. **Check DATA_DIR permissions**:
   ```bash
   # Ensure directory exists and is writable
   mkdir -p .data
   chmod 755 .data
   ```

2. **Verify path in Docker**:
   ```yaml
   # docker-compose.yml
   volumes:
     - backend-data:/data  # Mount volume
   environment:
     DATA_DIR: /data       # Match volume path
   ```

### High Memory Usage

**Symptoms**:
- Server crashes with out-of-memory errors
- Slow performance over time

**Solutions**:

1. **Increase Node.js heap size**:
   ```bash
   # In .env
   NODE_OPTIONS=--max-old-space-size=4096
   
   # Or in package.json
   "start": "node --max-old-space-size=4096 src/server.js"
   ```

2. **Enable garbage collection logging**:
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 --trace-gc
   ```

3. **Monitor memory usage**:
   ```bash
   # Check process memory
   ps aux | grep node
   
   # Monitor in real-time
   top -p $(pgrep -f "node.*server.js")
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check server logs**:
   ```bash
   # Development
   npm run dev
   
   # Production with verbose logging
   LOG_LEVEL=debug npm start
   ```

2. **Enable debug mode**:
   ```bash
   DEBUG=true LOG_LEVEL=debug npm start
   ```

3. **Review GitHub issues**: [github.com/clduab11/gemini-flow/issues](https://github.com/clduab11/gemini-flow/issues)

4. **Create a new issue** with:
   - Environment configuration (sanitized, no secrets!)
   - Error messages and stack traces
   - Steps to reproduce
   - System information (OS, Node version, etc.)

# 🐳 Docker Deployment Guide

This guide provides comprehensive instructions for building, running, and securing the Gemini Flow backend using Docker.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Building the Image](#building-the-image)
- [Running the Container](#running-the-container)
- [Docker Compose](#docker-compose)
- [Security Verification](#security-verification)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🎯 Overview

### Multi-Stage Build Architecture

The Dockerfile uses a two-stage build process:

1. **Builder Stage** (node:18-alpine)
   - Installs all dependencies (including devDependencies)
   - Prepares application for production
   - Prunes development dependencies

2. **Production Stage** (node:18-alpine)
   - Minimal runtime image
   - Non-root user (geminiflow, UID 1001)
   - dumb-init for proper signal handling
   - Security hardening

### Security Features

- ✅ **Non-root user**: Runs as UID 1001 (geminiflow)
- ✅ **Multi-stage build**: Smaller image, no build tools in production
- ✅ **Signal handling**: dumb-init handles SIGTERM/SIGINT properly
- ✅ **File ownership**: All files owned by non-root user
- ✅ **Health checks**: Validates service availability
- ✅ **Resource limits**: CPU and memory constraints via docker-compose
- ✅ **Security options**: no-new-privileges flag enabled

### Image Size Comparison

| Build Type | Size | Reduction |
|------------|------|-----------|
| Single-stage (baseline) | ~180MB | - |
| Multi-stage (optimized) | ~140MB | 22% |

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Using Docker CLI

```bash
# Build image
docker build -t gemini-flow-backend:latest backend/

# Run container
docker run -d \
  --name gemini-flow-backend \
  -p 3001:3001 \
  -e GOOGLE_API_KEY="your-api-key" \
  gemini-flow-backend:latest

# View logs
docker logs -f gemini-flow-backend

# Stop container
docker stop gemini-flow-backend
```

## 🔨 Building the Image

### Basic Build

```bash
cd backend
docker build -t gemini-flow-backend:latest .
```

### Build with Arguments

```bash
docker build \
  --build-arg BUILD_VERSION=1.0.0 \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  -t gemini-flow-backend:latest \
  backend/
```

### Build with No Cache

```bash
docker build --no-cache -t gemini-flow-backend:latest backend/
```

### Multi-platform Build

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t gemini-flow-backend:latest \
  backend/
```

## 🏃 Running the Container

### Basic Run

```bash
docker run -d \
  --name gemini-flow-backend \
  -p 3001:3001 \
  gemini-flow-backend:latest
```

### With Environment Variables

```bash
docker run -d \
  --name gemini-flow-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e LOG_LEVEL=info \
  -e GOOGLE_API_KEY="your-api-key-here" \
  gemini-flow-backend:latest
```

### With Volume Mounts

```bash
docker run -d \
  --name gemini-flow-backend \
  -p 3001:3001 \
  -v $(pwd)/data:/app/.data \
  -v $(pwd)/logs:/app/logs \
  -e GOOGLE_API_KEY="your-api-key-here" \
  gemini-flow-backend:latest
```

### With Security Options

```bash
docker run -d \
  --name gemini-flow-backend \
  -p 3001:3001 \
  --user 1001:1001 \
  --security-opt no-new-privileges:true \
  --memory=512m \
  --cpus=1 \
  -e GOOGLE_API_KEY="your-api-key-here" \
  gemini-flow-backend:latest
```

### Generate Secure API Key

```bash
# Generate random API key
export GOOGLE_API_KEY=$(openssl rand -hex 32)

# Or use UUID
export GOOGLE_API_KEY=$(uuidgen)

# Run with generated key
docker run -d \
  --name gemini-flow-backend \
  -p 3001:3001 \
  -e GOOGLE_API_KEY="$GOOGLE_API_KEY" \
  gemini-flow-backend:latest
```

## 🎼 Docker Compose

### Configuration

The `docker-compose.yml` file includes:

- Backend service with security hardening
- Volume mounts for persistent data
- Resource limits (CPU/memory)
- Health checks
- Logging configuration
- Optional Redis service (commented out)

### Commands

```bash
# Start services in detached mode
docker-compose up -d

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart specific service
docker-compose restart backend

# Scale services (if configured)
docker-compose up -d --scale backend=3
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# .env
VERSION=1.0.0
BUILD_DATE=2024-01-01T00:00:00Z
LOG_LEVEL=info
GOOGLE_API_KEY=your-api-key-here
```

## 🔒 Security Verification

### Verify Non-Root User

```bash
# Check user in Dockerfile
docker inspect gemini-flow-backend | grep -i user

# Expected output: "User": "geminiflow" or "User": "1001"
```

### Check Running Processes

```bash
# View processes inside container
docker exec gemini-flow-backend ps aux

# Expected: processes running as UID 1001, not root (UID 0)
```

### Verify File Permissions

```bash
# Check data directory ownership
docker exec gemini-flow-backend ls -la /app/.data

# Expected: drwxr-xr-x geminiflow nodejs
```

### Security Scan

```bash
# Using Docker Scout (if available)
docker scout cves gemini-flow-backend:latest

# Using Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image gemini-flow-backend:latest

# Using Grype
grype gemini-flow-backend:latest
```

### Container Security Checks

```bash
# Check security options
docker inspect gemini-flow-backend | jq '.[0].HostConfig.SecurityOpt'

# Expected: ["no-new-privileges:true"]

# Check if running as root
docker exec gemini-flow-backend id

# Expected: uid=1001(geminiflow) gid=1001(nodejs)

# Check capabilities
docker inspect gemini-flow-backend | jq '.[0].HostConfig.CapDrop'
```

## 🏥 Health Checks

### Manual Health Check

```bash
# Check health endpoint
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "service": "gemini-flow-backend"
# }
```

### Docker Health Status

```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Inspect health check logs
docker inspect gemini-flow-backend | jq '.[0].State.Health'

# View health check history
docker inspect gemini-flow-backend | jq '.[0].State.Health.Log'
```

### Health Check from Inside Container

```bash
# Execute health check manually
docker exec gemini-flow-backend node -e \
  "require('http').get('http://localhost:3001/health', (r) => {
    r.on('data', d => console.log(d.toString()));
  })"
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs gemini-flow-backend

# Check if port is already in use
lsof -i :3001

# Check container events
docker events --filter container=gemini-flow-backend
```

### Permission Errors

```bash
# Fix volume permissions on host
sudo chown -R 1001:1001 ./data ./logs

# Or run with correct user
docker run --user 1001:1001 ...
```

### Health Check Failing

```bash
# Test health endpoint manually
docker exec gemini-flow-backend curl http://localhost:3001/health

# Check if Node.js process is running
docker exec gemini-flow-backend ps aux | grep node

# View application logs
docker logs gemini-flow-backend
```

### Build Failures

```bash
# Clean build with no cache
docker build --no-cache -t gemini-flow-backend:latest backend/

# Check for Docker daemon issues
docker system info

# Clean up Docker resources
docker system prune -a
```

### High Memory Usage

```bash
# Check resource usage
docker stats gemini-flow-backend

# Adjust memory limits in docker-compose.yml
# deploy.resources.limits.memory: 512M

# Check for memory leaks in logs
docker logs gemini-flow-backend | grep -i "memory"
```

## 📚 Best Practices

### Development vs Production

**Development:**
```bash
# Use volume mounts for hot reload
docker run -d \
  --name gemini-flow-dev \
  -p 3001:3001 \
  -v $(pwd)/backend/src:/app/src \
  -e NODE_ENV=development \
  gemini-flow-backend:latest
```

**Production:**
```bash
# Use docker-compose with all security options
docker-compose up -d
```

### Logging

```bash
# Follow logs with timestamps
docker logs -f --timestamps gemini-flow-backend

# View last 100 lines
docker logs --tail 100 gemini-flow-backend

# Save logs to file
docker logs gemini-flow-backend > backend.log 2>&1
```

### Updating the Image

```bash
# Pull latest changes
git pull origin main

# Rebuild image
docker-compose build --no-cache backend

# Restart with new image
docker-compose up -d backend

# Verify new image is running
docker ps | grep gemini-flow-backend
```

### Backup and Restore

```bash
# Backup volumes
docker run --rm \
  -v backend-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/backend-data-$(date +%Y%m%d).tar.gz /data

# Restore volumes
docker run --rm \
  -v backend-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/backend-data-20240101.tar.gz -C /
```

### Monitoring

```bash
# Real-time resource usage
docker stats gemini-flow-backend

# Container events
docker events --filter container=gemini-flow-backend --since 1h

# Export metrics
docker inspect gemini-flow-backend | jq '.[0].State'
```

## 🔗 References

- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Issue #81](https://github.com/clduab11/gemini-flow/issues/81)
- [Pull Request #66](https://github.com/clduab11/gemini-flow/pull/66)

## 📝 Notes

- The backend runs on port 3001 by default
- Health check endpoint: `http://localhost:3001/health`
- Non-root user: `geminiflow` (UID 1001)
- Data directory: `/app/.data`
- Logs directory: `/app/logs`
- Base image: `node:18-alpine`
- Signal handler: `dumb-init`

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for similar problems
- Review Docker logs for error messages
- Verify environment variables are set correctly

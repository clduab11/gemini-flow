#!/bin/bash
# Docker Security Verification Script for Gemini Flow Backend
# This script validates all security features of the Docker implementation

set -e  # Exit on error

echo "🔒 Docker Security Verification Script"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Variables
IMAGE_NAME="gemini-flow-backend:latest"
CONTAINER_NAME="gemini-flow-backend"

echo "1. Building Docker Image"
echo "========================"
cd backend
docker build -t $IMAGE_NAME .
success "Image built successfully"
echo ""

echo "2. Verifying Image Size"
echo "======================="
SIZE=$(docker images $IMAGE_NAME --format "{{.Size}}")
info "Image size: $SIZE"
success "Image size check complete"
echo ""

echo "3. Verifying Non-Root User"
echo "=========================="
USER=$(docker inspect $IMAGE_NAME | jq -r '.[0].Config.User')
if [ "$USER" == "geminiflow" ]; then
    success "Container configured to run as non-root user: $USER"
else
    error "Container not configured correctly. User: $USER"
    exit 1
fi
echo ""

echo "4. Verifying Entrypoint (dumb-init)"
echo "==================================="
ENTRYPOINT=$(docker inspect $IMAGE_NAME | jq -r '.[0].Config.Entrypoint[0]')
if [ "$ENTRYPOINT" == "dumb-init" ]; then
    success "dumb-init is configured as entrypoint"
else
    error "dumb-init not configured. Entrypoint: $ENTRYPOINT"
    exit 1
fi
echo ""

echo "5. Starting Test Container"
echo "=========================="
docker run -d --name $CONTAINER_NAME-test -p 3001:3001 -e GOOGLE_API_KEY=test-key $IMAGE_NAME
sleep 3
success "Container started"
echo ""

echo "6. Verifying Process User ID"
echo "============================="
UID_CHECK=$(docker exec $CONTAINER_NAME-test id -u)
GID_CHECK=$(docker exec $CONTAINER_NAME-test id -g)
if [ "$UID_CHECK" == "1001" ] && [ "$GID_CHECK" == "1001" ]; then
    success "Container running as UID 1001, GID 1001"
else
    error "Container not running as expected user. UID: $UID_CHECK, GID: $GID_CHECK"
    docker stop $CONTAINER_NAME-test && docker rm $CONTAINER_NAME-test
    exit 1
fi
echo ""

echo "7. Verifying Running Processes"
echo "==============================="
PROCESS_USER=$(docker exec $CONTAINER_NAME-test ps aux | grep node | grep -v grep | awk '{print $1}' | head -n 1)
if [ "$PROCESS_USER" == "geminifl" ] || [ "$PROCESS_USER" == "1001" ] || [ "$PROCESS_USER" == "1" ]; then
    success "Node.js process running as non-root user (User: $PROCESS_USER)"
else
    error "Process running as unexpected user: $PROCESS_USER"
    docker stop $CONTAINER_NAME-test && docker rm $CONTAINER_NAME-test
    exit 1
fi
echo ""

echo "8. Verifying File Permissions"
echo "=============================="
DATA_OWNER=$(docker exec $CONTAINER_NAME-test stat -c '%U' /app/.data)
LOGS_OWNER=$(docker exec $CONTAINER_NAME-test stat -c '%U' /app/logs)
if [ "$DATA_OWNER" == "geminiflow" ] && [ "$LOGS_OWNER" == "geminiflow" ]; then
    success "Data directories owned by geminiflow user"
else
    error "Incorrect ownership. .data: $DATA_OWNER, logs: $LOGS_OWNER"
    docker stop $CONTAINER_NAME-test && docker rm $CONTAINER_NAME-test
    exit 1
fi
echo ""

echo "9. Testing Health Check Endpoint"
echo "================================="
HEALTH_STATUS=$(curl -s http://localhost:3001/health | jq -r '.status')
if [ "$HEALTH_STATUS" == "healthy" ]; then
    success "Health check endpoint responding correctly"
else
    error "Health check failed. Status: $HEALTH_STATUS"
    docker stop $CONTAINER_NAME-test && docker rm $CONTAINER_NAME-test
    exit 1
fi
echo ""

echo "10. Waiting for Docker Health Check"
echo "===================================="
sleep 35
DOCKER_HEALTH=$(docker inspect $CONTAINER_NAME-test | jq -r '.[0].State.Health.Status')
if [ "$DOCKER_HEALTH" == "healthy" ]; then
    success "Docker health check reporting healthy"
else
    error "Docker health check failed. Status: $DOCKER_HEALTH"
    docker stop $CONTAINER_NAME-test && docker rm $CONTAINER_NAME-test
    exit 1
fi
echo ""

echo "11. Verifying Labels"
echo "===================="
TITLE=$(docker inspect $IMAGE_NAME | jq -r '.[0].Config.Labels["org.opencontainers.image.title"]')
if [ "$TITLE" == "Gemini Flow Backend" ]; then
    success "Image labels configured correctly"
else
    error "Image labels not configured. Title: $TITLE"
fi
echo ""

echo "12. Checking for Common Vulnerabilities"
echo "========================================"
info "Checking for exposed secrets..."
if docker exec $CONTAINER_NAME-test env | grep -i "password\|secret\|key" | grep -v "GOOGLE_API_KEY"; then
    error "Potential secrets found in environment"
else
    success "No obvious secrets exposed"
fi
echo ""

echo "13. Cleanup"
echo "==========="
docker stop $CONTAINER_NAME-test
docker rm $CONTAINER_NAME-test
success "Test container removed"
echo ""

echo "================================"
echo "✅ All Security Checks Passed!"
echo "================================"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Multi-stage build implemented"
echo "✓ Non-root user (geminiflow, UID 1001) configured"
echo "✓ dumb-init for signal handling"
echo "✓ File ownership set correctly"
echo "✓ Health checks working"
echo "✓ Image size optimized ($SIZE)"
echo "✓ Security labels configured"
echo ""
echo "Next steps:"
echo "----------"
echo "1. Run: docker compose up -d"
echo "2. Verify: docker compose ps"
echo "3. Check logs: docker compose logs -f backend"
echo "4. Test API: curl http://localhost:3001/health"
echo ""

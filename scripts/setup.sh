#!/bin/bash

###############################################################################
# Gemini Flow - One-Command Setup Script
# Sprint 8: System Integration & Developer Experience
#
# This script automates the complete setup process for local development.
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Gemini Flow - Development Setup                   ║${NC}"
echo -e "${BLUE}║         Sprint 8: System Integration                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Check Prerequisites
###############################################################################

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f 2 | cut -d'.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ git $(git --version | cut -d' ' -f3)${NC}"

echo ""

###############################################################################
# Install Backend Dependencies
###############################################################################

echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd "$PROJECT_ROOT/backend"

if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Backend package.json not found${NC}"
    exit 1
fi

echo ""

###############################################################################
# Install Frontend Dependencies
###############################################################################

echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd "$PROJECT_ROOT/frontend"

if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

echo ""

###############################################################################
# Install Root Dependencies (Super Terminal)
###############################################################################

echo -e "${YELLOW}📦 Installing Super Terminal dependencies...${NC}"
cd "$PROJECT_ROOT"

if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Super Terminal dependencies installed${NC}"
else
    echo -e "${RED}❌ Root package.json not found${NC}"
    exit 1
fi

echo ""

###############################################################################
# Initialize Database
###############################################################################

echo -e "${YELLOW}💾 Initializing database...${NC}"

# Create .data directory for backend
mkdir -p "$PROJECT_ROOT/backend/.data"
echo -e "${GREEN}✓ Database directory created${NC}"

# Create .gemini-flow directory for Super Terminal
mkdir -p "$HOME/.gemini-flow/workflows"
mkdir -p "$HOME/.gemini-flow/logs"
echo -e "${GREEN}✓ Super Terminal directories created${NC}"

echo ""

###############################################################################
# Generate API Key
###############################################################################

echo -e "${YELLOW}🔐 Generating API key...${NC}"

# Generate a random API key
API_KEY="dev-$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)"

# Create backend .env file
cat > "$PROJECT_ROOT/backend/.env" << EOF
# Backend Environment Variables
PORT=3001
API_KEY=${API_KEY}
NODE_ENV=development

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
EOF

echo -e "${GREEN}✓ Backend .env file created${NC}"

# Create frontend .env file
cat > "$PROJECT_ROOT/frontend/.env" << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
VITE_API_KEY=${API_KEY}
EOF

echo -e "${GREEN}✓ Frontend .env file created${NC}"

# Create root .env file for Super Terminal
cat > "$PROJECT_ROOT/.env" << EOF
# Super Terminal Environment Variables
API_KEY=${API_KEY}
API_BASE_URL=http://localhost:3001/api
WS_URL=ws://localhost:3001/ws
EOF

echo -e "${GREEN}✓ Super Terminal .env file created${NC}"

echo -e "${BLUE}ℹ️  Generated API Key: ${API_KEY}${NC}"

echo ""

###############################################################################
# Check Port Availability
###############################################################################

echo -e "${YELLOW}🔌 Checking port availability...${NC}"

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
        return 0
    fi
}

check_port 3001 || echo -e "${YELLOW}  Backend might fail to start${NC}"
check_port 5173 || echo -e "${YELLOW}  Frontend might fail to start${NC}"

echo ""

###############################################################################
# Build TypeScript
###############################################################################

echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
cd "$PROJECT_ROOT"

if [ -f "tsconfig.json" ]; then
    npm run build 2>/dev/null || echo -e "${YELLOW}⚠️  TypeScript build skipped (optional)${NC}"
fi

echo ""

###############################################################################
# Create Helper Scripts
###############################################################################

echo -e "${YELLOW}📝 Creating helper scripts...${NC}"

# Create dev.sh script
cat > "$PROJECT_ROOT/scripts/dev.sh" << 'EOF'
#!/bin/bash
# Start all services for development

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Starting Gemini Flow Development Servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting backend on http://localhost:3001..."
cd "$PROJECT_ROOT/backend" && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend on http://localhost:5173..."
cd "$PROJECT_ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "WebSocket: ws://localhost:3001/ws"
echo "Health:   http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
EOF

chmod +x "$PROJECT_ROOT/scripts/dev.sh"
echo -e "${GREEN}✓ Created dev.sh${NC}"

# Create health-check script
cat > "$PROJECT_ROOT/scripts/health-check.sh" << 'EOF'
#!/bin/bash
# Check health of all services

echo "🏥 Checking service health..."
echo ""

# Check backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not running"
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running"
fi

echo ""
EOF

chmod +x "$PROJECT_ROOT/scripts/health-check.sh"
echo -e "${GREEN}✓ Created health-check.sh${NC}"

echo ""

###############################################################################
# Setup Complete
###############################################################################

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Setup Complete!                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "  1. Start all services:"
echo -e "     ${YELLOW}./scripts/dev.sh${NC}"
echo ""
echo -e "  2. Or start services individually:"
echo -e "     ${YELLOW}cd backend && npm start${NC}    (Backend API)"
echo -e "     ${YELLOW}cd frontend && npm run dev${NC}  (Frontend UI)"
echo -e "     ${YELLOW}npm run super-terminal -- --tui${NC}  (Super Terminal)"
echo ""
echo -e "  3. Access the application:"
echo -e "     Backend:  ${BLUE}http://localhost:3001${NC}"
echo -e "     Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "     Health:   ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "  4. Check service health:"
echo -e "     ${YELLOW}./scripts/health-check.sh${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo -e "  - Getting Started: ${YELLOW}docs/GETTING_STARTED.md${NC}"
echo -e "  - Architecture:    ${YELLOW}docs/ARCHITECTURE_OVERVIEW.md${NC}"
echo -e "  - API Reference:   ${YELLOW}http://localhost:3001/health${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""

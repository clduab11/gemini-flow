#!/bin/bash

# ========================================
# Start all services for Gemini Flow + THE_ORCHESTRATOR
# ========================================

echo "================================================"
echo " GEMINI FLOW + THE_ORCHESTRATOR STARTUP SCRIPT"
echo "================================================"
echo ""

# Check for required API keys
echo "Checking environment variables..."
if [ -z "$GEMINI_API_KEY" ]; then
    echo "WARNING: GEMINI_API_KEY not set - Gemini features will be limited"
fi
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "WARNING: ANTHROPIC_API_KEY not set - THE_ORCHESTRATOR features will be limited"
fi
echo ""

# Kill any existing processes on our ports
echo "Cleaning up old processes..."
npx kill-port 3001 5173 5174 8000 2>/dev/null
sleep 2

echo "================================================"
echo "Starting services..."
echo "================================================"
echo ""

# Start Backend Node.js API (port 3001)
echo "[1/3] Starting Backend API (Node.js) on port 3001..."
(cd backend && npm start) &
BACKEND_PID=$!
sleep 3

# Start Frontend React App (port 5173/5174)
echo "[2/3] Starting Frontend (React) on port 5173/5174..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!
sleep 3

# Start Orchestrator Python API (port 8000)
echo "[3/3] Starting Orchestrator API (Python) on port 8000..."
python orchestrator_api.py &
ORCHESTRATOR_PID=$!
sleep 3

echo ""
echo "================================================"
echo " ALL SERVICES STARTED!"
echo "================================================"
echo ""
echo "Services running at:"
echo "  - Frontend:        http://localhost:5173 (or 5174)"
echo "  - Backend API:     http://localhost:3001"
echo "  - Orchestrator API: http://localhost:8000"
echo "  - API Docs:        http://localhost:8000/docs"
echo ""
echo "Process IDs:"
echo "  - Backend:     $BACKEND_PID"
echo "  - Frontend:    $FRONTEND_PID"
echo "  - Orchestrator: $ORCHESTRATOR_PID"
echo ""
echo "Opening frontend in browser..."

# Open frontend in default browser
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:5173
fi

echo ""
echo "Services are running. Press Ctrl+C to stop all services."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $ORCHESTRATOR_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for all background processes
wait
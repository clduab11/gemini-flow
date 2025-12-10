@echo off
REM ========================================
REM Start all services for Gemini Flow + THE_ORCHESTRATOR
REM ========================================

echo ================================================
echo  GEMINI FLOW + THE_ORCHESTRATOR STARTUP SCRIPT
echo ================================================
echo.

REM Check for required API keys
echo Checking environment variables...
if not defined GEMINI_API_KEY (
    echo WARNING: GEMINI_API_KEY not set - Gemini features will be limited
)
if not defined ANTHROPIC_API_KEY (
    echo WARNING: ANTHROPIC_API_KEY not set - THE_ORCHESTRATOR features will be limited
)
echo.

REM Kill any existing processes on our ports
echo Cleaning up old processes...
call npx kill-port 3001 5173 5174 8000 2>nul
timeout /t 2 /nobreak >nul

echo ================================================
echo Starting services...
echo ================================================
echo.

REM Start Backend Node.js API (port 3001)
echo [1/3] Starting Backend API (Node.js) on port 3001...
start "Backend API" cmd /c "cd backend && npm start"
timeout /t 3 /nobreak >nul

REM Start Frontend React App (port 5173/5174)
echo [2/3] Starting Frontend (React) on port 5173/5174...
start "Frontend" cmd /c "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Orchestrator Python API (port 8000)
echo [3/3] Starting Orchestrator API (Python) on port 8000...
start "Orchestrator API" cmd /c "python orchestrator_api.py"
timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo  ALL SERVICES STARTED!
echo ================================================
echo.
echo Services running at:
echo   - Frontend:        http://localhost:5173 (or 5174)
echo   - Backend API:     http://localhost:3001
echo   - Orchestrator API: http://localhost:8000
echo   - API Docs:        http://localhost:8000/docs
echo.
echo To stop all services, close this window and all command windows.
echo.
echo Press any key to open the frontend in your browser...
pause >nul

REM Open frontend in default browser
start http://localhost:5173

echo.
echo Services are running. Press Ctrl+C in each window to stop.
pause
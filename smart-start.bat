@echo off
REM ========================================
REM SMART START - Intelligent System Activation
REM ========================================

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║         THE_ORCHESTRATOR - INTELLIGENT STARTUP           ║
echo  ╠═══════════════════════════════════════════════════════════╣
echo  ║  Detecting environment and configuring automatically...   ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

REM Detect if running in Claude Code or standard environment
set CLAUDE_CODE=false
set HAS_API_KEYS=false

REM Check for Claude Code environment
if defined ANTHROPIC_API_KEY (
    echo [√] Claude API detected - native mode enabled
    set CLAUDE_CODE=true
    set HAS_API_KEYS=true
)

REM Check for Gemini
if defined GEMINI_API_KEY (
    echo [√] Gemini API detected - native mode enabled
    set HAS_API_KEYS=true
)

REM Smart mode selection
if "%HAS_API_KEYS%"=="false" (
    echo.
    echo  ┌─────────────────────────────────────────────────┐
    echo  │  NO API KEYS DETECTED - CLI NATIVE MODE        │
    echo  │                                                 │
    echo  │  Running in intelligent mode that uses         │
    echo  │  Claude Code's native capabilities             │
    echo  │  No external API keys needed!                  │
    echo  └─────────────────────────────────────────────────┘
    echo.

    echo Starting CLI-aware orchestrator...
    python cli_orchestrator.py

) else (
    echo.
    echo  ┌─────────────────────────────────────────────────┐
    echo  │  API KEYS DETECTED - FULL SYSTEM MODE          │
    echo  └─────────────────────────────────────────────────┘
    echo.

    echo Select startup mode:
    echo   [1] STANDBY MODE - Wait for user commands (recommended)
    echo   [2] FULL VISUAL - Start all services with UI
    echo   [3] HEADLESS - Backend only, no UI
    echo   [4] CLI ONLY - Direct orchestrator access
    echo.

    set /p MODE="Enter choice (1-4): "

    if "%MODE%"=="1" goto STANDBY
    if "%MODE%"=="2" goto FULL
    if "%MODE%"=="3" goto HEADLESS
    if "%MODE%"=="4" goto CLI
    goto STANDBY
)

:STANDBY
echo.
echo ═══════════════════════════════════════════════════════
echo  STANDBY MODE - System ready, waiting for commands
echo ═══════════════════════════════════════════════════════
echo.
echo Starting minimal services...

REM Start only the orchestrator in standby
start "Orchestrator Standby" /min cmd /c "python cli_orchestrator.py"

echo.
echo System is now in STANDBY mode.
echo Any user prompt will activate full orchestration.
echo.
goto END

:FULL
echo.
echo Starting full visual system...
call start-all.bat
goto END

:HEADLESS
echo.
echo Starting headless backend...
start "Backend API" /min cmd /c "cd backend && npm start"
start "Orchestrator API" /min cmd /c "python orchestrator_api.py"
echo.
echo Backend services running (no UI).
goto END

:CLI
echo.
echo Starting CLI-only orchestrator...
python cli_orchestrator.py
goto END

:END
echo.
echo ═══════════════════════════════════════════════════════
echo  System ready. Just type your command to begin.
echo ═══════════════════════════════════════════════════════
echo.
pause
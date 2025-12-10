@echo off
REM ========================================
REM PROJECT FACTORY - Create New Project
REM ========================================

cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                   PROJECT FACTORY                         ║
echo ║         Create Self-Contained AI Systems                  ║
echo ╠═══════════════════════════════════════════════════════════╣
echo ║  Each project becomes independent while using             ║
echo ║  ALL intelligence from the parent system                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set /p PROJECT_NAME="Enter project name: "

echo.
echo Creating new project: %PROJECT_NAME%
echo.

python project_generator.py "%PROJECT_NAME%"

echo.
echo ════════════════════════════════════════════════════════════
echo Project created successfully!
echo ════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo 1. Navigate to PROJECT_FACTORY/projects/%PROJECT_NAME%_[timestamp]
echo 2. Edit project_spec.md with your requirements
echo 3. Run: python build.py
echo 4. Your self-contained system will be generated!
echo.
pause
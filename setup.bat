@echo off
setlocal enabledelayedexpansion

echo =================================================================
echo    Local Autonomous AI Agent - Windows Setup and Verification
echo =================================================================

set MISSING_ITEMS=0

:: 1. Check Node.js
echo.
echo [1/8] Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [FAIL] Node.js is NOT detected in PATH.
    echo          Please download and install Node.js v18+ from https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo   [PASS] Node.js detected: %NODE_VERSION%

:: 2. Check & Install Dependencies
echo.
echo [2/8] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo   [FAIL] npm install encountered an error.
    exit /b 1
)
echo   [PASS] Dependencies installed cleanly.

:: 3. Create Required Workspace Directories
echo.
echo [3/8] Ensuring portable workspace directory structure...
if not exist "agent_workspace" mkdir "agent_workspace"
if not exist "agent_workspace\projects" mkdir "agent_workspace\projects"
if not exist "agent_workspace\memory" mkdir "agent_workspace\memory"
if not exist "agent_workspace\backups" mkdir "agent_workspace\backups"
if not exist "agent_workspace\logs" mkdir "agent_workspace\logs"
if not exist "agent_workspace\downloads" mkdir "agent_workspace\downloads"
if not exist "agent_workspace\research" mkdir "agent_workspace\research"
if not exist "agent_workspace\temporary" mkdir "agent_workspace\temporary"
echo   [PASS] Workspace directories initialized in .\agent_workspace

:: 4. Create .env from .env.example if necessary
echo.
echo [4/8] Checking environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo   [INFO] Created .env from .env.example with safe default values.
    ) else (
        type nul > ".env"
        echo   [INFO] Created empty .env file.
    )
) else (
    echo   [PASS] Existing .env found.
)

:: 5. Check whether Ollama exists
echo.
echo [5/8] Checking Ollama binary...
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo   [PASS] Ollama command detected.
    set OLLAMA_INSTALLED=1
) else (
    echo   [NOT CONFIGURED] Ollama is not installed on this PC.
    echo                    Download Ollama from: https://ollama.com/download
    set /a MISSING_ITEMS+=1
    set OLLAMA_INSTALLED=0
)

:: 6. Check whether Ollama is running
echo.
echo [6/8] Checking Ollama daemon service...
set OLLAMA_RUNNING=0
if %OLLAMA_INSTALLED% equ 1 (
    curl -s --connect-timeout 2 http://127.0.0.1:11434/api/version >nul 2>nul
    if %errorlevel% equ 0 (
        echo   [PASS] Ollama service is ONLINE at http://127.0.0.1:11434
        set OLLAMA_RUNNING=1
    ) else (
        echo   [NOT CONFIGURED] Ollama daemon is offline.
        echo                    Start Ollama from Start Menu or run: ollama serve
        set /a MISSING_ITEMS+=1
    )
) else (
    echo   [SKIPPED] Ollama binary not found; skipping daemon probe.
)

:: 7. Check whether a local model exists
echo.
echo [7/8] Checking installed local LLM models...
if %OLLAMA_RUNNING% equ 1 (
    call ollama list
) else (
    echo   [NOT CONFIGURED] Cannot verify models (Ollama is offline or not installed).
    echo                    Recommended models to pull after installing Ollama:
    echo                      ollama pull llama3.2:3b
    echo                      ollama pull qwen2.5-coder:1.5b
)

:: 8. Check Playwright / Chromium availability
echo.
echo [8/8] Checking Playwright / Chromium headless browser...
call npx playwright --version >nul 2>nul
if %errorlevel% equ 0 (
    echo   [PASS] Playwright CLI available.
    echo   [INFO] To install or update Chromium browser: npx playwright install chromium
) else (
    echo   [INFO] To enable Playwright headless Chromium browser automation:
    echo          npx playwright install chromium
)

echo.
echo =================================================================
echo    SETUP STATUS SUMMARY
echo =================================================================
if %MISSING_ITEMS% equ 0 (
    echo   [✓] ALL LOCAL PREREQUISITES VERIFIED! Ready to launch.
) else (
    echo   [i] Setup completed with %MISSING_ITEMS% non-blocking item(s) to configure.
    echo       The agent can start, and will guide you to complete missing parts.
)
echo.
echo   To launch the Agent Dashboard:
echo     npm run dev        (development mode)
echo     npm run start      (production mode)
echo.
echo   To run the 13-point verification suite:
echo     npm run verify:phase15
echo =================================================================


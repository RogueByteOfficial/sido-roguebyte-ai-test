#!/usr/bin/env bash
# Local Autonomous AI Agent - Setup Script (POSIX / Linux / macOS / WSL)

echo "================================================================="
echo "   Local Autonomous AI Agent — Setup & Environment Verification  "
echo "================================================================="

MISSING_ITEMS=0

# 1. Check Node.js
echo ""
echo "[1/8] Checking Node.js runtime..."
if ! command -v node &> /dev/null; then
    echo "  [FAIL] Node.js is NOT installed or not in PATH."
    echo "         Please install Node.js (v18, v20, or v22 LTS) from https://nodejs.org/"
    MISSING_ITEMS=$((MISSING_ITEMS + 1))
    exit 1
else
    NODE_VER=$(node -v)
    echo "  [PASS] Node.js detected: $NODE_VER"
fi

# 2. Check & Install Dependencies
echo ""
echo "[2/8] Installing project dependencies..."
if ! npm install; then
    echo "  [FAIL] npm install encountered an error. Please resolve and rerun."
    exit 1
else
    echo "  [PASS] Dependencies installed cleanly."
fi

# 3. Create Required Workspace Directories
echo ""
echo "[3/8] Ensuring portable workspace directory structure..."
mkdir -p agent_workspace/projects
mkdir -p agent_workspace/memory
mkdir -p agent_workspace/backups
mkdir -p agent_workspace/logs
mkdir -p agent_workspace/downloads
mkdir -p agent_workspace/research
mkdir -p agent_workspace/temporary
echo "  [PASS] Workspace directories initialized in ./agent_workspace"

# 4. Create .env from .env.example if necessary
echo ""
echo "[4/8] Checking environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "  [INFO] Created .env from .env.example with safe default values."
    else
        touch .env
        echo "  [INFO] Created empty .env file."
    fi
else
    echo "  [PASS] Existing .env found."
fi

# 5. Check whether Ollama exists
echo ""
echo "[5/8] Checking Ollama binary..."
OLLAMA_INSTALLED=false
if command -v ollama &> /dev/null; then
    OLLAMA_INSTALLED=true
    echo "  [PASS] Ollama binary detected: $(ollama --version 2>/dev/null || echo 'Installed')"
else
    echo "  [NOT CONFIGURED] Ollama is not installed on this machine."
    echo "                   Download & install Ollama from: https://ollama.com"
    MISSING_ITEMS=$((MISSING_ITEMS + 1))
fi

# 6. Check whether Ollama is running
echo ""
echo "[6/8] Checking Ollama daemon service..."
OLLAMA_RUNNING=false
if [ "$OLLAMA_INSTALLED" = true ]; then
    OLLAMA_RES=$(curl -s --connect-timeout 2 http://127.0.0.1:11434/api/version 2>/dev/null || true)
    if [[ "$OLLAMA_RES" == *"version"* ]]; then
        OLLAMA_RUNNING=true
        echo "  [PASS] Ollama service is ONLINE at http://127.0.0.1:11434"
    else
        echo "  [NOT CONFIGURED] Ollama daemon is offline."
        echo "                   Start the service in another terminal by running: ollama serve"
        MISSING_ITEMS=$((MISSING_ITEMS + 1))
    fi
else
    echo "  [SKIPPED] Ollama binary not found; skipping daemon probe."
fi

# 7. Check whether a local model exists
echo ""
echo "[7/8] Checking installed local LLM models..."
if [ "$OLLAMA_RUNNING" = true ]; then
    TAGS_JSON=$(curl -s --connect-timeout 3 http://127.0.0.1:11434/api/tags 2>/dev/null || true)
    if [[ "$TAGS_JSON" == *"\"models\":[]"* ]] || [[ "$TAGS_JSON" != *"\"models\""* ]]; then
        echo "  [NOT CONFIGURED] NO LOCAL MODEL INSTALLED in Ollama."
        echo "                   Pull an agent-capable coding model with one of:"
        echo "                     ollama pull llama3.2:3b          # Recommended for general use"
        echo "                     ollama pull qwen2.5-coder:1.5b   # Lightweight coding model"
        echo "                     ollama pull qwen2.5-coder:7b     # High precision (16GB+ RAM)"
        MISSING_ITEMS=$((MISSING_ITEMS + 1))
    else
        echo "  [PASS] Installed local models found."
        ollama list 2>/dev/null || true
    fi
else
    echo "  [NOT CONFIGURED] Cannot verify models (Ollama is offline or not installed)."
    echo "                   Once Ollama is installed and running, run:"
    echo "                     ollama pull llama3.2:3b"
fi

# 8. Check Playwright / Chromium availability
echo ""
echo "[8/8] Checking Playwright / Chromium headless browser..."
if npx playwright --version &> /dev/null; then
    echo "  [PASS] Playwright CLI available: $(npx playwright --version 2>/dev/null)"
    # Check if chromium browser binary exists
    if [ -d "$HOME/.cache/ms-playwright" ] || [ -d "$LOCALAPPDATA/ms-playwright" ]; then
        echo "  [PASS] Playwright browser cache detected."
    else
        echo "  [INFO] Playwright browser binaries may not be downloaded."
        echo "         To enable headless Chromium execution, run: npx playwright install chromium"
    fi
else
    echo "  [INFO] Playwright CLI not installed globally. To install Chromium for browser automation:"
    echo "         npx playwright install chromium"
fi

echo ""
echo "================================================================="
echo "   SETUP STATUS SUMMARY                                          "
echo "================================================================="
if [ $MISSING_ITEMS -eq 0 ]; then
    echo "  [✓] ALL LOCAL PREREQUISITES VERIFIED! Ready to launch."
else
    echo "  [i] Setup completed with $MISSING_ITEMS non-blocking item(s) to configure."
    echo "      The agent can start, and will guide you to complete missing parts."
fi
echo ""
echo "  To launch the Agent Dashboard:"
echo "    npm run dev        (development mode with live reload)"
echo "    npm run start      (production mode)"
echo ""
echo "  To run the 13-point verification suite:"
echo "    npm run verify:phase15"
echo "================================================================="


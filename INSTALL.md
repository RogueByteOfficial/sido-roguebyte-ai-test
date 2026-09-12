# Installation & Setup Guide — Local Autonomous AI Agent

This guide covers setup and running the Local Autonomous AI Agent on your personal computer (Linux, macOS, or Windows).

---

## 1. System Requirements

- **Node.js**: v18+ (v20 or v22 LTS recommended).
- **Git**: Installed and accessible in your system PATH.
- **RAM**:
  - Minimum 4 GB RAM (works with lightweight models like `qwen2.5-coder:1.5b` or `llama3.2:1b`).
  - Recommended 8 GB RAM (runs `llama3.2:3b` comfortably).
  - 16 GB+ RAM (supports `qwen2.5-coder:7b` for advanced coding).
- **Disk Space**: ~5 GB free space for Node packages, workspace files, and local LLM weights.

---

## 2. One-Command Setup Scripts

### Linux / macOS / WSL:
```bash
chmod +x setup.sh
./setup.sh
```

### Windows (PowerShell / Command Prompt):
```cmd
setup.bat
```

The setup script automatically checks your Node.js version, installs npm dependencies, ensures directory structure (`agent_workspace/`), provisions `.env` from `.env.example`, checks Ollama status, detects local models, and verifies Playwright/Chromium availability.

---

## 3. Manual Step-by-Step Installation

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
Default values connect to local Ollama (`http://127.0.0.1:11434`) and local workspace (`./agent_workspace`).

### Step 3: Install & Start Ollama (Local LLM)
1. **Download & Install**:
   - **macOS / Windows**: Download installer from [https://ollama.com](https://ollama.com)
   - **Linux**: Run `curl -fsSL https://ollama.com/install.sh | sh`
2. **Start the Ollama daemon**:
   ```bash
   ollama serve
   ```
3. **Pull an agent coding model**:
   ```bash
   # Recommended default (8GB+ RAM):
   ollama pull llama3.2:3b

   # Ultra-lightweight coding (4GB RAM):
   ollama pull qwen2.5-coder:1.5b

   # High accuracy full-stack (16GB+ RAM):
   ollama pull qwen2.5-coder:7b
   ```

### Step 4: Install Playwright & Chromium (Real Headless Browser)
The project includes a built-in W3C DOM Level 4 engine (JSDOM) for zero-dependency DOM verification tests.

To additionally install Playwright and download the official Chromium headless browser binary on your target machine:
```bash
npx playwright install chromium
```
*(On Linux systems without GUI libraries, you can run `npx playwright install --with-deps chromium` if system dependencies are required).*

> **Note**: The system verifies browser engines strictly. Chromium is only marked as operational when it has physically launched on the device.

---

## 4. Starting the Agent

### Development Mode (with Live Reload):
```bash
npm run dev
```

### Production Build & Launch:
```bash
npm run build
npm run start
```

Once started, open your web browser to:
**`http://localhost:3000`**

On startup, the server performs a live hardware and model scan, printing detected RAM, CPU cores, Ollama status, and model recommendations directly to your terminal.

---

## 5. Running the Phase 1.5 Verification Suite

To run the complete 13-point diagnostic test and end-to-end autonomous development cycle test:
```bash
npm run verify:phase15
```

---

## 6. Optional External Integrations

All optional integrations default to `NOT CONFIGURED` with zero fake passes. When you are ready to enable them on your local machine:

- **GitHub Remote Push**:
  - Install GitHub CLI: `gh auth login`
  - Or set `GITHUB_TOKEN=ghp_yourPersonalAccessToken` in `.env`.
- **Vercel Cloud Deployment**:
  - Install Vercel CLI: `npm i -g vercel && vercel login`
  - Or set `VERCEL_TOKEN=yourToken` in `.env`.
- **PayPal Sandbox Payments**:
  - Create a sandbox app in [PayPal Developer Portal](https://developer.paypal.com).
  - Set `PAYPAL_SANDBOX_CLIENT_ID` and `PAYPAL_SANDBOX_SECRET` in `.env`.
  - *Production payments are locked by security architecture.*


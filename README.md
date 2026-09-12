# Local Autonomous AI Agent Platform (Phase 1.5)

A 100% locally hosted autonomous AI Agent architecture that operates on consumer hardware using local LLMs (via Ollama or llama.cpp) without requiring paid cloud AI APIs.

---

## Quick Start

Follow these 7 steps to activate the agent on your own machine:

### 1. Install Node.js
Ensure Node.js (v18, v20, or v22 LTS) is installed:
```bash
node -v
```
*(Download from [https://nodejs.org](https://nodejs.org) if not installed).*

### 2. Install Ollama
Download and install Ollama from [https://ollama.com](https://ollama.com).
```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# macOS / Windows
# Download installer directly from https://ollama.com
```

### 3. Install Project Dependencies
Run automated setup or install via npm:
```bash
# Automated setup (checks all tools & sets up workspace):
chmod +x setup.sh && ./setup.sh     # Linux / macOS
setup.bat                           # Windows

# Or manually:
npm install
```

### 4. Pull a Local Model
Pull an agent-capable coding model into Ollama:
```bash
# Balanced model (recommended for 8GB+ RAM):
ollama pull llama3.2:3b

# Lightweight coding model (for 4GB RAM):
ollama pull qwen2.5-coder:1.5b

# High accuracy coding model (for 16GB+ RAM):
ollama pull qwen2.5-coder:7b
```

### 5. Start the Agent
```bash
# Development mode:
npm run dev

# Or production mode:
npm run build
npm run start
```

### 6. Open the Dashboard
Navigate to:
**`http://localhost:3000`**

### 7. Run Phase 1.5 Verification
Run the 13-point diagnostic suite and end-to-end autonomous cycle test:
```bash
npm run verify:phase15
```

---

## Essential Local Commands Reference

### How to Check Ollama
```bash
# Check if the Ollama daemon is reachable:
curl http://127.0.0.1:11434/api/version

# Start Ollama service if offline:
ollama serve
```

### How to List Installed Models
```bash
ollama list
```

### How to Install a New Model
```bash
ollama pull <model-name>
# Example:
ollama pull llama3.2:3b
```

### How to Start the Agent
```bash
npm run dev      # Boots the server and mounts Vite UI
# or
npm run start    # Starts the compiled standalone bundle (dist/server.cjs)
```

### How to Run Verification
```bash
npm run verify:phase15
```

---

## How to Enable Optional Cloud Integrations Later

By default, external cloud services are marked `NOT CONFIGURED` with zero fake passes. When you are ready to enable them on your local machine:

### 1. Enable GitHub Integration
- **Via GitHub CLI**:
  ```bash
  gh auth login
  ```
- **Or via Environment**:
  Generate a Personal Access Token (repo scope) at `https://github.com/settings/tokens` and add to `.env`:
  ```env
  GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
  ```

### 2. Enable Vercel Cloud Deployment
- **Via Vercel CLI**:
  ```bash
  npm install -g vercel
  vercel login
  ```
- **Or via Environment**:
  Create an access token at `https://vercel.com/account/tokens` and add to `.env`:
  ```env
  VERCEL_TOKEN=yourVercelTokenHere
  ```

### 3. Enable PayPal Sandbox Payments
- Create a developer app at [https://developer.paypal.com/dashboard/applications/sandbox](https://developer.paypal.com/dashboard/applications/sandbox).
- Add sandbox credentials to `.env`:
  ```env
  PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id
  PAYPAL_SANDBOX_SECRET=your_sandbox_secret
  ```
  *(Live production payments are strictly locked and prohibited by the security boundary).*

---

## Core Architecture & Verification

- **Real Local Models**: Automated detection of Ollama at `http://127.0.0.1:11434`.
- **System Memory Check**: RAM capacity detected on boot; recommends models based on physical memory.
- **W3C DOM Level 4 Engine**: Browser tests use real JSDOM / Playwright DOM mutations (`0 -> 1` counter verification).
- **Workspace Sandboxing**: Path traversal protection and automatic timestamped backups in `agent_workspace/backups/`.
- **Tri-Tier Persistent Memory**: Short-term, long-term, and project memory survive process reboots.
- **Audit & Redaction**: Sensitive tokens are scrubbed from logs before writes to `agent_workspace/logs/audit.log`.


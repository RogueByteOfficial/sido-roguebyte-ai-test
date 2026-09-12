# Configuration Guide

The agent runtime maintains configurations in `agent_workspace/memory/` and environment variables.

## 1. Local AI Model Configuration
- **Ollama Default**: `http://127.0.0.1:11434`
- **llama.cpp Default**: `http://127.0.0.1:8080`
- **Fallback Engine**: The built-in zero-dependency autonomous engine requires no configuration and starts automatically.

## 2. Internet Access
- **Allow Internet**: Permits outbound HTTP/HTTPS requests, browser navigation, and web searches.
- **Block Internet**: Completely isolates the agent to the local machine and sandboxed files.
- Toggle from the UI **Permissions** or **Browser** tab.

## 3. GitHub Configuration
- Option A: GitHub CLI (`gh auth login`).
- Option B: Personal Access Token (PAT) with `repo` scope entered in the GitHub view. Secrets are never printed in logs.

## 4. Vercel Configuration
- Option A: Vercel CLI (`vercel login`).
- Option B: Vercel API Token entered in the Vercel view.

## 5. PayPal Sandbox
- **Default Mode**: `PAYPAL_SANDBOX=true` (Hard-enforced default).
- Provide **Sandbox Client ID** and **Sandbox Secret** via UI.
- All payment creation steps generate human approval requests.

# Troubleshooting Guide

### 1. Ollama connection refused (`ECONNREFUSED 127.0.0.1:11434`)
- Cause: Ollama is not running in the background.
- Solution: Run `ollama serve` in a separate terminal or select the "Built-in Local Autonomous Engine (Zero-dep)" in the Models tab.

### 2. Browser navigation failed
- Cause: Internet access toggle may be turned OFF in Permissions.
- Solution: Check Permissions tab and enable "ALLOW" for Internet.

### 3. GitHub repository creation returns 401
- Cause: Missing or expired GitHub Personal Access Token.
- Solution: Go to GitHub tab and paste a token with `repo` scope or authenticate via `gh auth login`.

### 4. PayPal Sandbox returns 401 Unauthorized
- Cause: Invalid Sandbox Client ID or Client Secret.
- Solution: Confirm you are using Sandbox credentials from `developer.paypal.com` and ensure `PAYPAL_SANDBOX=true`.

### 5. Dangerous command blocked by Security Guard
- Cause: Attempted to run commands like `rm -rf /` or format commands.
- Solution: Review the command. If safe, execute directly through an approved project directory.

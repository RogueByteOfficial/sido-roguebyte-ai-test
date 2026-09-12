# Agent Tool Reference

### 1. Terminal Tool (`terminal`)
- **Action**: Runs shell commands inside `agent_workspace/` or target subdirectories.
- **Parameters**: `command`, `cwdRel`, `timeoutMs`.
- **Security**: Dangerous commands intercepted, secrets redacted, 45s execution limit.

### 2. File Tools (`file_create`, `file_edit`, `file_read`, `file_delete`)
- **Action**: Reads, creates, modifies, and deletes files in the sandboxed workspace.
- **Auto-Backup**: Edits and deletions automatically archive a backup copy in `agent_workspace/backups/`.

### 3. Browser Tool (`browser_open`, `browser_search`)
- **Action**: Performs real HTTP requests, parses DOM, extracts links & text snippets, renders SVG previews, and queries DuckDuckGo for research artifacts.
- **Config**: Honors global Allow/Block Internet toggle.

### 4. GitHub Tool (`git_init`, `git_commit`, `github_create_repo`)
- **Action**: Manages local Git version control and remote GitHub repositories.

### 5. Vercel Tool (`vercel_deploy`)
- **Action**: Deploys web applications to Vercel and streams deployment logs.

### 6. PayPal Sandbox Tool (`paypal_check`, `paypal_create_order`)
- **Action**: Generates sandbox test orders and payment verification. Never moves real money.

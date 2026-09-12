# Security Architecture & Policies

Security is built into every layer of the local autonomous agent.

## 1. Secret Redaction Engine
Any strings matching sensitive credential patterns are redacted before entering stdout, audit logs, or model prompts:
- GitHub PATs (`ghp_...`, `github_pat_...`)
- PayPal tokens and client secrets
- Vercel tokens
- Authorization / Bearer tokens
- Private RSA/SSH keys

## 2. Command Guard & Terminal Restrictions
Commands executed through the terminal tool are inspected by regex heuristics before execution.
Forbidden commands include:
- Low-level disk formatting (`mkfs`, `fdisk`, `dd if=`)
- Root-level deletions (`rm -rf /`, `rm -rf ~`)
- System power manipulations (`shutdown`, `reboot`, `init 0`)
- Fork bombs and unverified remote curl-pipe-to-bash

## 3. Human Approval System
For sensitive operations, the agent halts and creates an approval ticket showing:
- **WHAT WILL HAPPEN**
- **WHY**
- **WHAT DATA WILL BE USED**
- **WHAT ACCOUNT WILL BE AFFECTED**
The agent cannot proceed until the user explicitly selects `[Approve]` in the UI.

## 4. Workspace Sandboxing
Filesystem operations are confined within `agent_workspace/`. Attempting to reference paths outside the root via `../` escapes triggers a Security Sandboxing Violation.
Every modified file automatically generates a timestamped copy in `agent_workspace/backups/`.

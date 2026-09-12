import { TerminalTool } from './terminal.js';
import { SecurityManager } from '../security.js';
import { WorkspaceManager } from '../workspace.js';

export interface GitHubAuthState {
  authenticated: boolean;
  username?: string;
  authMethod: 'CLI' | 'PAT' | 'NONE';
  scopes: string[];
}

export class GitHubTool {
  private terminal: TerminalTool;
  private security: SecurityManager;
  private workspace: WorkspaceManager;
  private patToken: string | null = null;

  constructor(terminal: TerminalTool, security: SecurityManager, workspace: WorkspaceManager) {
    this.terminal = terminal;
    this.security = security;
    this.workspace = workspace;
    if (process.env.GITHUB_TOKEN) {
      this.patToken = process.env.GITHUB_TOKEN.trim();
    }
  }

  public setPersonalAccessToken(token: string): void {
    this.patToken = token.trim();
    this.security.logAudit('GITHUB', 'INFO', 'GitHub Personal Access Token updated (token redacted).');
  }

  public async getStatus(): Promise<GitHubAuthState> {
    // Check GitHub CLI first
    const ghCheck = await this.terminal.execute('gh auth status', { timeoutMs: 5000 });
    if (ghCheck.exitCode === 0) {
      const userMatch = ghCheck.stdout.match(/Logged in to github\.com account ([a-zA-Z0-9_-]+)/i);
      return {
        authenticated: true,
        username: userMatch ? userMatch[1] : 'Authenticated User',
        authMethod: 'CLI',
        scopes: ['repo', 'read:org']
      };
    }

    if (this.patToken) {
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${this.patToken}`,
            'User-Agent': 'Local-AI-Agent/1.0',
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (res.ok) {
          const user = await res.json();
          const scopesHeader = res.headers.get('x-oauth-scopes') || '';
          return {
            authenticated: true,
            username: user.login,
            authMethod: 'PAT',
            scopes: scopesHeader.split(',').map((s) => s.trim()).filter(Boolean)
          };
        }
      } catch {}
    }

    return {
      authenticated: false,
      authMethod: 'NONE',
      scopes: []
    };
  }

  public async gitInit(projectRelDir: string): Promise<any> {
    this.security.logAudit('GITHUB', 'INFO', `Initializing git in ${projectRelDir}`);
    const res = await this.terminal.execute('git init', { cwdRel: projectRelDir });
    return res;
  }

  public async gitStatus(projectRelDir: string): Promise<any> {
    const res = await this.terminal.execute('git status -s', { cwdRel: projectRelDir });
    return res;
  }

  public async gitAddAndCommit(projectRelDir: string, message: string): Promise<any> {
    const cleanMessage = message.replace(/"/g, '\\"');
    await this.terminal.execute('git add .', { cwdRel: projectRelDir });
    const res = await this.terminal.execute(`git commit -m "${cleanMessage}"`, { cwdRel: projectRelDir });
    this.security.logAudit('GITHUB', 'INFO', `Git commit in ${projectRelDir}: "${cleanMessage}"`);
    return res;
  }

  public async gitBranch(projectRelDir: string, branchName: string): Promise<any> {
    return await this.terminal.execute(`git checkout -B ${branchName}`, { cwdRel: projectRelDir });
  }

  public async createRepository(name: string, isPrivate = true): Promise<any> {
    this.security.logAudit('GITHUB', 'INFO', `Creating GitHub repository: ${name} (private: ${isPrivate})`);
    
    // Prefer gh CLI
    const visibility = isPrivate ? '--private' : '--public';
    const cliRes = await this.terminal.execute(`gh repo create ${name} ${visibility} --confirm`, { timeoutMs: 15000 });
    if (cliRes.exitCode === 0) {
      return { success: true, method: 'CLI', output: cliRes.stdout };
    }

    // Fallback to REST API if PAT is configured
    if (this.patToken) {
      const res = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.patToken}`,
          'User-Agent': 'Local-AI-Agent/1.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          private: isPrivate,
          description: 'Created autonomously by Local AI Agent infrastructure'
        })
      });

      if (res.ok) {
        const repo = await res.json();
        return { success: true, method: 'PAT', repoUrl: repo.html_url, cloneUrl: repo.clone_url };
      } else {
        const err = await res.text();
        return { success: false, error: this.security.redact(err) };
      }
    }

    return {
      success: false,
      error: 'GitHub is not authenticated. Please authenticate via GitHub CLI (gh auth login) or configure a Personal Access Token in settings.'
    };
  }

  public async listIssues(repoFullName: string): Promise<any> {
    if (this.patToken) {
      const res = await fetch(`https://api.github.com/repos/${repoFullName}/issues`, {
        headers: {
          'Authorization': `Bearer ${this.patToken}`,
          'User-Agent': 'Local-AI-Agent/1.0'
        }
      });
      if (res.ok) return await res.json();
    }

    const cliRes = await this.terminal.execute(`gh issue list -R ${repoFullName}`, { timeoutMs: 8000 });
    return cliRes.stdout;
  }
}

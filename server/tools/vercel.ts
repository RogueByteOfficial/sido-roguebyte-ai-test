import { TerminalTool } from './terminal.js';
import { SecurityManager } from '../security.js';
import { WorkspaceManager } from '../workspace.js';

export interface VercelAuthState {
  installed: boolean;
  authenticated: boolean;
  username?: string;
  version?: string;
}

export class VercelTool {
  private terminal: TerminalTool;
  private security: SecurityManager;
  private workspace: WorkspaceManager;
  private vercelToken: string | null = null;

  constructor(terminal: TerminalTool, security: SecurityManager, workspace: WorkspaceManager) {
    this.terminal = terminal;
    this.security = security;
    this.workspace = workspace;
    if (process.env.VERCEL_TOKEN) {
      this.vercelToken = process.env.VERCEL_TOKEN.trim();
    }
  }

  public setToken(token: string): void {
    this.vercelToken = token.trim();
    this.security.logAudit('VERCEL', 'INFO', 'Vercel API token updated (token redacted).');
  }

  public async getStatus(): Promise<VercelAuthState> {
    const verCheck = await this.terminal.execute('vercel --version', { timeoutMs: 4000 });
    const installed = verCheck.exitCode === 0;
    const version = installed ? verCheck.stdout.trim() : undefined;

    if (installed) {
      const whoami = await this.terminal.execute('vercel whoami', { timeoutMs: 5000 });
      if (whoami.exitCode === 0 && whoami.stdout.trim()) {
        return {
          installed: true,
          authenticated: true,
          username: whoami.stdout.trim(),
          version
        };
      }
    }

    if (this.vercelToken) {
      try {
        const res = await fetch('https://api.vercel.com/v2/user', {
          headers: {
            'Authorization': `Bearer ${this.vercelToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          return {
            installed,
            authenticated: true,
            username: data.user?.username || data.user?.email || 'Vercel User',
            version
          };
        }
      } catch {}
    }

    return {
      installed,
      authenticated: false,
      version
    };
  }

  public async deploy(projectRelDir: string, production = false): Promise<any> {
    this.security.logAudit('VERCEL', 'INFO', `Deploying project ${projectRelDir} to Vercel (production: ${production})`);
    const prodFlag = production ? '--prod' : '';
    const tokenFlag = this.vercelToken ? `--token=${this.vercelToken}` : '';
    
    // Command uses standard CLI flags with yes to bypass interactive prompts
    const command = `vercel ${prodFlag} --yes ${tokenFlag}`.trim();
    const res = await this.terminal.execute(command, { cwdRel: projectRelDir, timeoutMs: 90000 });

    const deploymentUrlMatch = res.stdout.match(/https:\/\/[a-zA-Z0-9._-]+\.vercel\.app/);
    const deploymentUrl = deploymentUrlMatch ? deploymentUrlMatch[0] : null;

    return {
      success: res.exitCode === 0,
      deploymentUrl,
      output: res.stdout,
      errors: res.stderr,
      exitCode: res.exitCode
    };
  }

  public async getDeploymentLogs(deploymentIdOrUrl: string): Promise<any> {
    const tokenFlag = this.vercelToken ? `--token=${this.vercelToken}` : '';
    const res = await this.terminal.execute(`vercel logs ${deploymentIdOrUrl} ${tokenFlag}`, { timeoutMs: 15000 });
    return res;
  }
}

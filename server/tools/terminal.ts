import { spawn } from 'child_process';
import path from 'path';
import { SecurityManager } from '../security.js';
import { WorkspaceManager } from '../workspace.js';

export interface CommandExecutionResult {
  command: string;
  cwd: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  success: boolean;
  truncated: boolean;
  intercepted?: boolean;
  warning?: string;
}

export class TerminalTool {
  private workspace: WorkspaceManager;
  private security: SecurityManager;
  private activeProcesses: Map<string, any> = new Map();

  constructor(workspace: WorkspaceManager, security: SecurityManager) {
    this.workspace = workspace;
    this.security = security;
  }

  public async execute(
    command: string,
    options: {
      cwdRel?: string;
      timeoutMs?: number;
      env?: Record<string, string>;
      bypassDangerousCheck?: boolean;
    } = {}
  ): Promise<CommandExecutionResult> {
    const timeout = options.timeoutMs || 45000;
    const targetCwd = options.cwdRel
      ? this.workspace.resolvePath(options.cwdRel)
      : this.workspace.rootDir;

    // Check for dangerous system destructive commands
    if (!options.bypassDangerousCheck) {
      const dangerCheck = this.security.inspectCommand(command);
      if (dangerCheck.isDangerous) {
        this.security.logAudit('SECURITY', 'SECURITY', `Intercepted dangerous command: "${command}"`, {
          reason: dangerCheck.reason
        });
        return {
          command,
          cwd: targetCwd,
          stdout: '',
          stderr: `SECURITY GUARD INTERCEPTION: Command blocked. Reason: ${dangerCheck.reason}. Requires explicit human approval.`,
          exitCode: 126,
          durationMs: 0,
          success: false,
          truncated: false,
          intercepted: true,
          warning: dangerCheck.reason
        };
      }
    }

    const startTime = Date.now();
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'bash';
    const shellArgs = isWindows ? ['/d', '/s', '/c', command] : ['-c', command];

    this.security.logAudit('TERMINAL', 'INFO', `Executing: ${command}`, { cwd: path.relative(this.workspace.rootDir, targetCwd) });

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTruncated = false;
      const MAX_OUTPUT = 256 * 1024; // 256 KB cap

      let timedOut = false;
      const child = spawn(shell, shellArgs, {
        cwd: targetCwd,
        env: {
          ...process.env,
          ...(options.env || {}),
          LANG: 'en_US.UTF-8',
          FORCE_COLOR: '0'
        }
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 2000);
      }, timeout);

      child.stdout.on('data', (chunk: Buffer) => {
        if (stdout.length < MAX_OUTPUT) {
          stdout += chunk.toString();
        } else if (!isTruncated) {
          isTruncated = true;
          stdout += '\n... [Output truncated to avoid memory overflow] ...\n';
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        if (stderr.length < MAX_OUTPUT) {
          stderr += chunk.toString();
        } else if (!isTruncated) {
          isTruncated = true;
          stderr += '\n... [Stderr truncated to avoid memory overflow] ...\n';
        }
      });

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        if (timedOut) {
          stderr += `\n[Command timed out after ${timeout}ms]`;
        }

        const sanitizedStdout = this.security.redact(stdout);
        const sanitizedStderr = this.security.redact(stderr);

        resolve({
          command,
          cwd: targetCwd,
          stdout: sanitizedStdout,
          stderr: sanitizedStderr,
          exitCode: timedOut ? 124 : (code ?? (signal ? 1 : 0)),
          durationMs,
          success: code === 0 && !timedOut,
          truncated: isTruncated
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve({
          command,
          cwd: targetCwd,
          stdout: '',
          stderr: `Process spawn error: ${err.message}`,
          exitCode: 1,
          durationMs,
          success: false,
          truncated: false
        });
      });
    });
  }
}

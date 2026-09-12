import fs from 'fs';
import path from 'path';
import { AuditLogEntry } from './types.js';

const SECRET_PATTERNS: RegExp[] = [
  /ghp_[a-zA-Z0-9]{36,}/gi,                     // GitHub Personal Access Token
  /github_pat_[a-zA-Z0-9_]{50,}/gi,             // GitHub Fine-grained PAT
  /gho_[a-zA-Z0-9]{36,}/gi,                     // GitHub OAuth
  /A[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g,   // PayPal access token pattern
  /access_token\$[a-zA-Z0-9_-]+/gi,             // PayPal client access token
  /vercel_[a-zA-Z0-9]{24,}/gi,                  // Vercel token
  /Bearer\s+[a-zA-Z0-9._\-]{20,}/gi,            // Bearer tokens
  /sk-[a-zA-Z0-9]{32,}/gi,                      // OpenAI / local API key
  /(client_secret|client_id|secret|password|passwd|private_key|token)\s*[:=]\s*["']?([^"'\s\n]{8,})["']?/gi,
];

// Dangerous commands that could damage operating systems or compromise system integrity
const DANGEROUS_COMMAND_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(mkfs|fdisk|parted|dd\s+if=)\b/i, reason: 'Disk partition or low-level formatting detected' },
  { pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f*|-f*r*)\s+(\/|\/\*|~|\$HOME|\.\.)(\s|$)/i, reason: 'Destructive recursive root or parent directory deletion' },
  { pattern: /\b(shutdown|reboot|poweroff|init\s+0|init\s+6)\b/i, reason: 'System shutdown or reboot command' },
  { pattern: />\s*(\/dev\/sd[a-z]|\/dev\/nvme)/i, reason: 'Direct write to raw block storage device' },
  { pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/i, reason: 'Fork bomb attack vector' },
  { pattern: /\bchmod\s+(-R\s+)?777\s+\//i, reason: 'Global system permission compromise' },
  { pattern: /\b(curl|wget)\s+[^|]+\|\s*(ba)?sh\b/i, reason: 'Unverified remote script piped directly to shell' }
];

export class SecurityManager {
  private auditLogPath: string;
  private inMemoryLogs: AuditLogEntry[] = [];
  private maxInMemoryLogs = 500;

  constructor(workspaceDir: string) {
    const logsDir = path.join(workspaceDir, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.auditLogPath = path.join(logsDir, 'audit.log');
  }

  /**
   * Redacts any API tokens, client secrets, passwords, or credentials
   */
  public redact(text: string): string {
    if (!text || typeof text !== 'string') return text;
    let sanitized = text;
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match, prefix, secret) => {
        if (prefix && secret) {
          return `${prefix}: [REDACTED_SECRET]`;
        }
        return '[REDACTED_SECRET]';
      });
    }
    return sanitized;
  }

  /**
   * Checks whether a command contains high-risk system commands
   */
  public inspectCommand(command: string): { isDangerous: boolean; reason?: string } {
    for (const item of DANGEROUS_COMMAND_PATTERNS) {
      if (item.pattern.test(command)) {
        return { isDangerous: true, reason: item.reason };
      }
    }
    return { isDangerous: false };
  }

  /**
   * Records an audit event with secret redaction
   */
  public logAudit(
    category: AuditLogEntry['category'],
    level: AuditLogEntry['level'],
    message: string,
    details?: any
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      category,
      level,
      message: this.redact(message),
      details: details ? JSON.parse(this.redact(JSON.stringify(details))) : undefined
    };

    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > this.maxInMemoryLogs) {
      this.inMemoryLogs.pop();
    }

    try {
      fs.appendFileSync(
        this.auditLogPath,
        `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${
          entry.details ? ' ' + JSON.stringify(entry.details) : ''
        }\n`
      );
    } catch (err) {
      console.error('Failed to write to audit.log:', err);
    }

    return entry;
  }

  public getRecentLogs(limit = 100): AuditLogEntry[] {
    return this.inMemoryLogs.slice(0, limit);
  }

  public getRawLogContent(): string {
    if (fs.existsSync(this.auditLogPath)) {
      return fs.readFileSync(this.auditLogPath, 'utf8');
    }
    return '';
  }
}

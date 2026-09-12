import fs from 'fs';
import path from 'path';
import { PermissionSettings, ApprovalRequest, PermissionLevel } from './types.js';

export class PermissionManager {
  private configPath: string;
  private permissions: PermissionSettings;
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: ApprovalRequest[] = [];

  constructor(workspaceDir: string) {
    const configDir = path.join(workspaceDir, 'memory');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    this.configPath = path.join(configDir, 'PERMISSIONS.json');
    this.permissions = this.loadPermissions();
  }

  private loadPermissions(): PermissionSettings {
    const defaultSettings: PermissionSettings = {
      INTERNET: 'ALLOW',
      TERMINAL: 'ALLOW',
      FILES: 'ALLOW',
      BROWSER: 'ALLOW',
      GITHUB: 'ASK',
      VERCEL: 'ASK',
      PAYPAL: 'ASK' // Financial actions must ALWAYS require explicit approval
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const saved = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { ...defaultSettings, ...saved, PAYPAL: 'ASK' }; // Enforce PAYPAL as ASK
      }
    } catch {}
    return defaultSettings;
  }

  public savePermissions(newSettings: Partial<PermissionSettings>): PermissionSettings {
    this.permissions = {
      ...this.permissions,
      ...newSettings,
      PAYPAL: 'ASK' // Enforce financial protection
    };
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.permissions, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving permissions:', err);
    }
    return this.permissions;
  }

  public getPermissions(): PermissionSettings {
    return this.permissions;
  }

  public checkPermission(toolCategory: keyof PermissionSettings): PermissionLevel {
    if (toolCategory === 'PAYPAL') return 'ASK';
    return this.permissions[toolCategory] || 'ASK';
  }

  public createApprovalRequest(params: {
    action: string;
    tool: string;
    whatWillHappen: string;
    why: string;
    whatDataWillBeUsed: string;
    whatAccountWillBeAffected: string;
    payload?: any;
  }): ApprovalRequest {
    const request: ApprovalRequest = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      action: params.action,
      tool: params.tool,
      whatWillHappen: params.whatWillHappen,
      why: params.why,
      whatDataWillBeUsed: params.whatDataWillBeUsed,
      whatAccountWillBeAffected: params.whatAccountWillBeAffected,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      payload: params.payload
    };

    this.pendingApprovals.set(request.id, request);
    return request;
  }

  public getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values());
  }

  public getApproval(id: string): ApprovalRequest | undefined {
    return this.pendingApprovals.get(id);
  }

  public resolveApproval(id: string, approved: boolean): ApprovalRequest | null {
    const request = this.pendingApprovals.get(id);
    if (!request) return null;

    request.status = approved ? 'APPROVED' : 'DENIED';
    this.pendingApprovals.delete(id);
    this.approvalHistory.unshift(request);
    if (this.approvalHistory.length > 100) this.approvalHistory.pop();

    return request;
  }

  public getApprovalHistory(): ApprovalRequest[] {
    return this.approvalHistory;
  }
}

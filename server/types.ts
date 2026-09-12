export type PermissionLevel = 'ALLOW' | 'DENY' | 'ASK';

export interface PermissionSettings {
  INTERNET: PermissionLevel;
  TERMINAL: PermissionLevel;
  FILES: PermissionLevel;
  BROWSER: PermissionLevel;
  GITHUB: PermissionLevel;
  VERCEL: PermissionLevel;
  PAYPAL: PermissionLevel;
}

export interface ApprovalRequest {
  id: string;
  action: string;
  tool: string;
  whatWillHappen: string;
  why: string;
  whatDataWillBeUsed: string;
  whatAccountWillBeAffected: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  payload?: any;
}

export interface SystemHardware {
  os: {
    platform: string;
    release: string;
    arch: string;
    type: string;
  };
  cpu: {
    model: string;
    cores: number;
    speedMhz: number;
    loadAverage: number[];
  };
  ram: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    totalGB: number;
    freeGB: number;
    usedGB: number;
    usagePercent: number;
  };
  gpu: {
    detected: boolean;
    name: string;
    vramGB?: number;
    driver?: string;
  };
  disk: {
    totalGB: number;
    freeGB: number;
    usedGB: number;
  };
  recommendedModels: RecommendedModel[];
}

export interface RecommendedModel {
  id: string;
  name: string;
  sizeParam: string;
  minRamGB: number;
  recommendedRamGB: number;
  vramGB?: number;
  family: string;
  description: string;
  compatible: boolean;
  reason?: string;
  speedRating: 'Fast' | 'Moderate' | 'Slow';
}

export interface LocalModelInfo {
  id: string;
  name: string;
  size: string;
  modifiedAt?: string;
  digest?: string;
  backend: 'ollama' | 'llamacpp' | 'builtin' | 'custom';
  status: 'installed' | 'available' | 'downloading';
  progress?: number;
  ramRequirementGB: number;
}

export interface AgentTaskStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'retrying';
  tool?: string;
  input?: any;
  output?: any;
  error?: string;
  retryCount?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentTask {
  id: string;
  prompt: string;
  status: 'idle' | 'planning' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  steps: AgentTaskStep[];
  currentStepIndex: number;
  plan: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  summary?: string;
  modelUsed: string;
  tokensUsed?: number;
  executionTimeMs?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: 'AGENT' | 'TERMINAL' | 'BROWSER' | 'FILES' | 'GITHUB' | 'VERCEL' | 'PAYPAL' | 'PERMISSION' | 'SECURITY';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  message: string;
  details?: any;
}

export type TestStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT CONFIGURED';

export interface DiagnosticResult {
  category: string;
  status: TestStatus;
  message: string;
  details?: string;
  latencyMs?: number;
  timestamp: string;
}

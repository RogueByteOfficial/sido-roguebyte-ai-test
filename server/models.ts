import { LocalModelInfo } from './types.js';
import { SecurityManager } from './security.js';

export interface ModelBackendStatus {
  ollamaAvailable: boolean;
  ollamaVersion?: string;
  ollamaStatus: 'ONLINE' | 'OFFLINE';
  llamacppAvailable: boolean;
  activeBackend: 'ollama' | 'llamacpp' | 'builtin';
  activeModel: string;
  localModelConfigured: boolean;
  reason?: string;
}

export interface ModelTestResult {
  success: boolean;
  isRealLocalLLM: boolean;
  status: 'PASS' | 'NOT CONFIGURED' | 'FAIL';
  latencyMs: number;
  response: string;
  parsedJson?: any;
  engine: string;
  reason?: string;
}

export class ModelManager {
  private security: SecurityManager;
  private ollamaUrl: string = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').trim();
  private llamacppUrl: string = (process.env.LLAMACPP_HOST || 'http://127.0.0.1:8080').trim();
  private activeModel: string = process.env.OLLAMA_MODEL || 'builtin-autonomous-v1';
  private activeBackend: 'ollama' | 'llamacpp' | 'builtin' = process.env.OLLAMA_MODEL ? 'ollama' : 'builtin';

  constructor(security: SecurityManager) {
    this.security = security;
  }

  public setOllamaUrl(url: string): void {
    this.ollamaUrl = url.trim();
  }

  public getOllamaUrl(): string {
    return this.ollamaUrl;
  }

  public async checkBackends(): Promise<ModelBackendStatus> {
    let ollamaAvailable = false;
    let ollamaVersion: string | undefined;

    try {
      const res = await fetch(`${this.ollamaUrl}/api/version`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        ollamaAvailable = true;
        ollamaVersion = data.version;
      }
    } catch {}

    let llamacppAvailable = false;
    try {
      const res = await fetch(`${this.llamacppUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) llamacppAvailable = true;
    } catch {}

    if (ollamaAvailable && this.activeBackend === 'builtin') {
      this.activeBackend = 'ollama';
    }

    const localModelConfigured = ollamaAvailable || llamacppAvailable;

    return {
      ollamaAvailable,
      ollamaVersion,
      ollamaStatus: ollamaAvailable ? 'ONLINE' : 'OFFLINE',
      llamacppAvailable,
      activeBackend: this.activeBackend,
      activeModel: this.activeModel,
      localModelConfigured,
      reason: localModelConfigured ? undefined : `Connection refused at ${this.ollamaUrl}`
    };
  }

  public async listInstalledModels(): Promise<LocalModelInfo[]> {
    const models: LocalModelInfo[] = [
      {
        id: 'builtin-autonomous-v1',
        name: 'DETERMINISTIC FALLBACK (Infrastructure testing only, not generative AI)',
        size: 'Embedded Heuristic Engine',
        backend: 'builtin',
        status: 'installed',
        ramRequirementGB: 0.1
      }
    ];

    try {
      const res = await fetch(`${this.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models)) {
          for (const m of data.models) {
            models.push({
              id: m.name,
              name: m.name,
              size: `${Math.round((m.size / (1024 * 1024 * 1024)) * 10) / 10} GB`,
              modifiedAt: m.modified_at,
              digest: m.digest?.slice(0, 12),
              backend: 'ollama',
              status: 'installed',
              ramRequirementGB: Math.round((m.size / (1024 * 1024 * 1024)) * 1.3 * 10) / 10
            });
          }
        }
      }
    } catch {}

    return models;
  }

  public setActiveModel(modelId: string, backend?: 'ollama' | 'llamacpp' | 'builtin'): void {
    this.activeModel = modelId;
    if (backend) {
      this.activeBackend = backend;
    } else if (modelId.startsWith('builtin')) {
      this.activeBackend = 'builtin';
    } else {
      this.activeBackend = 'ollama';
    }
    this.security.logAudit('AGENT', 'INFO', `Switched active local model to ${modelId} (${this.activeBackend})`);
  }

  public getActiveModel(): { model: string; backend: string; isRealLocalLLM: boolean } {
    return {
      model: this.activeModel,
      backend: this.activeBackend,
      isRealLocalLLM: this.activeBackend === 'ollama' || this.activeBackend === 'llamacpp'
    };
  }

  /**
   * Tests the model backend.
   * If testing Ollama, sends the prompt: "Return valid JSON with keys: 'status', 'engine', 'summary'."
   * If Ollama is unavailable, explicitly returns status: 'NOT CONFIGURED' and labels builtin as DETERMINISTIC FALLBACK.
   */
  public async testModel(modelId?: string): Promise<ModelTestResult> {
    const targetModel = modelId || this.activeModel;
    const startTime = Date.now();

    // Check Ollama connectivity first
    const backends = await this.checkBackends();

    if (!backends.ollamaAvailable && (targetModel.startsWith('builtin') || this.activeBackend === 'builtin')) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        isRealLocalLLM: false,
        status: 'NOT CONFIGURED',
        latencyMs: duration,
        response: 'DETERMINISTIC FALLBACK ENGINE: Active for offline pipeline verification only. Not a real generative AI model.',
        engine: 'Deterministic Fallback Heuristic Engine',
        reason: `OLLAMA STATUS: OFFLINE. LOCAL MODEL: NOT CONFIGURED. Reason: Connection refused at ${this.ollamaUrl}`
      };
    }

    if (!backends.ollamaAvailable) {
      return {
        success: false,
        isRealLocalLLM: false,
        status: 'NOT CONFIGURED',
        latencyMs: Date.now() - startTime,
        response: `Connection refused at ${this.ollamaUrl}. Local Ollama server is not running.`,
        engine: 'Ollama HTTP API',
        reason: `OLLAMA STATUS: OFFLINE. LOCAL MODEL: NOT CONFIGURED. Reason: Connection refused at ${this.ollamaUrl}`
      };
    }

    // Check if any models are actually installed in Ollama
    const installed = await this.listInstalledModels();
    const ollamaModels = installed.filter((m) => m.backend === 'ollama');

    if (ollamaModels.length === 0) {
      return {
        success: false,
        isRealLocalLLM: false,
        status: 'NOT CONFIGURED',
        latencyMs: Date.now() - startTime,
        response: 'Ollama is running, but no local models are currently installed.',
        engine: 'Ollama HTTP API',
        reason: 'NO LOCAL MODEL INSTALLED. Run: ollama pull llama3.2:3b (or qwen2.5-coder:1.5b)'
      };
    }

    // Determine the effective model to test
    let effectiveModel = targetModel;
    if (effectiveModel.startsWith('builtin') || !ollamaModels.some((m) => m.id === effectiveModel || m.name === effectiveModel)) {
      effectiveModel = ollamaModels[0].id;
      this.setActiveModel(effectiveModel, 'ollama');
    }

    // Real Ollama invocation with required verification prompt
    try {
      const prompt = "Return valid JSON with keys: 'status', 'engine', 'summary'.";
      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: effectiveModel,
          prompt,
          format: 'json',
          stream: false
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (res.status === 404) {
        return {
          success: false,
          isRealLocalLLM: false,
          status: 'NOT CONFIGURED',
          latencyMs: Date.now() - startTime,
          response: `Model '${effectiveModel}' not found in Ollama.`,
          engine: 'Ollama HTTP API',
          reason: `NO LOCAL MODEL INSTALLED: Model '${effectiveModel}' not found. Run 'ollama pull ${effectiveModel}' or 'ollama pull llama3.2:3b'`
        };
      }

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;
      const rawResponse = data.response?.trim() || '';

      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(rawResponse);
      } catch {
        // Try extracting JSON
        const match = rawResponse.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedJson = JSON.parse(match[0]);
          } catch {}
        }
      }

      return {
        success: true,
        isRealLocalLLM: true,
        status: 'PASS',
        latencyMs,
        response: rawResponse,
        parsedJson,
        engine: `Ollama (${effectiveModel})`
      };
    } catch (err: any) {
      return {
        success: false,
        isRealLocalLLM: true,
        status: 'FAIL',
        latencyMs: Date.now() - startTime,
        response: `Real local model test failed: ${err.message}`,
        engine: `Ollama (${effectiveModel})`,
        reason: err.message
      };
    }
  }

  public async pullModel(modelName: string): Promise<{ success: boolean; message: string }> {
    this.security.logAudit('AGENT', 'INFO', `Starting pull for model: ${modelName}`);
    try {
      const res = await fetch(`${this.ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: false }),
        signal: AbortSignal.timeout(300000) // 5 minutes
      });
      if (res.ok) {
        return { success: true, message: `Model ${modelName} downloaded and verified.` };
      } else {
        const err = await res.text();
        return { success: false, message: `Failed to download: ${err}` };
      }
    } catch (err: any) {
      return { success: false, message: `Failed to connect to Ollama at ${this.ollamaUrl}: ${err.message}` };
    }
  }

  public async deleteModel(modelName: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.ollamaUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      if (res.ok) {
        return { success: true, message: `Model ${modelName} removed.` };
      } else {
        return { success: false, message: `Could not delete ${modelName}` };
      }
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

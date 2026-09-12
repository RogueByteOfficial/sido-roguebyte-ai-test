import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Download,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Zap,
  Info
} from 'lucide-react';
import { SystemHardware, LocalModelInfo, RecommendedModel } from '../types';

interface Props {
  hardware: SystemHardware | null;
  activeModel: { model: string; backend: string } | null;
  onModelChanged: () => void;
}

export const ModelsView: React.FC<Props> = ({
  hardware,
  activeModel,
  onModelChanged
}) => {
  const [installedModels, setInstalledModels] = useState<LocalModelInfo[]>([]);
  const [backends, setBackends] = useState<{
    ollamaAvailable: boolean;
    ollamaVersion?: string;
    llamacppAvailable: boolean;
    activeBackend: string;
    activeModel: string;
  } | null>(null);

  const [downloadInput, setDownloadInput] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [testResult, setTestResult] = useState<{
    modelId: string;
    latencyMs: number;
    response: string;
    success: boolean;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      const bRes = await fetch('/api/models/backends');
      if (bRes.ok) setBackends(await bRes.json());

      const mRes = await fetch('/api/models/installed');
      if (mRes.ok) setInstalledModels(await mRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSwitchModel = async (modelId: string, backend?: string) => {
    try {
      const res = await fetch('/api/models/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, backend })
      });
      if (res.ok) {
        setStatusMessage(`Active model switched to ${modelId}`);
        onModelChanged();
        fetchModels();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleTestModel = async (modelId: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      const data = await res.json();
      setTestResult({
        modelId,
        latencyMs: data.latencyMs,
        response: data.response,
        success: data.success
      });
    } catch (err: any) {
      setTestResult({
        modelId,
        latencyMs: 0,
        response: err.message,
        success: false
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePullModel = async (name: string) => {
    if (!name) return;
    setIsDownloading(true);
    setStatusMessage(`Initiating pull for model: ${name}...`);
    try {
      const res = await fetch('/api/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: name })
      });
      const data = await res.json();
      setStatusMessage(data.message);
      fetchModels();
    } catch (err: any) {
      setStatusMessage(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteModel = async (name: string) => {
    if (!confirm(`Are you sure you want to remove model ${name}?`)) return;
    try {
      const res = await fetch('/api/models/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: name })
      });
      const data = await res.json();
      setStatusMessage(data.message);
      fetchModels();
    } catch (err: any) {
      setStatusMessage(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Local AI Model Manager &amp; Hardware Compatibility
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Auto-detects host system capabilities and recommends models optimized for consumer hardware.
          </p>
        </div>

        <button
          onClick={fetchModels}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Backends
        </button>
      </div>

      {statusMessage && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Backend Statuses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Ollama Runtime</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backends?.ollamaAvailable ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {backends?.ollamaAvailable
              ? `Connected (v${backends.ollamaVersion || 'detected'})`
              : 'Offline / Not Detected'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Endpoint: http://127.0.0.1:11434
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">llama.cpp Runtime</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backends?.llamacppAvailable ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {backends?.llamacppAvailable ? 'Server Ready' : 'Standby'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Endpoint: http://127.0.0.1:8080
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Embedded Engine</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-sm font-bold text-white">
            Built-in Autonomous Engine
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Zero-dependency local heuristics &amp; rule planner
          </p>
        </div>
      </div>

      {/* Recommended Models Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Hardware Compatibility Matrix &amp; Model Recommendations</span>
          <span className="text-xs text-indigo-400 font-normal">
            Based on {hardware?.ram.totalGB} GB RAM &amp; {hardware?.gpu.detected ? hardware.gpu.name : 'CPU Only'}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hardware?.recommendedModels.map((m: RecommendedModel) => {
            const isInstalled = installedModels.some((im) => im.id.includes(m.id) || im.name.includes(m.id));
            const isActive = activeModel?.model === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500'
                    : m.compatible
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/20 border-slate-800/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{m.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        m.compatible
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {m.compatible ? 'COMPATIBLE' : 'HIGH RAM'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                    {m.description}
                  </p>

                  <div className="space-y-1 text-[11px] font-mono text-slate-400 mb-3 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <div className="flex justify-between">
                      <span>Min RAM:</span>
                      <span className="text-slate-200">{m.minRamGB} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="text-emerald-400">{m.speedRating}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isInstalled ? (
                    <button
                      onClick={() => handleSwitchModel(m.id)}
                      disabled={isActive}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isActive ? 'Active Model' : 'Switch to Model'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePullModel(m.id)}
                      disabled={!m.compatible || isDownloading}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Pull Model
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Installed Models & Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Installed Models List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Installed Local Models</span>
            <span className="text-xs text-slate-400">{installedModels.length} models ready</span>
          </h3>

          <div className="space-y-3">
            {installedModels.map((im) => {
              const isActive = activeModel?.model === im.id;
              return (
                <div
                  key={im.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/60'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">{im.name}</span>
                      {isActive && (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                          CURRENT ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>Size: {im.size}</span>
                      <span>Backend: {im.backend}</span>
                      <span>Req RAM: ~{im.ramRequirementGB} GB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestModel(im.id)}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                      title="Run latency & diagnostic test"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      Test
                    </button>

                    {!isActive && (
                      <button
                        onClick={() => handleSwitchModel(im.id, im.backend)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Activate
                      </button>
                    )}

                    {im.backend === 'ollama' && (
                      <button
                        onClick={() => handleDeleteModel(im.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                        title="Remove model file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download Custom Model Form */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">
              Pull Specific Model from Ollama Registry
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. qwen2.5-coder:1.5b, deepseek-r1:7b, mistral:7b"
                value={downloadInput}
                onChange={(e) => setDownloadInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handlePullModel(downloadInput)}
                disabled={!downloadInput || isDownloading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {isDownloading ? 'Pulling...' : 'Download'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Test Results Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Model Diagnostic Console
            </h3>

            {testResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Target Model:</span>
                  <span className="text-indigo-400 font-semibold">{testResult.modelId}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Response Latency:</span>
                  <span className="text-emerald-400 font-semibold">{testResult.latencyMs} ms</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Test Status:</span>
                  <span
                    className={`font-semibold ${
                      testResult.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {testResult.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    Output Response:
                  </span>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {testResult.response}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Zap className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">Click &quot;Test&quot; next to any model to measure token generation latency and response integrity.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mt-4 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Offline models run entirely inside your machine. No telemetry or query data ever leaves your computer.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

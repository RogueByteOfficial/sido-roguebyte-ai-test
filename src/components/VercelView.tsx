import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Play,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileText,
  Key
} from 'lucide-react';

export const VercelView: React.FC = () => {
  const [vercelStatus, setVercelStatus] = useState<{
    cliInstalled: boolean;
    cliVersion?: string;
    hasToken: boolean;
    authStatus: string;
  } | null>(null);

  const [tokenInput, setTokenInput] = useState('');
  const [projectRelDir, setProjectRelDir] = useState('projects');
  const [isProduction, setIsProduction] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean;
    url?: string;
    logs: string;
  } | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/vercel/status');
      if (res.ok) setVercelStatus(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    try {
      const res = await fetch('/api/vercel/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      if (res.ok) {
        setStatusMessage('Vercel API token saved. Secret permanently masked from logs.');
        setTokenInput('');
        fetchStatus();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentResult(null);
    try {
      const res = await fetch('/api/vercel/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectRelDir,
          production: isProduction
        })
      });
      const data = await res.json();
      setDeploymentResult({
        success: data.success,
        url: data.url,
        logs: data.logs
      });
    } catch (err: any) {
      setDeploymentResult({
        success: false,
        logs: `Deployment API error: ${err.message}`
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            Vercel Deployment Tool
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Deploy web projects from agent_workspace/ with automated log extraction and URL verification.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {statusMessage && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Vercel CLI</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                vercelStatus?.cliInstalled ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {vercelStatus?.cliInstalled ? vercelStatus.cliVersion : 'CLI Not Detected'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Install globally via &apos;npm i -g vercel&apos; or use direct API Token below
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Vercel Token Status</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                vercelStatus?.hasToken ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {vercelStatus?.hasToken ? 'Token Configured' : 'No Token Configured'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {vercelStatus?.authStatus}
          </p>
        </div>
      </div>

      {/* Deploy & Token Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deploy Action Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Deploy Project from Workspace
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Project Directory (relative to agent_workspace/)
              </label>
              <input
                type="text"
                value={projectRelDir}
                onChange={(e) => setProjectRelDir(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isProd"
                checked={isProduction}
                onChange={(e) => setIsProduction(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-indigo-600"
              />
              <label htmlFor="isProd" className="text-xs text-slate-300 cursor-pointer">
                Deploy directly to Production (--prod)
              </label>
            </div>

            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-950"
            >
              <Play className="w-3.5 h-3.5" />
              {isDeploying ? 'Deploying...' : 'Deploy to Vercel'}
            </button>
          </div>

          {deploymentResult && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Deployment Status:</span>
                <span
                  className={`font-semibold ${
                    deploymentResult.success ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {deploymentResult.success ? 'DEPLOYED SUCCESS' : 'DEPLOYMENT FAILED'}
                </span>
              </div>

              {deploymentResult.url && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-300 truncate">
                    {deploymentResult.url}
                  </span>
                  <a
                    href={deploymentResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Token Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Vercel API Token Setup
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Enter Vercel Access Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="vercel_token_..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveToken}
                  disabled={!tokenInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-300">Token Security Policy:</div>
              <p>Tokens are never stored in plain text in public repositories or project source files.</p>
              <p>All output traces sanitize strings matching Vercel authorization tokens.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Logs Console */}
      {deploymentResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Deployment Trace &amp; Build Logs
          </h3>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {deploymentResult.logs}
          </pre>
        </div>
      )}
    </div>
  );
};

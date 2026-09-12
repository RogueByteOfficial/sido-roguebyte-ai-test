import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  FolderGit2,
  ExternalLink,
  Key
} from 'lucide-react';

export const GitHubView: React.FC = () => {
  const [gitStatus, setGitStatus] = useState<{
    gitInstalled: boolean;
    gitVersion?: string;
    ghInstalled: boolean;
    ghVersion?: string;
    hasToken: boolean;
    authStatus: string;
  } | null>(null);

  const [tokenInput, setTokenInput] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState('feat: agent automated update');
  const [projectRelDir, setProjectRelDir] = useState('projects');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      if (res.ok) setGitStatus(await res.json());
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
      const res = await fetch('/api/github/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      if (res.ok) {
        setStatusMessage('GitHub token updated safely. Secret redacted from logs.');
        setTokenInput('');
        fetchStatus();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleInit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/github/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRelDir })
      });
      const data = await res.json();
      setStatusMessage(data.message || (data.success ? 'Git repo initialized' : 'Failed to initialize'));
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRelDir, message: commitMessage })
      });
      const data = await res.json();
      setStatusMessage(data.message || (data.success ? 'Committed changes successfully' : 'Failed to commit'));
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRepoName.trim(), isPrivate })
      });
      const data = await res.json();
      setStatusMessage(data.message);
      if (data.success) setNewRepoName('');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            Git &amp; GitHub Integration
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Local git version control and secure GitHub integration. Passwords and PATs are never logged.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Git Status
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

      {/* Git Diagnostic Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Local Git Engine</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gitStatus?.gitInstalled ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {gitStatus?.gitInstalled ? gitStatus.gitVersion : 'Git Not Detected'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Required for local repository versioning
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">GitHub CLI (gh)</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gitStatus?.ghInstalled ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {gitStatus?.ghInstalled ? gitStatus.ghVersion : 'Not Installed (Optional)'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Optional CLI interface for GitHub
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Token Authentication</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gitStatus?.hasToken ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {gitStatus?.hasToken ? 'Personal Access Token Configured' : 'No Token Configured'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {gitStatus?.authStatus}
          </p>
        </div>
      </div>

      {/* Local Operations & Remote Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Git Operations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Local Git Version Control Operations
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Target Project Directory (relative to workspace)
              </label>
              <input
                type="text"
                value={projectRelDir}
                onChange={(e) => setProjectRelDir(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInit}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                Initialize Git Repo
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs text-slate-400 block">Commit Staged Changes</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCommit}
                disabled={isLoading || !commitMessage.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <GitCommit className="w-3.5 h-3.5" />
                Stage &amp; Commit (git add -A &amp;&amp; git commit)
              </button>
            </div>
          </div>
        </div>

        {/* Remote GitHub Operations & Token Config */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            GitHub Personal Access Token (PAT)
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Personal Access Token (with repo scope)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveToken}
                  disabled={!tokenInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg transition-colors"
                >
                  Save Token
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tokens are stored in memory and permanently masked from all logs and AI prompts.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs text-slate-400 block">Create Remote GitHub Repository</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. my-awesome-local-project"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <label className="flex items-center gap-1.5 text-xs text-slate-300 px-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                  />
                  Private
                </label>
              </div>
              <button
                onClick={handleCreateRepo}
                disabled={isLoading || !newRepoName.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Create Repository on GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

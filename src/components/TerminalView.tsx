import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const TerminalView: React.FC = () => {
  const [command, setCommand] = useState('');
  const [cwdRel, setCwdRel] = useState('projects');
  const [history, setHistory] = useState<Array<{
    id: string;
    command: string;
    cwd: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
    intercepted?: boolean;
    warning?: string;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async (cmdToRun = command) => {
    if (!cmdToRun.trim() || isRunning) return;
    setIsRunning(true);

    try {
      const res = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmdToRun,
          cwdRel
        })
      });

      const data = await res.json();
      setHistory((prev) => [
        {
          id: 'hist_' + Date.now(),
          command: cmdToRun,
          cwd: data.cwd || cwdRel,
          stdout: data.stdout,
          stderr: data.stderr,
          exitCode: data.exitCode,
          durationMs: data.durationMs,
          intercepted: data.intercepted,
          warning: data.warning
        },
        ...prev
      ]);
      setCommand('');
    } catch (err: any) {
      setHistory((prev) => [
        {
          id: 'hist_' + Date.now(),
          command: cmdToRun,
          cwd: cwdRel,
          stdout: '',
          stderr: `Failed to invoke terminal API: ${err.message}`,
          exitCode: 1,
          durationMs: 0
        },
        ...prev
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-indigo-400" />
            Sandboxed Terminal Control
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Safe execution environment with automated dangerous command guard and secret redaction filters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sandbox Enforced
          </span>
        </div>
      </div>

      {/* Terminal Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <span>CWD: agent_workspace/</span>
            <input
              type="text"
              value={cwdRel}
              onChange={(e) => setCwdRel(e.target.value)}
              className="bg-transparent text-indigo-400 focus:outline-none w-28 font-mono"
              placeholder="projects"
            />
          </div>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="Enter terminal command (e.g. ls -la, node -v, git status, npm test)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleRun()}
              disabled={!command.trim() || isRunning}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunning ? 'Running...' : 'Execute'}
            </button>
          </div>
        </div>

        {/* Quick Command Shortcuts */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test:</span>
          {[
            'node -v',
            'git --version',
            'ls -la',
            'df -h .',
            'rm -rf /' // Test dangerous interception!
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleRun(cmd)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                cmd.includes('rm -rf /')
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={cmd.includes('rm') ? 'Test dangerous command guard interception' : undefined}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal History Log */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
            Terminal session ready. Output from commands executed by you or the autonomous agent will appear here.
          </div>
        ) : (
          history.map((h) => (
            <div
              key={h.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden shadow-sm ${
                h.intercepted
                  ? 'border-rose-500/60'
                  : h.exitCode === 0
                  ? 'border-slate-800'
                  : 'border-amber-500/40'
              }`}
            >
              {/* Command bar header */}
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">$</span>
                  <span className="text-white font-semibold">{h.command}</span>
                  <span className="text-slate-500 text-[11px]">in {h.cwd}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {h.durationMs}ms
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.intercepted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : h.exitCode === 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {h.intercepted ? 'INTERCEPTED' : `EXIT ${h.exitCode}`}
                  </span>
                </div>
              </div>

              {/* Output Content */}
              <div className="p-4 space-y-2 bg-slate-950/80 font-mono text-xs">
                {h.stdout && (
                  <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {h.stdout}
                  </pre>
                )}

                {h.stderr && (
                  <pre
                    className={`whitespace-pre-wrap leading-relaxed overflow-x-auto ${
                      h.intercepted ? 'text-rose-400 font-bold' : 'text-amber-300'
                    }`}
                  >
                    {h.stderr}
                  </pre>
                )}

                {!h.stdout && !h.stderr && (
                  <span className="text-slate-600 italic">[Command produced no console output]</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

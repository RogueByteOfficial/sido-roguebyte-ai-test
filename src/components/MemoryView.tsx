import React, { useState, useEffect } from 'react';
import {
  Brain,
  RotateCcw,
  Trash2,
  RefreshCw,
  FolderGit2,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const MemoryView: React.FC = () => {
  const [memoryData, setMemoryData] = useState<{
    shortTerm: any;
    longTerm: any;
    projects: Record<string, any>;
    canResume: boolean;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) setMemoryData(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  const handleClearShortTerm = async () => {
    try {
      const res = await fetch('/api/memory/clear-short', { method: 'POST' });
      if (res.ok) {
        setStatusMessage('Short-term scratchpad cleared.');
        fetchMemory();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Persistent Tri-Tier Agent Memory
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Preserves context, active task checkpoints, learned solutions, and error recovery playbooks on disk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMemory}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Memory
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Memory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier 1: Short-Term Memory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                1. Short-Term Memory (Scratchpad)
              </span>
              <button
                onClick={handleClearShortTerm}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                title="Clear current scratchpad"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Active Task Checkpoint</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200">
                  {memoryData?.shortTerm?.activeTask ? (
                    <div>
                      <div className="font-semibold text-indigo-400">
                        {memoryData.shortTerm.activeTask.prompt}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Status: {memoryData.shortTerm.activeTask.status} (Step{' '}
                        {memoryData.shortTerm.activeTask.currentStepIndex + 1})
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No active task in scratchpad</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Volatile Key-Value Scratchpad</span>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(memoryData?.shortTerm?.scratchpad || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            File: agent_workspace/memory/short_term.json
          </div>
        </div>

        {/* Tier 2: Long-Term Memory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                2. Long-Term Memory (Learned Fixes)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                PERSISTENT
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Learned Solutions ({memoryData?.longTerm?.learnedSolutions?.length || 0})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {memoryData?.longTerm?.learnedSolutions?.length ? (
                    memoryData.longTerm.learnedSolutions.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-950 rounded border border-slate-800 text-xs"
                      >
                        <div className="font-semibold text-indigo-300">{s.problem}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.solution}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2 bg-slate-950 rounded">
                      No learned solutions logged yet
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Previous Errors &amp; Automated Fixes (
                  {memoryData?.longTerm?.previousErrors?.length || 0})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {memoryData?.longTerm?.previousErrors?.length ? (
                    memoryData.longTerm.previousErrors.map((err: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-950 rounded border border-slate-800 text-xs"
                      >
                        <div className="font-mono text-rose-400">{err.error}</div>
                        <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                          Fix: {err.fixApplied}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2 bg-slate-950 rounded">
                      Zero unrecovered errors recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            File: agent_workspace/memory/long_term.json
          </div>
        </div>

        {/* Tier 3: Project Memory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                3. Project-Specific Memory
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                PER-REPOSITORY
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div className="text-xs text-slate-400">
                Maintains project architecture notes, dependencies, scripts, and deployment URLs across agent sessions:
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {memoryData?.projects && Object.keys(memoryData.projects).length > 0 ? (
                  Object.entries(memoryData.projects).map(([name, proj]: [string, any]) => (
                    <div key={name} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                      <div className="font-semibold text-indigo-300 flex items-center justify-between">
                        <span>{name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{proj.techStack?.join(', ')}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Architecture: {proj.architecture || 'Web Application'}
                      </div>
                      {proj.notes && proj.notes.length > 0 && (
                        <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                          {proj.notes.length} project notes recorded
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg border border-slate-800">
                    No individual project memory files created yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            File: agent_workspace/memory/projects.json
          </div>
        </div>
      </div>
    </div>
  );
};

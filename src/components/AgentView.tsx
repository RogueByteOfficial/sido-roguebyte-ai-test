import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  FileCode,
  Globe,
  GitBranch,
  CreditCard,
  Check,
  XCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AgentTask, AgentTaskStep } from '../types';

interface Props {
  currentTask: AgentTask | null;
  taskHistory: AgentTask[];
  onTaskSubmit: (prompt: string) => void;
  onResumeTask: () => void;
}

export const AgentView: React.FC<Props> = ({
  currentTask,
  taskHistory,
  onTaskSubmit,
  onResumeTask
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [activeStepTab, setActiveStepTab] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onTaskSubmit(promptInput.trim());
    setPromptInput('');
  };

  const getToolIcon = (toolName?: string) => {
    if (!toolName) return <Terminal className="w-3.5 h-3.5" />;
    if (toolName.startsWith('file_')) return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
    if (toolName.startsWith('browser_')) return <Globe className="w-3.5 h-3.5 text-blue-400" />;
    if (toolName.startsWith('git') || toolName.startsWith('github'))
      return <GitBranch className="w-3.5 h-3.5 text-purple-400" />;
    if (toolName.startsWith('paypal')) return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
    return <Terminal className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Task Prompt Submission */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Autonomous Agent Core &amp; Task Planner
            </h2>
          </div>
          {currentTask && currentTask.status === 'waiting_approval' && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-medium animate-pulse">
              Waiting for Human Approval
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe what the agent should accomplish autonomously... (e.g. 'Create a small web project, modify it using the Agent, run tests, initialize Git, and verify with browser')"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Pipeline: LOCAL MODEL → PLANNER → TOOLS → ERROR RECOVERY → VERIFY
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResumeTask}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Resume interrupted task from persistent short-term memory"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                Resume Interrupted
              </button>

              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-950"
              >
                <Play className="w-3.5 h-3.5" />
                Execute Autonomous Task
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Execution Tracker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Decomposed Plan & Steps */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Step-by-Step Task Decomposition
            </span>
            <span className="text-xs font-mono text-indigo-400">
              {currentTask ? `${currentTask.steps.length} Steps Planned` : 'No active task'}
            </span>
          </div>

          {currentTask && currentTask.steps.length > 0 ? (
            <div className="space-y-3">
              {currentTask.steps.map((step: AgentTaskStep, index: number) => {
                const isSelected = activeStepTab === step.id || (!activeStepTab && index === currentTask.currentStepIndex);
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStepTab(step.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      step.status === 'running'
                        ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50'
                        : step.status === 'completed'
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        : step.status === 'needs_approval'
                        ? 'bg-amber-950/30 border-amber-500/60'
                        : step.status === 'retrying'
                        ? 'bg-purple-950/30 border-purple-500/60'
                        : step.status === 'failed'
                        ? 'bg-rose-950/30 border-rose-500/60'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {step.status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                          {step.status === 'running' && (
                            <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                          )}
                          {step.status === 'needs_approval' && (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          )}
                          {step.status === 'retrying' && (
                            <RotateCcw className="w-5 h-5 text-purple-400 animate-spin" />
                          )}
                          {step.status === 'failed' && (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                          {step.status === 'pending' && (
                            <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {step.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              {getToolIcon(step.tool)}
                              {step.tool || 'terminal'}
                            </span>
                            {step.retryCount && step.retryCount > 0 ? (
                              <span className="text-purple-400">
                                Recovery Attempt #{step.retryCount}
                              </span>
                            ) : null}
                            {step.startedAt && (
                              <span>{new Date(step.startedAt).toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          step.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : step.status === 'running'
                            ? 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                            : step.status === 'needs_approval'
                            ? 'bg-amber-500/20 text-amber-400'
                            : step.status === 'retrying'
                            ? 'bg-purple-500/20 text-purple-400'
                            : step.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {/* Show Output or Error when selected */}
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                        {step.input && (
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                              Tool Input Parameters
                            </span>
                            <pre className="text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 overflow-x-auto">
                              {JSON.stringify(step.input, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.output && (
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                              Observation &amp; Result Output
                            </span>
                            <pre className="text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-emerald-300 overflow-x-auto max-h-48 overflow-y-auto">
                              {typeof step.output === 'string'
                                ? step.output
                                : JSON.stringify(step.output, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.error && (
                          <div>
                            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block mb-1">
                              Error Diagnostics
                            </span>
                            <pre className="text-xs font-mono bg-rose-950/30 p-2.5 rounded border border-rose-800/60 text-rose-300 overflow-x-auto">
                              {step.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">No task in progress.</p>
              <p className="text-xs text-slate-500 mt-1">Submit a prompt above to generate and execute an autonomous plan.</p>
            </div>
          )}
        </div>

        {/* Right: Error Recovery & Execution Facts */}
        <div className="space-y-4">
          {/* Recovery Loop Explanation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Autonomous Error Recovery Engine
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a command fails, the agent does not immediately halt. It initiates an autonomous recovery loop:
            </p>
            <div className="space-y-1.5 text-xs font-mono text-indigo-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>1. COMMAND FAILED</div>
              <div>2. READ &amp; PARSE ERROR</div>
              <div>3. ANALYZE KNOWN FAULT CLASS</div>
              <div>4. PROPOSE CORRECTIVE ACTION</div>
              <div>5. APPLY FIX (e.g. git init, mkdir)</div>
              <div>6. RE-RUN COMMAND (Up to 3 Retries)</div>
              <div>7. VERIFY COMPLIANCE</div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Max Retry Cap: 3 attempts. Infinite loops strictly prevented.
            </div>
          </div>

          {/* Model & Intelligence Meta */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Execution Architecture Facts
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Execution Mode:</span>
                <span className="text-white font-mono">100% Local Inference</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Paid Cloud AI APIs:</span>
                <span className="text-emerald-400 font-mono">Zero / None</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Workspace Directory:</span>
                <span className="text-indigo-400 font-mono truncate max-w-[140px]">agent_workspace/</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">State Persistence:</span>
                <span className="text-emerald-400 font-mono">Tri-Tier Disk Memory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

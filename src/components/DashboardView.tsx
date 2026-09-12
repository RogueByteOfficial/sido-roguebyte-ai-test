import React from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Terminal,
  Globe,
  FolderGit2,
  GitBranch,
  Cloud,
  CreditCard,
  ShieldCheck,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SystemHardware, AgentTask, AuditLogEntry } from '../types';
import { ActiveTab } from './Navbar';

interface Props {
  hardware: SystemHardware | null;
  currentTask: AgentTask | null;
  recentLogs: AuditLogEntry[];
  onNavigate: (tab: ActiveTab) => void;
  onQuickRun: (prompt: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  hardware,
  currentTask,
  recentLogs,
  onNavigate,
  onQuickRun
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Local Autonomous Agent System
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            100% Free &amp; Offline-Ready Agent Infrastructure. Controls terminal, browser automation, filesystem sandboxing, and Git operations without reliance on proprietary cloud AI APIs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('selftest')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-950"
          >
            <Activity className="w-4 h-4" />
            Run Self-Test Suite
          </button>
          <button
            onClick={() => onNavigate('agent')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
          >
            <Play className="w-4 h-4" />
            Open Agent Core
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Processor</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {hardware ? `${hardware.cpu.cores} Cores` : 'Detecting...'}
          </div>
          <p className="text-xs text-slate-400 truncate mt-1">
            {hardware?.cpu.model || 'Local Architecture'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Memory (RAM)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {hardware ? `${hardware.ram.usedGB} / ${hardware.ram.totalGB} GB` : 'Detecting...'}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${hardware?.ram.usagePercent || 50}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">GPU / Acceleration</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {hardware?.gpu.detected ? hardware.gpu.name : 'CPU Only'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {hardware?.gpu.detected
              ? `${hardware.gpu.vramGB} GB VRAM (${hardware.gpu.driver})`
              : 'Local CPU Quantization Ready'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Workspace Disk</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {hardware ? `${hardware.disk.freeGB} GB Free` : 'Sandboxed'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            agent_workspace/ isolated
          </p>
        </div>
      </div>

      {/* Tools Status Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Subsystems &amp; Tool Capabilities</span>
          <span className="text-xs font-normal text-slate-400">All tools sandboxed by default</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" />, status: 'READY' },
            { id: 'browser', label: 'Browser', icon: <Globe className="w-4 h-4" />, status: 'READY' },
            { id: 'projects', label: 'Filesystem', icon: <FolderGit2 className="w-4 h-4" />, status: 'READY' },
            { id: 'github', label: 'Git & GitHub', icon: <GitBranch className="w-4 h-4" />, status: 'READY' },
            { id: 'vercel', label: 'Vercel CLI', icon: <Cloud className="w-4 h-4" />, status: 'READY' },
            { id: 'paypal', label: 'PayPal Sandbox', icon: <CreditCard className="w-4 h-4" />, status: 'SANDBOX ONLY' },
            { id: 'permissions', label: 'Permissions', icon: <ShieldCheck className="w-4 h-4" />, status: 'ENFORCED' }
          ].map((tool) => (
            <div
              key={tool.id}
              onClick={() => onNavigate(tool.id as ActiveTab)}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-800/40"
            >
              <div className="text-slate-400 mb-2 flex items-center justify-between">
                {tool.icon}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xs font-medium text-slate-200">{tool.label}</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{tool.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Task & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Task Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Current Agent Execution
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
                  currentTask?.status === 'running'
                    ? 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                    : currentTask?.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : currentTask?.status === 'waiting_approval'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentTask?.status ? currentTask.status.toUpperCase() : 'IDLE'}
              </span>
            </div>

            {currentTask && currentTask.status !== 'idle' ? (
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">TASK PROMPT</div>
                  <div className="text-sm font-medium text-slate-200">{currentTask.prompt}</div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Plan Execution: Step {currentTask.currentStepIndex + 1} of {currentTask.steps.length}</span>
                    <span className="font-mono">
                      {Math.round((currentTask.currentStepIndex / Math.max(currentTask.steps.length, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(currentTask.currentStepIndex / Math.max(currentTask.steps.length, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {currentTask.summary && (
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded border border-slate-800 font-mono">
                    {currentTask.summary}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">Agent Core is idle and waiting for commands.</p>
                <p className="text-xs text-slate-500 mt-1">Submit a task below or click a template workflow.</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigate('agent')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View Full Planner &amp; Step Logs <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-slate-500 font-mono">Autonomous Execution Loop v1.0</span>
          </div>
        </div>

        {/* Quick Workflows */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Autonomous Workflows
          </h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onQuickRun('Create a small web project locally, modify it using the Agent, run tests, initialize Git, and verify with browser')}
              className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition-colors text-xs text-slate-300 hover:text-white group"
            >
              <div className="font-semibold text-indigo-400 mb-0.5 group-hover:underline">
                Acceptance Test Flow
              </div>
              <div className="text-slate-400 text-[11px]">
                Create web app, modify, run tests, git commit, and verify with browser.
              </div>
            </button>

            <button
              onClick={() => onQuickRun('Verify PayPal Sandbox and create a $10.00 USD test payment order without moving real money')}
              className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition-colors text-xs text-slate-300 hover:text-white group"
            >
              <div className="font-semibold text-amber-400 mb-0.5 group-hover:underline">
                PayPal Sandbox Payment Flow
              </div>
              <div className="text-slate-400 text-[11px]">
                Generate sandbox OAuth token and create test order (Approval required).
              </div>
            </button>

            <button
              onClick={() => onQuickRun('Search web for open-source small language models under 3B parameters and save research')}
              className="w-full text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition-colors text-xs text-slate-300 hover:text-white group"
            >
              <div className="font-semibold text-emerald-400 mb-0.5 group-hover:underline">
                Web Research &amp; Extraction
              </div>
              <div className="text-slate-400 text-[11px]">
                Query DuckDuckGo, extract content, and save into research workspace.
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

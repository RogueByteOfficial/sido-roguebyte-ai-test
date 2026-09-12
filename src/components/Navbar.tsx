import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Bot,
  Terminal,
  Globe,
  FolderGit2,
  GitBranch,
  Cloud,
  CreditCard,
  Brain,
  ShieldAlert,
  FileText,
  Activity,
  Settings,
  Circle,
  AlertTriangle
} from 'lucide-react';
import { SystemHardware, ApprovalRequest } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'models'
  | 'agent'
  | 'terminal'
  | 'browser'
  | 'projects'
  | 'github'
  | 'vercel'
  | 'paypal'
  | 'memory'
  | 'permissions'
  | 'logs'
  | 'selftest'
  | 'settings';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hardware: SystemHardware | null;
  activeModel: { model: string; backend: string } | null;
  pendingApprovals: ApprovalRequest[];
  isOnline: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  hardware,
  activeModel,
  pendingApprovals,
  isOnline
}) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'models', label: 'Models', icon: <Cpu className="w-4 h-4" /> },
    { id: 'agent', label: 'Agent', icon: <Bot className="w-4 h-4" /> },
    { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
    { id: 'browser', label: 'Browser', icon: <Globe className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'github', label: 'GitHub', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'vercel', label: 'Vercel', icon: <Cloud className="w-4 h-4" /> },
    { id: 'paypal', label: 'PayPal', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'memory', label: 'Memory', icon: <Brain className="w-4 h-4" /> },
    { id: 'permissions', label: 'Permissions', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'logs', label: 'Logs', icon: <FileText className="w-4 h-4" /> },
    { id: 'selftest', label: 'Self-Test', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'Docs & Config', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top status bar */}
      <div className="px-6 py-2.5 flex items-center justify-between border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              LOCAL AI AGENT
            </span>
            <span className="bg-slate-800 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded">
              PHASE 1 INFRASTRUCTURE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Circle
              className={`w-2.5 h-2.5 fill-current ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}
            />
            <span>{isOnline ? 'ONLINE (LOCAL DAEMON)' : 'OFFLINE'}</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1 text-slate-400">
            <span>MODEL:</span>
            <span className="text-indigo-400 font-medium font-mono">
              {activeModel?.model || 'Detecting...'}
            </span>
            <span className="text-slate-500 text-[11px]">({activeModel?.backend || 'local'})</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          {hardware && (
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-300">
                CPU: <span className="text-white">{hardware.cpu.cores} cores</span>
              </span>
              <span className="text-slate-300">
                RAM: <span className="text-white">{hardware.ram.usedGB}/{hardware.ram.totalGB} GB</span>
              </span>
              <span className="text-slate-300">
                GPU: <span className="text-white">{hardware.gpu.detected ? hardware.gpu.name : 'CPU Only'}</span>
              </span>
            </div>
          )}

          {pendingApprovals.length > 0 && (
            <button
              onClick={() => setActiveTab('permissions')}
              className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded font-semibold text-xs animate-bounce"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {pendingApprovals.length} Approval Required
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <nav className="px-4 flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'permissions' && pendingApprovals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

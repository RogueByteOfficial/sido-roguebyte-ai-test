import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Save
} from 'lucide-react';
import { PermissionSettings, PermissionLevel, ApprovalRequest } from '../types';

interface Props {
  pendingApprovals: ApprovalRequest[];
  onDecision: (id: string, approved: boolean) => void;
}

export const PermissionsView: React.FC<Props> = ({
  pendingApprovals,
  onDecision
}) => {
  const [permissions, setPermissions] = useState<PermissionSettings>({
    INTERNET: 'ALLOW',
    TERMINAL: 'ALLOW',
    FILES: 'ALLOW',
    BROWSER: 'ALLOW',
    GITHUB: 'ASK',
    VERCEL: 'ASK',
    PAYPAL: 'ASK'
  });

  const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
        setApprovalHistory(data.approvalHistory || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleUpdateLevel = (key: keyof PermissionSettings, level: PermissionLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: level
    }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });
      if (res.ok) {
        setSaveStatus('Permission matrix saved and enforced!');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const permissionKeys: Array<{
    key: keyof PermissionSettings;
    label: string;
    desc: string;
    critical?: boolean;
  }> = [
    {
      key: 'INTERNET',
      label: 'Outbound Internet Access',
      desc: 'Controls HTTP/HTTPS requests, website visits, and external package queries.'
    },
    {
      key: 'TERMINAL',
      label: 'Terminal Command Execution',
      desc: 'Controls running shell scripts and build commands in workspace.'
    },
    {
      key: 'FILES',
      label: 'Workspace Filesystem Operations',
      desc: 'Controls writing, editing, and deleting files in agent_workspace/.'
    },
    {
      key: 'BROWSER',
      label: 'Browser Automation Engine',
      desc: 'Controls headless/DOM webpage navigation and scraping.'
    },
    {
      key: 'GITHUB',
      label: 'GitHub & Remote Git Actions',
      desc: 'Controls creating repositories, pushing commits, and managing issues.',
      critical: true
    },
    {
      key: 'VERCEL',
      label: 'Vercel Deployment Operations',
      desc: 'Controls deploying preview and production web applications.',
      critical: true
    },
    {
      key: 'PAYPAL',
      label: 'PayPal Sandbox Financial Operations',
      desc: 'Controls creating test sandbox payment orders and verifying payments.',
      critical: true
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Security Matrix &amp; Human Approval Settings
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Defines strict authorization gates (ALLOW, DENY, or ASK) for each subsystem tool.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs text-emerald-400 font-medium">{saveStatus}</span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-950"
          >
            <Save className="w-3.5 h-3.5" />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Pending Approvals Banner if any */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            Active Human Approvals Required ({pendingApprovals.length})
          </div>

          <div className="space-y-3">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 text-xs"
              >
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-white">TOOL: {req.tool.toUpperCase()}</span>
                  <span className="font-mono text-slate-500">{new Date(req.createdAt).toLocaleTimeString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-400 block">WHAT WILL HAPPEN:</span>
                    <span className="text-slate-200">{req.whatWillHappen}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 block">WHY:</span>
                    <span className="text-slate-300">{req.why}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 block">WHAT DATA WILL BE USED:</span>
                    <span className="font-mono text-emerald-400">{req.whatDataWillBeUsed}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 block">WHAT ACCOUNT WILL BE AFFECTED:</span>
                    <span className="text-amber-300">{req.whatAccountWillBeAffected}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onDecision(req.id, false)}
                    className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-800/50 rounded text-xs font-medium"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => onDecision(req.id, true)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permission Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Permission Matrix
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ASK triggers the mandatory Human Approval prompt before tool execution
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {permissionKeys.map((item) => {
            const currentLevel = permissions[item.key] || 'ASK';
            return (
              <div
                key={item.key}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{item.label}</span>
                    {item.critical && (
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                        SENSITIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{item.desc}</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                  {(['ALLOW', 'ASK', 'DENY'] as PermissionLevel[]).map((lvl) => {
                    const isSelected = currentLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        onClick={() => handleUpdateLevel(item.key, lvl)}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? lvl === 'ALLOW'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : lvl === 'ASK'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval History Audit Trail */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Recent Human Approval Decisions History
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {approvalHistory.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-6 text-center">
              No historical approval decisions logged.
            </div>
          ) : (
            approvalHistory.map((hist) => (
              <div
                key={hist.id}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{hist.whatWillHappen}</span>
                    <span className="font-mono text-slate-500 text-[10px]">({hist.tool})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Account: {hist.whatAccountWillBeAffected}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    hist.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {hist.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

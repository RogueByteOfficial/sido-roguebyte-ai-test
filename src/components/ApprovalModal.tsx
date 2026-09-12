import React from 'react';
import { ApprovalRequest } from '../types';
import { AlertTriangle, ShieldCheck, XCircle, CheckCircle, Clock } from 'lucide-react';

interface Props {
  requests: ApprovalRequest[];
  onDecision: (id: string, approved: boolean) => void;
}

export const ApprovalModal: React.FC<Props> = ({ requests, onDecision }) => {
  if (requests.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Human Approval Required</h3>
              <p className="text-xs text-amber-300">
                Action requires explicit confirmation before the Autonomous Agent can proceed.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-medium">
            {requests.length} Pending
          </span>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {requests.map((req) => (
            <div key={req.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                  TOOL: {req.tool.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(req.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    WHAT WILL HAPPEN
                  </span>
                  <div className="text-slate-200 font-medium bg-slate-900/90 p-2.5 rounded border border-slate-800">
                    {req.whatWillHappen}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    WHY
                  </span>
                  <div className="text-slate-300 text-xs bg-slate-900/50 p-2.5 rounded border border-slate-800/80">
                    {req.why}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      WHAT DATA WILL BE USED
                    </span>
                    <div className="text-xs font-mono text-emerald-400 bg-slate-900/90 p-2 rounded border border-slate-800 truncate">
                      {req.whatDataWillBeUsed}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      WHAT ACCOUNT WILL BE AFFECTED
                    </span>
                    <div className="text-xs font-medium text-amber-300 bg-slate-900/90 p-2 rounded border border-slate-800">
                      {req.whatAccountWillBeAffected}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => onDecision(req.id, false)}
                  className="px-4 py-2 text-xs font-medium text-red-300 bg-red-950/50 hover:bg-red-900/50 border border-red-800/60 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Deny Action
                </button>
                <button
                  onClick={() => onDecision(req.id, true)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve &amp; Continue
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

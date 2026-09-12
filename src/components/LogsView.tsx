import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';
import { AuditLogEntry } from '../types';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs?limit=250');
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_audit_logs_${Date.now()}.json`;
    a.click();
  };

  const handleDownloadRaw = async () => {
    try {
      const res = await fetch('/api/logs/raw');
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent_raw_audit_${Date.now()}.log`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterCategory !== 'ALL' && log.category !== filterCategory) return false;
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Audit Logging &amp; Redaction Stream
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time audit log stream saved in agent_workspace/logs/. All credentials and private keys are redacted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Secrets in Logs
          </span>
          <button
            onClick={handleDownloadRaw}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export Raw Log
          </button>
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail messages or metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="AGENT">AGENT</option>
            <option value="TERMINAL">TERMINAL</option>
            <option value="BROWSER">BROWSER</option>
            <option value="FILES">FILES</option>
            <option value="GITHUB">GITHUB</option>
            <option value="VERCEL">VERCEL</option>
            <option value="PAYPAL">PAYPAL</option>
            <option value="SECURITY">SECURITY</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Level:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="SECURITY">SECURITY</option>
          </select>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
          title="Refresh logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-500 flex justify-between">
          <span>Showing {filteredLogs.length} of {logs.length} logged events</span>
          <span>agent_workspace/logs/audit.log</span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              No audit log entries matching current filters.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-3 hover:bg-slate-800/30 transition-colors font-mono text-xs flex items-start gap-3"
              >
                <span className="text-slate-500 shrink-0 text-[11px] pt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    entry.level === 'INFO'
                      ? 'bg-slate-800 text-slate-300'
                      : entry.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : entry.level === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {entry.level}
                </span>

                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 shrink-0 font-semibold">
                  {entry.category}
                </span>

                <div className="flex-1 space-y-1">
                  <div className="text-slate-200">{entry.message}</div>
                  {entry.details && (
                    <pre className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80 overflow-x-auto">
                      {typeof entry.details === 'string'
                        ? entry.details
                        : JSON.stringify(entry.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

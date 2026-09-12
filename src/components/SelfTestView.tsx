import React, { useState } from 'react';
import {
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  RefreshCw,
  Award,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { DiagnosticResult, TestStatus } from '../types';

export const SelfTestView: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunningSelfTest, setIsRunningSelfTest] = useState(false);
  const [acceptanceReport, setAcceptanceReport] = useState<any>(null);
  const [isRunningAcceptance, setIsRunningAcceptance] = useState(false);

  const handleRunSelfTest = async () => {
    setIsRunningSelfTest(true);
    try {
      const res = await fetch('/api/selftest');
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningSelfTest(false);
    }
  };

  const handleRunAcceptanceTest = async () => {
    setIsRunningAcceptance(true);
    setAcceptanceReport(null);
    try {
      const res = await fetch('/api/acceptance', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAcceptanceReport(data);
      }
    } catch (err: any) {
      setAcceptanceReport({
        name: 'End-to-End Acceptance Test',
        passed: false,
        summary: `Test runner encountered error: ${err.message}`,
        steps: []
      });
    } finally {
      setIsRunningAcceptance(false);
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" />
            FAIL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            WARNING
          </span>
        );
      case 'NOT CONFIGURED':
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            NOT CONFIGURED
          </span>
        );
    }
  };

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const warningCount = results.filter((r) => r.status === 'WARNING').length;
  const notConfigCount = results.filter((r) => r.status === 'NOT CONFIGURED').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            System Self-Test &amp; Real Acceptance Verification
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Strict automated validation suite. Evaluates real execution of models, terminal, filesystem, browser, Git, Vercel, and PayPal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAcceptanceTest}
            disabled={isRunningAcceptance}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950"
          >
            <FileCheck className="w-4 h-4" />
            {isRunningAcceptance ? 'Executing E2E...' : 'Run End-to-End Acceptance Test'}
          </button>

          <button
            onClick={handleRunSelfTest}
            disabled={isRunningSelfTest}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-950"
          >
            <Play className="w-4 h-4" />
            {isRunningSelfTest ? 'Running Diagnostics...' : 'Run All 13 Diagnostics'}
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">Passing Tests</span>
              <div className="text-2xl font-bold text-emerald-400">{passCount}</div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">Failures</span>
              <div className="text-2xl font-bold text-rose-400">{failCount}</div>
            </div>
            <XCircle className="w-6 h-6 text-rose-500/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">Warnings</span>
              <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-500/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">Optional / Unconfigured</span>
              <div className="text-2xl font-bold text-slate-400">{notConfigCount}</div>
            </div>
            <HelpCircle className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      )}

      {/* Acceptance Test Report (if run) */}
      {acceptanceReport && (
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">{acceptanceReport.name}</h3>
                <p className="text-xs text-slate-400">
                  Full lifecycle validation: Project Creation → File Modifications → Automated Tests → Git Versioning → Web Verification
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                (acceptanceReport.allPassed ?? acceptanceReport.passed)
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {(acceptanceReport.allPassed ?? acceptanceReport.passed) ? 'ALL STEPS PASSED' : 'STEP FAILED'}
            </span>
          </div>

          <div className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
            {acceptanceReport.summary}
          </div>

          <div className="space-y-2">
            {acceptanceReport.steps?.map((step: any, idx: number) => {
              const isSuccess = step.status === 'SUCCESS' || step.status === 'PASS';
              const isNotConfig = step.status === 'NOT_CONFIGURED' || step.status === 'NOT CONFIGURED' || step.status === 'SKIPPED';
              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-500">{idx + 1}.</span>
                    <span className="font-semibold text-white">{step.step || step.name}</span>
                    {step.details && (
                      <span className="text-slate-400 font-mono text-[11px] truncate max-w-md">
                        - {step.details}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isSuccess
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isNotConfig
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isSuccess ? 'PASS' : isNotConfig ? 'OPTIONAL' : 'FAIL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Diagnostics List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>DIAGNOSTIC TEST CASE</span>
          <span>EVALUATION STATUS &amp; LATENCY</span>
        </div>

        <div className="divide-y divide-slate-800">
          {results.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs font-mono">
              Diagnostics have not been executed yet. Click &quot;Run All 13 Diagnostics&quot; above to begin verification.
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{r.category}</span>
                  </div>
                  <div className="text-xs text-slate-300">{r.message}</div>
                  {r.details && (
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      Details: {r.details}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {r.latencyMs !== undefined && (
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.latencyMs}ms
                    </span>
                  )}
                  {getStatusBadge(r.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

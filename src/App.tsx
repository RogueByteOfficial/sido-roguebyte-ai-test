/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ApprovalModal } from './components/ApprovalModal';
import { DashboardView } from './components/DashboardView';
import { ModelsView } from './components/ModelsView';
import { AgentView } from './components/AgentView';
import { TerminalView } from './components/TerminalView';
import { BrowserView } from './components/BrowserView';
import { ProjectsView } from './components/ProjectsView';
import { GitHubView } from './components/GitHubView';
import { VercelView } from './components/VercelView';
import { PayPalView } from './components/PayPalView';
import { MemoryView } from './components/MemoryView';
import { PermissionsView } from './components/PermissionsView';
import { LogsView } from './components/LogsView';
import { SelfTestView } from './components/SelfTestView';
import { SettingsAndDocsView } from './components/SettingsAndDocsView';
import { SystemHardware, AgentTask, ApprovalRequest, AuditLogEntry } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [hardware, setHardware] = useState<SystemHardware | null>(null);
  const [activeModel, setActiveModel] = useState<{ model: string; backend: string } | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Poll system state periodically
  const fetchSystemState = async () => {
    try {
      // Hardware
      const hwRes = await fetch('/api/hardware');
      if (hwRes.ok) setHardware(await hwRes.json());

      // Models
      const bRes = await fetch('/api/models/backends');
      if (bRes.ok) {
        const bData = await bRes.json();
        setActiveModel({ model: bData.activeModel, backend: bData.activeBackend });
      }

      // Permissions & Approvals
      const pRes = await fetch('/api/permissions');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPendingApprovals(pData.pendingApprovals || []);
      }

      // Agent Task
      const tRes = await fetch('/api/agent/task');
      if (tRes.ok) {
        const tData = await tRes.json();
        setCurrentTask(tData.status !== 'idle' ? tData : null);
      }

      // Agent History
      const hRes = await fetch('/api/agent/history');
      if (hRes.ok) setTaskHistory(await hRes.json());

      // Recent Logs
      const lRes = await fetch('/api/logs?limit=30');
      if (lRes.ok) setRecentLogs(await lRes.json());

      setIsOnline(true);
    } catch (err) {
      console.error('API polling error:', err);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchSystemState();
    const interval = setInterval(fetchSystemState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprovalDecision = async (id: string, approved: boolean) => {
    try {
      await fetch('/api/permissions/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved })
      });
      fetchSystemState();
    } catch (err) {
      console.error('Failed to submit approval decision:', err);
    }
  };

  const handleTaskSubmit = async (prompt: string) => {
    try {
      const res = await fetch('/api/agent/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const task = await res.json();
        setCurrentTask(task);
        setActiveTab('agent');
      }
    } catch (err) {
      console.error('Failed to submit task:', err);
    }
  };

  const handleResumeTask = async () => {
    try {
      await fetch('/api/agent/resume', { method: 'POST' });
      fetchSystemState();
      setActiveTab('agent');
    } catch (err) {
      console.error('Failed to resume task:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hardware={hardware}
        activeModel={activeModel}
        pendingApprovals={pendingApprovals}
        isOnline={isOnline}
      />

      {/* Mandatory Human Approval Dialog */}
      <ApprovalModal
        requests={pendingApprovals}
        onDecision={handleApprovalDecision}
      />

      {/* Main Tab Views */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            hardware={hardware}
            currentTask={currentTask}
            recentLogs={recentLogs}
            onNavigate={setActiveTab}
            onQuickRun={handleTaskSubmit}
          />
        )}

        {activeTab === 'models' && (
          <ModelsView
            hardware={hardware}
            activeModel={activeModel}
            onModelChanged={fetchSystemState}
          />
        )}

        {activeTab === 'agent' && (
          <AgentView
            currentTask={currentTask}
            taskHistory={taskHistory}
            onTaskSubmit={handleTaskSubmit}
            onResumeTask={handleResumeTask}
          />
        )}

        {activeTab === 'terminal' && <TerminalView />}

        {activeTab === 'browser' && <BrowserView />}

        {activeTab === 'projects' && <ProjectsView />}

        {activeTab === 'github' && <GitHubView />}

        {activeTab === 'vercel' && <VercelView />}

        {activeTab === 'paypal' && <PayPalView />}

        {activeTab === 'memory' && <MemoryView />}

        {activeTab === 'permissions' && (
          <PermissionsView
            pendingApprovals={pendingApprovals}
            onDecision={handleApprovalDecision}
          />
        )}

        {activeTab === 'logs' && <LogsView />}

        {activeTab === 'selftest' && <SelfTestView />}

        {activeTab === 'settings' && <SettingsAndDocsView />}
      </main>
    </div>
  );
}

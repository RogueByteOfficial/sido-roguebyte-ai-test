import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import { SecurityManager } from './server/security.js';
import { WorkspaceManager } from './server/workspace.js';
import { MemoryManager } from './server/memory.js';
import { PermissionManager } from './server/permissions.js';
import { detectHardware } from './server/hardware.js';
import { ModelManager } from './server/models.js';
import { TerminalTool } from './server/tools/terminal.js';
import { BrowserTool } from './server/tools/browser.js';
import { GitHubTool } from './server/tools/github.js';
import { VercelTool } from './server/tools/vercel.js';
import { PayPalTool } from './server/tools/paypal.js';
import { AgentCore } from './server/agent.js';
import { SelfTestRunner } from './server/selftest.js';
import { AcceptanceTestRunner } from './server/acceptance.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Core Subsystems
  const workspace = new WorkspaceManager();
  const security = new SecurityManager(workspace.rootDir);
  const memory = new MemoryManager(workspace.rootDir);
  const permissions = new PermissionManager(workspace.rootDir);
  const modelManager = new ModelManager(security);
  const terminal = new TerminalTool(workspace, security);
  const browser = new BrowserTool(workspace, security);
  const github = new GitHubTool(terminal, security, workspace);
  const vercel = new VercelTool(terminal, security, workspace);
  const paypal = new PayPalTool(security);

  const agent = new AgentCore({
    modelManager,
    terminal,
    browser,
    github,
    vercel,
    paypal,
    workspace,
    memory,
    permissions,
    security
  });

  const selfTest = new SelfTestRunner({
    modelManager,
    terminal,
    browser,
    github,
    vercel,
    paypal,
    workspace,
    memory,
    permissions,
    security
  });

  const acceptance = new AcceptanceTestRunner({
    workspace,
    terminal,
    browser,
    github,
    vercel,
    paypal,
    security
  });

  // Log system startup
  security.logAudit('AGENT', 'INFO', 'Local Autonomous AI Agent system initialized in workspace: ' + workspace.rootDir);

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Hardware detection
  app.get('/api/hardware', (req, res) => {
    try {
      const hw = detectHardware();
      res.json(hw);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Models
  app.get('/api/models/backends', async (req, res) => {
    try {
      const backends = await modelManager.checkBackends();
      res.json(backends);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/models/installed', async (req, res) => {
    try {
      const models = await modelManager.listInstalledModels();
      res.json(models);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/models/active', (req, res) => {
    const { modelId, backend } = req.body;
    if (!modelId) return res.status(400).json({ error: 'modelId is required' });
    modelManager.setActiveModel(modelId, backend);
    res.json({ success: true, active: modelManager.getActiveModel() });
  });

  app.post('/api/models/test', async (req, res) => {
    const { modelId } = req.body;
    try {
      const result = await modelManager.testModel(modelId || modelManager.getActiveModel().model);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/models/pull', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'modelName is required' });
    const result = await modelManager.pullModel(modelName);
    res.json(result);
  });

  app.post('/api/models/delete', async (req, res) => {
    const { modelName } = req.body;
    if (!modelName) return res.status(400).json({ error: 'modelName is required' });
    const result = await modelManager.deleteModel(modelName);
    res.json(result);
  });

  // Workspace Files
  app.get('/api/workspace/tree', (req, res) => {
    const rel = (req.query.dir as string) || '';
    try {
      const tree = workspace.listTree(rel);
      res.json(tree);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/workspace/file', (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'path parameter is required' });
    try {
      const content = workspace.readFile(filePath);
      res.json({ path: filePath, content });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/workspace/file', (req, res) => {
    const { path: filePath, content, actionDesc } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'path and content are required' });
    }
    try {
      const result = workspace.writeFile(filePath, content, actionDesc);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/workspace/file', (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'path parameter is required' });
    try {
      const result = workspace.deleteFile(filePath);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/workspace/changes', (req, res) => {
    res.json(workspace.getChangeHistory());
  });

  app.post('/api/workspace/search', (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    res.json(workspace.searchFiles(query));
  });

  // Memory
  app.get('/api/memory', (req, res) => {
    res.json({
      shortTerm: memory.getShortTerm(),
      longTerm: memory.getLongTerm(),
      projects: memory.getProjects(),
      canResume: memory.canResumeTask()
    });
  });

  app.post('/api/memory/clear-short', (req, res) => {
    memory.clearShortTerm();
    res.json({ success: true });
  });

  // Permissions & Human Approvals
  app.get('/api/permissions', (req, res) => {
    res.json({
      permissions: permissions.getPermissions(),
      pendingApprovals: permissions.getPendingRequests(),
      approvalHistory: permissions.getApprovalHistory()
    });
  });

  app.post('/api/permissions', (req, res) => {
    const updated = permissions.savePermissions(req.body);
    res.json(updated);
  });

  app.post('/api/permissions/decision', async (req, res) => {
    const { id, approved } = req.body;
    if (!id || approved === undefined) {
      return res.status(400).json({ error: 'id and approved boolean are required' });
    }
    await agent.handleApprovalDecision(id, approved);
    res.json({ success: true, pending: permissions.getPendingRequests() });
  });

  // Terminal execution
  app.post('/api/terminal/execute', async (req, res) => {
    const { command, cwdRel, timeoutMs, bypassDangerousCheck } = req.body;
    if (!command) return res.status(400).json({ error: 'command is required' });
    try {
      const result = await terminal.execute(command, { cwdRel, timeoutMs, bypassDangerousCheck });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Browser
  app.get('/api/browser/tabs', (req, res) => {
    res.json({
      tabs: browser.getTabs(),
      activeTab: browser.getActiveTab(),
      internetAllowed: browser.isInternetAllowed()
    });
  });

  app.post('/api/browser/navigate', async (req, res) => {
    const { url, tabId } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });
    const tab = await browser.navigate(url, tabId);
    res.json(tab);
  });

  app.post('/api/browser/search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    try {
      const results = await browser.search(query);
      res.json(results);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/browser/tab/new', (req, res) => {
    const tab = browser.createTab(req.body.url);
    res.json(tab);
  });

  app.post('/api/browser/tab/switch', (req, res) => {
    const ok = browser.switchTab(req.body.id);
    res.json({ success: ok, activeTab: browser.getActiveTab() });
  });

  app.post('/api/browser/tab/close', (req, res) => {
    const ok = browser.closeTab(req.body.id);
    res.json({ success: ok, activeTab: browser.getActiveTab() });
  });

  app.post('/api/browser/internet-toggle', (req, res) => {
    const { allowed } = req.body;
    browser.setInternetAllowed(Boolean(allowed));
    res.json({ internetAllowed: browser.isInternetAllowed() });
  });

  // GitHub
  app.get('/api/github/status', async (req, res) => {
    const status = await github.getStatus();
    res.json(status);
  });

  app.post('/api/github/token', (req, res) => {
    github.setPersonalAccessToken(req.body.token || '');
    res.json({ success: true });
  });

  app.post('/api/github/init', async (req, res) => {
    const result = await github.gitInit(req.body.projectRelDir || 'projects');
    res.json(result);
  });

  app.post('/api/github/commit', async (req, res) => {
    const { projectRelDir, message } = req.body;
    const result = await github.gitAddAndCommit(projectRelDir || 'projects', message || 'Automated commit');
    res.json(result);
  });

  app.post('/api/github/create-repo', async (req, res) => {
    const { name, isPrivate } = req.body;
    const result = await github.createRepository(name, isPrivate);
    res.json(result);
  });

  // Vercel
  app.get('/api/vercel/status', async (req, res) => {
    const status = await vercel.getStatus();
    res.json(status);
  });

  app.post('/api/vercel/token', (req, res) => {
    vercel.setToken(req.body.token || '');
    res.json({ success: true });
  });

  app.post('/api/vercel/deploy', async (req, res) => {
    const { projectRelDir, production } = req.body;
    const result = await vercel.deploy(projectRelDir, production);
    res.json(result);
  });

  // PayPal Sandbox
  app.get('/api/paypal/status', (req, res) => {
    res.json(paypal.getStatus());
  });

  app.post('/api/paypal/config', (req, res) => {
    const { clientId, clientSecret, sandbox } = req.body;
    paypal.configure(clientId, clientSecret, sandbox !== false);
    res.json(paypal.getStatus());
  });

  app.post('/api/paypal/test-order', async (req, res) => {
    const { amount, currency, description } = req.body;
    const result = await paypal.createTestOrder(amount, currency, description);
    res.json(result);
  });

  // Agent Core
  app.get('/api/agent/task', (req, res) => {
    res.json(agent.getCurrentTask() || { status: 'idle' });
  });

  app.post('/api/agent/task', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const task = await agent.submitTask(prompt);
    res.json(task);
  });

  app.get('/api/agent/history', (req, res) => {
    res.json(agent.getTaskHistory());
  });

  app.post('/api/agent/resume', async (req, res) => {
    const resumed = await agent.resumeInterruptedTask();
    res.json({ success: resumed, currentTask: agent.getCurrentTask() });
  });

  // Audit Logs
  app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    res.json(security.getRecentLogs(limit));
  });

  app.get('/api/logs/raw', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(security.getRawLogContent());
  });

  // Self-Test & Diagnostics
  app.get('/api/selftest', async (req, res) => {
    try {
      const results = await selfTest.runAllDiagnostics();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Acceptance Test
  app.post('/api/acceptance', async (req, res) => {
    try {
      const report = await acceptance.runFullAcceptanceTest();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Documentation provider
  app.get('/api/docs/:docName', (req, res) => {
    const { docName } = req.params;
    const allowed = ['README.md', 'INSTALL.md', 'CONFIGURATION.md', 'SECURITY.md', 'ARCHITECTURE.md', 'TROUBLESHOOTING.md', 'TOOLS.md'];
    if (!allowed.includes(docName)) {
      return res.status(404).json({ error: 'Documentation file not found' });
    }
    const docPath = path.resolve(process.cwd(), docName);
    if (fs.existsSync(docPath)) {
      res.json({ name: docName, content: fs.readFileSync(docPath, 'utf8') });
    } else {
      res.status(404).json({ error: 'File does not exist yet' });
    }
  });

  // --- Vite Middleware or Static Asset Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\nAutonomous AI Agent Server running on http://0.0.0.0:${PORT}`);

    // Startup Hardware & Model Selection Routine
    try {
      const hw = detectHardware();
      const backends = await modelManager.checkBackends();
      const ollamaUrl = modelManager.getOllamaUrl();

      console.log('================================================================');
      console.log('         LOCAL AUTONOMOUS AI AGENT — HARDWARE & MODEL CHECK     ');
      console.log('================================================================');
      console.log(`System RAM Detected : ${hw.ram.totalGB} GB Total (Free: ${hw.ram.freeGB} GB)`);
      console.log(`CPU Cores           : ${hw.cpu.cores}`);
      if (hw.gpu.detected && hw.gpu.name) {
        console.log(`GPU Detected        : ${hw.gpu.name}`);
      }

      if (!backends.ollamaAvailable) {
        console.log(`Ollama Status       : OFFLINE (${ollamaUrl})`);
        console.log('----------------------------------------------------------------');
        console.log('  MODEL STATUS: NO LOCAL MODEL INSTALLED / OLLAMA OFFLINE');
        console.log('----------------------------------------------------------------');
        console.log(`  Ollama daemon is not reachable at ${ollamaUrl}.`);
        console.log('  To activate real local LLM on this device:');
        console.log('    1. Install Ollama: https://ollama.com');
        console.log('    2. Start Ollama service: ollama serve');
        const pullCmd = hw.ram.totalGB >= 16 ? 'ollama pull qwen2.5-coder:7b' : (hw.ram.totalGB >= 8 ? 'ollama pull llama3.2:3b' : 'ollama pull qwen2.5-coder:1.5b');
        console.log(`    3. Pull recommended model: ${pullCmd}`);
        console.log('----------------------------------------------------------------\n');
      } else {
        console.log(`Ollama Status       : ONLINE (v${backends.ollamaVersion || 'detected'} at ${ollamaUrl})`);
        const installed = await modelManager.listInstalledModels();
        const realModels = installed.filter((m) => m.backend === 'ollama');

        if (realModels.length === 0) {
          console.log('----------------------------------------------------------------');
          console.log('  MODEL STATUS: NO LOCAL MODEL INSTALLED');
          console.log('----------------------------------------------------------------');
          console.log('  Ollama is running, but no local models are currently installed.');
          console.log('  Run the following command in your terminal to install:');
          const pullCmd = hw.ram.totalGB >= 16 ? 'ollama pull qwen2.5-coder:7b' : (hw.ram.totalGB >= 8 ? 'ollama pull llama3.2:3b' : 'ollama pull qwen2.5-coder:1.5b');
          console.log(`    ${pullCmd}`);
          console.log('  Lightweight coding alternative:');
          console.log('    ollama pull qwen2.5-coder:1.5b');
          console.log('----------------------------------------------------------------\n');
        } else {
          console.log(`Installed Models    : ${realModels.map((m) => m.name).join(', ')}`);
          if (process.env.OLLAMA_MODEL && realModels.some((m) => m.name === process.env.OLLAMA_MODEL || m.id === process.env.OLLAMA_MODEL)) {
            modelManager.setActiveModel(process.env.OLLAMA_MODEL, 'ollama');
            console.log(`Active Local Model  : ${process.env.OLLAMA_MODEL} (configured via OLLAMA_MODEL)`);
          } else {
            const preferred = hw.ram.totalGB >= 16 ? ['qwen2.5-coder:7b', 'llama3.2:3b', 'qwen2.5-coder:1.5b'] : (hw.ram.totalGB >= 8 ? ['llama3.2:3b', 'qwen2.5-coder:1.5b', 'phi3:mini'] : ['qwen2.5-coder:1.5b', 'llama3.2:1b']);
            let chosen = realModels[0].id;
            for (const pref of preferred) {
              const match = realModels.find((m) => m.id === pref || m.id.startsWith(pref));
              if (match) {
                chosen = match.id;
                break;
              }
            }
            modelManager.setActiveModel(chosen, 'ollama');
            console.log(`Recommended Active  : ${chosen} (selected for ${hw.ram.totalGB} GB RAM)`);
          }
          console.log('================================================================\n');
        }
      }
    } catch (err: any) {
      console.warn('Hardware/Model startup check notice:', err.message);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Folder,
  FileCode,
  FileText,
  Trash2,
  Save,
  Search,
  RotateCcw,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

interface FileNode {
  name: string;
  relPath: string;
  type: 'file' | 'directory';
  sizeBytes?: number;
  modifiedAt?: string;
  children?: FileNode[];
}

export const ProjectsView: React.FC = () => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [changes, setChanges] = useState<Array<{
    id: string;
    filePath: string;
    action: string;
    timestamp: string;
    backupPath?: string;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchTree = async () => {
    try {
      const res = await fetch('/api/workspace/tree');
      if (res.ok) setTree(await res.json());

      const cRes = await fetch('/api/workspace/changes');
      if (cRes.ok) setChanges(await cRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleSelectFile = async (relPath: string) => {
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(relPath)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFile(relPath);
        setFileContent(data.content);
        setIsDirty(false);
        setSaveStatus(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile,
          content: fileContent,
          actionDesc: 'Manual edit in Dashboard'
        })
      });
      if (res.ok) {
        setIsDirty(false);
        setSaveStatus('Saved & Backed Up!');
        fetchTree();
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (relPath: string) => {
    if (!confirm(`Delete ${relPath}? A backup will be preserved in agent_workspace/backups/`)) return;
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(relPath)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedFile === relPath) {
          setSelectedFile(null);
          setFileContent('');
        }
        fetchTree();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFile = async () => {
    if (!newFilePath.trim()) return;
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newFilePath.trim(),
          content: '',
          actionDesc: 'Created via Workspace Explorer'
        })
      });
      if (res.ok) {
        setSelectedFile(newFilePath.trim());
        setFileContent('');
        setNewFilePath('');
        setIsCreating(false);
        fetchTree();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderTreeNodes = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = selectedFile === node.relPath;
      if (node.type === 'directory') {
        return (
          <div key={node.relPath} style={{ paddingLeft: `${depth * 12}px` }}>
            <div className="flex items-center gap-1.5 py-1 px-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/50 rounded cursor-default">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>{node.name}</span>
            </div>
            {node.children && renderTreeNodes(node.children, depth + 1)}
          </div>
        );
      }
      return (
        <div
          key={node.relPath}
          style={{ paddingLeft: `${depth * 12}px` }}
          onClick={() => handleSelectFile(node.relPath)}
          className={`group flex items-center justify-between py-1 px-2 text-xs rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-indigo-600 text-white font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <FileCode className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFile(node.relPath);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400"
            title="Delete file (backed up)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            Workspace Filesystem &amp; Versioning
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Sandboxed in agent_workspace/. Automatic versioned backups generated before every modification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New File
          </button>
          <button
            onClick={fetchTree}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            title="Refresh File Tree"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">agent_workspace/</span>
          <input
            type="text"
            placeholder="projects/my-app/index.html"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleCreateFile}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
          >
            Create
          </button>
        </div>
      )}

      {/* Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Tree Explorer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-between">
            <span>Workspace Structure</span>
            <span className="text-[10px] text-emerald-400 font-mono">SAFE SANDBOX</span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[500px]">
            {renderTreeNodes(tree)}
          </div>
        </div>

        {/* Center File Editor */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            {/* Editor Header Bar */}
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-semibold">
                  {selectedFile ? `agent_workspace/${selectedFile}` : 'No file selected'}
                </span>
                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
              </div>

              <div className="flex items-center gap-2">
                {saveStatus && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    {saveStatus}
                  </span>
                )}
                {selectedFile && (
                  <button
                    onClick={handleSaveFile}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save &amp; Backup
                  </button>
                )}
              </div>
            </div>

            {/* Code / Text Area */}
            <div className="p-4">
              {selectedFile ? (
                <textarea
                  rows={20}
                  value={fileContent}
                  onChange={(e) => {
                    setFileContent(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-lg p-3 leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
                />
              ) : (
                <div className="py-24 text-center text-slate-500 text-xs font-mono">
                  Select a file from the left workspace tree to inspect or edit.
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Character Count: {fileContent.length}</span>
            <span>UTF-8 Encoding</span>
          </div>
        </div>

        {/* Right Change History & Backups */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-between">
            <span>Modification Trail</span>
            <span className="text-[10px] text-indigo-400 font-mono">{changes.length} Events</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
            {changes.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                No file modifications logged yet.
              </div>
            ) : (
              changes.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-300 truncate max-w-[130px]">
                      {c.filePath}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{c.action}</div>
                  {c.backupPath && (
                    <div className="text-[10px] font-mono text-emerald-400/80 truncate">
                      Backed up: {c.backupPath.split('/').pop()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

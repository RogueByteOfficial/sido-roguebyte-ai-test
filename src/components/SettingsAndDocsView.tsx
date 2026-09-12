import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileCode,
  CheckCircle2,
  Terminal,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderDown
} from 'lucide-react';

export const SettingsAndDocsView: React.FC = () => {
  const docFiles = [
    'README.md',
    'INSTALL.md',
    'CONFIGURATION.md',
    'SECURITY.md',
    'ARCHITECTURE.md',
    'TROUBLESHOOTING.md',
    'TOOLS.md'
  ];

  const [activeDoc, setActiveDoc] = useState('README.md');
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchDoc = async (name: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/docs/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setDocContent(data.content);
        setActiveDoc(name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc('README.md');
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Documentation &amp; Environment Manuals
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Complete technical documentation, installation guides, configuration matrices, and setup scripts.
          </p>
        </div>
      </div>

      {/* Docs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Manual Documents
          </div>

          <div className="space-y-1">
            {docFiles.map((doc) => {
              const isSelected = activeDoc === doc;
              return (
                <button
                  key={doc}
                  onClick={() => fetchDoc(doc)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{doc}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
            <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Setup Automation Scripts
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-indigo-400 font-semibold">Linux / WSL / Mac:</div>
              <div className="text-slate-400">chmod +x setup.sh</div>
              <div className="text-slate-400">./setup.sh</div>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-emerald-400 font-semibold">Windows (CMD / PowerShell):</div>
              <div className="text-slate-400">setup.bat</div>
            </div>
          </div>
        </div>

        {/* Document Content Viewer */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-white font-semibold">{activeDoc}</span>
              <span className="text-slate-500">Markdown Format</span>
            </div>

            <div className="p-6 overflow-y-auto max-h-[650px]">
              {isLoading ? (
                <div className="py-24 text-center text-slate-500 text-xs font-mono">
                  Loading documentation content...
                </div>
              ) : (
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {docContent}
                </pre>
              )}
            </div>
          </div>

          <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Local AI Agent Phase 1 Specification</span>
            <span>Free &amp; Open Source</span>
          </div>
        </div>
      </div>
    </div>
  );
};

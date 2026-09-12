import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Plus,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { BrowserTab } from '../types';

export const BrowserView: React.FC = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTab, setActiveTab] = useState<BrowserTab | null>(null);
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; link: string; snippet: string }>>([]);
  const [internetAllowed, setInternetAllowed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBrowserState = async () => {
    try {
      const res = await fetch('/api/browser/tabs');
      if (res.ok) {
        const data = await res.json();
        setTabs(data.tabs);
        setActiveTab(data.activeTab);
        setInternetAllowed(data.internetAllowed);
        if (data.activeTab?.url) setUrlInput(data.activeTab.url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBrowserState();
  }, []);

  const handleNavigate = async (targetUrl = urlInput) => {
    if (!targetUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/browser/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, tabId: activeTab?.id })
      });
      const data = await res.json();
      setActiveTab(data);
      fetchBrowserState();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/browser/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTab = async () => {
    try {
      const res = await fetch('/api/browser/tab/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'about:blank' })
      });
      const tab = await res.json();
      setActiveTab(tab);
      setUrlInput(tab.url);
      fetchBrowserState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchTab = async (id: string) => {
    try {
      const res = await fetch('/api/browser/tab/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      setActiveTab(data.activeTab);
      setUrlInput(data.activeTab.url);
      fetchBrowserState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseTab = async (id: string) => {
    try {
      await fetch('/api/browser/tab/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchBrowserState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleInternet = async (newVal: boolean) => {
    try {
      const res = await fetch('/api/browser/internet-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowed: newVal })
      });
      const data = await res.json();
      setInternetAllowed(data.internetAllowed);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Global Internet Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Real Browser Automation &amp; Web Research
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Extracts DOM nodes, text content, hyperlinks, and records structured research into the workspace.
          </p>
        </div>

        {/* Global Internet Access Configuration */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <span className="text-xs font-semibold text-slate-400">Internet Access:</span>
          <button
            onClick={() => handleToggleInternet(!internetAllowed)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              internetAllowed
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {internetAllowed ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                [✓] Allow Internet
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                [ ] Block Internet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Browser Shell */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Tab Bar */}
        <div className="bg-slate-950 px-3 pt-2.5 flex items-center gap-1.5 border-b border-slate-800/80 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab?.id;
            return (
              <div
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer border-t border-x transition-colors max-w-[200px] ${
                  isActive
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <span className="truncate">{tab.title || tab.url}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleNewTab}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Open new tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
            placeholder="https://example.com"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => handleNavigate()}
            disabled={isLoading}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Navigate
          </button>
        </div>

        {/* Browser Content / Visual Render */}
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[480px]">
          {/* Main Visual Render Frame */}
          <div className="lg:col-span-2 p-5 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
            {activeTab?.screenshotSvg ? (
              <div
                className="w-full h-full rounded-lg overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center bg-slate-950"
                dangerouslySetInnerHTML={{ __html: activeTab.screenshotSvg }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No active webpage loaded. Enter a URL above or run a search below.
              </div>
            )}

            {activeTab && activeTab.status === 'loaded' && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>STATUS CODE: {activeTab.statusCode || 200} OK</span>
                <span>LINKS FOUND: {activeTab.links.length}</span>
              </div>
            )}
          </div>

          {/* Extracted Text & Links Sidebar */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[550px] bg-slate-900">
            <div>
              <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
                Extracted Page Content
              </h4>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans max-h-48 overflow-y-auto">
                {activeTab?.contentSnippet || 'No content extracted yet.'}
              </div>
            </div>

            {activeTab?.links && activeTab.links.length > 0 && (
              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
                  Extracted Hyperlinks ({activeTab.links.length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeTab.links.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNavigate(link.href)}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-xs text-indigo-400 hover:text-indigo-300 truncate flex items-center gap-1 font-mono transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{link.text || link.href}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Web Search Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          DuckDuckGo Web Research Engine (Saves to agent_workspace/research/)
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search topic or research papers (e.g. 'Ollama small language models quantization 2026')..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {searchResults.map((res, i) => (
              <div
                key={i}
                onClick={() => handleNavigate(res.link)}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-colors"
              >
                <div className="text-xs font-semibold text-indigo-400 truncate mb-1">
                  {res.title}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate mb-1">
                  {res.link}
                </div>
                <div className="text-xs text-slate-300 line-clamp-2">
                  {res.snippet}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

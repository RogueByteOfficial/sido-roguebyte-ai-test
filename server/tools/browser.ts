import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { SecurityManager } from '../security.js';
import { WorkspaceManager } from '../workspace.js';

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  contentSnippet: string;
  fullText?: string;
  links: Array<{ text: string; href: string }>;
  statusCode?: number;
  lastNavigated: string;
  screenshotSvg?: string;
  engine: 'jsdom' | 'network_fetch';
}

export interface DOMInteractionResult {
  success: boolean;
  action: 'click' | 'type' | 'inspect' | 'verify';
  selector?: string;
  initialText?: string;
  updatedText?: string;
  elementFound: boolean;
  message: string;
  domSnippet?: string;
}

export class BrowserTool {
  private workspace: WorkspaceManager;
  private security: SecurityManager;
  private internetAllowed: boolean = true;
  private tabs: Map<string, BrowserTab> = new Map();
  private activeTabId: string = 'tab_default';
  private activeDom: JSDOM | null = null;

  constructor(workspace: WorkspaceManager, security: SecurityManager) {
    this.workspace = workspace;
    this.security = security;
    this.tabs.set(this.activeTabId, {
      id: this.activeTabId,
      url: 'about:blank',
      title: 'New Tab',
      status: 'idle',
      contentSnippet: 'Browser initialized with real DOM engine (JSDOM/W3C Standards).',
      links: [],
      lastNavigated: new Date().toISOString(),
      engine: 'jsdom'
    });
  }

  public setInternetAllowed(allowed: boolean): void {
    this.internetAllowed = allowed;
    this.security.logAudit('BROWSER', 'INFO', `Internet access globally ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
  }

  public isInternetAllowed(): boolean {
    return this.internetAllowed;
  }

  public getTabs(): BrowserTab[] {
    return Array.from(this.tabs.values());
  }

  public getActiveTab(): BrowserTab {
    return this.tabs.get(this.activeTabId) || Array.from(this.tabs.values())[0];
  }

  public createTab(url = 'about:blank'): BrowserTab {
    const id = 'tab_' + Date.now();
    const tab: BrowserTab = {
      id,
      url,
      title: 'New Tab',
      status: 'idle',
      contentSnippet: '',
      links: [],
      lastNavigated: new Date().toISOString(),
      engine: 'jsdom'
    };
    this.tabs.set(id, tab);
    this.activeTabId = id;
    return tab;
  }

  public switchTab(id: string): boolean {
    if (this.tabs.has(id)) {
      this.activeTabId = id;
      return true;
    }
    return false;
  }

  public closeTab(id: string): boolean {
    if (this.tabs.size <= 1) return false;
    this.tabs.delete(id);
    if (this.activeTabId === id) {
      this.activeTabId = Array.from(this.tabs.keys())[0];
    }
    return true;
  }

  /**
   * Loads HTML directly into the real browser DOM engine
   */
  public loadHtml(htmlContent: string, url: string = 'http://localhost:3000'): BrowserTab {
    const tab = this.getActiveTab();
    tab.url = url;
    tab.status = 'loading';
    tab.lastNavigated = new Date().toISOString();
    tab.engine = 'jsdom';

    try {
      const virtualConsole = new VirtualConsole();
      this.activeDom = new JSDOM(htmlContent, {
        url,
        runScripts: 'dangerously',
        resources: 'usable',
        virtualConsole
      });

      const document = this.activeDom.window.document;
      tab.title = document.title || 'Local Application';
      tab.statusCode = 200;
      tab.status = 'loaded';

      // Extract links
      const links: Array<{ text: string; href: string }> = [];
      document.querySelectorAll('a').forEach((el) => {
        links.push({ text: (el.textContent || '').trim(), href: el.getAttribute('href') || '' });
      });
      tab.links = links.slice(0, 25);

      const bodyText = (document.body ? document.body.textContent || '' : '').replace(/\s+/g, ' ').trim();
      tab.contentSnippet = bodyText.slice(0, 300);
      tab.fullText = bodyText;

      this.security.logAudit('BROWSER', 'INFO', `Loaded HTML into DOM engine: "${tab.title}" (${url})`);
      return tab;
    } catch (err: any) {
      tab.status = 'error';
      tab.contentSnippet = `Failed to parse DOM: ${err.message}`;
      return tab;
    }
  }

  /**
   * Navigates to a URL. Supports both HTTP(S) URLs and local file/workspace paths.
   */
  public async navigate(url: string, tabId?: string): Promise<BrowserTab> {
    const targetTabId = tabId || this.activeTabId;
    let tab = this.tabs.get(targetTabId);
    if (!tab) {
      tab = this.createTab(url);
    }

    // Handle local workspace file loading
    if (url.startsWith('file://') || url.startsWith('projects/') || url.endsWith('.html')) {
      const filePath = url.startsWith('file://') ? url.replace('file://', '') : this.workspace.resolvePath(url);
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, 'utf8');
        return this.loadHtml(html, `file://${filePath}`);
      }
    }

    if (!this.internetAllowed) {
      tab.status = 'error';
      tab.contentSnippet = 'Internet access is globally disabled in agent permission settings.';
      this.security.logAudit('BROWSER', 'WARN', `Blocked attempt to navigate to ${url} (Internet blocked)`);
      return tab;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    tab.url = url;
    tab.status = 'loading';
    tab.lastNavigated = new Date().toISOString();

    try {
      this.security.logAudit('BROWSER', 'INFO', `Navigating to: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AI-Agent/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      clearTimeout(timeout);

      tab.statusCode = response.status;
      const html = await response.text();

      // Mount into real JSDOM
      const virtualConsole = new VirtualConsole();
      this.activeDom = new JSDOM(html, {
        url,
        runScripts: 'outside-only',
        virtualConsole
      });

      const document = this.activeDom.window.document;
      tab.title = document.title || url;
      tab.engine = 'jsdom';

      // Extract links
      const links: Array<{ text: string; href: string }> = [];
      document.querySelectorAll('a').forEach((el) => {
        const text = (el.textContent || '').trim();
        const href = el.getAttribute('href') || '';
        if (text && href) links.push({ text, href });
      });
      tab.links = links.slice(0, 25);

      const bodyText = (document.body ? document.body.textContent || '' : '').replace(/\s+/g, ' ').trim();
      tab.contentSnippet = bodyText.slice(0, 400);
      tab.fullText = bodyText;
      tab.status = 'loaded';

      return tab;
    } catch (err: any) {
      tab.status = 'error';
      tab.contentSnippet = `Failed to navigate: ${err.message}`;
      this.security.logAudit('BROWSER', 'ERROR', `Navigation error for ${url}: ${err.message}`);
      return tab;
    }
  }

  /**
   * Real DOM Inspection: finds elements and extracts properties
   */
  public querySelector(selector: string): { found: boolean; tagName?: string; text?: string; id?: string; className?: string } {
    if (!this.activeDom) {
      return { found: false };
    }
    const doc = this.activeDom.window.document;
    const el = doc.querySelector(selector);
    if (!el) {
      return { found: false };
    }
    return {
      found: true,
      tagName: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim(),
      id: el.id,
      className: el.className
    };
  }

  /**
   * Real DOM Interaction: Clicks a button or element and verifies DOM mutation
   */
  public clickElement(selector: string): DOMInteractionResult {
    if (!this.activeDom) {
      return {
        success: false,
        action: 'click',
        selector,
        elementFound: false,
        message: 'No active DOM loaded in browser tool'
      };
    }

    const doc = this.activeDom.window.document;
    const el = doc.querySelector(selector) as HTMLElement | null;
    if (!el) {
      return {
        success: false,
        action: 'click',
        selector,
        elementFound: false,
        message: `Element not found matching selector: ${selector}`
      };
    }

    const initialText = (el.textContent || '').trim();

    try {
      // Dispatch real W3C MouseEvent
      const clickEvent = new this.activeDom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: this.activeDom.window as unknown as Window
      });
      el.dispatchEvent(clickEvent);

      const updatedText = (el.textContent || '').trim();
      this.security.logAudit('BROWSER', 'INFO', `Clicked element "${selector}". Initial: "${initialText}", Updated: "${updatedText}"`);

      return {
        success: true,
        action: 'click',
        selector,
        elementFound: true,
        initialText,
        updatedText,
        message: `Successfully clicked ${selector}.`,
        domSnippet: el.outerHTML
      };
    } catch (err: any) {
      return {
        success: false,
        action: 'click',
        selector,
        elementFound: true,
        message: `Click event dispatch error: ${err.message}`
      };
    }
  }

  /**
   * Executes the full 8-step Real Browser Verification required by Phase 1.5
   * 1. Start / load local application
   * 2. Navigate to it
   * 3. Read the DOM
   * 4. Find the heading
   * 5. Find the button
   * 6. Click the button
   * 7. Read the changed text
   * 8. Verify the expected result
   */
  public verifyInteractiveApp(htmlContent?: string): {
    success: boolean;
    steps: Array<{ step: string; success: boolean; details: string }>;
    engine: string;
  } {
    const testHtml = htmlContent || `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Counter Test App</title>
</head>
<body>
  <h1 id="main-heading">Interactive Counter Application</h1>
  <p>Current count: <span id="count-value">0</span></p>
  <button id="counter-btn">Increment Counter</button>
  <script>
    let count = 0;
    const countDisplay = document.getElementById('count-value');
    const btn = document.getElementById('counter-btn');
    btn.addEventListener('click', () => {
      count += 1;
      countDisplay.textContent = String(count);
      btn.textContent = 'Count: ' + count;
    });
  </script>
</body>
</html>`;

    const steps: Array<{ step: string; success: boolean; details: string }> = [];

    // Step 1 & 2: Load and navigate
    this.loadHtml(testHtml, 'http://localhost:3000/counter-test');
    steps.push({
      step: '1 & 2. Start local app and navigate',
      success: true,
      details: 'Loaded HTML into real DOM engine with active JavaScript runtime.'
    });

    // Step 3: Read DOM
    if (!this.activeDom) {
      steps.push({ step: '3. Read DOM', success: false, details: 'DOM failed to initialize' });
      return { success: false, steps, engine: 'JSDOM (W3C DOM Level 4)' };
    }
    const doc = this.activeDom.window.document;
    steps.push({
      step: '3. Read the DOM',
      success: true,
      details: `DOM tree parsed successfully. Title: "${doc.title}"`
    });

    // Step 4: Find heading
    const heading = doc.querySelector('h1');
    const headingFound = Boolean(heading && heading.textContent?.includes('Interactive Counter'));
    steps.push({
      step: '4. Find the heading',
      success: headingFound,
      details: heading ? `Found <h1>: "${heading.textContent?.trim()}"` : 'Heading not found'
    });

    // Step 5: Find button
    const btn = doc.querySelector('#counter-btn') as HTMLElement | null;
    const btnFound = Boolean(btn);
    steps.push({
      step: '5. Find the button',
      success: btnFound,
      details: btn ? `Found button with id "#counter-btn": "${btn.textContent?.trim()}"` : 'Button not found'
    });

    if (!btn || !headingFound) {
      return { success: false, steps, engine: 'JSDOM (W3C DOM Level 4)' };
    }

    // Step 6: Click the button
    const countSpan = doc.querySelector('#count-value');
    const initialCount = countSpan?.textContent?.trim();

    const clickRes = this.clickElement('#counter-btn');
    steps.push({
      step: '6. Click the button',
      success: clickRes.success,
      details: `Dispatched MouseEvent click to #counter-btn. Result: ${clickRes.message}`
    });

    // Step 7: Read changed text
    const updatedCount = countSpan?.textContent?.trim();
    const updatedBtnText = btn.textContent?.trim();
    const changed = updatedCount === '1';
    steps.push({
      step: '7. Read the changed text',
      success: changed,
      details: `Count text before click: "${initialCount}", after click: "${updatedCount}". Button text: "${updatedBtnText}"`
    });

    // Step 8: Verify expected result
    const verified = changed && updatedBtnText === 'Count: 1';
    steps.push({
      step: '8. Verify expected result',
      success: verified,
      details: verified
        ? 'Verified: DOM state successfully mutated by in-page JavaScript event listener from 0 to 1.'
        : `Verification failed: expected "1", got "${updatedCount}"`
    });

    const allPassed = steps.every((s) => s.success);
    return {
      success: allPassed,
      steps,
      engine: 'JSDOM (W3C DOM Level 4)'
    };
  }

  public async search(query: string): Promise<any> {
    if (!this.internetAllowed) {
      return {
        query,
        results: [],
        message: 'Internet access is globally disabled in agent permission settings.'
      };
    }

    const encoded = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

    try {
      this.security.logAudit('BROWSER', 'INFO', `Agent searching web for: "${query}"`);
      const tab = await this.navigate(searchUrl);

      const results: Array<{ title: string; snippet: string; url: string }> = [];
      if (this.activeDom) {
        const doc = this.activeDom.window.document;
        const resultElements = doc.querySelectorAll('.result');
        resultElements.forEach((el, i) => {
          if (i < 5) {
            const titleEl = el.querySelector('.result__title a');
            const snippetEl = el.querySelector('.result__snippet');
            if (titleEl) {
              results.push({
                title: (titleEl.textContent || '').trim(),
                snippet: (snippetEl?.textContent || '').trim(),
                url: titleEl.getAttribute('href') || ''
              });
            }
          }
        });
      }

      return { query, results, totalFound: results.length };
    } catch (err: any) {
      return { query, results: [], error: err.message };
    }
  }
}

import fs from 'fs';
import path from 'path';

export interface FileChangeRecord {
  id: string;
  filePath: string;
  action: 'CREATE' | 'MODIFY' | 'DELETE';
  timestamp: string;
  backupPath?: string;
  sizeBytes?: number;
}

export interface WorkspaceFileNode {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  sizeBytes?: number;
  updatedAt?: string;
  children?: WorkspaceFileNode[];
}

export class WorkspaceManager {
  public rootDir: string;
  private changeHistoryPath: string;
  private changeHistory: FileChangeRecord[] = [];

  constructor(workspacePath?: string) {
    const defaultWorkspace = process.env.AGENT_WORKSPACE ? path.resolve(process.cwd(), process.env.AGENT_WORKSPACE) : path.resolve(process.cwd(), 'agent_workspace');
    this.rootDir = workspacePath || defaultWorkspace;
    this.initializeDirectories();
    this.changeHistoryPath = path.join(this.rootDir, 'logs', 'file_changes.json');
    this.loadChangeHistory();
  }

  private initializeDirectories(): void {
    const requiredDirs = [
      'projects',
      'downloads',
      'research',
      'logs',
      'memory',
      'temporary',
      'backups'
    ];

    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }

    for (const dir of requiredDirs) {
      const fullPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  private loadChangeHistory(): void {
    try {
      if (fs.existsSync(this.changeHistoryPath)) {
        const raw = fs.readFileSync(this.changeHistoryPath, 'utf8');
        this.changeHistory = JSON.parse(raw);
      }
    } catch {
      this.changeHistory = [];
    }
  }

  private saveChangeHistory(): void {
    try {
      fs.writeFileSync(this.changeHistoryPath, JSON.stringify(this.changeHistory, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving change history:', err);
    }
  }

  public resolvePath(subPath: string): string {
    if (path.isAbsolute(subPath) && subPath.startsWith(this.rootDir)) {
      return subPath;
    }
    const cleanSub = subPath.replace(/^(\.\/|\/)/, '');
    const resolved = path.resolve(this.rootDir, cleanSub);
    // Sandboxing check: ensure the path is within the workspace root
    if (!resolved.startsWith(this.rootDir)) {
      throw new Error(`Security Violation: Path "${subPath}" escapes the agent workspace sandbox.`);
    }
    return resolved;
  }

  public getRelativePath(fullPath: string): string {
    return path.relative(this.rootDir, fullPath);
  }

  public backupFile(filePath: string): string | null {
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) return null;

    const baseName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${timestamp}_${baseName}`;
    const backupTarget = path.join(this.rootDir, 'backups', backupFileName);

    fs.copyFileSync(filePath, backupTarget);
    return backupTarget;
  }

  public readFile(relPath: string): string {
    const target = this.resolvePath(relPath);
    if (!fs.existsSync(target)) {
      throw new Error(`File does not exist: ${relPath}`);
    }
    return fs.readFileSync(target, 'utf8');
  }

  public writeFile(relPath: string, content: string, actionDesc?: string): { success: boolean; backupPath?: string } {
    const target = this.resolvePath(relPath);
    const parent = path.dirname(target);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }

    let backupPath: string | undefined = undefined;
    const exists = fs.existsSync(target);

    if (exists) {
      const backup = this.backupFile(target);
      if (backup) backupPath = backup;
    }

    fs.writeFileSync(target, content, 'utf8');

    const record: FileChangeRecord = {
      id: 'fc_' + Date.now(),
      filePath: relPath,
      action: exists ? 'MODIFY' : 'CREATE',
      timestamp: new Date().toISOString(),
      backupPath: backupPath ? this.getRelativePath(backupPath) : undefined,
      sizeBytes: Buffer.byteLength(content, 'utf8')
    };

    this.changeHistory.unshift(record);
    if (this.changeHistory.length > 200) this.changeHistory.pop();
    this.saveChangeHistory();

    return { success: true, backupPath: backupPath ? this.getRelativePath(backupPath) : undefined };
  }

  public deleteFile(relPath: string): { success: boolean; backupPath?: string } {
    const target = this.resolvePath(relPath);
    if (!fs.existsSync(target)) {
      return { success: false };
    }

    let backupPath: string | undefined = undefined;
    const stats = fs.statSync(target);
    if (!stats.isDirectory()) {
      const backup = this.backupFile(target);
      if (backup) backupPath = backup;
      fs.unlinkSync(target);
    } else {
      fs.rmSync(target, { recursive: true, force: true });
    }

    const record: FileChangeRecord = {
      id: 'fc_' + Date.now(),
      filePath: relPath,
      action: 'DELETE',
      timestamp: new Date().toISOString(),
      backupPath: backupPath ? this.getRelativePath(backupPath) : undefined
    };

    this.changeHistory.unshift(record);
    this.saveChangeHistory();

    return { success: true, backupPath: backupPath ? this.getRelativePath(backupPath) : undefined };
  }

  public listTree(directoryRel = ''): WorkspaceFileNode[] {
    const targetDir = this.resolvePath(directoryRel);
    if (!fs.existsSync(targetDir)) return [];

    const buildTree = (dir: string): WorkspaceFileNode[] => {
      const items = fs.readdirSync(dir);
      const nodes: WorkspaceFileNode[] = [];

      for (const item of items) {
        const fullItemPath = path.join(dir, item);
        let stat: fs.Stats;
        try {
          stat = fs.statSync(fullItemPath);
        } catch {
          continue;
        }

        const isDir = stat.isDirectory();
        const rel = path.relative(this.rootDir, fullItemPath);

        const node: WorkspaceFileNode = {
          name: item,
          path: fullItemPath,
          relativePath: rel,
          isDirectory: isDir,
          sizeBytes: isDir ? undefined : stat.size,
          updatedAt: stat.mtime.toISOString(),
          children: isDir ? buildTree(fullItemPath) : undefined
        };

        nodes.push(node);
      }
      return nodes;
    };

    return buildTree(targetDir);
  }

  public searchFiles(keyword: string, maxResults = 20): Array<{ path: string; line: number; content: string }> {
    const results: Array<{ path: string; line: number; content: string }> = [];
    const lower = keyword.toLowerCase();

    const scan = (dir: string) => {
      if (results.length >= maxResults) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'backups') continue;
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          scan(full);
        } else if (stat.size < 1024 * 1024) {
          try {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(lower)) {
                results.push({
                  path: path.relative(this.rootDir, full),
                  line: i + 1,
                  content: lines[i].trim()
                });
                if (results.length >= maxResults) return;
              }
            }
          } catch {}
        }
      }
    };

    scan(this.rootDir);
    return results;
  }

  public getChangeHistory(): FileChangeRecord[] {
    return this.changeHistory;
  }
}

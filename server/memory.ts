import fs from 'fs';
import path from 'path';

export interface ShortTermMemory {
  activeTaskId?: string;
  activeTaskPrompt?: string;
  currentStep?: number;
  scratchpad: string;
  lastObservation?: string;
  recentToolCalls: Array<{ tool: string; timestamp: string; summary: string }>;
  interruptedState?: any;
}

export interface LongTermMemory {
  learnedSolutions: Array<{ problemPattern: string; solution: string; tags: string[]; addedAt: string }>;
  errorsEncountered: Array<{ error: string; fix: string; occurrences: number; lastSeen: string }>;
  userPreferences: Record<string, any>;
  environmentFacts: Record<string, string>;
  credentialsMetadata: Array<{ service: string; configured: boolean; lastValidated?: string; scopes?: string[] }>;
}

export interface ProjectMemoryItem {
  projectId: string;
  name: string;
  rootPath: string;
  techStack: string[];
  gitRepo?: string;
  vercelProjectId?: string;
  lastBuildCommand?: string;
  lastTestCommand?: string;
  notes: string[];
  updatedAt: string;
}

export class MemoryManager {
  private memoryDir: string;
  private shortTermPath: string;
  private longTermPath: string;
  private projectMemoryPath: string;

  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;
  private projects: Record<string, ProjectMemoryItem>;

  constructor(workspaceDir: string) {
    this.memoryDir = path.join(workspaceDir, 'memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    this.shortTermPath = path.join(this.memoryDir, 'SHORT_TERM_MEMORY.json');
    this.longTermPath = path.join(this.memoryDir, 'LONG_TERM_MEMORY.json');
    this.projectMemoryPath = path.join(this.memoryDir, 'PROJECT_MEMORY.json');

    this.shortTerm = this.loadJSON(this.shortTermPath, {
      scratchpad: '',
      recentToolCalls: []
    });

    this.longTerm = this.loadJSON(this.longTermPath, {
      learnedSolutions: [
        {
          problemPattern: 'node_modules missing or package not found',
          solution: 'Run npm install in the project directory before executing build',
          tags: ['node', 'npm', 'build'],
          addedAt: new Date().toISOString()
        },
        {
          problemPattern: 'git remote origin not set',
          solution: 'Initialize git repository and prompt user to link remote or create repository via GitHub integration',
          tags: ['git', 'github'],
          addedAt: new Date().toISOString()
        }
      ],
      errorsEncountered: [],
      userPreferences: {
        theme: 'light',
        autoConfirmSafeActions: true,
        maxRetries: 3
      },
      environmentFacts: {},
      credentialsMetadata: []
    });

    this.projects = this.loadJSON(this.projectMemoryPath, {});
  }

  private loadJSON<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch {}
    return fallback;
  }

  private saveShortTerm(): void {
    try {
      fs.writeFileSync(this.shortTermPath, JSON.stringify(this.shortTerm, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving short term memory:', err);
    }
  }

  private saveLongTerm(): void {
    try {
      fs.writeFileSync(this.longTermPath, JSON.stringify(this.longTerm, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving long term memory:', err);
    }
  }

  private saveProjectMemory(): void {
    try {
      fs.writeFileSync(this.projectMemoryPath, JSON.stringify(this.projects, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving project memory:', err);
    }
  }

  // Short-Term Memory Methods
  public getShortTerm(): ShortTermMemory {
    return this.shortTerm;
  }

  public updateShortTerm(updates: Partial<ShortTermMemory>): void {
    this.shortTerm = { ...this.shortTerm, ...updates };
    this.saveShortTerm();
  }

  public clearShortTerm(): void {
    this.shortTerm = {
      scratchpad: '',
      recentToolCalls: []
    };
    this.saveShortTerm();
  }

  public recordToolCall(tool: string, summary: string): void {
    this.shortTerm.recentToolCalls.unshift({
      tool,
      timestamp: new Date().toISOString(),
      summary
    });
    if (this.shortTerm.recentToolCalls.length > 20) {
      this.shortTerm.recentToolCalls.pop();
    }
    this.saveShortTerm();
  }

  // Long-Term Memory Methods
  public getLongTerm(): LongTermMemory {
    return this.longTerm;
  }

  public addLearnedSolution(pattern: string, solution: string, tags: string[] = []): void {
    this.longTerm.learnedSolutions.unshift({
      problemPattern: pattern,
      solution,
      tags,
      addedAt: new Date().toISOString()
    });
    this.saveLongTerm();
  }

  public recordErrorAndFix(error: string, fix: string): void {
    const existing = this.longTerm.errorsEncountered.find((e) => e.error === error);
    if (existing) {
      existing.occurrences++;
      existing.fix = fix;
      existing.lastSeen = new Date().toISOString();
    } else {
      this.longTerm.errorsEncountered.unshift({
        error,
        fix,
        occurrences: 1,
        lastSeen: new Date().toISOString()
      });
    }
    this.saveLongTerm();
  }

  public setUserPreference(key: string, value: any): void {
    this.longTerm.userPreferences[key] = value;
    this.saveLongTerm();
  }

  public setCredentialMetadata(service: string, configured: boolean, scopes: string[] = []): void {
    const idx = this.longTerm.credentialsMetadata.findIndex((c) => c.service === service);
    const item = {
      service,
      configured,
      lastValidated: new Date().toISOString(),
      scopes
    };
    if (idx >= 0) {
      this.longTerm.credentialsMetadata[idx] = item;
    } else {
      this.longTerm.credentialsMetadata.push(item);
    }
    this.saveLongTerm();
  }

  // Project Memory Methods
  public getProjects(): Record<string, ProjectMemoryItem> {
    return this.projects;
  }

  public getProject(projectId: string): ProjectMemoryItem | undefined {
    return this.projects[projectId];
  }

  public saveProject(item: ProjectMemoryItem): void {
    this.projects[item.projectId] = { ...item, updatedAt: new Date().toISOString() };
    this.saveProjectMemory();
  }

  public canResumeTask(): boolean {
    return !!(this.shortTerm.activeTaskId && this.shortTerm.interruptedState);
  }
}

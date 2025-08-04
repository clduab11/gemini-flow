/**
 * Context Gatherer - Collects code context for AI processing
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { CodeContext, WorkspaceAnalysis } from '../types';
import { Logger } from './logger';

export class ContextGatherer {
  constructor(private readonly _logger: Logger) {}

  /**
   * Gather context from a file and optional selection
   */
  gatherFileContext(document: vscode.TextDocument, selection?: vscode.Selection): CodeContext {
    try {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      const workspaceRoot = workspaceFolder?.uri.fsPath;
      
      const context: CodeContext = {
        fileName: path.basename(document.fileName),
        language: document.languageId,
        fullText: document.getText(),
        relativeFilePath: workspaceRoot 
          ? path.relative(workspaceRoot, document.fileName)
          : document.fileName,
        workspaceRoot
      };

      if (selection && !selection.isEmpty) {
        context.selectedText = document.getText(selection);
        context.lineNumber = selection.start.line + 1;
        context.columnNumber = selection.start.character + 1;
      }

      this._logger.debug('File context gathered', {
        fileName: context.fileName,
        language: context.language,
        hasSelection: !!context.selectedText,
        textLength: context.fullText.length
      });

      return context;
    } catch (error) {
      this._logger.error('Failed to gather file context', error as Error);
      throw error;
    }
  }

  /**
   * Gather comprehensive project context
   */
  async gatherProjectContext(workspaceFolder: vscode.WorkspaceFolder): Promise<WorkspaceAnalysis> {
    try {
      this._logger.info('Gathering project context...');

      const analysis: WorkspaceAnalysis = {
        projectType: 'unknown',
        languages: [],
        dependencies: [],
        architecture: {
          patterns: [],
          complexity: 0,
          maintainability: 0
        },
        recommendations: []
      };

      // Analyze project structure
      await this.analyzeProjectStructure(workspaceFolder, analysis);
      
      // Detect project type
      analysis.projectType = await this.detectProjectType(workspaceFolder);
      
      // Analyze languages used
      analysis.languages = await this.detectLanguages(workspaceFolder);
      
      // Analyze dependencies
      analysis.dependencies = await this.analyzeDependencies(workspaceFolder);
      
      // Analyze architecture patterns
      analysis.architecture = await this.analyzeArchitecture(workspaceFolder);
      
      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      this._logger.info('Project context analysis completed', {
        projectType: analysis.projectType,
        languageCount: analysis.languages.length,
        dependencyCount: analysis.dependencies.length
      });

      return analysis;
    } catch (error) {
      this._logger.error('Failed to gather project context', error as Error);
      throw error;
    }
  }

  /**
   * Gather workspace-wide context
   */
  async gatherWorkspaceContext(): Promise<{
    folders: string[];
    openFiles: string[];
    recentChanges: string[];
  }> {
    try {
      const context = {
        folders: [] as string[],
        openFiles: [] as string[],
        recentChanges: [] as string[]
      };

      // Get workspace folders
      if (vscode.workspace.workspaceFolders) {
        context.folders = vscode.workspace.workspaceFolders.map(folder => 
          path.basename(folder.uri.fsPath)
        );
      }

      // Get open files
      context.openFiles = vscode.workspace.textDocuments
        .filter(doc => !doc.isUntitled && doc.uri.scheme === 'file')
        .map(doc => path.basename(doc.fileName));

      // Get recent changes (from Git if available)
      context.recentChanges = await this.getRecentChanges();

      this._logger.debug('Workspace context gathered', {
        folderCount: context.folders.length,
        openFileCount: context.openFiles.length,
        recentChangeCount: context.recentChanges.length
      });

      return context;
    } catch (error) {
      this._logger.error('Failed to gather workspace context', error as Error);
      throw error;
    }
  }

  /**
   * Get surrounding context for a specific line
   */
  getSurroundingContext(document: vscode.TextDocument, line: number, contextLines = 5): {
    before: string[];
    after: string[];
    target: string;
  } {
    const totalLines = document.lineCount;
    const startLine = Math.max(0, line - contextLines);
    const endLine = Math.min(totalLines - 1, line + contextLines);

    const before: string[] = [];
    const after: string[] = [];

    for (let i = startLine; i < line; i++) {
      before.push(document.lineAt(i).text);
    }

    for (let i = line + 1; i <= endLine; i++) {
      after.push(document.lineAt(i).text);
    }

    const target = line < totalLines ? document.lineAt(line).text : '';

    return { before, after, target };
  }

  /**
   * Extract imports and dependencies from code
   */
  extractImportsAndDependencies(document: vscode.TextDocument): {
    imports: string[];
    dependencies: string[];
  } {
    const text = document.getText();
    const language = document.languageId;
    const imports: string[] = [];
    const dependencies: string[] = [];

    try {
      switch (language) {
        case 'typescript':
        case 'javascript':
          this.extractJavaScriptImports(text, imports, dependencies);
          break;
        case 'python':
          this.extractPythonImports(text, imports, dependencies);
          break;
        case 'java':
          this.extractJavaImports(text, imports, dependencies);
          break;
        case 'go':
          this.extractGoImports(text, imports, dependencies);
          break;
        case 'rust':
          this.extractRustImports(text, imports, dependencies);
          break;
        default:
          this._logger.debug(`Import extraction not implemented for language: ${language}`);
      }
    } catch (error) {
      this._logger.error('Failed to extract imports', error as Error);
    }

    return { imports, dependencies };
  }

  /**
   * Analyze project structure
   */
  private async analyzeProjectStructure(
    workspaceFolder: vscode.WorkspaceFolder, 
    analysis: WorkspaceAnalysis
  ): Promise<void> {
    try {
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, '**/*'),
        '**/node_modules/**',
        1000
      );

      // Count files by type
      const fileTypes = new Map<string, number>();
      for (const file of files) {
        const ext = path.extname(file.fsPath);
        fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
      }

      // Determine complexity based on file count and structure
      analysis.architecture.complexity = this.calculateComplexity(files.length, fileTypes);
      
      this._logger.debug('Project structure analyzed', {
        totalFiles: files.length,
        fileTypes: Array.from(fileTypes.entries())
      });
    } catch (error) {
      this._logger.error('Failed to analyze project structure', error as Error);
    }
  }

  /**
   * Detect project type
   */
  private async detectProjectType(workspaceFolder: vscode.WorkspaceFolder): Promise<string> {
    const indicators = [
      { files: ['package.json'], type: 'Node.js' },
      { files: ['requirements.txt', 'setup.py', 'pyproject.toml'], type: 'Python' },
      { files: ['pom.xml', 'build.gradle'], type: 'Java' },
      { files: ['Cargo.toml'], type: 'Rust' },
      { files: ['go.mod'], type: 'Go' },
      { files: ['Gemfile'], type: 'Ruby' },
      { files: ['composer.json'], type: 'PHP' },
      { files: ['.csproj', '.sln'], type: 'C#' },
      { files: ['CMakeLists.txt'], type: 'C++' }
    ];

    for (const indicator of indicators) {
      for (const file of indicator.files) {
        try {
          const uri = vscode.Uri.joinPath(workspaceFolder.uri, file);
          await vscode.workspace.fs.stat(uri);
          return indicator.type;
        } catch {
          // File doesn't exist, continue
        }
      }
    }

    return 'unknown';
  }

  /**
   * Detect languages used in the project
   */
  private async detectLanguages(workspaceFolder: vscode.WorkspaceFolder): Promise<string[]> {
    const languageMap = new Map<string, number>();

    try {
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, '**/*'),
        '**/node_modules/**',
        500
      );

      for (const file of files) {
        const ext = path.extname(file.fsPath).toLowerCase();
        const language = this.getLanguageFromExtension(ext);
        if (language) {
          languageMap.set(language, (languageMap.get(language) || 0) + 1);
        }
      }
    } catch (error) {
      this._logger.error('Failed to detect languages', error as Error);
    }

    // Return languages sorted by usage
    return Array.from(languageMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language);
  }

  /**
   * Analyze project dependencies
   */
  private async analyzeDependencies(workspaceFolder: vscode.WorkspaceFolder): Promise<string[]> {
    const dependencies: string[] = [];

    try {
      // Check package.json
      const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
      try {
        const content = await vscode.workspace.fs.readFile(packageJsonUri);
        const packageJson = JSON.parse(Buffer.from(content).toString());
        
        if (packageJson.dependencies) {
          dependencies.push(...Object.keys(packageJson.dependencies));
        }
        if (packageJson.devDependencies) {
          dependencies.push(...Object.keys(packageJson.devDependencies));
        }
      } catch {
        // package.json doesn't exist or is invalid
      }

      // Check requirements.txt
      const requirementsUri = vscode.Uri.joinPath(workspaceFolder.uri, 'requirements.txt');
      try {
        const content = await vscode.workspace.fs.readFile(requirementsUri);
        const lines = Buffer.from(content).toString().split('\\n');
        for (const line of lines) {
          const dep = line.trim().split(/[>=<!=]/)[0];
          if (dep) {
            dependencies.push(dep);
          }
        }
      } catch {
        // requirements.txt doesn't exist
      }

      // Add more dependency file checks as needed...

    } catch (error) {
      this._logger.error('Failed to analyze dependencies', error as Error);
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Analyze architecture patterns
   */
  private async analyzeArchitecture(workspaceFolder: vscode.WorkspaceFolder): Promise<{
    patterns: string[];
    complexity: number;
    maintainability: number;
  }> {
    const patterns: string[] = [];
    let complexity = 0;
    let maintainability = 0;

    try {
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, '**/*.{ts,js,py,java,go,rs}'),
        '**/node_modules/**',
        200
      );

      // Detect common patterns
      const folderStructure = new Set<string>();
      for (const file of files) {
        const relativePath = path.relative(workspaceFolder.uri.fsPath, file.fsPath);
        const parts = relativePath.split(path.sep);
        
        if (parts.length > 1) {
          folderStructure.add(parts[0]);
        }
      }

      // Detect architectural patterns
      if (folderStructure.has('src') && folderStructure.has('test')) {
        patterns.push('Standard Source Structure');
      }
      if (folderStructure.has('components') || folderStructure.has('views')) {
        patterns.push('Component-Based Architecture');
      }
      if (folderStructure.has('controllers') && folderStructure.has('models')) {
        patterns.push('MVC Pattern');
      }
      if (folderStructure.has('services') || folderStructure.has('api')) {
        patterns.push('Service Layer');
      }

      // Calculate metrics
      complexity = this.calculateComplexity(files.length, new Map());
      maintainability = this.calculateMaintainability(patterns.length, folderStructure.size);

    } catch (error) {
      this._logger.error('Failed to analyze architecture', error as Error);
    }

    return { patterns, complexity, maintainability };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: WorkspaceAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.architecture.complexity > 80) {
      recommendations.push('Consider refactoring to reduce complexity');
    }

    if (analysis.architecture.maintainability < 50) {
      recommendations.push('Improve code organization and documentation');
    }

    if (analysis.dependencies.length > 50) {
      recommendations.push('Review dependencies for unused packages');
    }

    if (analysis.languages.length > 5) {
      recommendations.push('Consider consolidating technology stack');
    }

    if (analysis.architecture.patterns.length === 0) {
      recommendations.push('Consider adopting architectural patterns for better organization');
    }

    return recommendations;
  }

  /**
   * Get recent changes from Git
   */
  private async getRecentChanges(): Promise<string[]> {
    // This would integrate with Git extension or run git commands
    // For now, return empty array
    return [];
  }

  /**
   * Extract JavaScript/TypeScript imports
   */
  private extractJavaScriptImports(text: string, imports: string[], dependencies: string[]): void {
    const importRegex = /import.*?from\\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\\(['"]([^'"]+)['"]\\)/g;

    let match;
    while ((match = importRegex.exec(text)) !== null) {
      imports.push(match[1]);
      if (!match[1].startsWith('.')) {
        dependencies.push(match[1].split('/')[0]);
      }
    }

    while ((match = requireRegex.exec(text)) !== null) {
      imports.push(match[1]);
      if (!match[1].startsWith('.')) {
        dependencies.push(match[1].split('/')[0]);
      }
    }
  }

  /**
   * Extract Python imports
   */
  private extractPythonImports(text: string, imports: string[], dependencies: string[]): void {
    const importRegex = /(?:from\\s+([\\w.]+)\\s+)?import\\s+([\\w.,\\s]+)/g;
    
    let match;
    while ((match = importRegex.exec(text)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
        dependencies.push(match[1].split('.')[0]);
      } else {
        const modules = match[2].split(',').map(m => m.trim());
        imports.push(...modules);
        dependencies.push(...modules);
      }
    }
  }

  /**
   * Extract Java imports
   */
  private extractJavaImports(text: string, imports: string[], dependencies: string[]): void {
    const importRegex = /import\\s+([\\w.]+);/g;
    
    let match;
    while ((match = importRegex.exec(text)) !== null) {
      imports.push(match[1]);
      const parts = match[1].split('.');
      if (parts.length > 2) {
        dependencies.push(parts.slice(0, 2).join('.'));
      }
    }
  }

  /**
   * Extract Go imports
   */
  private extractGoImports(text: string, imports: string[], dependencies: string[]): void {
    const importRegex = /import\\s+(?:\\(([^)]+)\\)|"([^"]+)")/g;
    
    let match;
    while ((match = importRegex.exec(text)) !== null) {
      if (match[1]) {
        // Multiple imports
        const lines = match[1].split('\\n');
        for (const line of lines) {
          const importMatch = line.match(/"([^"]+)"/);
          if (importMatch) {
            imports.push(importMatch[1]);
            dependencies.push(importMatch[1]);
          }
        }
      } else if (match[2]) {
        // Single import
        imports.push(match[2]);
        dependencies.push(match[2]);
      }
    }
  }

  /**
   * Extract Rust imports
   */
  private extractRustImports(text: string, imports: string[], dependencies: string[]): void {
    const useRegex = /use\\s+([\\w:]+)/g;
    
    let match;
    while ((match = useRegex.exec(text)) !== null) {
      imports.push(match[1]);
      const parts = match[1].split('::');
      if (parts.length > 0) {
        dependencies.push(parts[0]);
      }
    }
  }

  /**
   * Get language from file extension
   */
  private getLanguageFromExtension(ext: string): string | null {
    const extensionMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'JavaScript React',
      '.tsx': 'TypeScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.h': 'C/C++ Header',
      '.hpp': 'C++ Header',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.html': 'HTML',
      '.xml': 'XML',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.sql': 'SQL'
    };

    return extensionMap[ext] || null;
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexity(fileCount: number, fileTypes: Map<string, number>): number {
    let complexity = Math.min(fileCount / 10, 50); // Base complexity from file count
    
    // Add complexity for diverse file types
    complexity += Math.min(fileTypes.size * 2, 30);
    
    // Add complexity for specific file types that indicate complexity
    const complexTypes = ['.ts', '.js', '.java', '.py', '.go', '.rs'];
    for (const type of complexTypes) {
      const count = fileTypes.get(type) || 0;
      complexity += Math.min(count * 0.5, 20);
    }

    return Math.min(Math.round(complexity), 100);
  }

  /**
   * Calculate maintainability score
   */
  private calculateMaintainability(patternCount: number, folderCount: number): number {
    let score = 50; // Base score
    
    // Add points for architectural patterns
    score += patternCount * 10;
    
    // Add points for organized folder structure
    if (folderCount > 2 && folderCount < 10) {
      score += 20;
    } else if (folderCount >= 10) {
      score += 10;
    }
    
    // Cap at 100
    return Math.min(score, 100);
  }
}
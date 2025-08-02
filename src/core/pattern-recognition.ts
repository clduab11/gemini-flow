/**
 * Pattern Recognition Engine - ML-powered Code Analysis
 * 
 * Implements machine learning algorithms for recognizing code patterns,
 * architectural structures, and coding styles
 */

import { Logger } from '../utils/logger.js';

export interface PatternMatch {
  type: string;
  confidence: number;
  location: {
    file: string;
    line: number;
    column: number;
  };
  context: string;
  metadata: Record<string, any>;
}

export interface ArchitecturalPattern {
  name: string;
  description: string;
  indicators: string[];
  confidence: number;
  files: string[];
  structure: Record<string, any>;
}

export interface CodingStyle {
  indentation: {
    type: 'spaces' | 'tabs';
    size: number;
  };
  lineLength: number;
  naming: {
    variables: 'camelCase' | 'snake_case' | 'PascalCase';
    functions: 'camelCase' | 'snake_case' | 'PascalCase';
    classes: 'PascalCase' | 'snake_case';
    constants: 'UPPER_CASE' | 'camelCase';
  };
  quotes: 'single' | 'double' | 'mixed';
  semicolons: boolean;
  trailingCommas: boolean;
}

export interface FrameworkSignature {
  framework: string;
  version?: string;
  confidence: number;
  patterns: string[];
  dependencies: string[];
  structure: string[];
}

export class PatternRecognitionEngine {
  private logger: Logger;
  private patterns: Map<string, RegExp[]> = new Map();
  private architecturalIndicators: Map<string, string[]> = new Map();
  private frameworkSignatures: Map<string, RegExp[]> = new Map();

  constructor() {
    this.logger = new Logger('PatternRecognition');
    this.initializePatterns();
    this.initializeArchitecturalIndicators();
    this.initializeFrameworkSignatures();
  }

  /**
   * Analyze code content for patterns
   */
  async analyzePatterns(content: string, filePath: string): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];
    const lines = content.split('\n');

    // Analyze each pattern type
    for (const [patternType, regexes] of this.patterns) {
      const patternMatches = await this.findPatternMatches(
        content,
        lines,
        filePath,
        patternType,
        regexes
      );
      matches.push(...patternMatches);
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect architectural patterns in codebase
   */
  async detectArchitecture(files: string[], contents: Map<string, string>): Promise<ArchitecturalPattern[]> {
    const patterns: ArchitecturalPattern[] = [];

    for (const [patternName, indicators] of this.architecturalIndicators) {
      const detection = await this.detectArchitecturalPattern(
        patternName,
        indicators,
        files,
        contents
      );
      
      if (detection.confidence > 0.5) {
        patterns.push(detection);
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract coding style from content
   */
  extractCodingStyle(content: string): CodingStyle {
    const lines = content.split('\n');
    
    return {
      indentation: this.analyzeIndentation(lines),
      lineLength: this.analyzeLineLength(lines),
      naming: this.analyzeNamingConventions(content),
      quotes: this.analyzeQuoteStyle(content),
      semicolons: this.analyzeSemicolonUsage(content),
      trailingCommas: this.analyzeTrailingCommas(content)
    };
  }

  /**
   * Identify framework signatures
   */
  async identifyFrameworks(files: string[], contents: Map<string, string>): Promise<FrameworkSignature[]> {
    const signatures: FrameworkSignature[] = [];

    for (const [framework, patterns] of this.frameworkSignatures) {
      const signature = await this.detectFrameworkSignature(
        framework,
        patterns,
        files,
        contents
      );
      
      if (signature.confidence > 0.3) {
        signatures.push(signature);
      }
    }

    return signatures.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Learn new patterns from examples
   */
  async learnPattern(examples: string[], patternType: string): Promise<RegExp[]> {
    // Extract common patterns from examples using ML techniques
    const patterns: RegExp[] = [];
    
    // Simple pattern extraction (in real implementation would use more sophisticated ML)
    const commonSubstrings = this.findCommonSubstrings(examples);
    
    for (const substring of commonSubstrings) {
      try {
        // Convert common substrings to regex patterns
        const pattern = this.convertToRegex(substring);
        if (pattern) {
          patterns.push(pattern);
        }
      } catch (error) {
        this.logger.warn(`Failed to create pattern from: ${substring}`, error);
      }
    }

    // Store learned patterns
    if (patterns.length > 0) {
      this.patterns.set(patternType, patterns);
      this.logger.info(`Learned ${patterns.length} patterns for type: ${patternType}`);
    }

    return patterns;
  }

  /**
   * Initialize built-in pattern recognizers
   */
  private initializePatterns(): void {
    // Function patterns
    this.patterns.set('function', [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*\([^)]*\)\s*=>/g
    ]);

    // Class patterns
    this.patterns.set('class', [
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:extends\s+([a-zA-Z_$][a-zA-Z0-9_$]*))?\s*{/g,
      /interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:extends\s+([^{]+))?\s*{/g
    ]);

    // React component patterns
    this.patterns.set('react-component', [
      /const\s+([A-Z][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>\s*{/g,
      /function\s+([A-Z][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{[\s\S]*?return\s*\(/g,
      /React\.FC<([^>]+)>/g
    ]);

    // Hook patterns (React)
    this.patterns.set('react-hook', [
      /const\s+\[([^,]+),\s*([^]]+)\]\s*=\s*useState/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*useCallback/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*useMemo/g,
      /useEffect\s*\(/g
    ]);

    // API patterns
    this.patterns.set('api-endpoint', [
      /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /@(Get|Post|Put|Delete|Patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ]);

    // Database patterns
    this.patterns.set('database', [
      /SELECT\s+[\s\S]*?FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+SET/gi,
      /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ]);

    // Error handling patterns
    this.patterns.set('error-handling', [
      /try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{/g,
      /throw\s+new\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\.catch\s*\(/g,
      /Promise\.reject/g
    ]);

    // Async patterns
    this.patterns.set('async-await', [
      /async\s+function/g,
      /const\s+[^=]*=\s*async\s+/g,
      /await\s+/g,
      /Promise\.(all|race|allSettled)/g
    ]);
  }

  /**
   * Initialize architectural pattern indicators
   */
  private initializeArchitecturalIndicators(): void {
    this.architecturalIndicators.set('mvc', [
      'models/', 'views/', 'controllers/',
      'Model.js', 'Controller.js', 'View.js'
    ]);

    this.architecturalIndicators.set('mvvm', [
      'models/', 'views/', 'viewmodels/',
      'ViewModel.js', 'DataBinding'
    ]);

    this.architecturalIndicators.set('layered', [
      'presentation/', 'business/', 'data/',
      'services/', 'repositories/', 'entities/'
    ]);

    this.architecturalIndicators.set('microservices', [
      'services/', 'api-gateway/', 'service-discovery/',
      'docker-compose.yml', 'kubernetes/', '.k8s/'
    ]);

    this.architecturalIndicators.set('event-driven', [
      'events/', 'handlers/', 'subscribers/',
      'EventEmitter', 'EventBus', 'Publisher'
    ]);

    this.architecturalIndicators.set('clean-architecture', [
      'entities/', 'use-cases/', 'interface-adapters/',
      'frameworks/', 'domain/', 'application/', 'infrastructure/'
    ]);
  }

  /**
   * Initialize framework signature patterns
   */
  private initializeFrameworkSignatures(): void {
    // React signatures
    this.frameworkSignatures.set('react', [
      /import\s+React\s+from\s+['"`]react['"`]/g,
      /import\s+{\s*[^}]*}\s+from\s+['"`]react['"`]/g,
      /React\.createElement/g,
      /jsx|tsx/g,
      /useState|useEffect|useContext/g
    ]);

    // Vue signatures
    this.frameworkSignatures.set('vue', [
      /import\s+Vue\s+from\s+['"`]vue['"`]/g,
      /new\s+Vue\s*\(/g,
      /\.vue$/g,
      /<template>/g,
      /defineComponent/g
    ]);

    // Angular signatures
    this.frameworkSignatures.set('angular', [
      /import\s+{\s*[^}]*}\s+from\s+['"`]@angular/g,
      /@Component\s*\(/g,
      /@Injectable\s*\(/g,
      /@NgModule\s*\(/g,
      /angular\.json/g
    ]);

    // Express signatures
    this.frameworkSignatures.set('express', [
      /import\s+express\s+from\s+['"`]express['"`]/g,
      /const\s+express\s*=\s*require\s*\(\s*['"`]express['"`]/g,
      /app\.(get|post|put|delete|use)\s*\(/g,
      /express\(\)/g
    ]);

    // Next.js signatures
    this.frameworkSignatures.set('nextjs', [
      /import\s+.*\s+from\s+['"`]next/g,
      /getServerSideProps|getStaticProps/g,
      /pages\/|app\//g,
      /next\.config\.js/g
    ]);
  }

  /**
   * Find pattern matches in content
   */
  private async findPatternMatches(
    content: string,
    lines: string[],
    filePath: string,
    patternType: string,
    regexes: RegExp[]
  ): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    for (const regex of regexes) {
      let match;
      const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
      
      while ((match = globalRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = lines[lineNumber - 1] || '';
        
        matches.push({
          type: patternType,
          confidence: this.calculatePatternConfidence(match, line, patternType),
          location: {
            file: filePath,
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index - 1) - 1
          },
          context: line.trim(),
          metadata: {
            matchedText: match[0],
            groups: match.slice(1),
            pattern: regex.source
          }
        });
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score for pattern match
   */
  private calculatePatternConfidence(match: RegExpMatchArray, line: string, patternType: string): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on context
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      confidence *= 0.3; // Comments are less reliable
    }

    // Adjust based on pattern type specificity
    if (patternType === 'react-component' && match[0].includes('React.FC')) {
      confidence *= 1.2;
    }

    if (patternType === 'function' && match[0].includes('async')) {
      confidence *= 1.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect architectural pattern
   */
  private async detectArchitecturalPattern(
    patternName: string,
    indicators: string[],
    files: string[],
    contents: Map<string, string>
  ): Promise<ArchitecturalPattern> {
    const matchingFiles: string[] = [];
    let indicatorCount = 0;

    for (const indicator of indicators) {
      const matchingForIndicator = files.filter(file => 
        file.includes(indicator) || 
        contents.get(file)?.includes(indicator)
      );
      
      if (matchingForIndicator.length > 0) {
        indicatorCount++;
        matchingFiles.push(...matchingForIndicator);
      }
    }

    const confidence = indicatorCount / indicators.length;

    return {
      name: patternName,
      description: `${patternName.toUpperCase()} architectural pattern`,
      indicators,
      confidence,
      files: [...new Set(matchingFiles)],
      structure: this.analyzeStructure(matchingFiles)
    };
  }

  /**
   * Detect framework signature
   */
  private async detectFrameworkSignature(
    framework: string,
    patterns: RegExp[],
    files: string[],
    contents: Map<string, string>
  ): Promise<FrameworkSignature> {
    let matches = 0;
    const foundPatterns: string[] = [];
    const dependencies: string[] = [];

    for (const [file, content] of contents) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matches++;
          foundPatterns.push(pattern.source);
        }
      }
    }

    // Check package.json for dependencies
    const packageJson = contents.get('package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        Object.keys(allDeps).forEach(dep => {
          if (dep.includes(framework) || this.isRelatedDependency(framework, dep)) {
            dependencies.push(dep);
          }
        });
      } catch (error) {
        // Invalid package.json
      }
    }

    const confidence = (matches + dependencies.length * 2) / (patterns.length + 5);

    return {
      framework,
      confidence: Math.min(confidence, 1.0),
      patterns: foundPatterns,
      dependencies,
      structure: this.analyzeFrameworkStructure(framework, files)
    };
  }

  /**
   * Analyze indentation style
   */
  private analyzeIndentation(lines: string[]): { type: 'spaces' | 'tabs'; size: number } {
    let spaceCount = 0;
    let tabCount = 0;
    const spaceSizes: number[] = [];

    for (const line of lines) {
      if (line.startsWith('\t')) {
        tabCount++;
      } else if (line.startsWith(' ')) {
        spaceCount++;
        const match = line.match(/^( +)/);
        if (match) {
          spaceSizes.push(match[1].length);
        }
      }
    }

    const type = tabCount > spaceCount ? 'tabs' : 'spaces';
    const size = type === 'spaces' && spaceSizes.length > 0 ?
      Math.round(spaceSizes.reduce((a, b) => a + b, 0) / spaceSizes.length) : 
      type === 'tabs' ? 1 : 2;

    return { type, size };
  }

  /**
   * Analyze line length preferences
   */
  private analyzeLineLength(lines: string[]): number {
    const lengths = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.length)
      .sort((a, b) => a - b);

    // Return 90th percentile as typical max line length
    const index = Math.floor(lengths.length * 0.9);
    return lengths[index] || 80;
  }

  /**
   * Analyze naming conventions
   */
  private analyzeNamingConventions(content: string): CodingStyle['naming'] {
    const variableMatches = content.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
    const functionMatches = content.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
    const classMatches = content.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];

    return {
      variables: this.detectNamingStyle(variableMatches.map(m => m.split(/\s+/)[1])),
      functions: this.detectNamingStyle(functionMatches.map(m => m.split(/\s+/)[1])),
      classes: this.detectNamingStyle(classMatches.map(m => m.split(/\s+/)[1])) as 'PascalCase' | 'snake_case',
      constants: 'UPPER_CASE' as const // Default assumption
    };
  }

  /**
   * Detect naming style from examples
   */
  private detectNamingStyle(names: string[]): 'camelCase' | 'snake_case' | 'PascalCase' {
    if (names.length === 0) return 'camelCase';

    let camelCaseCount = 0;
    let snakeCaseCount = 0;
    let pascalCaseCount = 0;

    for (const name of names) {
      if (/^[a-z][a-zA-Z0-9]*$/.test(name)) camelCaseCount++;
      else if (/^[a-z][a-z0-9_]*$/.test(name)) snakeCaseCount++;
      else if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) pascalCaseCount++;
    }

    if (pascalCaseCount > camelCaseCount && pascalCaseCount > snakeCaseCount) {
      return 'PascalCase';
    } else if (snakeCaseCount > camelCaseCount) {
      return 'snake_case';
    }
    return 'camelCase';
  }

  /**
   * Analyze quote style preferences
   */
  private analyzeQuoteStyle(content: string): 'single' | 'double' | 'mixed' {
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;

    if (Math.abs(singleQuotes - doubleQuotes) < 5) return 'mixed';
    return singleQuotes > doubleQuotes ? 'single' : 'double';
  }

  /**
   * Analyze semicolon usage
   */
  private analyzeSemicolonUsage(content: string): boolean {
    const lines = content.split('\n');
    const codeLines = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('*')
    );

    const semicolonLines = codeLines.filter(line => line.trim().endsWith(';'));
    return semicolonLines.length > codeLines.length * 0.6;
  }

  /**
   * Analyze trailing comma usage
   */
  private analyzeTrailingCommas(content: string): boolean {
    const arrayMatches = content.match(/\[[^\]]*,\s*\]/g) || [];
    const objectMatches = content.match(/{[^}]*,\s*}/g) || [];
    const totalMatches = arrayMatches.length + objectMatches.length;

    return totalMatches > 3; // Assume trailing commas if found in multiple places
  }

  /**
   * Find common substrings in examples
   */
  private findCommonSubstrings(examples: string[]): string[] {
    if (examples.length < 2) return [];

    const commonSubstrings: Set<string> = new Set();
    const minLength = 3;

    for (let i = 0; i < examples.length - 1; i++) {
      for (let j = i + 1; j < examples.length; j++) {
        const common = this.longestCommonSubstring(examples[i], examples[j]);
        if (common.length >= minLength) {
          commonSubstrings.add(common);
        }
      }
    }

    return Array.from(commonSubstrings);
  }

  /**
   * Find longest common substring between two strings
   */
  private longestCommonSubstring(str1: string, str2: string): string {
    const dp: number[][] = Array(str1.length + 1)
      .fill(null)
      .map(() => Array(str2.length + 1).fill(0));

    let maxLength = 0;
    let endingPos = 0;

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          if (dp[i][j] > maxLength) {
            maxLength = dp[i][j];
            endingPos = i;
          }
        }
      }
    }

    return str1.substring(endingPos - maxLength, endingPos);
  }

  /**
   * Convert common substring to regex pattern
   */
  private convertToRegex(substring: string): RegExp | null {
    if (substring.length < 3) return null;

    // Escape special regex characters
    const escaped = substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    try {
      return new RegExp(escaped, 'g');
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if dependency is related to framework
   */
  private isRelatedDependency(framework: string, dependency: string): boolean {
    const relatedDeps: Record<string, string[]> = {
      'react': ['react-dom', 'react-router', 'react-query', '@types/react'],
      'vue': ['vue-router', 'vuex', 'nuxt', '@vue/'],
      'angular': ['@angular/', 'ng-', 'angular-'],
      'express': ['express-', 'body-parser', 'cors', 'helmet'],
      'nextjs': ['next', '@next/']
    };

    const related = relatedDeps[framework] || [];
    return related.some(rel => dependency.includes(rel));
  }

  /**
   * Analyze structure for patterns
   */
  private analyzeStructure(files: string[]): Record<string, any> {
    const structure: Record<string, any> = {
      directories: new Set(),
      fileTypes: new Set(),
      depth: 0
    };

    for (const file of files) {
      const parts = file.split('/');
      structure.depth = Math.max(structure.depth, parts.length);
      
      // Add directories
      for (let i = 0; i < parts.length - 1; i++) {
        structure.directories.add(parts[i]);
      }
      
      // Add file extensions
      const ext = file.split('.').pop();
      if (ext) {
        structure.fileTypes.add(ext);
      }
    }

    return {
      directories: Array.from(structure.directories),
      fileTypes: Array.from(structure.fileTypes),
      depth: structure.depth,
      fileCount: files.length
    };
  }

  /**
   * Analyze framework-specific structure
   */
  private analyzeFrameworkStructure(framework: string, files: string[]): string[] {
    const frameworkStructures: Record<string, string[]> = {
      'react': ['src/', 'components/', 'hooks/', 'pages/', 'public/'],
      'vue': ['src/', 'components/', 'views/', 'router/', 'store/'],
      'angular': ['src/app/', 'components/', 'services/', 'modules/'],
      'express': ['routes/', 'controllers/', 'middleware/', 'models/'],
      'nextjs': ['pages/', 'components/', 'public/', 'styles/']
    };

    const expectedStructure = frameworkStructures[framework] || [];
    return expectedStructure.filter(dir => 
      files.some(file => file.includes(dir))
    );
  }
}

export default PatternRecognitionEngine;
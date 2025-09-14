/**
 * Pattern Recognition Engine - ML-powered Code Analysis
 *
 * Implements machine learning algorithms for recognizing code patterns,
 * architectural structures, and coding styles
 */
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
        type: "spaces" | "tabs";
        size: number;
    };
    lineLength: number;
    naming: {
        variables: "camelCase" | "snake_case" | "PascalCase";
        functions: "camelCase" | "snake_case" | "PascalCase";
        classes: "PascalCase" | "snake_case";
        constants: "UPPER_CASE" | "camelCase";
    };
    quotes: "single" | "double" | "mixed";
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
export declare class PatternRecognitionEngine {
    private logger;
    private patterns;
    private architecturalIndicators;
    private frameworkSignatures;
    constructor();
    /**
     * Analyze code content for patterns
     */
    analyzePatterns(content: string, filePath: string): Promise<PatternMatch[]>;
    /**
     * Detect architectural patterns in codebase
     */
    detectArchitecture(files: string[], contents: Map<string, string>): Promise<ArchitecturalPattern[]>;
    /**
     * Extract coding style from content
     */
    extractCodingStyle(content: string): CodingStyle;
    /**
     * Identify framework signatures
     */
    identifyFrameworks(files: string[], contents: Map<string, string>): Promise<FrameworkSignature[]>;
    /**
     * Learn new patterns from examples
     */
    learnPattern(examples: string[], patternType: string): Promise<RegExp[]>;
    /**
     * Initialize built-in pattern recognizers
     */
    private initializePatterns;
    /**
     * Initialize architectural pattern indicators
     */
    private initializeArchitecturalIndicators;
    /**
     * Initialize framework signature patterns
     */
    private initializeFrameworkSignatures;
    /**
     * Find pattern matches in content
     */
    private findPatternMatches;
    /**
     * Calculate confidence score for pattern match
     */
    private calculatePatternConfidence;
    /**
     * Detect architectural pattern
     */
    private detectArchitecturalPattern;
    /**
     * Detect framework signature
     */
    private detectFrameworkSignature;
    /**
     * Analyze indentation style
     */
    private analyzeIndentation;
    /**
     * Analyze line length preferences
     */
    private analyzeLineLength;
    /**
     * Analyze naming conventions
     */
    private analyzeNamingConventions;
    /**
     * Detect naming style from examples
     */
    private detectNamingStyle;
    /**
     * Analyze quote style preferences
     */
    private analyzeQuoteStyle;
    /**
     * Analyze semicolon usage
     */
    private analyzeSemicolonUsage;
    /**
     * Analyze trailing comma usage
     */
    private analyzeTrailingCommas;
    /**
     * Find common substrings in examples
     */
    private findCommonSubstrings;
    /**
     * Find longest common substring between two strings
     */
    private longestCommonSubstring;
    /**
     * Convert common substring to regex pattern
     */
    private convertToRegex;
    /**
     * Check if dependency is related to framework
     */
    private isRelatedDependency;
    /**
     * Analyze structure for patterns
     */
    private analyzeStructure;
    /**
     * Analyze framework-specific structure
     */
    private analyzeFrameworkStructure;
}
export default PatternRecognitionEngine;
//# sourceMappingURL=pattern-recognition.d.ts.map
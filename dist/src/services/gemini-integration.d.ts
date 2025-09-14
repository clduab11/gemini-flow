/**
 * Gemini Integration Service
 *
 * Handles Gemini CLI detection and context loading for enhanced AI coordination
 */
export interface GeminiContext {
    content: string;
    loaded: boolean;
    timestamp: Date;
    source: "GEMINI.md" | "fallback";
}
export interface GeminiDetectionResult {
    isInstalled: boolean;
    version?: string;
    path?: string;
    error?: string;
}
export declare class GeminiIntegrationService {
    private logger;
    private static instance;
    private cachedContext;
    private detectionResult;
    private constructor();
    static getInstance(): GeminiIntegrationService;
    /**
     * Detect if official Gemini CLI is installed
     */
    detectGeminiCLI(): Promise<GeminiDetectionResult>;
    /**
     * Load GEMINI.md context for enhanced AI coordination
     */
    loadGeminiContext(projectRoot?: string): Promise<GeminiContext>;
    /**
     * Setup environment variables for Gemini integration
     */
    setupEnvironment(): void;
    /**
     * Get integration status for logging/debugging
     */
    getIntegrationStatus(): Promise<{
        cliDetected: boolean;
        contextLoaded: boolean;
        environmentConfigured: boolean;
        geminiVersion?: string;
        contextSource?: string;
    }>;
    /**
     * Initialize complete Gemini integration
     */
    initialize(projectRoot?: string): Promise<{
        detection: GeminiDetectionResult;
        context: GeminiContext;
        environmentConfigured: boolean;
    }>;
    /**
     * Clear cached data (useful for testing)
     */
    clearCache(): void;
    private isCacheValid;
    private getFallbackContext;
}
export default GeminiIntegrationService;
//# sourceMappingURL=gemini-integration.d.ts.map
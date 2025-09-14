/**
 * Google AI Authentication
 *
 * Simple authentication system for Google AI Studio API key
 * providing Gemini CLI parity with multiple key detection methods
 */
export interface GoogleAIAuthOptions {
    apiKey?: string;
    configPath?: string;
}
export interface AuthStatus {
    isAuthenticated: boolean;
    source: "environment" | "config" | "constructor" | "none";
    keyFormat: "valid" | "invalid" | "none";
    keyPrefix: string | null;
}
export interface AuthConfig {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
}
export declare class GoogleAIAuth {
    private apiKey;
    private configPath;
    private logger;
    constructor(options?: GoogleAIAuthOptions);
    /**
     * Initialize API key from multiple sources with priority order:
     * 1. Constructor option
     * 2. Environment variables (GEMINI_API_KEY, GOOGLE_AI_API_KEY, GOOGLE_API_KEY)
     * 3. Config file
     */
    private initializeApiKey;
    /**
     * Get API key from environment variables
     */
    private getApiKeyFromEnvironment;
    /**
     * Get default config file path
     */
    private getDefaultConfigPath;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Validate API key format
     */
    isValidApiKey(): boolean;
    /**
     * Get current API key
     */
    getApiKey(): string | null;
    /**
     * Set API key
     */
    setApiKey(apiKey: string | null): boolean;
    /**
     * Load configuration from file
     */
    loadConfig(configPath: string): boolean;
    /**
     * Save configuration to file
     */
    saveConfig(configPath?: string): Promise<void>;
    /**
     * Clear authentication
     */
    clearAuth(): void;
    /**
     * Get detailed authentication status
     */
    getAuthStatus(): AuthStatus;
    /**
     * Test API key by making a simple API call
     */
    testApiKey(): Promise<boolean>;
    /**
     * Get authentication help message
     */
    getAuthHelpMessage(): string;
}
//# sourceMappingURL=google-ai-auth.d.ts.map
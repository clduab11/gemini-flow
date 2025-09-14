export class GoogleAIAuth {
    constructor(options?: {});
    apiKey: null;
    configPath: any;
    logger: Logger;
    /**
     * Initialize API key from multiple sources with priority order:
     * 1. Constructor option
     * 2. Environment variables (GEMINI_API_KEY, GOOGLE_AI_API_KEY, GOOGLE_API_KEY)
     * 3. Config file
     */
    initializeApiKey(constructorKey: any): void;
    /**
     * Get API key from environment variables
     */
    getApiKeyFromEnvironment(): string | null;
    /**
     * Get default config file path
     */
    getDefaultConfigPath(): string;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Validate API key format
     */
    isValidApiKey(): any;
    /**
     * Get current API key
     */
    getApiKey(): null;
    /**
     * Set API key
     */
    setApiKey(apiKey: any): boolean;
    /**
     * Load configuration from file
     */
    loadConfig(configPath: any): boolean;
    /**
     * Save configuration to file
     */
    saveConfig(configPath: any): Promise<void>;
    /**
     * Clear authentication
     */
    clearAuth(): void;
    /**
     * Get detailed authentication status
     */
    getAuthStatus(): {
        isAuthenticated: boolean;
        source: string;
        keyFormat: string;
        keyPrefix: string | null;
    };
    /**
     * Test API key by making a simple API call
     */
    testApiKey(): Promise<boolean>;
    /**
     * Get authentication help message
     */
    getAuthHelpMessage(): string;
}
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=google-ai-auth.d.ts.map
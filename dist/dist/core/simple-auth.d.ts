export class SimpleAuth {
    logger: Logger;
    configPath: string;
    apiKey: any;
    /**
     * Load authentication from various sources
     */
    loadAuth(): void;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get API key
     */
    getApiKey(): any;
    /**
     * Set API key
     */
    setApiKey(apiKey: any): boolean;
    /**
     * Save configuration to file
     */
    saveConfig(): Promise<void>;
    /**
     * Clear authentication
     */
    clearAuth(): void;
    /**
     * Test API key validity
     */
    testApiKey(): Promise<boolean>;
    /**
     * Get authentication status
     */
    getAuthStatus(): {
        isAuthenticated: boolean;
        source: string;
        keyPrefix: string;
        keyFormat: string;
    };
    /**
     * Get help message for authentication
     */
    getAuthHelpMessage(): string;
    /**
     * Validate API key format
     */
    validateApiKeyFormat(apiKey: any): any;
}
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=simple-auth.d.ts.map
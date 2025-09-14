/**
 * Simplified Authentication Manager
 *
 * Simple API key management without complex enterprise features
 */
export interface AuthConfig {
    apiKey?: string;
    source?: "env" | "config" | "manual";
}
export interface AuthStatus {
    isAuthenticated: boolean;
    source: string;
    keyPrefix: string;
    keyFormat: "valid" | "invalid";
}
export declare class SimpleAuth {
    private logger;
    private configPath;
    private apiKey?;
    constructor();
    /**
     * Load authentication from various sources
     */
    private loadAuth;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get API key
     */
    getApiKey(): string | undefined;
    /**
     * Set API key
     */
    setApiKey(apiKey: string): boolean;
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
    getAuthStatus(): AuthStatus;
    /**
     * Get help message for authentication
     */
    getAuthHelpMessage(): string;
    /**
     * Validate API key format
     */
    private validateApiKeyFormat;
}
//# sourceMappingURL=simple-auth.d.ts.map
/**
 * Google AI Authentication
 *
 * Simple authentication system for Google AI Studio API key
 * providing Gemini CLI parity with multiple key detection methods
 */
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger } from "../utils/logger.js";
export class GoogleAIAuth {
    apiKey = null;
    configPath;
    logger;
    constructor(options = {}) {
        this.logger = new Logger("GoogleAIAuth");
        // Set config path
        this.configPath = options.configPath || this.getDefaultConfigPath();
        // Initialize API key from various sources (priority order)
        this.initializeApiKey(options.apiKey);
        this.logger.debug("GoogleAI authentication initialized", {
            hasApiKey: !!this.apiKey,
            configPath: this.configPath,
            source: this.getAuthStatus().source,
        });
    }
    /**
     * Initialize API key from multiple sources with priority order:
     * 1. Constructor option
     * 2. Environment variables (GEMINI_API_KEY, GOOGLE_AI_API_KEY, GOOGLE_API_KEY)
     * 3. Config file
     */
    initializeApiKey(constructorKey) {
        // Priority 1: Constructor option
        if (constructorKey) {
            this.apiKey = constructorKey;
            this.logger.debug("API key loaded from constructor");
            return;
        }
        // Priority 2: Environment variables
        const envKey = this.getApiKeyFromEnvironment();
        if (envKey) {
            this.apiKey = envKey;
            this.logger.debug("API key loaded from environment");
            return;
        }
        // Priority 3: Config file
        const configLoaded = this.loadConfig(this.configPath);
        if (configLoaded) {
            this.logger.debug("API key loaded from config file");
            return;
        }
        this.logger.debug("No API key found in any source");
    }
    /**
     * Get API key from environment variables
     */
    getApiKeyFromEnvironment() {
        // Check multiple environment variable names
        const envVars = ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_API_KEY"];
        for (const envVar of envVars) {
            const key = process.env[envVar];
            if (key && key.trim()) {
                return key.trim();
            }
        }
        return null;
    }
    /**
     * Get default config file path
     */
    getDefaultConfigPath() {
        const homeDir = os.homedir();
        return path.join(homeDir, ".gemini-flow", "config.json");
    }
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.apiKey;
    }
    /**
     * Validate API key format
     */
    isValidApiKey() {
        if (!this.apiKey) {
            return false;
        }
        // Google AI API keys typically start with 'AIza'
        return this.apiKey.startsWith("AIza") && this.apiKey.length >= 35;
    }
    /**
     * Get current API key
     */
    getApiKey() {
        return this.apiKey;
    }
    /**
     * Set API key
     */
    setApiKey(apiKey) {
        if (!apiKey) {
            this.apiKey = null;
            this.logger.debug("API key cleared");
            return true;
        }
        // Validate format
        if (!apiKey.startsWith("AIza") || apiKey.length < 35) {
            this.logger.warn("Invalid API key format provided");
            return false;
        }
        this.apiKey = apiKey;
        this.logger.debug("API key set successfully");
        return true;
    }
    /**
     * Load configuration from file
     */
    loadConfig(configPath) {
        try {
            if (!fs.existsSync(configPath)) {
                return false;
            }
            const configContent = fs.readFileSync(configPath, "utf8");
            const config = JSON.parse(configContent);
            if (config.apiKey) {
                this.apiKey = config.apiKey;
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error("Failed to load config", { configPath, error });
            return false;
        }
    }
    /**
     * Save configuration to file
     */
    async saveConfig(configPath) {
        const targetPath = configPath || this.configPath;
        try {
            // Ensure directory exists
            const configDir = path.dirname(targetPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            // Prepare config object
            const config = {
                apiKey: this.apiKey || undefined,
                model: "gemini-1.5-flash",
                temperature: 0.7,
                maxTokens: 1000000,
            };
            // Write config file
            fs.writeFileSync(targetPath, JSON.stringify(config, null, 2));
            this.logger.info("Configuration saved", { configPath: targetPath });
        }
        catch (error) {
            this.logger.error("Failed to save config", {
                configPath: targetPath,
                error,
            });
            throw error;
        }
    }
    /**
     * Clear authentication
     */
    clearAuth() {
        this.apiKey = null;
        this.logger.debug("Authentication cleared");
    }
    /**
     * Get detailed authentication status
     */
    getAuthStatus() {
        if (!this.apiKey) {
            return {
                isAuthenticated: false,
                source: "none",
                keyFormat: "none",
                keyPrefix: null,
            };
        }
        // Determine source
        let source = "config";
        if (this.getApiKeyFromEnvironment() === this.apiKey) {
            source = "environment";
        }
        return {
            isAuthenticated: true,
            source,
            keyFormat: this.isValidApiKey() ? "valid" : "invalid",
            keyPrefix: this.apiKey ? `${this.apiKey.substring(0, 6)}...` : null,
        };
    }
    /**
     * Test API key by making a simple API call
     */
    async testApiKey() {
        if (!this.isAuthenticated() || !this.isValidApiKey()) {
            return false;
        }
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            // Make a simple test request
            const result = await model.generateContent("Hello");
            const response = await result.response;
            // If we get here without error, the API key works
            this.logger.debug("API key test successful");
            return true;
        }
        catch (error) {
            this.logger.warn("API key test failed", error);
            if (error instanceof Error) {
                if (error.message.includes("API_KEY_INVALID")) {
                    this.logger.error("Invalid API key");
                }
                else if (error.message.includes("QUOTA_EXCEEDED")) {
                    this.logger.warn("API quota exceeded, but key is valid");
                    return true; // Key is valid, just quota exceeded
                }
            }
            return false;
        }
    }
    /**
     * Get authentication help message
     */
    getAuthHelpMessage() {
        return `
Google AI API Key Authentication Help:

1. Get an API key from Google AI Studio:
   https://aistudio.google.com/app/apikey

2. Set your API key using one of these methods:

   Environment Variable (recommended):
   export GEMINI_API_KEY="your-api-key-here"

   Alternative environment variables:
   export GOOGLE_AI_API_KEY="your-api-key-here"
   export GOOGLE_API_KEY="your-api-key-here"

   Configuration file:
   Save to ~/.gemini-flow/config.json:
   {
     "apiKey": "your-api-key-here"
   }

3. Verify your setup:
   gemini-flow doctor

API keys should start with 'AIza' and be at least 35 characters long.
    `.trim();
    }
}

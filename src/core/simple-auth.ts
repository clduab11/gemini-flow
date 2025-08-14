/**
 * Simplified Authentication Manager
 *
 * Simple API key management without complex enterprise features
 */

import { Logger } from "../utils/logger.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

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

export class SimpleAuth {
  private logger: Logger;
  private configPath: string;
  private apiKey?: string;

  constructor() {
    this.logger = new Logger("SimpleAuth");
    this.configPath = path.join(os.homedir(), ".gemini-flow-auth.json");
    this.loadAuth();
  }

  /**
   * Load authentication from various sources
   */
  private loadAuth(): void {
    // Try environment variables first
    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (envKey) {
      this.apiKey = envKey;
      return;
    }

    // Try config file
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
        if (config.apiKey) {
          this.apiKey = config.apiKey;
        }
      }
    } catch (error) {
      this.logger.warn("Failed to load auth config", error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.apiKey && this.validateApiKeyFormat(this.apiKey));
  }

  /**
   * Get API key
   */
  getApiKey(): string | undefined {
    return this.apiKey;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): boolean {
    if (!this.validateApiKeyFormat(apiKey)) {
      return false;
    }

    this.apiKey = apiKey;
    return true;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("No API key to save");
    }

    const config: AuthConfig = {
      apiKey: this.apiKey,
      source: "config",
    };

    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.logger.info("Auth config saved");
    } catch (error) {
      this.logger.error("Failed to save auth config", error);
      throw error;
    }
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.apiKey = undefined;

    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
      }
    } catch (error) {
      this.logger.warn("Failed to remove auth config file", error);
    }
  }

  /**
   * Test API key validity
   */
  async testApiKey(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Simple test request
      const result = await model.generateContent("Hello");
      const response = await result.response;

      return !!response.text();
    } catch (error) {
      this.logger.debug("API key test failed", error);
      return false;
    }
  }

  /**
   * Get authentication status
   */
  getAuthStatus(): AuthStatus {
    const isAuthenticated = this.isAuthenticated();
    let source = "none";
    let keyPrefix = "";

    if (isAuthenticated && this.apiKey) {
      // Determine source
      const envKey =
        process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      if (envKey === this.apiKey) {
        source = "environment";
      } else if (fs.existsSync(this.configPath)) {
        source = "config file";
      } else {
        source = "manual";
      }

      keyPrefix = this.apiKey.substring(0, 10) + "...";
    }

    return {
      isAuthenticated,
      source,
      keyPrefix,
      keyFormat: this.apiKey
        ? this.validateApiKeyFormat(this.apiKey)
          ? "valid"
          : "invalid"
        : "invalid",
    };
  }

  /**
   * Get help message for authentication
   */
  getAuthHelpMessage(): string {
    return `
To authenticate with Gemini API:

1. Get your API key from: https://aistudio.google.com/app/apikey
2. Set it using one of these methods:
   
   • Command line:
     gemini-flow auth --key YOUR_API_KEY
   
   • Environment variable:
     export GEMINI_API_KEY="YOUR_API_KEY"
     export GOOGLE_AI_API_KEY="YOUR_API_KEY"

3. Test your setup:
   gemini-flow auth --test
`;
  }

  /**
   * Validate API key format
   */
  private validateApiKeyFormat(apiKey: string): boolean {
    // Basic validation for Google AI API keys
    return apiKey.startsWith("AIza") && apiKey.length >= 35;
  }
}

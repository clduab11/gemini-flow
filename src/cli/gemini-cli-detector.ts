/**
 * Gemini CLI Integration Architecture - CLI Detector
 *
 * Detects the presence and availability of the official Gemini CLI
 * Provides unified interface for CLI availability checking and version management
 */

import { execSync, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";

const execAsync = promisify(execSync);

export interface GeminiCLIVersion {
  major: number;
  minor: number;
  patch: number;
  full: string;
}

export interface GeminiCLIDetectionResult {
  available: boolean;
  version?: GeminiCLIVersion;
  path?: string;
  error?: string;
  capabilities?: string[];
}

export interface CLIIntegrationConfig {
  preferredCLIMode: "official" | "fallback" | "auto";
  versionRequirement?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  enableWarnings?: boolean;
}

/**
 * Gemini CLI Detector
 *
 * Detects and manages the official Gemini CLI integration
 * Provides fallback capabilities when official CLI is unavailable
 */
export class GeminiCLIDetector {
  private logger: Logger;
  private config: CLIIntegrationConfig;
  private detectionCache: Map<string, GeminiCLIDetectionResult> = new Map();

  constructor(config: Partial<CLIIntegrationConfig> = {}) {
    this.logger = new Logger("GeminiCLIDetector");
    this.config = {
      preferredCLIMode: "auto",
      timeoutMs: 5000,
      retryAttempts: 2,
      enableWarnings: true,
      ...config,
    };
  }

  /**
   * Detect if official Gemini CLI is available
   * Checks multiple installation methods and versions
   */
  async detectOfficialCLI(): Promise<GeminiCLIDetectionResult> {
    const cacheKey = "official-cli";
    const cached = this.detectionCache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const results: GeminiCLIDetectionResult[] = [];

    // Check multiple detection methods
    const detectionMethods = [
      this.checkGlobalInstallation.bind(this),
      this.checkLocalInstallation.bind(this),
      this.checkPATH.bind(this),
      this.checkKnownPaths.bind(this),
    ];

    for (const method of detectionMethods) {
      try {
        const result = await method();
        results.push(result);

        // Return first successful detection
        if (result.available) {
          this.detectionCache.set(cacheKey, result);
          return result;
        }
      } catch (error) {
        this.logger.debug(`Detection method failed: ${error}`);
      }
    }

    // Aggregate error information from all failed attempts
    const errorResult: GeminiCLIDetectionResult = {
      available: false,
      error: this.aggregateErrors(results),
      capabilities: [],
    };

    this.detectionCache.set(cacheKey, errorResult);
    return errorResult;
  }

  /**
   * Check if official CLI meets version requirements
   */
  async validateCLIVersion(detected: GeminiCLIDetectionResult): Promise<boolean> {
    if (!detected.available || !detected.version) {
      return false;
    }

    if (!this.config.versionRequirement) {
      return true;
    }

    try {
      const required = this.parseVersionString(this.config.versionRequirement);
      const current = detected.version;

      return this.compareVersions(current, required) >= 0;
    } catch (error) {
      this.logger.warn(`Failed to validate CLI version: ${error}`);
      return false;
    }
  }

  /**
   * Get CLI integration preference based on availability and configuration
   */
  async getIntegrationMode(): Promise<"official" | "fallback"> {
    const detected = await this.detectOfficialCLI();

    switch (this.config.preferredCLIMode) {
      case "official":
        if (detected.available && await this.validateCLIVersion(detected)) {
          return "official";
        }
        if (this.config.enableWarnings) {
          this.logger.warn("Official CLI not available, falling back to internal implementation");
        }
        return "fallback";

      case "fallback":
        if (detected.available && await this.validateCLIVersion(detected)) {
          this.logger.info("Official CLI available but using fallback mode as configured");
        }
        return "fallback";

      case "auto":
      default:
        if (detected.available && await this.validateCLIVersion(detected)) {
          return "official";
        }
        return "fallback";
    }
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.detectionCache.clear();
  }

  /**
   * Force re-detection of CLI
   */
  async refreshDetection(): Promise<GeminiCLIDetectionResult> {
    this.clearCache();
    return await this.detectOfficialCLI();
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(result: GeminiCLIDetectionResult): boolean {
    // Cache for 5 minutes unless it's an error
    if (!result.available) {
      return false; // Don't cache errors
    }

    // In a real implementation, you might want to add timestamps
    return true;
  }

  /**
   * Check global npm installation
   */
  private async checkGlobalInstallation(): Promise<GeminiCLIDetectionResult> {
    try {
      const versionOutput = execSync("gemini --version", {
        encoding: "utf8",
        timeout: this.config.timeoutMs,
      });

      const version = this.parseVersionString(versionOutput.trim());
      return {
        available: true,
        version,
        path: "gemini",
        capabilities: this.detectCapabilities(versionOutput),
      };
    } catch (error: any) {
      return {
        available: false,
        error: `Global installation check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check local node_modules installation
   */
  private async checkLocalInstallation(): Promise<GeminiCLIDetectionResult> {
    try {
      const localPath = path.join(process.cwd(), "node_modules", ".bin", "gemini");
      if (!fs.existsSync(localPath)) {
        throw new Error("Local CLI not found");
      }

      const versionOutput = execSync(`"${localPath}" --version`, {
        encoding: "utf8",
        timeout: this.config.timeoutMs,
      });

      const version = this.parseVersionString(versionOutput.trim());
      return {
        available: true,
        version,
        path: localPath,
        capabilities: this.detectCapabilities(versionOutput),
      };
    } catch (error: any) {
      return {
        available: false,
        error: `Local installation check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check PATH for gemini executable
   */
  private async checkPATH(): Promise<GeminiCLIDetectionResult> {
    try {
      const whichOutput = execSync("which gemini", {
        encoding: "utf8",
        timeout: this.config.timeoutMs,
      });

      const geminiPath = whichOutput.trim();
      const versionOutput = execSync(`"${geminiPath}" --version`, {
        encoding: "utf8",
        timeout: this.config.timeoutMs,
      });

      const version = this.parseVersionString(versionOutput.trim());
      return {
        available: true,
        version,
        path: geminiPath,
        capabilities: this.detectCapabilities(versionOutput),
      };
    } catch (error: any) {
      return {
        available: false,
        error: `PATH check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check known installation paths
   */
  private async checkKnownPaths(): Promise<GeminiCLIDetectionResult> {
    const knownPaths = [
      "/usr/local/bin/gemini",
      "/usr/bin/gemini",
      "/opt/homebrew/bin/gemini",
      path.join(process.env.HOME || "", ".local", "bin", "gemini"),
    ];

    for (const testPath of knownPaths) {
      try {
        if (fs.existsSync(testPath)) {
          const versionOutput = execSync(`"${testPath}" --version`, {
            encoding: "utf8",
            timeout: this.config.timeoutMs,
          });

          const version = this.parseVersionString(versionOutput.trim());
          return {
            available: true,
            version,
            path: testPath,
            capabilities: this.detectCapabilities(versionOutput),
          };
        }
      } catch (error) {
        continue; // Try next path
      }
    }

    return {
      available: false,
      error: "No CLI found in known installation paths",
    };
  }

  /**
   * Parse version string into semantic version object
   */
  private parseVersionString(versionString: string): GeminiCLIVersion {
    const match = versionString.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error(`Invalid version format: ${versionString}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      full: versionString,
    };
  }

  /**
   * Compare two version objects
   */
  private compareVersions(a: GeminiCLIVersion, b: GeminiCLIVersion): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }

  /**
   * Detect CLI capabilities from version output or help text
   */
  private detectCapabilities(versionOutput: string): string[] {
    const capabilities: string[] = [];

    // Basic capabilities that should be available
    capabilities.push("chat", "generate", "models");

    // Additional capabilities based on version
    if (versionOutput.includes("1.5") || versionOutput.includes("1.4")) {
      capabilities.push("vision", "function-calling");
    }

    if (versionOutput.includes("1.5")) {
      capabilities.push("streaming", "context-caching");
    }

    return capabilities;
  }

  /**
   * Aggregate error messages from multiple detection attempts
   */
  private aggregateErrors(results: GeminiCLIDetectionResult[]): string {
    const errors = results
      .filter(r => r.error)
      .map(r => r.error!)
      .filter(Boolean);

    if (errors.length === 0) {
      return "CLI detection failed";
    }

    return errors.join("; ");
  }
}

/**
 * Singleton instance for global use
 */
export const geminiCLIDetector = new GeminiCLIDetector();

/**
 * Quick detection function for one-off checks
 */
export async function isOfficialGeminiCLIAvailable(): Promise<boolean> {
  const result = await geminiCLIDetector.detectOfficialCLI();
  return result.available;
}

/**
 * Get CLI integration mode for current environment
 */
export async function getGeminiCLIIntegrationMode(): Promise<"official" | "fallback"> {
  return await geminiCLIDetector.getIntegrationMode();
}
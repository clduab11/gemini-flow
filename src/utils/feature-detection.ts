/**
 * Feature Detection Utility
 *
 * Detects available optional dependencies and enterprise features
 * Provides fallback mechanisms for core CLI functionality
 */

export interface FeatureDetectionResult {
  available: string[];
  missing: string[];
  errors: Record<string, Error>;
}

export interface FeatureCapabilities {
  googleCloud: boolean;
  vertexAI: boolean;
  googleAuth: boolean;
  googleAPIs: boolean;
  betterSQLite3: boolean;
  sqlite3: boolean;
  sqlJS: boolean;
  hasAnySQL: boolean;
  hasGoogleServices: boolean;
}

/**
 * Cache for feature detection results to avoid repeated imports
 */
const featureCache = new Map<string, boolean>();

/**
 * Detect if a module is available
 */
async function detectModule(moduleName: string): Promise<boolean> {
  if (featureCache.has(moduleName)) {
    return featureCache.get(moduleName)!;
  }

  try {
    await import(moduleName);
    featureCache.set(moduleName, true);
    return true;
  } catch (error) {
    featureCache.set(moduleName, false);
    return false;
  }
}

/**
 * Detect all optional dependencies
 */
export async function detectFeatures(): Promise<FeatureDetectionResult> {
  const modules = [
    "@google-cloud/vertexai",
    "google-auth-library",
    "googleapis",
    "better-sqlite3",
    "sqlite3",
    "sql.js",
  ];

  const result: FeatureDetectionResult = {
    available: [],
    missing: [],
    errors: {},
  };

  for (const moduleName of modules) {
    try {
      const isAvailable = await detectModule(moduleName);
      if (isAvailable) {
        result.available.push(moduleName);
      } else {
        result.missing.push(moduleName);
      }
    } catch (error) {
      result.missing.push(moduleName);
      result.errors[moduleName] = error as Error;
    }
  }

  return result;
}

/**
 * Get feature capabilities
 */
export async function getFeatureCapabilities(): Promise<FeatureCapabilities> {
  const detection = await detectFeatures();

  return {
    googleCloud: detection.available.includes("@google-cloud/vertexai"),
    vertexAI: detection.available.includes("@google-cloud/vertexai"),
    googleAuth: detection.available.includes("google-auth-library"),
    googleAPIs: detection.available.includes("googleapis"),
    betterSQLite3: detection.available.includes("better-sqlite3"),
    sqlite3: detection.available.includes("sqlite3"),
    sqlJS: detection.available.includes("sql.js"),
    hasAnySQL: detection.available.some((mod) =>
      ["better-sqlite3", "sqlite3", "sql.js"].includes(mod),
    ),
    hasGoogleServices: detection.available.some((mod) =>
      ["@google-cloud/vertexai", "google-auth-library", "googleapis"].includes(
        mod,
      ),
    ),
  };
}

/**
 * Check if enterprise features are available
 */
export async function hasEnterpriseFeatures(): Promise<boolean> {
  const capabilities = await getFeatureCapabilities();
  return capabilities.hasGoogleServices && capabilities.hasAnySQL;
}

/**
 * Dynamic import with fallback
 */
export async function safeImport<T = any>(
  moduleName: string,
): Promise<T | null> {
  try {
    const module = await import(moduleName);
    return module;
  } catch (error) {
    console.warn(
      `Optional dependency '${moduleName}' not available:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Conditional class instantiation
 */
export async function conditionalImport<T>(
  moduleName: string,
  factory: (module: any) => T,
): Promise<T | null> {
  const module = await safeImport(moduleName);
  if (!module) return null;

  try {
    return factory(module);
  } catch (error) {
    console.warn(
      `Failed to instantiate from '${moduleName}':`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Get recommended SQLite implementation
 */
export async function getRecommendedSQLiteImpl(): Promise<string | null> {
  const capabilities = await getFeatureCapabilities();

  if (capabilities.betterSQLite3) return "better-sqlite3";
  if (capabilities.sqlite3) return "sqlite3";
  if (capabilities.sqlJS) return "sql.js";

  return null;
}

/**
 * Clear feature detection cache (useful for testing)
 */
export function clearFeatureCache(): void {
  featureCache.clear();
}

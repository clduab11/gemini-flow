/**
 * Feature Detection Utility
 *
 * Detects available optional dependencies and enterprise features
 * Provides fallback mechanisms for core CLI functionality
 */
/**
 * Cache for feature detection results to avoid repeated imports
 */
const featureCache = new Map();
/**
 * Detect if a module is available
 */
async function detectModule(moduleName) {
    if (featureCache.has(moduleName)) {
        return featureCache.get(moduleName);
    }
    try {
        await import(moduleName);
        featureCache.set(moduleName, true);
        return true;
    }
    catch (error) {
        featureCache.set(moduleName, false);
        return false;
    }
}
/**
 * Detect all optional dependencies
 */
export async function detectFeatures() {
    const modules = [
        "@google-cloud/vertexai",
        "google-auth-library",
        "googleapis",
        "better-sqlite3",
        "sqlite3",
        "sql.js",
    ];
    const result = {
        available: [],
        missing: [],
        errors: {},
    };
    for (const moduleName of modules) {
        try {
            const isAvailable = await detectModule(moduleName);
            if (isAvailable) {
                result.available.push(moduleName);
            }
            else {
                result.missing.push(moduleName);
            }
        }
        catch (error) {
            result.missing.push(moduleName);
            result.errors[moduleName] = error;
        }
    }
    return result;
}
/**
 * Get feature capabilities
 */
export async function getFeatureCapabilities() {
    const detection = await detectFeatures();
    return {
        googleCloud: detection.available.includes("@google-cloud/vertexai"),
        vertexAI: detection.available.includes("@google-cloud/vertexai"),
        googleAuth: detection.available.includes("google-auth-library"),
        googleAPIs: detection.available.includes("googleapis"),
        betterSQLite3: detection.available.includes("better-sqlite3"),
        sqlite3: detection.available.includes("sqlite3"),
        sqlJS: detection.available.includes("sql.js"),
        hasAnySQL: detection.available.some((mod) => ["better-sqlite3", "sqlite3", "sql.js"].includes(mod)),
        hasGoogleServices: detection.available.some((mod) => ["@google-cloud/vertexai", "google-auth-library", "googleapis"].includes(mod)),
    };
}
/**
 * Check if enterprise features are available
 */
export async function hasEnterpriseFeatures() {
    const capabilities = await getFeatureCapabilities();
    return capabilities.hasGoogleServices && capabilities.hasAnySQL;
}
/**
 * Dynamic import with fallback
 */
export async function safeImport(moduleName) {
    try {
        const module = await import(moduleName);
        return module;
    }
    catch (error) {
        console.warn(`Optional dependency '${moduleName}' not available:`, error instanceof Error ? error.message : error);
        return null;
    }
}
/**
 * Conditional class instantiation
 */
export async function conditionalImport(moduleName, factory) {
    const module = await safeImport(moduleName);
    if (!module)
        return null;
    try {
        return factory(module);
    }
    catch (error) {
        console.warn(`Failed to instantiate from '${moduleName}':`, error instanceof Error ? error.message : error);
        return null;
    }
}
/**
 * Get recommended SQLite implementation
 */
export async function getRecommendedSQLiteImpl() {
    const capabilities = await getFeatureCapabilities();
    if (capabilities.betterSQLite3)
        return "better-sqlite3";
    if (capabilities.sqlite3)
        return "sqlite3";
    if (capabilities.sqlJS)
        return "sql.js";
    return null;
}
/**
 * Clear feature detection cache (useful for testing)
 */
export function clearFeatureCache() {
    featureCache.clear();
}
//# sourceMappingURL=feature-detection.js.map
/**
 * Detect all optional dependencies
 */
export function detectFeatures(): Promise<{
    available: never[];
    missing: never[];
    errors: {};
}>;
/**
 * Get feature capabilities
 */
export function getFeatureCapabilities(): Promise<{
    googleCloud: boolean;
    vertexAI: boolean;
    googleAuth: boolean;
    googleAPIs: boolean;
    betterSQLite3: boolean;
    sqlite3: boolean;
    sqlJS: boolean;
    hasAnySQL: boolean;
    hasGoogleServices: boolean;
}>;
/**
 * Check if enterprise features are available
 */
export function hasEnterpriseFeatures(): Promise<boolean>;
/**
 * Dynamic import with fallback
 */
export function safeImport(moduleName: any): Promise<any>;
/**
 * Conditional class instantiation
 */
export function conditionalImport(moduleName: any, factory: any): Promise<any>;
/**
 * Get recommended SQLite implementation
 */
export function getRecommendedSQLiteImpl(): Promise<"sqlite3" | "better-sqlite3" | "sql.js" | null>;
/**
 * Clear feature detection cache (useful for testing)
 */
export function clearFeatureCache(): void;
//# sourceMappingURL=feature-detection.d.ts.map
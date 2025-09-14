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
 * Detect all optional dependencies
 */
export declare function detectFeatures(): Promise<FeatureDetectionResult>;
/**
 * Get feature capabilities
 */
export declare function getFeatureCapabilities(): Promise<FeatureCapabilities>;
/**
 * Check if enterprise features are available
 */
export declare function hasEnterpriseFeatures(): Promise<boolean>;
/**
 * Dynamic import with fallback
 */
export declare function safeImport<T = any>(moduleName: string): Promise<T | null>;
/**
 * Conditional class instantiation
 */
export declare function conditionalImport<T>(moduleName: string, factory: (module: any) => T): Promise<T | null>;
/**
 * Get recommended SQLite implementation
 */
export declare function getRecommendedSQLiteImpl(): Promise<string | null>;
/**
 * Clear feature detection cache (useful for testing)
 */
export declare function clearFeatureCache(): void;
//# sourceMappingURL=feature-detection.d.ts.map
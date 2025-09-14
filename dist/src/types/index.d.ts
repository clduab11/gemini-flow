/**
 * Type exports for Gemini Flow
 */
export * from "./mcp.js";
export * from "./learning.js";
export * from "./a2a.js";
export type UserTier = "free" | "pro" | "enterprise";
/**
 * Type guard to validate and cast user tier values
 */
export declare function asUserTier(value: string | undefined | null): UserTier;
/**
 * Type guard to check if a value is a valid UserTier
 */
export declare function isValidUserTier(value: any): value is UserTier;
//# sourceMappingURL=index.d.ts.map
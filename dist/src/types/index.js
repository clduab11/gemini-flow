/**
 * Type exports for Gemini Flow
 */
// Core type exports
export * from "./mcp.js";
export * from "./learning.js";
export * from "./a2a.js";
/**
 * Type guard to validate and cast user tier values
 */
export function asUserTier(value) {
    if (value === "free" || value === "pro" || value === "enterprise") {
        return value;
    }
    return "free"; // Default fallback
}
/**
 * Type guard to check if a value is a valid UserTier
 */
export function isValidUserTier(value) {
    return value === "free" || value === "pro" || value === "enterprise";
}
//# sourceMappingURL=index.js.map
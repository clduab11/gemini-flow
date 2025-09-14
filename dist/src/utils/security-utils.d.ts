/**
 * Security Utilities
 *
 * Helper functions for security validation, encryption, and audit
 */
export declare class SecurityUtils {
    /**
     * Sanitize sensitive data from objects
     */
    static sanitizeObject(obj: any, sensitiveFields?: string[]): any;
    /**
     * Generate cryptographic signature for data integrity
     */
    static generateSignature(data: string, secret?: string): string;
    /**
     * Verify cryptographic signature
     */
    static verifySignature(data: string, signature: string, secret?: string): boolean;
    /**
     * Generate secure random token
     */
    static generateSecureToken(length?: number): string;
    /**
     * Hash sensitive data for storage
     */
    static hashSensitiveData(data: string, salt?: string): string;
    /**
     * Verify hashed data
     */
    static verifyHashedData(data: string, hashedData: string): boolean;
    /**
     * Validate URL security (HTTPS, no malicious patterns)
     */
    static validateUrlSecurity(url: string): {
        valid: boolean;
        reason?: string;
    };
    /**
     * Rate limiting implementation
     */
    static createRateLimiter(maxRequests: number, windowMs: number): (identifier: string) => boolean;
    /**
     * Input validation and sanitization
     */
    static validateInput(input: any, rules: {
        type?: "string" | "number" | "boolean" | "object";
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        required?: boolean;
        allowedValues?: any[];
    }): {
        valid: boolean;
        sanitized?: any;
        error?: string;
    };
    /**
     * Security audit logger
     */
    static createSecurityAuditLogger(): {
        log: (level: "info" | "warning" | "error" | "critical", event: string, details?: any) => void;
        getEvents: (level?: string, limit?: number) => {
            timestamp: Date;
            level: "info" | "warning" | "error" | "critical";
            event: string;
            details: any;
            signature: string;
        }[];
        verifyIntegrity: () => boolean;
    };
    /**
     * Encryption utilities for sensitive data
     */
    static createEncryption(key?: string): {
        encrypt: (text: string) => string;
        decrypt: (encryptedText: string) => string;
    };
    /**
     * Security policy enforcement
     */
    static enforceSecurityPolicy(action: string, resource: string, userContext: any, policy: any): {
        allowed: boolean;
        reason?: string;
        requiredPermissions?: string[];
    };
}
//# sourceMappingURL=security-utils.d.ts.map
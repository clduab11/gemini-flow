/**
 * Security Integration Script
 *
 * Integrates all security components for production Google Services deployment:
 * - Production Security Hardening
 * - Zero-Trust Architecture
 * - Security Runbooks
 * - Database Schema Setup
 * - Monitoring and Alerting
 */
import { DatabaseConnection } from "../core/sqlite-connection-pool.js";
export declare class SecurityIntegrationManager {
    private logger;
    private db;
    private securityHardening?;
    private zeroTrustArch?;
    private runbooks?;
    private initialized;
    constructor(db: DatabaseConnection);
    /**
     * Initialize complete security framework
     */
    initialize(): Promise<{
        success: boolean;
        components: string[];
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Get security framework status
     */
    getSecurityStatus(): {
        initialized: boolean;
        components: {
            securityHardening: boolean;
            zeroTrust: boolean;
            runbooks: boolean;
        };
        metrics: any;
        alerts: any[];
    };
    /**
     * Handle security incident
     */
    handleSecurityIncident(incident: {
        title: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        category: string;
        evidence?: any[];
    }): Promise<{
        incidentId: string;
        runbookExecutionId?: string;
        escalationTriggered: boolean;
    }>;
    /**
     * Authenticate user with zero-trust validation
     */
    authenticateUser(credentials: {
        username: string;
        password?: string;
        mfaToken?: string;
        deviceId: string;
        contextInfo: {
            ipAddress: string;
            userAgent: string;
            location?: any;
        };
    }): Promise<any>;
    /**
     * Authorize access to resources
     */
    authorizeAccess(sessionId: string, resource: string, action: string, contextInfo?: any): Promise<any>;
    /**
     * Validate and sanitize input
     */
    validateInput(input: any, schema: any): Promise<any>;
    /**
     * Execute parameterized database query
     */
    executeSecureQuery(query: string, parameters: any[], options?: any): Promise<any>;
    /**
     * Generate CSRF token
     */
    generateCsrfToken(sessionId: string): Promise<string>;
    /**
     * Validate CSRF token
     */
    validateCsrfToken(sessionId: string, token: string): Promise<boolean>;
    /**
     * Get security headers for HTTP responses
     */
    getSecurityHeaders(): Record<string, string>;
    /**
     * Create rate limiting middleware
     */
    createRateLimitMiddleware(): any;
    /**
     * Handle GDPR data subject request
     */
    handleGdprRequest(request: any): Promise<any>;
    /**
     * Generate security dashboard data
     */
    generateSecurityDashboard(): Promise<any>;
    /**
     * Shutdown security framework
     */
    shutdown(): Promise<void>;
    /**
     * Private implementation methods
     */
    private setupDatabaseSchema;
    private setupEventHandlers;
    private setupMonitoringAndAlerting;
    private startSecurityServices;
    private determineRunbook;
}
/**
 * Factory function to create and initialize security framework
 */
export declare function createSecurityFramework(db: DatabaseConnection): Promise<SecurityIntegrationManager>;
/**
 * Express.js middleware factory for security integration
 */
export declare function createSecurityMiddleware(securityManager: SecurityIntegrationManager): {
    securityHeaders: (req: any, res: any, next: any) => void;
    rateLimit: any;
    validateInput: (schema: any) => (req: any, res: any, next: any) => Promise<any>;
    csrfProtection: (req: any, res: any, next: any) => Promise<any>;
    authenticate: (req: any, res: any, next: any) => Promise<any>;
    authorize: (resource: string, action: string) => (req: any, res: any, next: any) => Promise<any>;
};
export default SecurityIntegrationManager;
//# sourceMappingURL=security-integration.d.ts.map
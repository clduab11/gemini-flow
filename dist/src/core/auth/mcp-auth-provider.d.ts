/**
 * MCP Authentication Provider
 *
 * Model Context Protocol authentication integration that provides authentication
 * capabilities as MCP tools and handles authentication requests from MCP clients
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { UnifiedAuthManager } from "./unified-auth-manager.js";
import { MCPAuthCapability, MCPAuthProvider, AuthenticationResult, RefreshTokenResult, ValidationResult } from "../../types/auth.js";
/**
 * MCP Auth Provider Configuration
 */
export interface MCPAuthProviderConfig {
    version: string;
    enabledCapabilities: string[];
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
    enableMetrics: boolean;
    enableCaching: boolean;
}
/**
 * MCP authentication metrics
 */
export interface MCPAuthMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    activeRequests: number;
    capabilityUsage: Record<string, number>;
    errorsByType: Record<string, number>;
}
/**
 * MCP Authentication Provider Implementation
 */
export declare class MCPAuthenticationProvider extends EventEmitter implements MCPAuthProvider {
    readonly name = "mcp-auth";
    readonly version: string;
    private authManager;
    private config;
    private logger;
    private activeRequests;
    private requestCounter;
    private metrics;
    readonly capabilities: MCPAuthCapability[];
    constructor(authManager: UnifiedAuthManager, config?: Partial<MCPAuthProviderConfig>);
    /**
     * Handle MCP authentication request
     */
    authenticate(params: any): Promise<AuthenticationResult>;
    /**
     * Handle MCP token refresh request
     */
    refresh(params: any): Promise<RefreshTokenResult>;
    /**
     * Handle MCP credential validation request
     */
    validate(params: any): Promise<ValidationResult>;
    /**
     * Handle additional MCP capabilities
     */
    handleCapability(method: string, params: any): Promise<any>;
    /**
     * Get MCP provider information
     */
    getProviderInfo(): {
        name: string;
        version: string;
        capabilities: MCPAuthCapability[];
        metrics: MCPAuthMetrics | undefined;
        config: {
            maxConcurrentRequests: number;
            requestTimeoutMs: number;
            enabledCapabilities: number;
        };
    };
    /**
     * Handle revocation request
     */
    private handleRevoke;
    /**
     * Handle status request
     */
    private handleStatus;
    /**
     * Handle capabilities request
     */
    private handleCapabilities;
    /**
     * Handle providers request
     */
    private handleProviders;
    /**
     * Handle metrics request
     */
    private handleMetrics;
    /**
     * Get metrics
     */
    private getMetrics;
    /**
     * Calculate success rate
     */
    private calculateSuccessRate;
    /**
     * Track active request
     */
    private trackRequest;
    /**
     * Untrack request
     */
    private untrackRequest;
    /**
     * Handle request timeout
     */
    private handleRequestTimeout;
    /**
     * Update metrics
     */
    private updateMetrics;
    /**
     * Create request context
     */
    private createRequestContext;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
    /**
     * Parameter validation methods
     */
    private validateAuthenticateParams;
    private validateRefreshParams;
    private validateValidateParams;
    private validateRevokeParams;
    /**
     * Create MCP-specific error
     */
    private createMCPError;
    /**
     * Create auth error
     */
    private createAuthError;
}
//# sourceMappingURL=mcp-auth-provider.d.ts.map
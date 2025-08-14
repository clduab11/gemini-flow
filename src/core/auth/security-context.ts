/**
 * Security Context Propagation System
 *
 * Manages security context propagation across the authentication system,
 * ensuring secure context sharing between components and maintaining security boundaries
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import {
  SecurityContext,
  AuthContext,
  AuthCredentials,
  AuthError,
} from "../../types/auth.js";

/**
 * Security context configuration
 */
export interface SecurityContextConfig {
  enableContextPropagation: boolean;
  maxContextAge: number; // milliseconds
  enableContextValidation: boolean;
  contextEncryptionEnabled: boolean;
  enableAuditTrail: boolean;
  trustedComponents: string[];
  securityLevels: string[];
}

/**
 * Context propagation entry
 */
interface ContextPropagationEntry {
  context: SecurityContext;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  sourceComponent: string;
  propagatedTo: string[];
}

/**
 * Context validation result
 */
interface ContextValidationResult {
  valid: boolean;
  expired: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Security audit entry
 */
interface SecurityAuditEntry {
  timestamp: number;
  eventType:
    | "context_created"
    | "context_propagated"
    | "context_validated"
    | "context_expired"
    | "security_violation";
  contextId: string;
  component: string;
  details: Record<string, any>;
  securityLevel: string;
}

/**
 * Context access control
 */
interface ContextAccessControl {
  requiredPermissions: string[];
  allowedComponents: string[];
  securityLevel: string;
  expiration: number;
}

/**
 * Security Context Manager
 */
export class SecurityContextManager extends EventEmitter {
  private config: SecurityContextConfig;
  private logger: Logger;

  // Context storage and tracking
  private activeContexts = new Map<string, ContextPropagationEntry>();
  private contextAccessControls = new Map<string, ContextAccessControl>();
  private auditTrail: SecurityAuditEntry[] = [];

  // Component registry
  private trustedComponents = new Set<string>();
  private componentSessions = new Map<string, Set<string>>();

  // Security validation
  private contextValidationRules = new Map<
    string,
    (context: SecurityContext) => boolean
  >();

  // Cleanup intervals
  private cleanupInterval?: ReturnType<typeof setInterval>;
  private auditCleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<SecurityContextConfig> = {}) {
    super();

    this.config = {
      enableContextPropagation: config.enableContextPropagation ?? true,
      maxContextAge: config.maxContextAge || 24 * 60 * 60 * 1000, // 24 hours
      enableContextValidation: config.enableContextValidation ?? true,
      contextEncryptionEnabled: config.contextEncryptionEnabled ?? true,
      enableAuditTrail: config.enableAuditTrail ?? true,
      trustedComponents: config.trustedComponents || [],
      securityLevels: config.securityLevels || [
        "public",
        "internal",
        "confidential",
        "secret",
      ],
      ...config,
    };

    this.logger = new Logger("SecurityContextManager");

    // Initialize trusted components
    this.config.trustedComponents.forEach((component) => {
      this.trustedComponents.add(component);
    });

    // Set up default validation rules
    this.setupDefaultValidationRules();

    // Start cleanup tasks
    this.startCleanupTasks();

    this.logger.info("Security Context Manager initialized", {
      enablePropagation: this.config.enableContextPropagation,
      maxContextAge: this.config.maxContextAge,
      trustedComponents: this.config.trustedComponents.length,
      enableAuditTrail: this.config.enableAuditTrail,
    });
  }

  /**
   * Create new security context
   */
  async createSecurityContext(
    authContext: AuthContext,
    sourceComponent: string,
    options: {
      securityLevel?: string;
      requiredPermissions?: string[];
      allowedComponents?: string[];
      customData?: Record<string, any>;
    } = {},
  ): Promise<SecurityContext> {
    try {
      if (!this.config.enableContextPropagation) {
        throw this.createSecurityError(
          "CONTEXT_DISABLED",
          "Context propagation is disabled",
        );
      }

      // Validate source component
      this.validateSourceComponent(sourceComponent);

      // Generate context ID
      const contextId = this.generateContextId();

      // Create security context
      const securityContext: SecurityContext = {
        authContext,
        requestId: contextId,
        sourceIp: options.customData?.sourceIp,
        userAgent: options.customData?.userAgent,
        timestamp: Date.now(),
        riskScore: this.calculateRiskScore(authContext, options),
        trustedDevice: this.isTrustedDevice(options.customData?.deviceInfo),
      };

      // Create propagation entry
      const propagationEntry: ContextPropagationEntry = {
        context: securityContext,
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        sourceComponent,
        propagatedTo: [],
      };

      // Set up access control
      const accessControl: ContextAccessControl = {
        requiredPermissions: options.requiredPermissions || [],
        allowedComponents: options.allowedComponents || [],
        securityLevel: options.securityLevel || "internal",
        expiration: Date.now() + this.config.maxContextAge,
      };

      // Store context
      this.activeContexts.set(contextId, propagationEntry);
      this.contextAccessControls.set(contextId, accessControl);

      // Add to component sessions
      if (!this.componentSessions.has(sourceComponent)) {
        this.componentSessions.set(sourceComponent, new Set());
      }
      this.componentSessions.get(sourceComponent)!.add(contextId);

      // Log audit entry
      this.logSecurityAudit(
        "context_created",
        contextId,
        sourceComponent,
        {
          securityLevel: accessControl.securityLevel,
          permissions: authContext.permissions,
          userId: authContext.userId,
        },
        accessControl.securityLevel,
      );

      this.logger.info("Security context created", {
        contextId,
        sourceComponent,
        securityLevel: accessControl.securityLevel,
        permissions: authContext.permissions.length,
      });

      this.emit("context_created", {
        contextId,
        securityContext,
        sourceComponent,
      });

      return securityContext;
    } catch (error) {
      this.logger.error("Failed to create security context", {
        sourceComponent,
        error,
      });
      throw error;
    }
  }

  /**
   * Propagate context to another component
   */
  async propagateContext(
    contextId: string,
    targetComponent: string,
    requiredPermissions: string[] = [],
  ): Promise<SecurityContext> {
    try {
      if (!this.config.enableContextPropagation) {
        throw this.createSecurityError(
          "CONTEXT_DISABLED",
          "Context propagation is disabled",
        );
      }

      // Get context entry
      const entry = this.activeContexts.get(contextId);
      if (!entry) {
        throw this.createSecurityError(
          "CONTEXT_NOT_FOUND",
          `Security context not found: ${contextId}`,
        );
      }

      // Get access control
      const accessControl = this.contextAccessControls.get(contextId);
      if (!accessControl) {
        throw this.createSecurityError(
          "ACCESS_CONTROL_NOT_FOUND",
          `Access control not found: ${contextId}`,
        );
      }

      // Validate context
      const validation = await this.validateContext(contextId);
      if (!validation.valid) {
        throw this.createSecurityError(
          "CONTEXT_INVALID",
          `Context validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Check component authorization
      await this.checkComponentAuthorization(
        targetComponent,
        accessControl,
        requiredPermissions,
      );

      // Update propagation tracking
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      if (!entry.propagatedTo.includes(targetComponent)) {
        entry.propagatedTo.push(targetComponent);
      }

      // Add to target component sessions
      if (!this.componentSessions.has(targetComponent)) {
        this.componentSessions.set(targetComponent, new Set());
      }
      this.componentSessions.get(targetComponent)!.add(contextId);

      // Log audit entry
      this.logSecurityAudit(
        "context_propagated",
        contextId,
        targetComponent,
        {
          sourceComponent: entry.sourceComponent,
          requiredPermissions,
          accessCount: entry.accessCount,
        },
        accessControl.securityLevel,
      );

      this.logger.debug("Security context propagated", {
        contextId,
        sourceComponent: entry.sourceComponent,
        targetComponent,
        accessCount: entry.accessCount,
      });

      this.emit("context_propagated", {
        contextId,
        sourceComponent: entry.sourceComponent,
        targetComponent,
        securityContext: entry.context,
      });

      return entry.context;
    } catch (error) {
      this.logger.error("Failed to propagate security context", {
        contextId,
        targetComponent,
        error,
      });
      throw error;
    }
  }

  /**
   * Validate security context
   */
  async validateContext(contextId: string): Promise<ContextValidationResult> {
    try {
      const entry = this.activeContexts.get(contextId);
      const accessControl = this.contextAccessControls.get(contextId);

      const result: ContextValidationResult = {
        valid: true,
        expired: false,
        errors: [],
        warnings: [],
      };

      // Check if context exists
      if (!entry || !accessControl) {
        result.valid = false;
        result.errors.push("Context not found");
        return result;
      }

      // Check expiration
      const now = Date.now();
      if (accessControl.expiration <= now) {
        result.valid = false;
        result.expired = true;
        result.errors.push("Context has expired");
      }

      // Check context age
      const contextAge = now - entry.createdAt;
      if (contextAge > this.config.maxContextAge) {
        result.valid = false;
        result.expired = true;
        result.errors.push("Context exceeds maximum age");
      }

      // Check auth context validity
      const authContext = entry.context.authContext;
      if (authContext.expiresAt && authContext.expiresAt <= now) {
        result.valid = false;
        result.expired = true;
        result.errors.push("Auth context has expired");
      }

      // Run custom validation rules
      if (this.config.enableContextValidation) {
        for (const [
          ruleName,
          ruleFunction,
        ] of this.contextValidationRules.entries()) {
          try {
            if (!ruleFunction(entry.context)) {
              result.warnings.push(`Validation rule failed: ${ruleName}`);
            }
          } catch (error) {
            result.warnings.push(`Validation rule error: ${ruleName}`);
          }
        }
      }

      // Log validation if there are issues
      if (!result.valid || result.warnings.length > 0) {
        this.logSecurityAudit(
          "context_validated",
          contextId,
          "security-manager",
          {
            valid: result.valid,
            expired: result.expired,
            errors: result.errors,
            warnings: result.warnings,
          },
          accessControl.securityLevel,
        );
      }

      return result;
    } catch (error) {
      this.logger.error("Context validation failed", { contextId, error });
      return {
        valid: false,
        expired: false,
        errors: [
          error instanceof Error ? error.message : "Unknown validation error",
        ],
        warnings: [],
      };
    }
  }

  /**
   * Get security context
   */
  async getSecurityContext(
    contextId: string,
    component: string,
  ): Promise<SecurityContext | null> {
    try {
      const entry = this.activeContexts.get(contextId);
      const accessControl = this.contextAccessControls.get(contextId);

      if (!entry || !accessControl) {
        return null;
      }

      // Validate context
      const validation = await this.validateContext(contextId);
      if (!validation.valid) {
        return null;
      }

      // Check component access
      if (
        accessControl.allowedComponents.length > 0 &&
        !accessControl.allowedComponents.includes(component)
      ) {
        throw this.createSecurityError(
          "ACCESS_DENIED",
          `Component not authorized: ${component}`,
        );
      }

      // Update access tracking
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      return entry.context;
    } catch (error) {
      this.logger.error("Failed to get security context", {
        contextId,
        component,
        error,
      });
      return null;
    }
  }

  /**
   * Revoke security context
   */
  async revokeContext(contextId: string, component: string): Promise<boolean> {
    try {
      const entry = this.activeContexts.get(contextId);
      const accessControl = this.contextAccessControls.get(contextId);

      if (!entry || !accessControl) {
        return false;
      }

      // Check if component can revoke this context
      if (
        entry.sourceComponent !== component &&
        !this.trustedComponents.has(component)
      ) {
        throw this.createSecurityError(
          "ACCESS_DENIED",
          `Component not authorized to revoke context: ${component}`,
        );
      }

      // Remove from all component sessions
      for (const [comp, sessions] of this.componentSessions.entries()) {
        sessions.delete(contextId);
      }

      // Remove context and access control
      this.activeContexts.delete(contextId);
      this.contextAccessControls.delete(contextId);

      // Log audit entry
      this.logSecurityAudit(
        "context_expired",
        contextId,
        component,
        {
          reason: "manual_revocation",
          originalSource: entry.sourceComponent,
        },
        accessControl.securityLevel,
      );

      this.logger.info("Security context revoked", { contextId, component });
      this.emit("context_revoked", { contextId, component });

      return true;
    } catch (error) {
      this.logger.error("Failed to revoke security context", {
        contextId,
        component,
        error,
      });
      return false;
    }
  }

  /**
   * List active contexts for component
   */
  getActiveContexts(component?: string): string[] {
    if (component) {
      const sessions = this.componentSessions.get(component);
      return sessions ? Array.from(sessions) : [];
    }

    return Array.from(this.activeContexts.keys());
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const now = Date.now();
    const entries = Array.from(this.activeContexts.values());

    return {
      totalContexts: this.activeContexts.size,
      activeComponents: this.componentSessions.size,
      trustedComponents: this.trustedComponents.size,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (now - entry.createdAt), 0) /
            entries.length
          : 0,
      auditEntries: this.auditTrail.length,
      securityViolations: this.auditTrail.filter(
        (entry) => entry.eventType === "security_violation",
      ).length,
    };
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit = 100, component?: string): SecurityAuditEntry[] {
    let entries = this.auditTrail;

    if (component) {
      entries = entries.filter((entry) => entry.component === component);
    }

    return entries.slice(-limit);
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(
    name: string,
    rule: (context: SecurityContext) => boolean,
  ): void {
    this.contextValidationRules.set(name, rule);
    this.logger.debug("Validation rule added", { name });
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(name: string): boolean {
    const removed = this.contextValidationRules.delete(name);
    if (removed) {
      this.logger.debug("Validation rule removed", { name });
    }
    return removed;
  }

  /**
   * Register trusted component
   */
  registerTrustedComponent(component: string): void {
    this.trustedComponents.add(component);
    this.logger.info("Trusted component registered", { component });
  }

  /**
   * Unregister trusted component
   */
  unregisterTrustedComponent(component: string): void {
    this.trustedComponents.delete(component);
    this.logger.info("Trusted component unregistered", { component });
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down Security Context Manager");

    // Clear cleanup intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.auditCleanupInterval) {
      clearInterval(this.auditCleanupInterval);
    }

    // Clear all contexts
    const contextIds = Array.from(this.activeContexts.keys());
    for (const contextId of contextIds) {
      await this.revokeContext(contextId, "security-manager");
    }

    this.logger.info("Security Context Manager shutdown complete");
  }

  /**
   * Setup default validation rules
   */
  private setupDefaultValidationRules(): void {
    // Rule: Check if auth context has required fields
    this.addValidationRule(
      "auth_context_complete",
      (context: SecurityContext) => {
        const authContext = context.authContext;
        return !!(
          authContext.sessionId &&
          authContext.credentials &&
          authContext.scopes
        );
      },
    );

    // Rule: Check if credentials are not expired
    this.addValidationRule(
      "credentials_not_expired",
      (context: SecurityContext) => {
        const credentials = context.authContext.credentials;
        if (credentials.expiresAt) {
          return credentials.expiresAt > Date.now();
        }
        return true; // No expiration set
      },
    );

    // Rule: Check risk score threshold
    this.addValidationRule(
      "risk_score_acceptable",
      (context: SecurityContext) => {
        return !context.riskScore || context.riskScore < 0.8; // 80% risk threshold
      },
    );
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Context cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredContexts().catch((error) => {
          this.logger.error("Context cleanup failed", { error });
        });
      },
      5 * 60 * 1000,
    );

    // Audit trail cleanup every hour
    this.auditCleanupInterval = setInterval(
      () => {
        this.cleanupAuditTrail();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Cleanup expired contexts
   */
  private async cleanupExpiredContexts(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [contextId, entry] of this.activeContexts.entries()) {
      const accessControl = this.contextAccessControls.get(contextId);

      if (!accessControl) {
        // Remove context without access control
        this.activeContexts.delete(contextId);
        cleanedCount++;
        continue;
      }

      // Check if expired
      const contextAge = now - entry.createdAt;
      const isExpired =
        accessControl.expiration <= now ||
        contextAge > this.config.maxContextAge;

      if (isExpired) {
        // Remove from component sessions
        for (const sessions of this.componentSessions.values()) {
          sessions.delete(contextId);
        }

        // Remove context
        this.activeContexts.delete(contextId);
        this.contextAccessControls.delete(contextId);

        // Log expiration
        this.logSecurityAudit(
          "context_expired",
          contextId,
          "security-manager",
          {
            reason: "automatic_cleanup",
            age: contextAge,
          },
          accessControl.securityLevel,
        );

        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info("Expired contexts cleaned up", { count: cleanedCount });
      this.emit("contexts_cleaned", { count: cleanedCount });
    }
  }

  /**
   * Cleanup old audit trail entries
   */
  private cleanupAuditTrail(): void {
    const maxEntries = 10000;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    // Remove old entries
    this.auditTrail = this.auditTrail.filter(
      (entry) => now - entry.timestamp <= maxAge,
    );

    // Keep only latest entries if still too many
    if (this.auditTrail.length > maxEntries) {
      this.auditTrail = this.auditTrail.slice(-maxEntries);
    }
  }

  /**
   * Validate source component
   */
  private validateSourceComponent(component: string): void {
    if (!component || typeof component !== "string") {
      throw this.createSecurityError(
        "INVALID_COMPONENT",
        "Invalid source component",
      );
    }
  }

  /**
   * Check component authorization
   */
  private async checkComponentAuthorization(
    component: string,
    accessControl: ContextAccessControl,
    requiredPermissions: string[],
  ): Promise<void> {
    // Check if component is allowed
    if (
      accessControl.allowedComponents.length > 0 &&
      !accessControl.allowedComponents.includes(component)
    ) {
      throw this.createSecurityError(
        "ACCESS_DENIED",
        `Component not in allowed list: ${component}`,
      );
    }

    // Check if component is trusted for sensitive operations
    if (
      accessControl.securityLevel === "secret" &&
      !this.trustedComponents.has(component)
    ) {
      throw this.createSecurityError(
        "INSUFFICIENT_TRUST",
        `Component not trusted for secret level: ${component}`,
      );
    }

    // Check required permissions
    for (const permission of requiredPermissions) {
      if (!accessControl.requiredPermissions.includes(permission)) {
        throw this.createSecurityError(
          "INSUFFICIENT_PERMISSIONS",
          `Missing required permission: ${permission}`,
        );
      }
    }
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(authContext: AuthContext, options: any): number {
    let riskScore = 0;

    // Base risk from auth method
    if (authContext.credentials.type === "api_key") {
      riskScore += 0.2;
    }

    // Risk from unknown source IP
    if (
      options.customData?.sourceIp &&
      !this.isKnownIP(options.customData.sourceIp)
    ) {
      riskScore += 0.3;
    }

    // Risk from untrusted device
    if (!this.isTrustedDevice(options.customData?.deviceInfo)) {
      riskScore += 0.2;
    }

    // Risk from high privilege permissions
    const highPrivilegePerms = ["admin", "superuser", "root"];
    if (
      authContext.permissions.some((perm) => highPrivilegePerms.includes(perm))
    ) {
      riskScore += 0.1;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Check if IP is known/trusted
   */
  private isKnownIP(ip: string): boolean {
    // This would integrate with IP reputation services or allowlists
    // For now, return true for local IPs
    return (
      ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")
    );
  }

  /**
   * Check if device is trusted
   */
  private isTrustedDevice(deviceInfo?: any): boolean {
    // This would check device fingerprints, certificates, etc.
    // For now, return false to be conservative
    return false;
  }

  /**
   * Generate unique context ID
   */
  private generateContextId(): string {
    return `sec_ctx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Log security audit entry
   */
  private logSecurityAudit(
    eventType: SecurityAuditEntry["eventType"],
    contextId: string,
    component: string,
    details: Record<string, any>,
    securityLevel: string,
  ): void {
    if (!this.config.enableAuditTrail) return;

    const entry: SecurityAuditEntry = {
      timestamp: Date.now(),
      eventType,
      contextId,
      component,
      details,
      securityLevel,
    };

    this.auditTrail.push(entry);
  }

  /**
   * Create security error
   */
  private createSecurityError(code: string, message: string): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    error.type = "authorization";
    error.retryable = false;
    error.context = {
      manager: "security-context",
      timestamp: Date.now(),
    };
    return error;
  }
}

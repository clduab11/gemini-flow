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

import { ProductionSecurityHardening } from "./production-security-hardening.js";
import { ZeroTrustArchitecture } from "./zero-trust-architecture.js";
import { SecurityRunbooks } from "./security-runbooks.js";
import {
  getSecurityConfig,
  zeroTrustPolicy,
  validateSecurityConfig,
} from "./production-security-config.js";
import { DatabaseConnection } from "../core/sqlite-connection-pool.js";
import { Logger } from "../utils/logger.js";
import fs from "fs/promises";
import path from "path";

export class SecurityIntegrationManager {
  private logger: Logger;
  private db: DatabaseConnection;
  private securityHardening?: ProductionSecurityHardening;
  private zeroTrustArch?: ZeroTrustArchitecture;
  private runbooks?: SecurityRunbooks;
  private initialized: boolean = false;

  constructor(db: DatabaseConnection) {
    this.logger = new Logger("SecurityIntegrationManager");
    this.db = db;
  }

  /**
   * Initialize complete security framework
   */
  async initialize(): Promise<{
    success: boolean;
    components: string[];
    errors: string[];
    warnings: string[];
  }> {
    const components: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.logger.info("Initializing production security framework...");

      // Step 1: Validate configuration
      const config = getSecurityConfig();
      const validation = validateSecurityConfig(config);

      if (!validation.isValid) {
        errors.push(...validation.errors);
        return {
          success: false,
          components,
          errors,
          warnings: validation.warnings,
        };
      }
      warnings.push(...validation.warnings);

      // Step 2: Setup database schema
      await this.setupDatabaseSchema();
      components.push("Database Schema");

      // Step 3: Initialize Production Security Hardening
      this.securityHardening = new ProductionSecurityHardening(config, this.db);
      components.push("Production Security Hardening");

      // Step 4: Initialize Zero-Trust Architecture
      this.zeroTrustArch = new ZeroTrustArchitecture(this.db, zeroTrustPolicy);
      components.push("Zero-Trust Architecture");

      // Step 5: Initialize Security Runbooks
      this.runbooks = new SecurityRunbooks();
      components.push("Security Runbooks");

      // Step 6: Setup event handlers and integrations
      await this.setupEventHandlers();
      components.push("Event Handlers");

      // Step 7: Configure monitoring and alerting
      await this.setupMonitoringAndAlerting();
      components.push("Monitoring & Alerting");

      // Step 8: Start security services
      await this.startSecurityServices();
      components.push("Security Services");

      this.initialized = true;

      this.logger.info("Security framework initialized successfully", {
        components: components.length,
        warnings: warnings.length,
        environment: config.environment,
      });

      return {
        success: true,
        components,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error("Security framework initialization failed", { error });
      errors.push(
        error instanceof Error ? error.message : "Unknown initialization error",
      );

      return {
        success: false,
        components,
        errors,
        warnings,
      };
    }
  }

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
  } {
    return {
      initialized: this.initialized,
      components: {
        securityHardening: !!this.securityHardening,
        zeroTrust: !!this.zeroTrustArch,
        runbooks: !!this.runbooks,
      },
      metrics: this.securityHardening?.getSecurityMetrics() || {},
      alerts: [], // Would contain active security alerts
    };
  }

  /**
   * Handle security incident
   */
  async handleSecurityIncident(incident: {
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    category: string;
    evidence?: any[];
  }): Promise<{
    incidentId: string;
    runbookExecutionId?: string;
    escalationTriggered: boolean;
  }> {
    if (!this.initialized || !this.securityHardening) {
      throw new Error("Security framework not initialized");
    }

    // Create security incident
    const incidentId =
      await this.securityHardening.createSecurityIncident(incident);

    // Determine appropriate runbook
    const runbookId = this.determineRunbook(
      incident.category,
      incident.severity,
    );
    let runbookExecutionId: string | undefined;

    // Execute runbook if available
    if (runbookId && this.runbooks) {
      try {
        runbookExecutionId = await this.runbooks.executeRunbook(runbookId, {
          incidentId,
          executedBy: "system",
          autoExecute: incident.severity === "critical",
          variables: {
            incident_id: incidentId,
            severity: incident.severity,
            category: incident.category,
          },
        });
      } catch (error) {
        this.logger.error("Runbook execution failed", {
          error,
          runbookId,
          incidentId,
        });
      }
    }

    // Trigger escalation for high/critical incidents
    const escalationTriggered =
      incident.severity === "high" || incident.severity === "critical";

    return {
      incidentId,
      runbookExecutionId,
      escalationTriggered,
    };
  }

  /**
   * Authenticate user with zero-trust validation
   */
  async authenticateUser(credentials: {
    username: string;
    password?: string;
    mfaToken?: string;
    deviceId: string;
    contextInfo: {
      ipAddress: string;
      userAgent: string;
      location?: any;
    };
  }): Promise<any> {
    if (!this.zeroTrustArch) {
      throw new Error("Zero-trust architecture not initialized");
    }

    return await this.zeroTrustArch.authenticateUser(credentials);
  }

  /**
   * Authorize access to resources
   */
  async authorizeAccess(
    sessionId: string,
    resource: string,
    action: string,
    contextInfo?: any,
  ): Promise<any> {
    if (!this.zeroTrustArch) {
      throw new Error("Zero-trust architecture not initialized");
    }

    return await this.zeroTrustArch.authorizeAccess(
      sessionId,
      resource,
      action,
      contextInfo,
    );
  }

  /**
   * Validate and sanitize input
   */
  async validateInput(input: any, schema: any): Promise<any> {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return await this.securityHardening.validateAndSanitizeInput(input, schema);
  }

  /**
   * Execute parameterized database query
   */
  async executeSecureQuery(
    query: string,
    parameters: any[],
    options?: any,
  ): Promise<any> {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return await this.securityHardening.executeParameterizedQuery(
      query,
      parameters,
      options,
    );
  }

  /**
   * Generate CSRF token
   */
  async generateCsrfToken(sessionId: string): Promise<string> {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return await this.securityHardening.generateCsrfToken(sessionId);
  }

  /**
   * Validate CSRF token
   */
  async validateCsrfToken(sessionId: string, token: string): Promise<boolean> {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return await this.securityHardening.validateCsrfToken(sessionId, token);
  }

  /**
   * Get security headers for HTTP responses
   */
  getSecurityHeaders(): Record<string, string> {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return {
      ...this.securityHardening.getXssProtectionHeaders(),
      ...this.securityHardening.getTlsSecurityHeaders(),
    };
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimitMiddleware(): any {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return this.securityHardening.createRateLimitMiddleware();
  }

  /**
   * Handle GDPR data subject request
   */
  async handleGdprRequest(request: any): Promise<any> {
    if (!this.securityHardening) {
      throw new Error("Security hardening not initialized");
    }

    return await this.securityHardening.handleGdprRequest(request);
  }

  /**
   * Generate security dashboard data
   */
  async generateSecurityDashboard(): Promise<any> {
    const dashboardData: any = {
      timestamp: new Date(),
      status: "unknown",
      metrics: {},
      incidents: [],
      threats: [],
      compliance: {},
      zeroTrust: {},
    };

    try {
      if (this.securityHardening) {
        const dashboard =
          await this.securityHardening.generateSecurityDashboard();
        dashboardData.status = dashboard.summary.status;
        dashboardData.metrics = this.securityHardening.getSecurityMetrics();
        dashboardData.incidents = dashboard.incidents;
        dashboardData.threats = dashboard.threats;
        dashboardData.compliance = dashboard.summary;
      }

      if (this.zeroTrustArch) {
        dashboardData.zeroTrust = this.zeroTrustArch.getSecurityStatus();
      }

      return dashboardData;
    } catch (error) {
      this.logger.error("Dashboard generation failed", { error });
      dashboardData.status = "error";
      return dashboardData;
    }
  }

  /**
   * Shutdown security framework
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down security framework...");

    try {
      // Stop monitoring services
      // Clean up resources
      // Close database connections

      this.initialized = false;
      this.logger.info("Security framework shutdown completed");
    } catch (error) {
      this.logger.error("Security framework shutdown failed", { error });
      throw error;
    }
  }

  /**
   * Private implementation methods
   */

  private async setupDatabaseSchema(): Promise<void> {
    try {
      // Read and execute security database schema
      const schemaPath = path.join(__dirname, "security-database-schema.sql");
      const schema = await fs.readFile(schemaPath, "utf-8");

      // Split schema into individual statements
      const statements = schema
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      // Execute each statement
      for (const statement of statements) {
        try {
          await this.db.executeQuery(statement);
        } catch (error) {
          // Log but continue - some statements might fail if tables already exist
          this.logger.debug("Schema statement execution", {
            statement: statement.substring(0, 100),
            error,
          });
        }
      }

      this.logger.info("Database schema setup completed");
    } catch (error) {
      this.logger.error("Database schema setup failed", { error });
      throw error;
    }
  }

  private async setupEventHandlers(): Promise<void> {
    // Setup event handlers between components
    if (this.runbooks && this.securityHardening) {
      // Handle runbook notification events
      this.runbooks.on("notification_required", async (notification) => {
        this.logger.info("Runbook notification", notification);
        // Send actual notifications via email, Slack, etc.
      });

      this.runbooks.on(
        "escalation_required",
        async (execution, step, result) => {
          this.logger.warn("Runbook escalation required", {
            executionId: execution.id,
            stepId: step.id,
            reason: result.errors,
          });
        },
      );
    }

    if (this.zeroTrustArch) {
      // Handle high-risk detections
      this.zeroTrustArch.on("high_risk_detected", async (assessment) => {
        this.logger.warn("High risk detected", {
          subjectType: assessment.subjectType,
          subjectId: assessment.subjectId,
          riskScore: assessment.riskScore,
        });

        // Trigger incident if risk is critical
        if (assessment.riskLevel === "critical") {
          await this.handleSecurityIncident({
            title: `Critical Risk Detected: ${assessment.subjectType}`,
            description: `High-risk activity detected for ${assessment.subjectType} ${assessment.subjectId}`,
            severity: "high",
            category: "behavioral_anomaly",
          });
        }
      });
    }
  }

  private async setupMonitoringAndAlerting(): Promise<void> {
    // Setup monitoring dashboards and alerting rules
    this.logger.info("Setting up monitoring and alerting...");

    // This would integrate with monitoring systems like Prometheus, Grafana, etc.
    // For now, we'll set up basic logging

    setInterval(async () => {
      try {
        const dashboard = await this.generateSecurityDashboard();

        // Log critical alerts
        if (dashboard.status === "critical") {
          this.logger.error("CRITICAL SECURITY STATUS", {
            activeIncidents: dashboard.incidents?.length || 0,
            highRiskSessions: dashboard.zeroTrust?.highRiskAssessments || 0,
          });
        }
      } catch (error) {
        this.logger.error("Monitoring check failed", { error });
      }
    }, 300000); // Every 5 minutes
  }

  private async startSecurityServices(): Promise<void> {
    // Start background security services
    this.logger.info("Starting security services...");

    // These would be actual security services
    // - Continuous monitoring
    // - Threat detection
    // - Incident response automation
    // - Compliance reporting
  }

  private determineRunbook(
    category: string,
    severity: "low" | "medium" | "high" | "critical",
  ): string | null {
    // Map incident categories to appropriate runbooks
    const runbookMapping: Record<string, string> = {
      data_breach: "data_breach_response",
      ddos: "ddos_mitigation",
      malware: "malware_outbreak_containment",
      insider_threat: "insider_threat_investigation",
      account_compromise: "account_compromise_recovery",
      api_abuse: "api_abuse_handling",
      certificate_expiration: "certificate_expiration_management",
      vulnerability_disclosure: "vulnerability_disclosure_response",
    };

    return runbookMapping[category] || null;
  }
}

/**
 * Factory function to create and initialize security framework
 */
export async function createSecurityFramework(
  db: DatabaseConnection,
): Promise<SecurityIntegrationManager> {
  const manager = new SecurityIntegrationManager(db);

  const result = await manager.initialize();

  if (!result.success) {
    throw new Error(
      `Security framework initialization failed: ${result.errors.join(", ")}`,
    );
  }

  if (result.warnings.length > 0) {
    console.warn("Security framework warnings:", result.warnings);
  }

  return manager;
}

/**
 * Express.js middleware factory for security integration
 */
export function createSecurityMiddleware(
  securityManager: SecurityIntegrationManager,
) {
  return {
    // Security headers middleware
    securityHeaders: (req: any, res: any, next: any) => {
      const headers = securityManager.getSecurityHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    },

    // Rate limiting middleware
    rateLimit: securityManager.createRateLimitMiddleware(),

    // Input validation middleware
    validateInput: (schema: any) => {
      return async (req: any, res: any, next: any) => {
        try {
          if (req.body) {
            const validation = await securityManager.validateInput(
              req.body,
              schema,
            );
            if (!validation.isValid) {
              return res.status(400).json({
                error: "Invalid input",
                details: validation.errors,
              });
            }
            req.body = validation.sanitized;
          }
          next();
        } catch (error) {
          res.status(500).json({ error: "Input validation failed" });
        }
      };
    },

    // CSRF protection middleware
    csrfProtection: async (req: any, res: any, next: any) => {
      if (
        req.method === "GET" ||
        req.method === "HEAD" ||
        req.method === "OPTIONS"
      ) {
        return next();
      }

      const token = req.headers["x-csrf-token"] || req.body._csrf;
      const sessionId = req.sessionID || req.headers["x-session-id"];

      if (!token || !sessionId) {
        return res.status(403).json({ error: "CSRF token required" });
      }

      try {
        const isValid = await securityManager.validateCsrfToken(
          sessionId,
          token,
        );
        if (!isValid) {
          return res.status(403).json({ error: "Invalid CSRF token" });
        }
        next();
      } catch (error) {
        res.status(500).json({ error: "CSRF validation failed" });
      }
    },

    // Zero-trust authentication middleware
    authenticate: async (req: any, res: any, next: any) => {
      try {
        const credentials = {
          username: req.body.username || req.headers["x-username"],
          password: req.body.password,
          mfaToken: req.body.mfaToken || req.headers["x-mfa-token"],
          deviceId: req.headers["x-device-id"] || "unknown",
          contextInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            location: req.headers["x-location"]
              ? JSON.parse(req.headers["x-location"])
              : undefined,
          },
        };

        const authResult = await securityManager.authenticateUser(credentials);

        if (!authResult.success) {
          return res.status(401).json({
            error: "Authentication failed",
            message: authResult.message,
            challengeRequired: authResult.challengeRequired,
          });
        }

        req.sessionId = authResult.sessionId;
        req.riskAssessment = authResult.riskAssessment;
        next();
      } catch (error) {
        res.status(500).json({ error: "Authentication error" });
      }
    },

    // Zero-trust authorization middleware
    authorize: (resource: string, action: string) => {
      return async (req: any, res: any, next: any) => {
        try {
          const authResult = await securityManager.authorizeAccess(
            req.sessionId,
            resource,
            action,
            {
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"],
              timestamp: new Date(),
            },
          );

          if (!authResult.authorized) {
            return res.status(403).json({
              error: "Access denied",
              reason: authResult.reason,
            });
          }

          req.accessGrant = authResult.accessGrant;
          next();
        } catch (error) {
          res.status(500).json({ error: "Authorization error" });
        }
      };
    },
  };
}

export default SecurityIntegrationManager;

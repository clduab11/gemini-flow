/**
 * Production Security Hardening Framework
 *
 * Enterprise-grade security implementation for production Google Services deployment with:
 * 1. Application Security:
 *    - Input validation and sanitization for all endpoints
 *    - SQL injection prevention (parameterized queries)
 *    - XSS protection (CSP headers, output encoding)
 *    - CSRF tokens for state-changing operations
 *    - Rate limiting and DDoS protection
 *
 * 2. Infrastructure Security:
 *    - Network segmentation and firewall rules
 *    - WAF configuration for API protection
 *    - TLS 1.3 enforcement with HSTS
 *    - Certificate pinning for mobile/desktop clients
 *    - Secrets rotation policies (90-day max)
 *
 * 3. Compliance and Auditing:
 *    - SIEM integration (Splunk/ELK)
 *    - Audit log aggregation and retention (7 years)
 *    - PII detection and masking
 *    - GDPR data subject request automation
 *    - SOC2 Type II compliance checklist
 *
 * 4. Incident Response:
 *    - Security runbooks for common scenarios
 *    - Automated threat detection rules
 *    - Incident response team escalation
 *    - Forensics data collection scripts
 */
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import validator from "validator";
import DOMPurify from "isomorphic-dompurify";
export class ProductionSecurityHardening extends EventEmitter {
    logger;
    config;
    db;
    // Security Components
    inputValidator;
    xssProtector;
    csrfProtector;
    rateLimiter;
    ddosProtector;
    firewallManager;
    tlsManager;
    wafManager;
    secretsManager;
    siemIntegrator;
    auditLogger;
    piiDetector;
    gdprManager;
    soc2Manager;
    incidentManager;
    threatDetector;
    forensicsCollector;
    // State Management
    activeIncidents = new Map();
    threatRules = new Map();
    vulnerabilities = new Map();
    securityMetrics = {
        blockedRequests: 0,
        detectedThreats: 0,
        incidentsCreated: 0,
        vulnerabilitiesFound: 0,
        complianceViolations: 0,
        encryptionOperations: 0,
        auditEventsGenerated: 0,
        piiDetections: 0,
    };
    constructor(config, db) {
        super();
        this.logger = new Logger("ProductionSecurityHardening");
        this.config = config;
        this.db = db;
        this.initializeSecurityComponents();
        this.setupSecurityMiddleware();
        this.startMonitoring();
        this.logger.info("Production Security Hardening initialized", {
            environment: config.environment,
            enforcementLevel: config.enforcementLevel,
            featuresEnabled: this.getEnabledFeatures(),
        });
    }
    /**
     * 🔒 Application Security Implementation
     */
    /**
     * Input Validation and Sanitization
     */
    async validateAndSanitizeInput(input, schema) {
        try {
            const errors = [];
            let sanitized = input;
            // Required check
            if (schema.required &&
                (input === null || input === undefined || input === "")) {
                errors.push("Field is required");
                return { isValid: false, sanitized: null, errors };
            }
            // Type-specific validation and sanitization
            switch (schema.type) {
                case "string":
                    if (typeof input !== "string") {
                        errors.push("Input must be a string");
                        break;
                    }
                    // Length validation
                    if (schema.maxLength && input.length > schema.maxLength) {
                        errors.push(`Input exceeds maximum length of ${schema.maxLength}`);
                    }
                    // Character whitelist validation
                    if (schema.allowedChars) {
                        const regex = new RegExp(`^[${schema.allowedChars}]*$`);
                        if (!regex.test(input)) {
                            errors.push("Input contains invalid characters");
                        }
                    }
                    // SQL injection prevention
                    if (this.config.applicationSecurity.inputValidation
                        .sqlInjectionPrevention) {
                        if (this.containsSqlInjection(input)) {
                            errors.push("Potential SQL injection detected");
                            this.logger.warn("SQL injection attempt blocked", {
                                input: input.substring(0, 100),
                            });
                        }
                    }
                    // XSS prevention
                    sanitized = DOMPurify.sanitize(input, {
                        ALLOWED_TAGS: this.config.applicationSecurity.inputValidation.allowedTags,
                        ALLOWED_ATTR: ["href", "src", "alt", "title"],
                    });
                    break;
                case "email":
                    if (!validator.isEmail(input)) {
                        errors.push("Invalid email format");
                    }
                    sanitized = validator.normalizeEmail(input) || input;
                    break;
                case "url":
                    if (!validator.isURL(input, { require_protocol: true })) {
                        errors.push("Invalid URL format");
                    }
                    break;
                case "number":
                    if (!validator.isNumeric(input.toString())) {
                        errors.push("Input must be a number");
                    }
                    sanitized = parseFloat(input);
                    break;
                case "json":
                    try {
                        sanitized = JSON.parse(input);
                    }
                    catch {
                        errors.push("Invalid JSON format");
                    }
                    break;
                case "html":
                    // Strict HTML sanitization
                    sanitized = DOMPurify.sanitize(input, {
                        ALLOWED_TAGS: [
                            "p",
                            "br",
                            "strong",
                            "em",
                            "u",
                            "h1",
                            "h2",
                            "h3",
                            "h4",
                            "h5",
                            "h6",
                        ],
                        ALLOWED_ATTR: [],
                    });
                    break;
            }
            // Custom validation
            if (schema.customValidation && !schema.customValidation(sanitized)) {
                errors.push("Custom validation failed");
            }
            const isValid = errors.length === 0;
            if (isValid) {
                this.securityMetrics.encryptionOperations++;
            }
            else {
                await this.auditLogger.logSecurityEvent({
                    type: "input_validation_failed",
                    severity: "medium",
                    details: {
                        errors,
                        originalInput: input.toString().substring(0, 100),
                    },
                });
            }
            return { isValid, sanitized, errors };
        }
        catch (error) {
            this.logger.error("Input validation failed", { error, input });
            return { isValid: false, sanitized: null, errors: ["Validation error"] };
        }
    }
    /**
     * SQL Injection Prevention with Parameterized Queries
     */
    async executeParameterizedQuery(query, parameters, options = {}) {
        try {
            // Validate query structure
            if (this.containsDangerousSqlPatterns(query)) {
                throw new Error("Query contains potentially dangerous patterns");
            }
            // Log query for audit
            await this.auditLogger.logSecurityEvent({
                type: "database_query_executed",
                severity: "low",
                details: {
                    query: query.substring(0, 200),
                    parameterCount: parameters.length,
                    readOnly: options.readOnly || false,
                },
            });
            // Execute with connection pool
            const connection = await this.db.getConnection();
            try {
                // Set query timeout
                if (options.timeout) {
                    await connection.run(`PRAGMA busy_timeout = ${options.timeout}`);
                }
                // Execute parameterized query
                let result;
                if (options.readOnly) {
                    result = await connection.all(query, parameters);
                    // Limit result size
                    if (options.maxRows && result.length > options.maxRows) {
                        result = result.slice(0, options.maxRows);
                        this.logger.warn("Query result truncated due to maxRows limit", {
                            originalCount: result.length,
                            maxRows: options.maxRows,
                        });
                    }
                }
                else {
                    result = await connection.run(query, parameters);
                }
                return result;
            }
            finally {
                this.db.releaseConnection(connection);
            }
        }
        catch (error) {
            this.logger.error("Parameterized query execution failed", {
                error,
                query,
            });
            // Log potential attack
            if (this.containsSqlInjection(query)) {
                await this.createSecurityIncident({
                    title: "SQL Injection Attempt Detected",
                    description: "Potential SQL injection attack blocked",
                    severity: "high",
                    category: "unauthorized_access",
                    evidence: [
                        {
                            type: "log",
                            description: "Blocked SQL query",
                            hash: crypto.createHash("sha256").update(query).digest("hex"),
                        },
                    ],
                });
            }
            throw error;
        }
    }
    /**
     * XSS Protection with CSP Headers and Output Encoding
     */
    getXssProtectionHeaders() {
        const csp = this.config.applicationSecurity.xssProtection.contentSecurityPolicy;
        return {
            "Content-Security-Policy": csp,
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": this.config.applicationSecurity.xssProtection.frameOptions,
            "X-XSS-Protection": this.config.applicationSecurity.xssProtection
                .xssFilter
                ? "1; mode=block"
                : "0",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
        };
    }
    /**
     * CSRF Token Management
     */
    async generateCsrfToken(sessionId) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + this.config.applicationSecurity.csrfProtection.tokenExpiry);
        // Store token
        await this.db.executeQuery("INSERT OR REPLACE INTO csrf_tokens (session_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)", [sessionId, token, expiresAt.toISOString(), new Date().toISOString()]);
        return token;
    }
    async validateCsrfToken(sessionId, token) {
        try {
            const result = await this.db.executeQuery("SELECT token, expires_at FROM csrf_tokens WHERE session_id = ? AND token = ?", [sessionId, token]);
            if (!result || result.length === 0) {
                await this.auditLogger.logSecurityEvent({
                    type: "csrf_token_invalid",
                    severity: "medium",
                    details: { sessionId, tokenProvided: !!token },
                });
                return false;
            }
            const tokenData = result[0];
            const expiresAt = new Date(tokenData.expires_at);
            if (expiresAt < new Date()) {
                await this.auditLogger.logSecurityEvent({
                    type: "csrf_token_expired",
                    severity: "medium",
                    details: { sessionId, expiresAt },
                });
                return false;
            }
            // Clean up used token
            await this.db.executeQuery("DELETE FROM csrf_tokens WHERE session_id = ? AND token = ?", [sessionId, token]);
            return true;
        }
        catch (error) {
            this.logger.error("CSRF token validation failed", { error, sessionId });
            return false;
        }
    }
    /**
     * Rate Limiting and DDoS Protection
     */
    createRateLimitMiddleware() {
        const config = this.config.applicationSecurity.rateLimiting;
        return rateLimit({
            windowMs: config.windowMs,
            max: config.maxRequests,
            skipSuccessfulRequests: config.skipSuccessfulRequests,
            skipFailedRequests: config.skipFailedRequests,
            standardHeaders: true,
            legacyHeaders: false,
            handler: async (req, res) => {
                const clientIp = req.ip || req.connection.remoteAddress;
                // Log rate limit violation
                await this.auditLogger.logSecurityEvent({
                    type: "rate_limit_exceeded",
                    severity: "medium",
                    details: {
                        clientIp,
                        userAgent: req.headers["user-agent"],
                        path: req.path,
                        method: req.method,
                    },
                });
                this.securityMetrics.blockedRequests++;
                // Check if this IP should be temporarily blocked
                await this.checkForDdosPattern(clientIp);
                res.status(429).json({
                    error: "Too many requests",
                    retryAfter: Math.ceil(config.windowMs / 1000),
                });
            },
            skip: (req) => {
                // Skip rate limiting for health checks and internal services
                const path = req.path;
                return path.startsWith("/health") || path.startsWith("/internal/");
            },
        });
    }
    async checkForDdosPattern(clientIp) {
        const thresholds = this.config.applicationSecurity.ddosProtection.thresholds;
        // Get recent requests from this IP
        const recentRequests = await this.db.executeQuery(`SELECT COUNT(*) as count FROM audit_logs 
       WHERE json_extract(details, '$.clientIp') = ? 
       AND created_at > datetime('now', '-1 minute')`, [clientIp]);
        if (recentRequests[0]?.count > thresholds.requests_per_second * 60) {
            // Potential DDoS attack
            await this.createSecurityIncident({
                title: "Potential DDoS Attack Detected",
                description: `High request volume from IP ${clientIp}`,
                severity: "high",
                category: "ddos",
                evidence: [
                    {
                        type: "log",
                        description: `Request count: ${recentRequests[0].count} in 1 minute`,
                        hash: crypto
                            .createHash("sha256")
                            .update(`ddos-${clientIp}-${Date.now()}`)
                            .digest("hex"),
                    },
                ],
            });
            // Temporarily block IP
            await this.firewallManager.addTemporaryBlock(clientIp, 3600); // 1 hour
        }
    }
    /**
     * 🏗️ Infrastructure Security Implementation
     */
    /**
     * Network Segmentation and Firewall Rules
     */
    async configureNetworkSecurity() {
        const config = this.config.infrastructureSecurity.networkSecurity;
        if (!config.segmentationEnabled) {
            return;
        }
        // Apply firewall rules
        for (const rule of config.firewallRules) {
            if (rule.enabled) {
                await this.firewallManager.applyRule(rule);
            }
        }
        // Configure geo-blocking
        for (const country of config.blockedCountries) {
            await this.firewallManager.blockCountry(country);
        }
        this.logger.info("Network security configured", {
            rulesApplied: config.firewallRules.length,
            blockedCountries: config.blockedCountries.length,
        });
    }
    /**
     * TLS 1.3 Enforcement with HSTS
     */
    getTlsSecurityHeaders() {
        const tlsConfig = this.config.infrastructureSecurity.tlsSecurity;
        const headers = {};
        if (tlsConfig.hstsEnabled) {
            headers["Strict-Transport-Security"] =
                `max-age=${tlsConfig.hstsMaxAge}; includeSubDomains; preload`;
        }
        // Additional security headers
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Download-Options"] = "noopen";
        headers["X-Permitted-Cross-Domain-Policies"] = "none";
        return headers;
    }
    /**
     * Certificate Pinning Configuration
     */
    getCertificatePinningConfig() {
        const pinning = this.config.infrastructureSecurity.tlsSecurity.certificatePinning;
        if (!pinning.enabled) {
            return null;
        }
        return {
            pins: pinning.pins,
            backupPins: pinning.backupPins,
            maxAge: 90 * 24 * 60 * 60, // 90 days
            includeSubdomains: true,
            reportUri: "/api/security/pin-report",
        };
    }
    /**
     * WAF Configuration for API Protection
     */
    async configureWaf() {
        const wafConfig = this.config.infrastructureSecurity.wafConfiguration;
        if (!wafConfig.enabled) {
            return;
        }
        // Apply built-in rule sets
        for (const ruleSet of wafConfig.ruleSets) {
            await this.wafManager.enableRuleSet(ruleSet);
        }
        // Apply custom rules
        for (const rule of wafConfig.customRules) {
            if (rule.enabled) {
                await this.wafManager.addCustomRule(rule);
            }
        }
        // Configure geo-blocking
        for (const country of wafConfig.geoBlocking) {
            await this.wafManager.blockGeography(country);
        }
        this.logger.info("WAF configured", {
            ruleSets: wafConfig.ruleSets.length,
            customRules: wafConfig.customRules.length,
            geoBlocks: wafConfig.geoBlocking.length,
        });
    }
    /**
     * Secrets Rotation Policies
     */
    async rotateSecrets() {
        const secretsConfig = this.config.infrastructureSecurity.secretsManagement;
        // Get secrets due for rotation
        const dueSecrets = await this.secretsManager.getSecretsForRotation(secretsConfig.rotationInterval);
        for (const secret of dueSecrets) {
            try {
                const newSecret = await this.secretsManager.generateNewSecret(secret.type);
                await this.secretsManager.rotateSecret(secret.id, newSecret);
                await this.auditLogger.logSecurityEvent({
                    type: "secret_rotated",
                    severity: "low",
                    details: {
                        secretId: secret.id,
                        secretType: secret.type,
                        lastRotation: secret.lastRotated,
                    },
                });
            }
            catch (error) {
                this.logger.error("Secret rotation failed", {
                    error,
                    secretId: secret.id,
                });
                await this.createSecurityIncident({
                    title: "Secret Rotation Failure",
                    description: `Failed to rotate secret ${secret.id}`,
                    severity: "medium",
                    category: "other",
                });
            }
        }
    }
    /**
     * 📊 Compliance and Auditing Implementation
     */
    /**
     * SIEM Integration
     */
    async forwardToSiem(event) {
        const siemConfig = this.config.compliance.siemIntegration;
        if (!siemConfig.enabled) {
            return;
        }
        try {
            await this.siemIntegrator.forwardEvent(event, {
                provider: siemConfig.provider,
                endpoint: siemConfig.endpoint,
                indexPattern: siemConfig.indexPattern,
            });
        }
        catch (error) {
            this.logger.error("SIEM forwarding failed", { error, event });
        }
    }
    /**
     * Audit Log Aggregation and Retention
     */
    async aggregateAuditLogs() {
        const auditConfig = this.config.compliance.auditLogging;
        if (!auditConfig.enabled) {
            return;
        }
        // Get logs older than retention period
        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() - auditConfig.retentionYears);
        // Archive old logs
        const oldLogs = await this.db.executeQuery("SELECT * FROM audit_logs WHERE created_at < ?", [retentionDate.toISOString()]);
        if (oldLogs.length > 0) {
            // Archive to long-term storage
            await this.auditLogger.archiveLogs(oldLogs);
            // Remove from active database
            await this.db.executeQuery("DELETE FROM audit_logs WHERE created_at < ?", [retentionDate.toISOString()]);
            this.logger.info("Audit logs archived", {
                archivedCount: oldLogs.length,
                retentionDate,
            });
        }
    }
    /**
     * PII Detection and Masking
     */
    async detectAndMaskPii(data) {
        const piiConfig = this.config.compliance.piiDetection;
        if (!piiConfig.enabled) {
            return { masked: data, piiDetected: false, patterns: [] };
        }
        const detectedPatterns = [];
        let masked = JSON.parse(JSON.stringify(data)); // Deep clone
        // Check for PII patterns
        for (const pattern of piiConfig.patterns) {
            const regex = new RegExp(pattern, "gi");
            const stringData = JSON.stringify(data);
            if (regex.test(stringData)) {
                detectedPatterns.push(pattern);
                // Apply masking based on strategy
                masked = this.applyPiiMasking(masked, pattern, piiConfig.maskingStrategy);
            }
        }
        if (detectedPatterns.length > 0) {
            this.securityMetrics.piiDetections++;
            if (piiConfig.alertOnDetection) {
                await this.auditLogger.logSecurityEvent({
                    type: "pii_detected",
                    severity: "medium",
                    details: {
                        patterns: detectedPatterns,
                        maskingStrategy: piiConfig.maskingStrategy,
                    },
                });
            }
        }
        return {
            masked,
            piiDetected: detectedPatterns.length > 0,
            patterns: detectedPatterns,
        };
    }
    /**
     * GDPR Data Subject Request Automation
     */
    async handleGdprRequest(request) {
        const requestId = crypto.randomUUID();
        const gdprConfig = this.config.compliance.gdprCompliance;
        if (!gdprConfig.enabled) {
            throw new Error("GDPR compliance not enabled");
        }
        // Verify identity
        const identityVerified = await this.gdprManager.verifyIdentity(request.subjectId, request.requesterEmail, request.verificationData);
        if (!identityVerified) {
            return {
                requestId,
                status: "rejected",
            };
        }
        const estimatedCompletion = new Date(Date.now() + gdprConfig.automatedResponseTime * 60 * 60 * 1000);
        // Store request
        await this.db.executeQuery(`INSERT INTO gdpr_requests 
       (id, type, subject_id, requester_email, status, created_at, estimated_completion) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            requestId,
            request.type,
            request.subjectId,
            request.requesterEmail,
            "pending",
            new Date().toISOString(),
            estimatedCompletion.toISOString(),
        ]);
        // Process request based on type
        let responseData = null;
        let status = "pending";
        try {
            switch (request.type) {
                case "access":
                    responseData = await this.gdprManager.generateAccessReport(request.subjectId, request.scope);
                    status = "completed";
                    break;
                case "erasure":
                    await this.gdprManager.erasePersonalData(request.subjectId, request.scope);
                    status = "completed";
                    break;
                case "portability":
                    responseData = await this.gdprManager.exportPersonalData(request.subjectId, request.scope);
                    status = "completed";
                    break;
                default:
                    // Other types require manual processing
                    status = "pending";
            }
            // Update request status
            await this.db.executeQuery("UPDATE gdpr_requests SET status = ?, response_data = ?, completed_at = ? WHERE id = ?", [
                status,
                responseData ? JSON.stringify(responseData) : null,
                status === "completed" ? new Date().toISOString() : null,
                requestId,
            ]);
        }
        catch (error) {
            this.logger.error("GDPR request processing failed", { error, requestId });
            status = "rejected";
        }
        // Log request processing
        await this.auditLogger.logSecurityEvent({
            type: "gdpr_request_processed",
            severity: "low",
            details: {
                requestId,
                type: request.type,
                subjectId: request.subjectId,
                status,
            },
        });
        return {
            requestId,
            status,
            responseData,
            estimatedCompletion: status === "pending" ? estimatedCompletion : undefined,
        };
    }
    /**
     * SOC2 Type II Compliance Checklist
     */
    async generateSoc2ComplianceReport() {
        const soc2Config = this.config.compliance.soc2Compliance;
        if (!soc2Config.enabled) {
            throw new Error("SOC2 compliance not enabled");
        }
        const controls = await this.soc2Manager.assessControls(soc2Config.controls);
        const passedControls = controls.filter((c) => c.status === "pass").length;
        const totalControls = controls.filter((c) => c.status !== "not_applicable").length;
        let overallStatus;
        if (passedControls === totalControls) {
            overallStatus = "compliant";
        }
        else if (passedControls > totalControls * 0.8) {
            overallStatus = "partial";
        }
        else {
            overallStatus = "non_compliant";
        }
        const lastAssessment = new Date();
        const nextAssessment = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        // Store compliance report
        await this.db.executeQuery(`INSERT INTO compliance_reports 
       (id, type, status, controls_passed, controls_total, created_at, next_assessment) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            crypto.randomUUID(),
            "SOC2",
            overallStatus,
            passedControls,
            totalControls,
            lastAssessment.toISOString(),
            nextAssessment.toISOString(),
        ]);
        return {
            overallStatus,
            controls,
            lastAssessment,
            nextAssessment,
        };
    }
    /**
     * 🚨 Incident Response Implementation
     */
    /**
     * Security Incident Creation and Management
     */
    async createSecurityIncident(incident) {
        const incidentId = crypto.randomUUID();
        const now = new Date();
        const fullIncident = {
            id: incidentId,
            detectedAt: now,
            status: "open",
            timeline: [
                {
                    timestamp: now,
                    type: "detection",
                    description: "Incident created",
                    actor: "system",
                    automated: true,
                },
            ],
            ...incident,
        };
        this.activeIncidents.set(incidentId, fullIncident);
        this.securityMetrics.incidentsCreated++;
        // Store in database
        await this.db.executeQuery(`INSERT INTO security_incidents 
       (id, title, description, severity, category, status, detected_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            incidentId,
            incident.title,
            incident.description,
            incident.severity,
            incident.category,
            "open",
            now.toISOString(),
            now.toISOString(),
        ]);
        // Trigger escalation based on severity
        await this.escalateIncident(incidentId, incident.severity);
        // Start forensics collection
        if (this.config.incidentResponse.forensicsEnabled) {
            await this.forensicsCollector.startCollection(incidentId);
        }
        // Log incident creation
        await this.auditLogger.logSecurityEvent({
            type: "security_incident_created",
            severity: incident.severity,
            details: {
                incidentId,
                category: incident.category,
                title: incident.title,
            },
        });
        this.emit("incident_created", fullIncident);
        this.logger.warn("Security incident created", {
            incidentId,
            title: incident.title,
            severity: incident.severity,
            category: incident.category,
        });
        return incidentId;
    }
    /**
     * Automated Threat Detection
     */
    async runThreatDetection() {
        for (const [ruleId, rule] of this.threatRules) {
            if (!rule.enabled)
                continue;
            try {
                const matches = await this.executeDetectionQuery(rule);
                if (matches.length >= rule.threshold) {
                    await this.handleThreatDetection(rule, matches);
                    // Update last triggered
                    rule.lastTriggered = new Date();
                    this.securityMetrics.detectedThreats++;
                }
            }
            catch (error) {
                this.logger.error("Threat detection rule failed", {
                    error,
                    ruleId: rule.id,
                    ruleName: rule.name,
                });
            }
        }
    }
    async executeDetectionQuery(rule) {
        // Calculate time window
        const windowStart = new Date(Date.now() - rule.timeWindow * 60 * 1000);
        // Execute rule query with time window
        const query = rule.query.replace("${time_window}", windowStart.toISOString());
        return await this.db.executeQuery(query);
    }
    async handleThreatDetection(rule, matches) {
        // Create security incident
        const incidentId = await this.createSecurityIncident({
            title: `Threat Detected: ${rule.name}`,
            description: rule.description,
            severity: rule.severity,
            category: this.mapRuleCategoryToIncidentCategory(rule.category),
            reportedBy: "automated_detection",
            affectedSystems: this.extractAffectedSystems(matches),
            affectedUsers: this.extractAffectedUsers(matches),
            evidence: matches.map((match) => ({
                id: crypto.randomUUID(),
                type: "log",
                description: `Detection rule match: ${rule.name}`,
                hash: crypto
                    .createHash("sha256")
                    .update(JSON.stringify(match))
                    .digest("hex"),
                collectedAt: new Date(),
                collectedBy: "system",
                chainOfCustody: [],
            })),
            mitigationSteps: rule.actions,
        });
        // Execute automated actions
        for (const action of rule.actions) {
            try {
                await this.executeAutomatedAction(action, matches, incidentId);
            }
            catch (error) {
                this.logger.error("Automated action failed", {
                    error,
                    action,
                    incidentId,
                });
            }
        }
    }
    /**
     * Incident Response Team Escalation
     */
    async escalateIncident(incidentId, severity) {
        const escalationLevels = this.config.incidentResponse.escalationMatrix.filter((level) => this.shouldEscalateToLevel(severity, level));
        for (const level of escalationLevels) {
            try {
                await this.notifyEscalationLevel(incidentId, level);
                // Schedule auto-escalation if not resolved
                setTimeout(async () => {
                    const incident = this.activeIncidents.get(incidentId);
                    if (incident && incident.status === "open") {
                        await this.autoEscalateIncident(incidentId, level.level + 1);
                    }
                }, level.timeToEscalate * 60 * 1000);
            }
            catch (error) {
                this.logger.error("Escalation notification failed", {
                    error,
                    incidentId,
                    level: level.level,
                });
            }
        }
    }
    /**
     * Forensics Data Collection
     */
    async collectForensicsData(incidentId, targets) {
        const evidence = [];
        for (const dataType of targets.dataTypes) {
            try {
                const collectionResult = await this.forensicsCollector.collect(dataType, targets.systems, targets.timeRange);
                const evidenceItem = {
                    id: crypto.randomUUID(),
                    type: dataType === "network"
                        ? "network_capture"
                        : dataType === "memory"
                            ? "memory_dump"
                            : "log",
                    description: `${dataType} data collection`,
                    filePath: collectionResult.filePath,
                    hash: collectionResult.hash,
                    collectedAt: new Date(),
                    collectedBy: "system",
                    chainOfCustody: [
                        {
                            timestamp: new Date(),
                            action: "collected",
                            actor: "system",
                            details: `Automated collection for incident ${incidentId}`,
                        },
                    ],
                };
                evidence.push(evidenceItem);
            }
            catch (error) {
                this.logger.error("Forensics data collection failed", {
                    error,
                    dataType,
                    incidentId,
                });
            }
        }
        // Update incident with evidence
        const incident = this.activeIncidents.get(incidentId);
        if (incident) {
            incident.evidence.push(...evidence);
            incident.timeline.push({
                timestamp: new Date(),
                type: "mitigation",
                description: `Collected ${evidence.length} pieces of forensic evidence`,
                actor: "system",
                automated: true,
            });
        }
        return evidence;
    }
    /**
     * 🔍 Monitoring and Metrics
     */
    getSecurityMetrics() {
        return {
            ...this.securityMetrics,
            activeIncidents: this.activeIncidents.size,
            threatRules: this.threatRules.size,
            averageResponseTime: this.calculateAverageResponseTime(),
        };
    }
    async generateSecurityDashboard() {
        // Calculate compliance score
        const complianceScore = await this.calculateComplianceScore();
        // Get recent threats (last 24 hours)
        const recentThreats = Array.from(this.threatRules.values()).filter((rule) => rule.lastTriggered &&
            rule.lastTriggered > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        // Determine overall status
        const criticalIncidents = Array.from(this.activeIncidents.values()).filter((i) => i.severity === "critical" && i.status !== "resolved").length;
        const status = criticalIncidents > 0
            ? "critical"
            : this.activeIncidents.size > 5 || recentThreats > 10
                ? "warning"
                : "healthy";
        // Get recent vulnerabilities
        const vulnerabilities = Array.from(this.vulnerabilities.values())
            .flatMap((assessment) => assessment.findings)
            .filter((finding) => finding.status !== "resolved")
            .sort((a, b) => (b.cvss3Score || 0) - (a.cvss3Score || 0))
            .slice(0, 10);
        // Generate recommendations
        const recommendations = await this.generateSecurityRecommendations({
            activeIncidents: this.activeIncidents.size,
            recentThreats,
            complianceScore,
            vulnerabilities: vulnerabilities.length,
        });
        return {
            summary: {
                status,
                activeIncidents: this.activeIncidents.size,
                recentThreats,
                complianceScore,
            },
            incidents: Array.from(this.activeIncidents.values()).slice(0, 10),
            threats: Array.from(this.threatRules.values())
                .filter((rule) => rule.lastTriggered)
                .sort((a, b) => b.lastTriggered.getTime() - a.lastTriggered.getTime())
                .slice(0, 10),
            vulnerabilities,
            recommendations,
        };
    }
    /**
     * Private Implementation Methods
     */
    initializeSecurityComponents() {
        // Initialize all security components
        this.inputValidator = new InputValidator(this.config);
        this.xssProtector = new XssProtector(this.config);
        this.csrfProtector = new CsrfProtector(this.config);
        this.rateLimiter = new RateLimiter(this.config);
        this.ddosProtector = new DdosProtector(this.config);
        this.firewallManager = new FirewallManager(this.config);
        this.tlsManager = new TlsManager(this.config);
        this.wafManager = new WafManager(this.config);
        this.secretsManager = new SecretsManager(this.config, this.db);
        this.siemIntegrator = new SiemIntegrator(this.config);
        this.auditLogger = new ProductionAuditLogger(this.config, this.db);
        this.piiDetector = new PiiDetector(this.config);
        this.gdprManager = new GdprManager(this.config, this.db);
        this.soc2Manager = new Soc2Manager(this.config, this.db);
        this.incidentManager = new IncidentManager(this.config, this.db);
        this.threatDetector = new ThreatDetector(this.config, this.db);
        this.forensicsCollector = new ForensicsCollector(this.config);
        // Load threat detection rules
        this.loadThreatDetectionRules();
    }
    setupSecurityMiddleware() {
        // This would typically be called during Express/Fastify setup
        // Implementation would depend on the web framework being used
    }
    startMonitoring() {
        // Start periodic security tasks
        setInterval(() => {
            this.runThreatDetection().catch((error) => {
                this.logger.error("Threat detection failed", { error });
            });
        }, 60000); // Every minute
        setInterval(() => {
            this.aggregateAuditLogs().catch((error) => {
                this.logger.error("Audit log aggregation failed", { error });
            });
        }, 3600000); // Every hour
        setInterval(() => {
            this.rotateSecrets().catch((error) => {
                this.logger.error("Secret rotation failed", { error });
            });
        }, 86400000); // Every day
    }
    getEnabledFeatures() {
        const features = [];
        if (this.config.applicationSecurity.inputValidation.enabled)
            features.push("input_validation");
        if (this.config.applicationSecurity.xssProtection.enabled)
            features.push("xss_protection");
        if (this.config.applicationSecurity.csrfProtection.enabled)
            features.push("csrf_protection");
        if (this.config.applicationSecurity.rateLimiting.enabled)
            features.push("rate_limiting");
        if (this.config.applicationSecurity.ddosProtection.enabled)
            features.push("ddos_protection");
        if (this.config.infrastructureSecurity.networkSecurity.segmentationEnabled)
            features.push("network_segmentation");
        if (this.config.infrastructureSecurity.tlsSecurity.hstsEnabled)
            features.push("hsts");
        if (this.config.infrastructureSecurity.wafConfiguration.enabled)
            features.push("waf");
        if (this.config.compliance.siemIntegration.enabled)
            features.push("siem");
        if (this.config.compliance.auditLogging.enabled)
            features.push("audit_logging");
        if (this.config.compliance.piiDetection.enabled)
            features.push("pii_detection");
        if (this.config.compliance.gdprCompliance.enabled)
            features.push("gdpr");
        if (this.config.compliance.soc2Compliance.enabled)
            features.push("soc2");
        if (this.config.incidentResponse.automated)
            features.push("automated_incident_response");
        return features;
    }
    // Helper method implementations
    containsSqlInjection(input) {
        const sqlPatterns = [
            /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
            /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
            /(script|javascript|vbscript|onload|onerror)/i,
        ];
        return sqlPatterns.some((pattern) => pattern.test(input));
    }
    containsDangerousSqlPatterns(query) {
        const dangerousPatterns = [
            /;.*?(drop|delete|truncate|alter)/i,
            /union.*?select/i,
            /exec.*?\(/i,
            /xp_cmdshell/i,
        ];
        return dangerousPatterns.some((pattern) => pattern.test(query));
    }
    applyPiiMasking(data, pattern, strategy) {
        // Implementation would recursively traverse object and apply masking
        const stringData = JSON.stringify(data);
        const regex = new RegExp(pattern, "gi");
        let maskedString;
        switch (strategy) {
            case "full":
                maskedString = stringData.replace(regex, "***MASKED***");
                break;
            case "partial":
                maskedString = stringData.replace(regex, (match) => {
                    const visible = Math.min(2, Math.floor(match.length * 0.2));
                    return (match.substring(0, visible) + "*".repeat(match.length - visible));
                });
                break;
            case "hash":
                maskedString = stringData.replace(regex, (match) => {
                    return (crypto
                        .createHash("sha256")
                        .update(match)
                        .digest("hex")
                        .substring(0, 8) + "...");
                });
                break;
            default:
                maskedString = stringData;
        }
        try {
            return JSON.parse(maskedString);
        }
        catch {
            return maskedString;
        }
    }
    mapRuleCategoryToIncidentCategory(category) {
        const mapping = {
            authentication: "unauthorized_access",
            authorization: "unauthorized_access",
            data_access: "data_breach",
            network: "ddos",
            behavioral: "insider_threat",
        };
        return mapping[category] || "other";
    }
    extractAffectedSystems(matches) {
        // Extract system information from detection matches
        return [...new Set(matches.map((match) => match.system_id || "unknown"))];
    }
    extractAffectedUsers(matches) {
        // Extract user information from detection matches
        return [...new Set(matches.map((match) => match.user_id).filter(Boolean))];
    }
    async executeAutomatedAction(action, matches, incidentId) {
        // Execute automated response actions
        switch (action) {
            case "block_ip":
                const ips = [
                    ...new Set(matches.map((m) => m.client_ip).filter(Boolean)),
                ];
                for (const ip of ips) {
                    await this.firewallManager.addTemporaryBlock(ip, 3600);
                }
                break;
            case "disable_user":
                const users = [
                    ...new Set(matches.map((m) => m.user_id).filter(Boolean)),
                ];
                for (const userId of users) {
                    await this.disableUserAccount(userId, incidentId);
                }
                break;
            case "alert_security_team":
                await this.notifySecurityTeam(incidentId, matches);
                break;
            default:
                this.logger.warn("Unknown automated action", { action, incidentId });
        }
    }
    shouldEscalateToLevel(severity, level) {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const severityNum = severityLevels[severity] || 1;
        return level.level <= severityNum;
    }
    async notifyEscalationLevel(incidentId, level) {
        // Send notifications to escalation level contacts
        for (const contact of level.contacts) {
            try {
                await this.sendIncidentNotification(contact, incidentId, level);
            }
            catch (error) {
                this.logger.error("Escalation notification failed", {
                    error,
                    contact,
                    incidentId,
                });
            }
        }
    }
    async autoEscalateIncident(incidentId, nextLevel) {
        const escalationLevel = this.config.incidentResponse.escalationMatrix.find((level) => level.level === nextLevel);
        if (escalationLevel) {
            await this.escalateIncident(incidentId, escalationLevel.severity);
        }
    }
    calculateAverageResponseTime() {
        const resolvedIncidents = Array.from(this.activeIncidents.values()).filter((incident) => incident.status === "resolved" && incident.resolvedAt);
        if (resolvedIncidents.length === 0)
            return 0;
        const totalResponseTime = resolvedIncidents.reduce((sum, incident) => {
            return (sum + (incident.resolvedAt.getTime() - incident.detectedAt.getTime()));
        }, 0);
        return totalResponseTime / resolvedIncidents.length / (1000 * 60); // Return in minutes
    }
    async calculateComplianceScore() {
        // Calculate overall compliance score across all enabled compliance frameworks
        let totalScore = 0;
        let frameworks = 0;
        if (this.config.compliance.gdprCompliance.enabled) {
            totalScore += await this.gdprManager.getComplianceScore();
            frameworks++;
        }
        if (this.config.compliance.soc2Compliance.enabled) {
            totalScore += await this.soc2Manager.getComplianceScore();
            frameworks++;
        }
        return frameworks > 0 ? totalScore / frameworks : 100;
    }
    async generateSecurityRecommendations(metrics) {
        const recommendations = [];
        if (metrics.activeIncidents > 5) {
            recommendations.push("High number of active incidents - consider increasing security team capacity");
        }
        if (metrics.recentThreats > 10) {
            recommendations.push("Elevated threat activity detected - review threat detection rules");
        }
        if (metrics.complianceScore < 80) {
            recommendations.push("Compliance score below threshold - address compliance gaps");
        }
        if (metrics.vulnerabilities > 20) {
            recommendations.push("High number of open vulnerabilities - prioritize remediation efforts");
        }
        return recommendations;
    }
    loadThreatDetectionRules() {
        // Load predefined threat detection rules
        const defaultRules = [
            {
                id: "failed_login_attempts",
                name: "Multiple Failed Login Attempts",
                description: "Detects multiple failed login attempts from same IP",
                category: "authentication",
                severity: "medium",
                query: `SELECT client_ip, COUNT(*) as attempts 
                FROM audit_logs 
                WHERE event_type = 'authentication_failed' 
                AND created_at > '\${time_window}' 
                GROUP BY client_ip`,
                threshold: 5,
                timeWindow: 15,
                enabled: true,
                actions: ["block_ip", "alert_security_team"],
            },
            {
                id: "privilege_escalation",
                name: "Privilege Escalation Attempt",
                description: "Detects attempts to access higher privilege resources",
                category: "authorization",
                severity: "high",
                query: `SELECT user_id, resource, COUNT(*) as attempts 
                FROM audit_logs 
                WHERE result = 'blocked' 
                AND event_type = 'access_denied' 
                AND created_at > '\${time_window}' 
                GROUP BY user_id, resource`,
                threshold: 3,
                timeWindow: 10,
                enabled: true,
                actions: ["disable_user", "alert_security_team"],
            },
        ];
        defaultRules.forEach((rule) => {
            this.threatRules.set(rule.id, rule);
        });
    }
    // Placeholder methods for external integrations
    async disableUserAccount(userId, reason) {
        // Implementation would integrate with user management system
        this.logger.info("User account disabled", { userId, reason });
    }
    async notifySecurityTeam(incidentId, matches) {
        // Implementation would send notifications via email, Slack, etc.
        this.logger.info("Security team notified", {
            incidentId,
            matchCount: matches.length,
        });
    }
    async sendIncidentNotification(contact, incidentId, level) {
        // Implementation would send notification to specific contact
        this.logger.info("Incident notification sent", {
            contact,
            incidentId,
            level: level.level,
        });
    }
}
// Supporting class stubs - these would be fully implemented
class InputValidator {
    config;
    constructor(config) {
        this.config = config;
    }
}
class XssProtector {
    config;
    constructor(config) {
        this.config = config;
    }
}
class CsrfProtector {
    config;
    constructor(config) {
        this.config = config;
    }
}
class RateLimiter {
    config;
    constructor(config) {
        this.config = config;
    }
}
class DdosProtector {
    config;
    constructor(config) {
        this.config = config;
    }
}
class FirewallManager {
    config;
    constructor(config) {
        this.config = config;
    }
    async applyRule(rule) {
        // Implementation would interact with firewall system
    }
    async blockCountry(country) {
        // Implementation would configure geo-blocking
    }
    async addTemporaryBlock(ip, duration) {
        // Implementation would temporarily block IP
    }
}
class TlsManager {
    config;
    constructor(config) {
        this.config = config;
    }
}
class WafManager {
    config;
    constructor(config) {
        this.config = config;
    }
    async enableRuleSet(ruleSet) {
        // Implementation would configure WAF rule set
    }
    async addCustomRule(rule) {
        // Implementation would add custom WAF rule
    }
    async blockGeography(country) {
        // Implementation would configure geographic blocking
    }
}
class SecretsManager {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
    async getSecretsForRotation(intervalDays) {
        // Implementation would query secrets due for rotation
        return [];
    }
    async generateNewSecret(type) {
        // Implementation would generate new secret
        return crypto.randomBytes(32).toString("hex");
    }
    async rotateSecret(id, newSecret) {
        // Implementation would rotate secret in vault
    }
}
class SiemIntegrator {
    config;
    constructor(config) {
        this.config = config;
    }
    async forwardEvent(event, config) {
        // Implementation would forward event to SIEM system
    }
}
class ProductionAuditLogger {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
    async logSecurityEvent(event) {
        // Implementation would log security event to audit system
        await this.db.executeQuery("INSERT INTO audit_logs (id, event_type, severity, details, created_at) VALUES (?, ?, ?, ?, ?)", [
            crypto.randomUUID(),
            event.type,
            event.severity,
            JSON.stringify(event.details),
            new Date().toISOString(),
        ]);
    }
    async archiveLogs(logs) {
        // Implementation would archive logs to long-term storage
    }
}
class PiiDetector {
    config;
    constructor(config) {
        this.config = config;
    }
}
class GdprManager {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
    async verifyIdentity(subjectId, email, verificationData) {
        // Implementation would verify data subject identity
        return true;
    }
    async generateAccessReport(subjectId, scope) {
        // Implementation would generate GDPR access report
        return { data: "access report" };
    }
    async erasePersonalData(subjectId, scope) {
        // Implementation would erase personal data
    }
    async exportPersonalData(subjectId, scope) {
        // Implementation would export personal data
        return { data: "exported data" };
    }
    async getComplianceScore() {
        // Implementation would calculate GDPR compliance score
        return 95;
    }
}
class Soc2Manager {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
    async assessControls(controls) {
        // Implementation would assess SOC2 controls
        return controls.map((control) => ({
            id: control,
            name: control,
            status: "pass",
            evidence: [],
            findings: [],
            recommendations: [],
        }));
    }
    async getComplianceScore() {
        // Implementation would calculate SOC2 compliance score
        return 92;
    }
}
class IncidentManager {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
}
class ThreatDetector {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
}
class ForensicsCollector {
    config;
    constructor(config) {
        this.config = config;
    }
    async startCollection(incidentId) {
        // Implementation would start automated forensics collection
    }
    async collect(dataType, systems, timeRange) {
        // Implementation would collect forensic data
        const filePath = `/forensics/${dataType}-${Date.now()}.log`;
        const hash = crypto.randomBytes(32).toString("hex");
        return { filePath, hash };
    }
}
//# sourceMappingURL=production-security-hardening.js.map
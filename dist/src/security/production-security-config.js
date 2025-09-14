/**
 * Production Security Configuration
 *
 * Complete configuration for production-hardened Google Services deployment
 * with enterprise-grade security controls and zero-trust architecture.
 */
/**
 * Production Security Configuration
 * Configured for enterprise production environment with maximum security
 */
export const productionSecurityConfig = {
    version: "1.0.0",
    environment: "production",
    enforcementLevel: "strict",
    // Application Security Configuration
    applicationSecurity: {
        inputValidation: {
            enabled: true,
            strictMode: true,
            allowedTags: [
                "p",
                "br",
                "strong",
                "em",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
            ],
            maxInputLength: 10000,
            sqlInjectionPrevention: true,
        },
        xssProtection: {
            enabled: true,
            contentSecurityPolicy: `default-src 'self'; 
                              script-src 'self' 'unsafe-inline' https://apis.google.com; 
                              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
                              font-src 'self' https://fonts.gstatic.com; 
                              img-src 'self' data: https:; 
                              connect-src 'self' https://api.google.com https://*.googleapis.com; 
                              frame-src 'none'; 
                              object-src 'none'; 
                              base-uri 'self'; 
                              form-action 'self'`,
            xssFilter: true,
            frameOptions: "DENY",
        },
        csrfProtection: {
            enabled: true,
            tokenExpiry: 3600000, // 1 hour
            cookieSettings: {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
            },
        },
        rateLimiting: {
            enabled: true,
            windowMs: 900000, // 15 minutes
            maxRequests: 100,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        ddosProtection: {
            enabled: true,
            thresholds: {
                requests_per_second: 50,
                concurrent_connections: 1000,
                bandwidth_mbps: 100,
            },
        },
    },
    // Infrastructure Security Configuration
    infrastructureSecurity: {
        networkSecurity: {
            segmentationEnabled: true,
            firewallRules: [
                {
                    id: "allow_https_inbound",
                    name: "Allow HTTPS Inbound",
                    action: "allow",
                    protocol: "tcp",
                    sourceIp: "0.0.0.0/0",
                    destinationPort: 443,
                    priority: 100,
                    enabled: true,
                },
                {
                    id: "allow_http_redirect",
                    name: "Allow HTTP for HTTPS Redirect",
                    action: "allow",
                    protocol: "tcp",
                    sourceIp: "0.0.0.0/0",
                    destinationPort: 80,
                    priority: 200,
                    enabled: true,
                },
                {
                    id: "deny_ssh_external",
                    name: "Deny External SSH",
                    action: "deny",
                    protocol: "tcp",
                    sourceIp: "0.0.0.0/0",
                    destinationPort: 22,
                    priority: 50,
                    enabled: true,
                },
                {
                    id: "allow_internal_communication",
                    name: "Allow Internal Service Communication",
                    action: "allow",
                    protocol: "tcp",
                    sourceIp: "10.0.0.0/8",
                    destinationIp: "10.0.0.0/8",
                    priority: 300,
                    enabled: true,
                },
            ],
            allowedCidrs: [
                "10.0.0.0/8", // Internal networks
                "172.16.0.0/12", // Private networks
                "192.168.0.0/16", // Local networks
            ],
            blockedCountries: ["CN", "RU", "KP", "IR"], // High-risk countries
        },
        tlsSecurity: {
            version: "1.3",
            hstsEnabled: true,
            hstsMaxAge: 31536000, // 1 year
            certificatePinning: {
                enabled: true,
                pins: [
                    // Production certificate pins (these would be actual certificate fingerprints)
                    "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                    "sha256-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
                ],
                backupPins: [
                    "sha256-CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=",
                    "sha256-DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=",
                ],
            },
        },
        wafConfiguration: {
            enabled: true,
            ruleSets: [
                "OWASP_CRS_3.3",
                "SQL_INJECTION_PREVENTION",
                "XSS_PREVENTION",
                "PROTOCOL_VIOLATIONS",
                "BAD_ROBOTS",
            ],
            customRules: [
                {
                    id: "api_abuse_prevention",
                    name: "API Abuse Prevention",
                    condition: "rate(5m) > 1000",
                    action: "challenge",
                    severity: "medium",
                    enabled: true,
                },
                {
                    id: "credential_stuffing",
                    name: "Credential Stuffing Protection",
                    condition: 'path matches "/login" and rate(1m) > 10',
                    action: "block",
                    severity: "high",
                    enabled: true,
                },
                {
                    id: "data_scraping",
                    name: "Data Scraping Prevention",
                    condition: 'user_agent matches "bot|crawler|spider" and rate(1h) > 100',
                    action: "challenge",
                    severity: "medium",
                    enabled: true,
                },
            ],
            geoBlocking: ["CN", "RU", "KP", "IR"],
        },
        secretsManagement: {
            rotationInterval: 90, // 90 days maximum
            vaultIntegration: true,
            encryptionAtRest: true,
            accessLogging: true,
        },
    },
    // Compliance and Auditing Configuration
    compliance: {
        siemIntegration: {
            enabled: true,
            provider: "elk", // Can be 'splunk', 'elk', 'sentinel', or 'custom'
            endpoint: process.env.SIEM_ENDPOINT || "https://siem.company.com/api/events",
            indexPattern: "security-logs-*",
        },
        auditLogging: {
            enabled: true,
            retentionYears: 7, // Legal requirement for many industries
            encryptLogs: true,
            realTimeAnalysis: true,
        },
        piiDetection: {
            enabled: true,
            patterns: [
                // Credit card numbers
                "\\b(?:\\d[ -]*?){13,16}\\b",
                // Social Security Numbers
                "\\b\\d{3}-\\d{2}-\\d{4}\\b",
                // Email addresses
                "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
                // Phone numbers
                "\\b\\+?1?[-\\s]?\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4}\\b",
                // IP addresses
                "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
            ],
            maskingStrategy: "partial",
            alertOnDetection: true,
        },
        gdprCompliance: {
            enabled: true,
            automatedResponseTime: 72, // 72 hours as required by GDPR
            dataSubjectPortal: "/privacy/data-requests",
            consentManagement: true,
        },
        soc2Compliance: {
            enabled: true,
            controls: [
                "CC1.1",
                "CC1.2",
                "CC1.3",
                "CC1.4",
                "CC1.5", // Control Environment
                "CC2.1",
                "CC2.2",
                "CC2.3", // Communication and Information
                "CC3.1",
                "CC3.2",
                "CC3.3",
                "CC3.4", // Risk Assessment
                "CC4.1",
                "CC4.2",
                "CC4.3", // Monitoring Activities
                "CC5.1",
                "CC5.2",
                "CC5.3", // Control Activities
                "CC6.1",
                "CC6.2",
                "CC6.3",
                "CC6.4",
                "CC6.5",
                "CC6.6",
                "CC6.7",
                "CC6.8", // Logical Access
                "CC7.1",
                "CC7.2",
                "CC7.3",
                "CC7.4",
                "CC7.5", // System Operations
                "CC8.1",
                "CC8.2",
                "CC8.3", // Change Management
                "CC9.1",
                "CC9.2", // Risk Mitigation
            ],
            evidenceCollection: true,
            continuousMonitoring: true,
        },
    },
    // Incident Response Configuration
    incidentResponse: {
        automated: true,
        escalationMatrix: [
            {
                level: 1,
                title: "Security Analyst",
                severity: "low",
                timeToEscalate: 30, // minutes
                contacts: ["security-analyst@company.com", "+1-555-0123"],
                actions: ["investigate", "document", "contain_if_needed"],
            },
            {
                level: 2,
                title: "Security Manager",
                severity: "medium",
                timeToEscalate: 15, // minutes
                contacts: ["security-manager@company.com", "+1-555-0124"],
                actions: [
                    "escalate_investigation",
                    "notify_stakeholders",
                    "coordinate_response",
                ],
            },
            {
                level: 3,
                title: "CISO",
                severity: "high",
                timeToEscalate: 10, // minutes
                contacts: ["ciso@company.com", "+1-555-0125"],
                actions: [
                    "executive_notification",
                    "crisis_management",
                    "external_communication",
                ],
            },
            {
                level: 4,
                title: "Executive Leadership",
                severity: "critical",
                timeToEscalate: 5, // minutes
                contacts: ["ceo@company.com", "cto@company.com", "+1-555-0126"],
                actions: [
                    "board_notification",
                    "regulatory_notification",
                    "public_communication",
                ],
            },
        ],
        runbookPaths: [
            "/runbooks/data-breach-response.md",
            "/runbooks/ddos-mitigation.md",
            "/runbooks/insider-threat-investigation.md",
            "/runbooks/malware-outbreak-containment.md",
            "/runbooks/account-compromise-recovery.md",
        ],
        forensicsEnabled: true,
        threatIntelIntegration: true,
    },
};
/**
 * Zero-Trust Policy Configuration
 * Implements strict zero-trust security model
 */
export const zeroTrustPolicy = {
    id: "production_zero_trust_policy",
    name: "Production Zero-Trust Policy",
    description: "Comprehensive zero-trust security policy for production environment",
    version: "1.0.0",
    enabled: true,
    // Identity and Access Management
    identityVerification: {
        requireMfa: true,
        mfaMethods: ["totp", "push", "hardware_token"],
        continuousAuthentication: true,
        sessionTimeout: 480, // 8 hours
        deviceTrustRequired: true,
    },
    // Network Security and Segmentation
    networkSegmentation: {
        enabled: true,
        defaultDeny: true,
        microSegments: [
            {
                id: "dmz_segment",
                name: "DMZ Segment",
                description: "Public-facing services and load balancers",
                ipRanges: ["10.1.0.0/24"],
                allowedPorts: [80, 443],
                protocols: ["tcp"],
                trustLevel: "low",
                accessRules: [
                    {
                        id: "public_web_access",
                        name: "Public Web Access",
                        source: { type: "segment", identifiers: ["internet"] },
                        destination: { type: "segment", identifiers: ["dmz_segment"] },
                        permissions: ["http", "https"],
                        conditions: [
                            {
                                type: "time",
                                operator: "in_range",
                                value: "00:00-23:59",
                                required: false,
                            },
                        ],
                        riskThreshold: 50,
                        enabled: true,
                    },
                ],
                monitoring: {
                    enabled: true,
                    logLevel: "detailed",
                    alertOnAnomalies: true,
                },
            },
            {
                id: "app_segment",
                name: "Application Segment",
                description: "Application servers and APIs",
                ipRanges: ["10.2.0.0/24"],
                allowedPorts: [8080, 8443, 9000],
                protocols: ["tcp"],
                trustLevel: "medium",
                accessRules: [
                    {
                        id: "dmz_to_app_access",
                        name: "DMZ to Application Access",
                        source: { type: "segment", identifiers: ["dmz_segment"] },
                        destination: { type: "segment", identifiers: ["app_segment"] },
                        permissions: ["api_access"],
                        conditions: [
                            {
                                type: "device_trust",
                                operator: "greater_than",
                                value: 70,
                                required: true,
                            },
                        ],
                        riskThreshold: 30,
                        enabled: true,
                    },
                ],
                monitoring: {
                    enabled: true,
                    logLevel: "verbose",
                    alertOnAnomalies: true,
                },
            },
            {
                id: "data_segment",
                name: "Data Segment",
                description: "Database servers and data storage",
                ipRanges: ["10.3.0.0/24"],
                allowedPorts: [5432, 3306, 27017],
                protocols: ["tcp"],
                trustLevel: "high",
                accessRules: [
                    {
                        id: "app_to_data_access",
                        name: "Application to Data Access",
                        source: { type: "segment", identifiers: ["app_segment"] },
                        destination: { type: "segment", identifiers: ["data_segment"] },
                        permissions: ["database_access"],
                        conditions: [
                            {
                                type: "device_trust",
                                operator: "greater_than",
                                value: 80,
                                required: true,
                            },
                            {
                                type: "user_risk",
                                operator: "less_than",
                                value: 30,
                                required: true,
                            },
                        ],
                        riskThreshold: 20,
                        enabled: true,
                    },
                ],
                monitoring: {
                    enabled: true,
                    logLevel: "verbose",
                    alertOnAnomalies: true,
                },
            },
            {
                id: "management_segment",
                name: "Management Segment",
                description: "Administrative and management systems",
                ipRanges: ["10.4.0.0/24"],
                allowedPorts: [22, 3389, 5986],
                protocols: ["tcp"],
                trustLevel: "critical",
                accessRules: [
                    {
                        id: "admin_access",
                        name: "Administrative Access",
                        source: { type: "user", identifiers: ["admin_users"] },
                        destination: {
                            type: "segment",
                            identifiers: ["management_segment"],
                        },
                        permissions: ["admin_access", "ssh_access"],
                        conditions: [
                            {
                                type: "device_trust",
                                operator: "greater_than",
                                value: 90,
                                required: true,
                            },
                            {
                                type: "location",
                                operator: "in_range",
                                value: ["office_locations"],
                                required: true,
                            },
                            {
                                type: "time",
                                operator: "in_range",
                                value: "08:00-18:00",
                                required: true,
                            },
                        ],
                        timeRestrictions: {
                            allowedHours: "08:00-18:00",
                            timeZone: "UTC",
                            daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
                        },
                        riskThreshold: 10,
                        enabled: true,
                    },
                ],
                monitoring: {
                    enabled: true,
                    logLevel: "verbose",
                    alertOnAnomalies: true,
                },
            },
        ],
        tunnelRequired: true,
        encryptionRequired: true,
    },
    // Device Security and Trust
    deviceTrust: {
        deviceRegistrationRequired: true,
        deviceHealthChecks: true,
        allowedDeviceTypes: ["desktop", "mobile", "tablet"],
        osVersionRequirements: {
            Windows: "10.0.19041", // Windows 10 20H2 or later
            macOS: "11.0", // Big Sur or later
            iOS: "14.0", // iOS 14 or later
            Android: "10.0", // Android 10 or later
            Ubuntu: "20.04", // Ubuntu 20.04 LTS or later
        },
        endpointProtectionRequired: true,
    },
    // Application Security
    applicationSecurity: {
        applicationInventory: true,
        applicationApproval: true,
        runtimeProtection: true,
        apiSecurity: true,
        dataFlowMonitoring: true,
    },
    // Data Security
    dataSecurity: {
        dataClassification: true,
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataLossPreventionEnabled: true,
        dataAccessLogging: true,
    },
    // Monitoring and Analytics
    monitoring: {
        continuousMonitoring: true,
        behaviorAnalytics: true,
        riskScoring: true,
        anomalyDetection: true,
        responseAutomation: true,
    },
};
/**
 * Environment-specific configurations
 */
export const environmentConfigs = {
    development: {
        ...productionSecurityConfig,
        environment: "development",
        enforcementLevel: "warn",
        applicationSecurity: {
            ...productionSecurityConfig.applicationSecurity,
            inputValidation: {
                ...productionSecurityConfig.applicationSecurity.inputValidation,
                strictMode: false,
            },
            rateLimiting: {
                ...productionSecurityConfig.applicationSecurity.rateLimiting,
                maxRequests: 1000, // More lenient for development
            },
        },
        compliance: {
            ...productionSecurityConfig.compliance,
            siemIntegration: {
                ...productionSecurityConfig.compliance.siemIntegration,
                enabled: false, // Disable SIEM in development
            },
        },
    },
    staging: {
        ...productionSecurityConfig,
        environment: "staging",
        enforcementLevel: "block",
        compliance: {
            ...productionSecurityConfig.compliance,
            auditLogging: {
                ...productionSecurityConfig.compliance.auditLogging,
                retentionYears: 1, // Shorter retention for staging
            },
        },
    },
    production: productionSecurityConfig,
};
/**
 * Get configuration for current environment
 */
export function getSecurityConfig() {
    const environment = (process.env.NODE_ENV ||
        "development");
    return environmentConfigs[environment] || environmentConfigs.development;
}
/**
 * Security configuration validation
 */
export function validateSecurityConfig(config) {
    const errors = [];
    const warnings = [];
    // Required configurations for production
    if (config.environment === "production") {
        if (!config.applicationSecurity.inputValidation.enabled) {
            errors.push("Input validation must be enabled in production");
        }
        if (!config.applicationSecurity.xssProtection.enabled) {
            errors.push("XSS protection must be enabled in production");
        }
        if (!config.applicationSecurity.csrfProtection.enabled) {
            errors.push("CSRF protection must be enabled in production");
        }
        if (!config.infrastructureSecurity.tlsSecurity.hstsEnabled) {
            errors.push("HSTS must be enabled in production");
        }
        if (config.infrastructureSecurity.tlsSecurity.version !== "1.3") {
            warnings.push("TLS 1.3 is recommended for production");
        }
        if (!config.compliance.auditLogging.enabled) {
            errors.push("Audit logging must be enabled in production");
        }
        if (config.compliance.auditLogging.retentionYears < 7) {
            warnings.push("7-year audit log retention is recommended for compliance");
        }
        if (!config.incidentResponse.automated) {
            warnings.push("Automated incident response is recommended for production");
        }
    }
    // Validate escalation matrix
    if (config.incidentResponse.escalationMatrix.length === 0) {
        errors.push("At least one escalation level must be defined");
    }
    // Validate firewall rules
    const firewallRules = config.infrastructureSecurity.networkSecurity.firewallRules;
    const hasHttpsAllow = firewallRules.some((rule) => rule.action === "allow" && rule.destinationPort === 443 && rule.enabled);
    if (!hasHttpsAllow) {
        warnings.push("No HTTPS allow rule found - may block legitimate traffic");
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Default export
 */
export default {
    productionSecurityConfig,
    zeroTrustPolicy,
    environmentConfigs,
    getSecurityConfig,
    validateSecurityConfig,
};
//# sourceMappingURL=production-security-config.js.map
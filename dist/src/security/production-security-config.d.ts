/**
 * Production Security Configuration
 *
 * Complete configuration for production-hardened Google Services deployment
 * with enterprise-grade security controls and zero-trust architecture.
 */
import { ProductionSecurityConfig } from "./production-security-hardening.js";
import { ZeroTrustPolicy } from "./zero-trust-architecture.js";
/**
 * Production Security Configuration
 * Configured for enterprise production environment with maximum security
 */
export declare const productionSecurityConfig: ProductionSecurityConfig;
/**
 * Zero-Trust Policy Configuration
 * Implements strict zero-trust security model
 */
export declare const zeroTrustPolicy: ZeroTrustPolicy;
/**
 * Environment-specific configurations
 */
export declare const environmentConfigs: {
    development: {
        environment: "development";
        enforcementLevel: "warn";
        applicationSecurity: {
            inputValidation: {
                strictMode: boolean;
                enabled: boolean;
                allowedTags: string[];
                maxInputLength: number;
                sqlInjectionPrevention: boolean;
            };
            rateLimiting: {
                maxRequests: number;
                enabled: boolean;
                windowMs: number;
                skipSuccessfulRequests: boolean;
                skipFailedRequests: boolean;
            };
            xssProtection: {
                enabled: boolean;
                contentSecurityPolicy: string;
                xssFilter: boolean;
                frameOptions: string;
            };
            csrfProtection: {
                enabled: boolean;
                tokenExpiry: number;
                cookieSettings: {
                    httpOnly: boolean;
                    secure: boolean;
                    sameSite: "none" | "strict" | "lax";
                };
            };
            ddosProtection: {
                enabled: boolean;
                thresholds: {
                    requests_per_second: number;
                    concurrent_connections: number;
                    bandwidth_mbps: number;
                };
            };
        };
        compliance: {
            siemIntegration: {
                enabled: boolean;
                provider: "custom" | "splunk" | "elk" | "sentinel";
                endpoint: string;
                indexPattern: string;
            };
            auditLogging: {
                enabled: boolean;
                retentionYears: number;
                encryptLogs: boolean;
                realTimeAnalysis: boolean;
            };
            piiDetection: {
                enabled: boolean;
                patterns: string[];
                maskingStrategy: "hash" | "partial" | "full";
                alertOnDetection: boolean;
            };
            gdprCompliance: {
                enabled: boolean;
                automatedResponseTime: number;
                dataSubjectPortal: string;
                consentManagement: boolean;
            };
            soc2Compliance: {
                enabled: boolean;
                controls: string[];
                evidenceCollection: boolean;
                continuousMonitoring: boolean;
            };
        };
        version: string;
        infrastructureSecurity: {
            networkSecurity: {
                segmentationEnabled: boolean;
                firewallRules: import("./production-security-hardening.js").FirewallRule[];
                allowedCidrs: string[];
                blockedCountries: string[];
            };
            tlsSecurity: {
                version: "1.2" | "1.3";
                hstsEnabled: boolean;
                hstsMaxAge: number;
                certificatePinning: {
                    enabled: boolean;
                    pins: string[];
                    backupPins: string[];
                };
            };
            wafConfiguration: {
                enabled: boolean;
                ruleSets: string[];
                customRules: import("./production-security-hardening.js").WafRule[];
                geoBlocking: string[];
            };
            secretsManagement: {
                rotationInterval: number;
                vaultIntegration: boolean;
                encryptionAtRest: boolean;
                accessLogging: boolean;
            };
        };
        incidentResponse: {
            automated: boolean;
            escalationMatrix: import("./production-security-hardening.js").EscalationLevel[];
            runbookPaths: string[];
            forensicsEnabled: boolean;
            threatIntelIntegration: boolean;
        };
    };
    staging: {
        environment: "staging";
        enforcementLevel: "block";
        compliance: {
            auditLogging: {
                retentionYears: number;
                enabled: boolean;
                encryptLogs: boolean;
                realTimeAnalysis: boolean;
            };
            siemIntegration: {
                enabled: boolean;
                provider: "custom" | "splunk" | "elk" | "sentinel";
                endpoint: string;
                indexPattern: string;
            };
            piiDetection: {
                enabled: boolean;
                patterns: string[];
                maskingStrategy: "hash" | "partial" | "full";
                alertOnDetection: boolean;
            };
            gdprCompliance: {
                enabled: boolean;
                automatedResponseTime: number;
                dataSubjectPortal: string;
                consentManagement: boolean;
            };
            soc2Compliance: {
                enabled: boolean;
                controls: string[];
                evidenceCollection: boolean;
                continuousMonitoring: boolean;
            };
        };
        version: string;
        applicationSecurity: {
            inputValidation: {
                enabled: boolean;
                strictMode: boolean;
                allowedTags: string[];
                maxInputLength: number;
                sqlInjectionPrevention: boolean;
            };
            xssProtection: {
                enabled: boolean;
                contentSecurityPolicy: string;
                xssFilter: boolean;
                frameOptions: string;
            };
            csrfProtection: {
                enabled: boolean;
                tokenExpiry: number;
                cookieSettings: {
                    httpOnly: boolean;
                    secure: boolean;
                    sameSite: "none" | "strict" | "lax";
                };
            };
            rateLimiting: {
                enabled: boolean;
                windowMs: number;
                maxRequests: number;
                skipSuccessfulRequests: boolean;
                skipFailedRequests: boolean;
            };
            ddosProtection: {
                enabled: boolean;
                thresholds: {
                    requests_per_second: number;
                    concurrent_connections: number;
                    bandwidth_mbps: number;
                };
            };
        };
        infrastructureSecurity: {
            networkSecurity: {
                segmentationEnabled: boolean;
                firewallRules: import("./production-security-hardening.js").FirewallRule[];
                allowedCidrs: string[];
                blockedCountries: string[];
            };
            tlsSecurity: {
                version: "1.2" | "1.3";
                hstsEnabled: boolean;
                hstsMaxAge: number;
                certificatePinning: {
                    enabled: boolean;
                    pins: string[];
                    backupPins: string[];
                };
            };
            wafConfiguration: {
                enabled: boolean;
                ruleSets: string[];
                customRules: import("./production-security-hardening.js").WafRule[];
                geoBlocking: string[];
            };
            secretsManagement: {
                rotationInterval: number;
                vaultIntegration: boolean;
                encryptionAtRest: boolean;
                accessLogging: boolean;
            };
        };
        incidentResponse: {
            automated: boolean;
            escalationMatrix: import("./production-security-hardening.js").EscalationLevel[];
            runbookPaths: string[];
            forensicsEnabled: boolean;
            threatIntelIntegration: boolean;
        };
    };
    production: ProductionSecurityConfig;
};
/**
 * Get configuration for current environment
 */
export declare function getSecurityConfig(): ProductionSecurityConfig;
/**
 * Security configuration validation
 */
export declare function validateSecurityConfig(config: ProductionSecurityConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Default export
 */
declare const _default: {
    productionSecurityConfig: ProductionSecurityConfig;
    zeroTrustPolicy: ZeroTrustPolicy;
    environmentConfigs: {
        development: {
            environment: "development";
            enforcementLevel: "warn";
            applicationSecurity: {
                inputValidation: {
                    strictMode: boolean;
                    enabled: boolean;
                    allowedTags: string[];
                    maxInputLength: number;
                    sqlInjectionPrevention: boolean;
                };
                rateLimiting: {
                    maxRequests: number;
                    enabled: boolean;
                    windowMs: number;
                    skipSuccessfulRequests: boolean;
                    skipFailedRequests: boolean;
                };
                xssProtection: {
                    enabled: boolean;
                    contentSecurityPolicy: string;
                    xssFilter: boolean;
                    frameOptions: string;
                };
                csrfProtection: {
                    enabled: boolean;
                    tokenExpiry: number;
                    cookieSettings: {
                        httpOnly: boolean;
                        secure: boolean;
                        sameSite: "none" | "strict" | "lax";
                    };
                };
                ddosProtection: {
                    enabled: boolean;
                    thresholds: {
                        requests_per_second: number;
                        concurrent_connections: number;
                        bandwidth_mbps: number;
                    };
                };
            };
            compliance: {
                siemIntegration: {
                    enabled: boolean;
                    provider: "custom" | "splunk" | "elk" | "sentinel";
                    endpoint: string;
                    indexPattern: string;
                };
                auditLogging: {
                    enabled: boolean;
                    retentionYears: number;
                    encryptLogs: boolean;
                    realTimeAnalysis: boolean;
                };
                piiDetection: {
                    enabled: boolean;
                    patterns: string[];
                    maskingStrategy: "hash" | "partial" | "full";
                    alertOnDetection: boolean;
                };
                gdprCompliance: {
                    enabled: boolean;
                    automatedResponseTime: number;
                    dataSubjectPortal: string;
                    consentManagement: boolean;
                };
                soc2Compliance: {
                    enabled: boolean;
                    controls: string[];
                    evidenceCollection: boolean;
                    continuousMonitoring: boolean;
                };
            };
            version: string;
            infrastructureSecurity: {
                networkSecurity: {
                    segmentationEnabled: boolean;
                    firewallRules: import("./production-security-hardening.js").FirewallRule[];
                    allowedCidrs: string[];
                    blockedCountries: string[];
                };
                tlsSecurity: {
                    version: "1.2" | "1.3";
                    hstsEnabled: boolean;
                    hstsMaxAge: number;
                    certificatePinning: {
                        enabled: boolean;
                        pins: string[];
                        backupPins: string[];
                    };
                };
                wafConfiguration: {
                    enabled: boolean;
                    ruleSets: string[];
                    customRules: import("./production-security-hardening.js").WafRule[];
                    geoBlocking: string[];
                };
                secretsManagement: {
                    rotationInterval: number;
                    vaultIntegration: boolean;
                    encryptionAtRest: boolean;
                    accessLogging: boolean;
                };
            };
            incidentResponse: {
                automated: boolean;
                escalationMatrix: import("./production-security-hardening.js").EscalationLevel[];
                runbookPaths: string[];
                forensicsEnabled: boolean;
                threatIntelIntegration: boolean;
            };
        };
        staging: {
            environment: "staging";
            enforcementLevel: "block";
            compliance: {
                auditLogging: {
                    retentionYears: number;
                    enabled: boolean;
                    encryptLogs: boolean;
                    realTimeAnalysis: boolean;
                };
                siemIntegration: {
                    enabled: boolean;
                    provider: "custom" | "splunk" | "elk" | "sentinel";
                    endpoint: string;
                    indexPattern: string;
                };
                piiDetection: {
                    enabled: boolean;
                    patterns: string[];
                    maskingStrategy: "hash" | "partial" | "full";
                    alertOnDetection: boolean;
                };
                gdprCompliance: {
                    enabled: boolean;
                    automatedResponseTime: number;
                    dataSubjectPortal: string;
                    consentManagement: boolean;
                };
                soc2Compliance: {
                    enabled: boolean;
                    controls: string[];
                    evidenceCollection: boolean;
                    continuousMonitoring: boolean;
                };
            };
            version: string;
            applicationSecurity: {
                inputValidation: {
                    enabled: boolean;
                    strictMode: boolean;
                    allowedTags: string[];
                    maxInputLength: number;
                    sqlInjectionPrevention: boolean;
                };
                xssProtection: {
                    enabled: boolean;
                    contentSecurityPolicy: string;
                    xssFilter: boolean;
                    frameOptions: string;
                };
                csrfProtection: {
                    enabled: boolean;
                    tokenExpiry: number;
                    cookieSettings: {
                        httpOnly: boolean;
                        secure: boolean;
                        sameSite: "none" | "strict" | "lax";
                    };
                };
                rateLimiting: {
                    enabled: boolean;
                    windowMs: number;
                    maxRequests: number;
                    skipSuccessfulRequests: boolean;
                    skipFailedRequests: boolean;
                };
                ddosProtection: {
                    enabled: boolean;
                    thresholds: {
                        requests_per_second: number;
                        concurrent_connections: number;
                        bandwidth_mbps: number;
                    };
                };
            };
            infrastructureSecurity: {
                networkSecurity: {
                    segmentationEnabled: boolean;
                    firewallRules: import("./production-security-hardening.js").FirewallRule[];
                    allowedCidrs: string[];
                    blockedCountries: string[];
                };
                tlsSecurity: {
                    version: "1.2" | "1.3";
                    hstsEnabled: boolean;
                    hstsMaxAge: number;
                    certificatePinning: {
                        enabled: boolean;
                        pins: string[];
                        backupPins: string[];
                    };
                };
                wafConfiguration: {
                    enabled: boolean;
                    ruleSets: string[];
                    customRules: import("./production-security-hardening.js").WafRule[];
                    geoBlocking: string[];
                };
                secretsManagement: {
                    rotationInterval: number;
                    vaultIntegration: boolean;
                    encryptionAtRest: boolean;
                    accessLogging: boolean;
                };
            };
            incidentResponse: {
                automated: boolean;
                escalationMatrix: import("./production-security-hardening.js").EscalationLevel[];
                runbookPaths: string[];
                forensicsEnabled: boolean;
                threatIntelIntegration: boolean;
            };
        };
        production: ProductionSecurityConfig;
    };
    getSecurityConfig: typeof getSecurityConfig;
    validateSecurityConfig: typeof validateSecurityConfig;
};
export default _default;
//# sourceMappingURL=production-security-config.d.ts.map
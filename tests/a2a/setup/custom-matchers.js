/**
 * Custom Jest Matchers for A2A Testing
 * Specialized assertions for A2A protocol compliance and validation
 */
import { expect } from '@jest/globals';
// A2A Protocol Compliance Matcher
expect.extend({
    toBeA2ACompliant(received) {
        const pass = received &&
            typeof received === 'object' &&
            received.id &&
            received.source &&
            received.target &&
            received.toolName &&
            received.timestamp &&
            received.coordination;
        if (pass) {
            return {
                message: () => `Expected message not to be A2A compliant, but it was`,
                pass: true,
            };
        }
        else {
            const missing = [];
            if (!received?.id)
                missing.push('id');
            if (!received?.source)
                missing.push('source');
            if (!received?.target)
                missing.push('target');
            if (!received?.toolName)
                missing.push('toolName');
            if (!received?.timestamp)
                missing.push('timestamp');
            if (!received?.coordination)
                missing.push('coordination');
            return {
                message: () => `Expected message to be A2A compliant, but missing: ${missing.join(', ')}`,
                pass: false,
            };
        }
    },
});
// Valid A2A Message Structure Matcher
expect.extend({
    toHaveValidA2AMessage(received) {
        const errors = [];
        // Check required fields
        if (!received?.id || typeof received.id !== 'string') {
            errors.push('id must be a non-empty string');
        }
        if (!received?.source?.agentId) {
            errors.push('source.agentId is required');
        }
        if (!received?.target?.type) {
            errors.push('target.type is required');
        }
        if (!received?.toolName || typeof received.toolName !== 'string') {
            errors.push('toolName must be a non-empty string');
        }
        if (!received?.timestamp || typeof received.timestamp !== 'number') {
            errors.push('timestamp must be a number');
        }
        if (!received?.coordination?.mode) {
            errors.push('coordination.mode is required');
        }
        // Validate coordination modes
        const validModes = ['direct', 'broadcast', 'consensus', 'pipeline'];
        if (received?.coordination?.mode && !validModes.includes(received.coordination.mode)) {
            errors.push(`coordination.mode must be one of: ${validModes.join(', ')}`);
        }
        // Validate target types
        const validTargetTypes = ['single', 'multiple', 'group', 'broadcast', 'conditional'];
        if (received?.target?.type && !validTargetTypes.includes(received.target.type)) {
            errors.push(`target.type must be one of: ${validTargetTypes.join(', ')}`);
        }
        const pass = errors.length === 0;
        return {
            message: () => pass
                ? `Expected A2A message to be invalid, but it was valid`
                : `Expected A2A message to be valid, but found errors:\n${errors.map(e => `  - ${e}`).join('\n')}`,
            pass,
        };
    },
});
// Performance Target Matcher
expect.extend({
    toMeetPerformanceTarget(received, target) {
        const actualThroughput = received?.throughput || received?.messagesPerSecond || 0;
        const pass = actualThroughput >= target;
        return {
            message: () => pass
                ? `Expected throughput ${actualThroughput} not to meet target ${target}`
                : `Expected throughput ${actualThroughput} to meet target ${target}`,
            pass,
        };
    },
});
// Security Attack Resistance Matcher
expect.extend({
    toBeSecureAgainstAttack(received, attackType) {
        const attackResult = received?.attackResults?.[attackType];
        const pass = attackResult &&
            (attackResult.blocked === true ||
                attackResult.mitigated === true ||
                attackResult.success === false);
        return {
            message: () => pass
                ? `Expected system to be vulnerable to ${attackType} attack, but it was secure`
                : `Expected system to be secure against ${attackType} attack, but it was vulnerable`,
            pass,
        };
    },
});
// Failure Recovery Matcher
expect.extend({
    toRecoverFromFailure(received, maxRecoveryTime) {
        const recoveryTime = received?.recoveryTime || Infinity;
        const recovered = received?.recovered === true || received?.systemSurvived === true;
        const pass = recovered && recoveryTime <= maxRecoveryTime;
        return {
            message: () => pass
                ? `Expected system not to recover within ${maxRecoveryTime}ms, but it recovered in ${recoveryTime}ms`
                : `Expected system to recover within ${maxRecoveryTime}ms, but it ${recovered ? `took ${recoveryTime}ms` : 'did not recover'}`,
            pass,
        };
    },
});
// Security Vulnerabilities Matcher
expect.extend({
    toHaveZeroSecurityVulnerabilities(received) {
        const criticalVulns = received?.criticalVulnerabilities || 0;
        const highVulns = received?.highRiskVulnerabilities || 0;
        const totalSignificantVulns = criticalVulns + highVulns;
        const pass = totalSignificantVulns === 0;
        return {
            message: () => pass
                ? `Expected to have security vulnerabilities, but found none`
                : `Expected zero security vulnerabilities, but found ${criticalVulns} critical and ${highVulns} high-risk vulnerabilities`,
            pass,
        };
    },
});
// MCP Tools Support Matcher
expect.extend({
    toSupportAllMCPTools(received) {
        const expectedToolCount = 104; // Total MCP tools as per specification
        const supportedTools = received?.supportedTools?.length ||
            received?.testedTools ||
            received?.toolCoverage || 0;
        const pass = supportedTools >= expectedToolCount;
        return {
            message: () => pass
                ? `Expected not to support all MCP tools, but supports ${supportedTools}/${expectedToolCount}`
                : `Expected to support all ${expectedToolCount} MCP tools, but only supports ${supportedTools}`,
            pass,
        };
    },
});
// Data Integrity Matcher
expect.extend({
    toMaintainDataIntegrity(received) {
        const dataIntegrity = received?.dataIntegrity !== false;
        const consistencyChecks = received?.consistencyViolations === 0 || received?.consistencyViolations === undefined;
        const noDataLoss = received?.dataLoss !== true;
        const pass = dataIntegrity && consistencyChecks && noDataLoss;
        return {
            message: () => pass
                ? `Expected data integrity to be compromised, but it was maintained`
                : `Expected data integrity to be maintained, but found violations: ${!dataIntegrity ? 'integrity compromised' : ''} ${!consistencyChecks ? 'consistency violations' : ''} ${!noDataLoss ? 'data loss detected' : ''}`.trim(),
            pass,
        };
    },
});
// Coordination Mode Support Matcher
expect.extend({
    toHandleCoordinationMode(received, mode) {
        const supportedModes = received?.supportedCoordinationModes || [];
        const testedModes = received?.testedCoordinationModes || [];
        const modeResults = received?.coordinationResults?.[mode];
        const isSupported = supportedModes.includes(mode) || testedModes.includes(mode);
        const hasValidResult = modeResults && (modeResults.success === true || modeResults.passed === true);
        const pass = isSupported && (hasValidResult || modeResults === undefined);
        return {
            message: () => pass
                ? `Expected not to handle coordination mode '${mode}', but it was handled successfully`
                : `Expected to handle coordination mode '${mode}', but it was ${!isSupported ? 'not supported' : 'supported but failed'}`,
            pass,
        };
    },
});
// Rate Limiting Matcher
expect.extend({
    toRespectRateLimits(received, limit) {
        const actualRate = received?.actualRate || received?.throughput || 0;
        const rateLimitEnforced = received?.rateLimitEnforced !== false;
        const rateLimitViolations = received?.rateLimitViolations || 0;
        const pass = rateLimitEnforced && rateLimitViolations === 0 && actualRate <= limit * 1.1; // 10% tolerance
        return {
            message: () => pass
                ? `Expected rate limits not to be respected, but they were (rate: ${actualRate}, limit: ${limit})`
                : `Expected rate limits to be respected (limit: ${limit}), but found violations: rate=${actualRate}, violations=${rateLimitViolations}, enforced=${rateLimitEnforced}`,
            pass,
        };
    },
});
console.log('🎯 A2A Custom Jest Matchers Loaded');
//# sourceMappingURL=custom-matchers.js.map
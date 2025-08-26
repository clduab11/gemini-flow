/**
 * Custom Jest Matchers for A2A Testing
 * Specialized assertions for A2A protocol compliance and validation
 */
/// <reference types="jest" />
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeA2ACompliant(): R;
            toHaveValidA2AMessage(): R;
            toMeetPerformanceTarget(target: number): R;
            toBeSecureAgainstAttack(attackType: string): R;
            toRecoverFromFailure(maxRecoveryTime: number): R;
            toHaveZeroSecurityVulnerabilities(): R;
            toSupportAllMCPTools(): R;
            toMaintainDataIntegrity(): R;
            toHandleCoordinationMode(mode: string): R;
            toRespectRateLimits(limit: number): R;
        }
    }
}
export type A2ACustomMatchers = {
    toBeA2ACompliant(): jest.CustomMatcherResult;
    toHaveValidA2AMessage(): jest.CustomMatcherResult;
    toMeetPerformanceTarget(target: number): jest.CustomMatcherResult;
    toBeSecureAgainstAttack(attackType: string): jest.CustomMatcherResult;
    toRecoverFromFailure(maxRecoveryTime: number): jest.CustomMatcherResult;
    toHaveZeroSecurityVulnerabilities(): jest.CustomMatcherResult;
    toSupportAllMCPTools(): jest.CustomMatcherResult;
    toMaintainDataIntegrity(): jest.CustomMatcherResult;
    toHandleCoordinationMode(mode: string): jest.CustomMatcherResult;
    toRespectRateLimits(limit: number): jest.CustomMatcherResult;
};
//# sourceMappingURL=custom-matchers.d.ts.map
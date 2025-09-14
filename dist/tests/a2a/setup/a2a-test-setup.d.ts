/**
 * A2A Test Setup
 * Global setup and configuration for A2A compliance testing
 */
declare global {
    var A2A_TEST_CONFIG: {
        performanceTarget: number;
        securityLevel: string;
        coverageThreshold: number;
        mockNetworkDelay: number;
        enableChaostesting: boolean;
        logLevel: string;
        timeouts: {
            default: number;
            protocol: number;
            integration: number;
            performance: number;
            chaos: number;
            security: number;
        };
    };
}
export {};
//# sourceMappingURL=a2a-test-setup.d.ts.map
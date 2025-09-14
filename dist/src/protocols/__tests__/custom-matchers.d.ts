/**
 * Custom Jest Matchers for Protocol Testing
 * Enhanced assertions for complex protocol behaviors
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidProtocolConfig(): R;
            toHaveActivatedSuccessfully(): R;
            toMeetTopologyRequirements(topology: string): R;
            toBeValidNamespaceKey(): R;
            toHaveCorrectNamespace(expectedNamespace: string): R;
            toBeSynchronizedWith(otherState: any): R;
            toMeetQuorumRequirements(nodeCount: number): R;
            toHaveByzantineFaultTolerance(faultCount: number): R;
            toBeValidConsensusMessage(): R;
            toMeetPerformanceRequirements(thresholds: any): R;
            toHaveAcceptableLatency(maxLatency: number): R;
            toMeetCoverageThreshold(threshold: number): R;
        }
    }
}
export {};
//# sourceMappingURL=custom-matchers.d.ts.map
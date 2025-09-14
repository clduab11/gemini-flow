/**
 * Custom Jest Matchers for Protocol Testing
 * Enhanced assertions for complex protocol behaviors
 */
// Protocol activation matchers
expect.extend({
    toBeValidProtocolConfig(received) {
        const requiredFields = ["name", "version", "enabled", "capabilities"];
        const hasAllFields = requiredFields.every((field) => field in received);
        const validName = typeof received.name === "string" && received.name.length > 0;
        const validVersion = typeof received.version === "string" &&
            /^\d+\.\d+\.\d+$/.test(received.version);
        const validCapabilities = Array.isArray(received.capabilities);
        const isValid = hasAllFields && validName && validVersion && validCapabilities;
        return {
            message: () => isValid
                ? `Expected protocol config to be invalid, but it was valid`
                : `Expected protocol config to be valid, but it was missing required fields or had invalid values`,
            pass: isValid,
        };
    },
    toHaveActivatedSuccessfully(received) {
        const isSuccessful = received.success === true &&
            received.protocol &&
            received.capabilities &&
            Array.isArray(received.capabilities) &&
            received.capabilities.length > 0;
        return {
            message: () => isSuccessful
                ? `Expected activation to fail, but it succeeded`
                : `Expected activation to succeed, but it failed: ${received.error || "Unknown error"}`,
            pass: isSuccessful,
        };
    },
    toMeetTopologyRequirements(received, topology) {
        const requirements = {
            mesh: (nodes) => nodes.length >= 3,
            hierarchical: (nodes) => nodes.some((n) => n.role === "coordinator"),
            ring: (nodes) => nodes.length >= 3,
            star: (nodes) => nodes.some((n) => n.role === "hub"),
        };
        const checker = requirements[topology.toLowerCase()];
        const meetsRequirements = checker ? checker(received.nodes || []) : false;
        return {
            message: () => meetsRequirements
                ? `Expected topology to not meet ${topology} requirements`
                : `Expected topology to meet ${topology} requirements`,
            pass: meetsRequirements,
        };
    },
});
// Memory operation matchers
expect.extend({
    toBeValidNamespaceKey(received) {
        const isValid = typeof received === "string" &&
            received.includes(":") &&
            received.split(":").length >= 2 &&
            received.split(":")[0].length > 0;
        return {
            message: () => isValid
                ? `Expected "${received}" to be invalid namespace key`
                : `Expected "${received}" to be valid namespace key (format: namespace:key)`,
            pass: isValid,
        };
    },
    toHaveCorrectNamespace(received, expectedNamespace) {
        const actualNamespace = received.metadata?.namespace ||
            (typeof received.key === "string" ? received.key.split(":")[0] : "");
        const isCorrect = actualNamespace === expectedNamespace;
        return {
            message: () => isCorrect
                ? `Expected namespace to not be "${expectedNamespace}"`
                : `Expected namespace to be "${expectedNamespace}", but got "${actualNamespace}"`,
            pass: isCorrect,
        };
    },
    toBeSynchronizedWith(received, otherState) {
        // Check vector clock synchronization
        const receivedClock = received.vectorClock || received.version;
        const otherClock = otherState.vectorClock || otherState.version;
        const isSynchronized = receivedClock &&
            otherClock &&
            receivedClock.toString() === otherClock.toString();
        return {
            message: () => isSynchronized
                ? `Expected states to be out of sync`
                : `Expected states to be synchronized, but vector clocks differ`,
            pass: isSynchronized,
        };
    },
});
// Consensus matchers
expect.extend({
    toMeetQuorumRequirements(received, nodeCount) {
        const faultThreshold = Math.floor((nodeCount - 1) / 3);
        const requiredQuorum = 2 * faultThreshold;
        const actualQuorum = received.quorum || received.responses || 0;
        const meetsRequirements = actualQuorum >= requiredQuorum;
        return {
            message: () => meetsRequirements
                ? `Expected quorum ${actualQuorum} to not meet requirements for ${nodeCount} nodes`
                : `Expected quorum ${actualQuorum} to meet requirements (${requiredQuorum}) for ${nodeCount} nodes`,
            pass: meetsRequirements,
        };
    },
    toHaveByzantineFaultTolerance(received, faultCount) {
        const totalNodes = received.totalNodes || received.agents?.length || 0;
        const maxTolerable = Math.floor((totalNodes - 1) / 3);
        const canTolerate = faultCount <= maxTolerable;
        return {
            message: () => canTolerate
                ? `Expected system to not tolerate ${faultCount} faults with ${totalNodes} nodes`
                : `Expected system to tolerate ${faultCount} faults with ${totalNodes} nodes (max: ${maxTolerable})`,
            pass: canTolerate,
        };
    },
    toBeValidConsensusMessage(received) {
        const requiredFields = [
            "type",
            "viewNumber",
            "sequenceNumber",
            "timestamp",
            "senderId",
        ];
        const validTypes = [
            "pre-prepare",
            "prepare",
            "commit",
            "view-change",
            "new-view",
        ];
        const hasRequiredFields = requiredFields.every((field) => field in received);
        const hasValidType = validTypes.includes(received.type);
        const hasValidNumbers = typeof received.viewNumber === "number" &&
            typeof received.sequenceNumber === "number" &&
            received.viewNumber >= 0 &&
            received.sequenceNumber >= 0;
        const isValid = hasRequiredFields && hasValidType && hasValidNumbers;
        return {
            message: () => isValid
                ? `Expected consensus message to be invalid`
                : `Expected consensus message to be valid, but it's missing fields or has invalid values`,
            pass: isValid,
        };
    },
});
// Performance matchers
expect.extend({
    toMeetPerformanceRequirements(received, thresholds) {
        const metrics = received.metrics || received;
        const requirements = [
            {
                key: "latency",
                check: (value) => value <= (thresholds.maxLatency || 1000),
            },
            {
                key: "throughput",
                check: (value) => value >= (thresholds.minThroughput || 100),
            },
            {
                key: "memory",
                check: (value) => value <= (thresholds.maxMemory || 100 * 1024 * 1024),
            },
            {
                key: "cpu",
                check: (value) => value <= (thresholds.maxCpu || 80),
            },
        ];
        const failures = requirements.filter((req) => {
            const value = metrics[req.key];
            return value !== undefined && !req.check(value);
        });
        const meetsRequirements = failures.length === 0;
        return {
            message: () => meetsRequirements
                ? `Expected performance to not meet requirements`
                : `Performance requirements not met: ${failures.map((f) => f.key).join(", ")}`,
            pass: meetsRequirements,
        };
    },
    toHaveAcceptableLatency(received, maxLatency) {
        const latency = received.latency || received.averageLatency || received.responseTime;
        const isAcceptable = typeof latency === "number" && latency <= maxLatency;
        return {
            message: () => isAcceptable
                ? `Expected latency ${latency}ms to exceed ${maxLatency}ms`
                : `Expected latency ${latency}ms to be within acceptable range (≤${maxLatency}ms)`,
            pass: isAcceptable,
        };
    },
});
// Coverage matchers
expect.extend({
    toMeetCoverageThreshold(received, threshold) {
        const coverage = received.coverage || received.percent || received;
        const meetsThreshold = typeof coverage === "number" && coverage >= threshold;
        return {
            message: () => meetsThreshold
                ? `Expected coverage ${coverage}% to be below ${threshold}%`
                : `Expected coverage ${coverage}% to meet threshold of ${threshold}%`,
            pass: meetsThreshold,
        };
    },
});
// Utility matchers for common patterns
expect.extend({
    toBeWithinRange(received, min, max) {
        const isWithinRange = received >= min && received <= max;
        return {
            message: () => isWithinRange
                ? `Expected ${received} to be outside range [${min}, ${max}]`
                : `Expected ${received} to be within range [${min}, ${max}]`,
            pass: isWithinRange,
        };
    },
    toHaveTimestamp(received) {
        const hasTimestamp = received.timestamp &&
            (received.timestamp instanceof Date ||
                typeof received.timestamp === "number" ||
                typeof received.timestamp === "string");
        return {
            message: () => hasTimestamp
                ? `Expected object to not have timestamp`
                : `Expected object to have valid timestamp`,
            pass: hasTimestamp,
        };
    },
    toBeRecentTimestamp(received, maxAgeMs = 60000) {
        const timestamp = received.timestamp || received;
        const timestampMs = timestamp instanceof Date
            ? timestamp.getTime()
            : typeof timestamp === "string"
                ? new Date(timestamp).getTime()
                : typeof timestamp === "number"
                    ? timestamp
                    : 0;
        const age = Date.now() - timestampMs;
        const isRecent = age >= 0 && age <= maxAgeMs;
        return {
            message: () => isRecent
                ? `Expected timestamp to be older than ${maxAgeMs}ms`
                : `Expected timestamp to be recent (within ${maxAgeMs}ms), but it's ${age}ms old`,
            pass: isRecent,
        };
    },
    toHaveEventualConsistency(received, otherStates, timeoutMs = 5000) {
        // Mock implementation for eventual consistency check
        // In real implementation, this would wait for states to converge
        const hasConsistency = otherStates.every((state) => JSON.stringify(received) === JSON.stringify(state));
        return {
            message: () => hasConsistency
                ? `Expected states to be inconsistent`
                : `Expected eventual consistency between states`,
            pass: hasConsistency,
        };
    },
});
export {};
//# sourceMappingURL=custom-matchers.js.map
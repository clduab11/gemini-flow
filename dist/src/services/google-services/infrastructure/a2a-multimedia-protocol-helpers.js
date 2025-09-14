/**
 * A2A Multimedia Protocol Helper Methods
 * Additional helper methods for the main protocol implementation
 */
import { Logger } from "../../../utils/logger.js";
export class ProtocolHelpers {
    logger;
    constructor() {
        this.logger = new Logger("ProtocolHelpers");
    }
    // ==================== ROUTING HELPERS ====================
    async establishRoutingPath(sessionId, agentId) {
        this.logger.debug("Establishing routing path", { sessionId, agentId });
        // Simulate routing path establishment
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    async deliverMessage(message, targetId) {
        this.logger.debug("Delivering message", {
            messageId: message.id,
            targetId,
            type: message.type,
        });
        // Simulate message delivery
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 20 + 5));
        // Simulate delivery success/failure (95% success rate)
        return Math.random() > 0.05;
    }
    async handleRoutingFailover(message, failedHop) {
        this.logger.warn("Attempting routing failover", {
            messageId: message.id,
            failedHop,
        });
        // Simulate failover attempt
        const alternatives = message.routing.failover.alternatives || [];
        for (const alternative of alternatives) {
            try {
                const delivered = await this.deliverMessage(message, alternative);
                if (delivered) {
                    this.logger.info("Failover successful", {
                        messageId: message.id,
                        alternative,
                    });
                    return true;
                }
            }
            catch (error) {
                this.logger.debug("Failover attempt failed", {
                    messageId: message.id,
                    alternative,
                    error: error.message,
                });
            }
        }
        this.logger.error("All failover attempts failed", {
            messageId: message.id,
        });
        return false;
    }
    updateRoutingStatistics(message, success) {
        this.logger.debug("Updating routing statistics", {
            messageId: message.id,
            success,
            hops: message.routing.hops,
        });
        // In production, update actual routing statistics
    }
    // ==================== STREAMING HELPERS ====================
    async createWebRTCEndpoint(streamId, config) {
        this.logger.debug("Creating WebRTC endpoint", { streamId });
        // Simulate WebRTC endpoint creation
        await new Promise((resolve) => setTimeout(resolve, 50));
        return `webrtc://${streamId}.example.com:${Math.floor(Math.random() * 1000) + 8000}`;
    }
    async createHttpStreamingEndpoint(streamId, targetAgent, config) {
        this.logger.debug("Creating HTTP streaming endpoint", {
            streamId,
            targetAgent,
        });
        // Simulate HTTP endpoint creation
        await new Promise((resolve) => setTimeout(resolve, 20));
        return `https://stream.example.com/${streamId}/${targetAgent}`;
    }
    async createMulticastEndpoint(streamId, config) {
        this.logger.debug("Creating multicast endpoint", { streamId });
        // Simulate multicast endpoint creation
        await new Promise((resolve) => setTimeout(resolve, 30));
        const multicastGroup = `224.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const port = Math.floor(Math.random() * 1000) + 9000;
        return `multicast://${multicastGroup}:${port}`;
    }
    // ==================== STATISTICS HELPERS ====================
    async calculateMessageStatistics(sessionId) {
        // Simulate message statistics calculation with realistic data
        const sent = Math.floor(Math.random() * 5000) + 1000;
        const received = Math.floor(sent * (0.95 + Math.random() * 0.04)); // 95-99% delivery rate
        const dropped = sent - received;
        const retransmitted = Math.floor(dropped * 0.8); // 80% of dropped messages retransmitted
        const duplicate = Math.floor(retransmitted * 0.1); // 10% duplicates
        return {
            sent,
            received,
            dropped,
            retransmitted,
            duplicate,
        };
    }
    async calculateBandwidthStatistics(sessionId) {
        // Simulate bandwidth statistics with realistic patterns
        const uploadCurrent = Math.random() * 2000000 + 500000; // 0.5-2.5 Mbps
        const downloadCurrent = Math.random() * 5000000 + 1000000; // 1-6 Mbps
        const uploadAverage = uploadCurrent * (0.8 + Math.random() * 0.2);
        const downloadAverage = downloadCurrent * (0.8 + Math.random() * 0.2);
        return {
            upload: {
                current: uploadCurrent,
                average: uploadAverage,
                peak: uploadCurrent * (1.2 + Math.random() * 0.5),
                utilization: Math.random() * 0.3 + 0.6, // 60-90%
            },
            download: {
                current: downloadCurrent,
                average: downloadAverage,
                peak: downloadCurrent * (1.2 + Math.random() * 0.5),
                utilization: Math.random() * 0.3 + 0.6, // 60-90%
            },
            total: {
                current: uploadCurrent + downloadCurrent,
                average: uploadAverage + downloadAverage,
                peak: (uploadCurrent + downloadCurrent) * (1.2 + Math.random() * 0.5),
                utilization: Math.random() * 0.3 + 0.6, // 60-90%
            },
        };
    }
    async calculateLatencyStatistics(sessionId) {
        // Simulate latency statistics with realistic distribution
        const base = Math.random() * 50 + 30; // 30-80ms base latency
        const jitter = Math.random() * 20; // Up to 20ms jitter
        const current = base + (Math.random() - 0.5) * jitter;
        const average = base;
        const min = base * 0.7;
        const max = base * 2.5;
        return {
            current,
            average,
            min,
            max,
            p50: base * 0.9,
            p95: base * 1.8,
            p99: base * 2.2,
        };
    }
    async calculateQualityStatistics(sessionId) {
        // Simulate quality statistics based on network conditions
        const networkCondition = Math.random(); // 0 = poor, 1 = excellent
        const baseQuality = 60 + networkCondition * 35; // 60-95 base quality
        const stability = 70 + networkCondition * 25; // 70-95 stability
        const consistency = 65 + networkCondition * 30; // 65-95 consistency
        return {
            overall: {
                overall: baseQuality + (Math.random() - 0.5) * 10,
                stability: stability + (Math.random() - 0.5) * 10,
                consistency: consistency + (Math.random() - 0.5) * 10,
            },
        };
    }
    async calculateErrorStatistics(sessionId) {
        // Simulate error statistics with realistic error distribution
        const baseErrorRate = Math.random() * 0.05; // 0-5% error rate
        const totalRequests = Math.floor(Math.random() * 10000) + 1000;
        const totalErrors = Math.floor(totalRequests * baseErrorRate);
        const errorTypes = {
            network_timeout: Math.floor(totalErrors * 0.4),
            routing_failed: Math.floor(totalErrors * 0.25),
            compression_error: Math.floor(totalErrors * 0.15),
            security_violation: Math.floor(totalErrors * 0.1),
            protocol_error: Math.floor(totalErrors * 0.1),
        };
        const recoveryAttempts = Math.floor(totalErrors * 1.5);
        const successfulRecoveries = Math.floor(recoveryAttempts * 0.8);
        return {
            total: totalErrors,
            rate: baseErrorRate,
            types: errorTypes,
            recovery: {
                attempts: recoveryAttempts,
                successful: successfulRecoveries,
                failed: recoveryAttempts - successfulRecoveries,
                averageTime: Math.random() * 2000 + 500, // 500-2500ms
            },
        };
    }
    // ==================== UTILITY HELPERS ====================
    generateUniqueId(prefix = "id") {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateChecksum(data) {
        // Simple checksum calculation (in production, use crypto hash)
        const str = typeof data === "string" ? data : JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    formatLatency(ms) {
        if (ms < 1000) {
            return `${Math.round(ms)}ms`;
        }
        else {
            return `${(ms / 1000).toFixed(2)}s`;
        }
    }
    calculatePercentile(values, percentile) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        if (Math.floor(index) === index) {
            return sorted[index];
        }
        else {
            const lower = sorted[Math.floor(index)];
            const upper = sorted[Math.ceil(index)];
            return lower + (upper - lower) * (index - Math.floor(index));
        }
    }
    validateConfiguration(config) {
        const errors = [];
        // Basic configuration validation
        if (!config) {
            errors.push("Configuration is required");
            return { valid: false, errors };
        }
        // Validate timeout values
        if (config.timeout && (config.timeout < 0 || config.timeout > 300000)) {
            errors.push("Timeout must be between 0 and 300000ms");
        }
        // Validate bandwidth limits
        if (config.maxBandwidth && config.maxBandwidth < 0) {
            errors.push("Maximum bandwidth must be positive");
        }
        // Validate compression settings
        if (config.compression && config.compression.level) {
            if (config.compression.level < 0 || config.compression.level > 9) {
                errors.push("Compression level must be between 0 and 9");
            }
        }
        return { valid: errors.length === 0, errors };
    }
    sanitizeUserInput(input) {
        // Basic input sanitization
        return input
            .replace(/[<>\"'&]/g, "") // Remove potentially dangerous characters
            .trim()
            .slice(0, 1000); // Limit length
    }
    createRetryStrategy(maxAttempts = 3, baseDelay = 1000) {
        let attempt = 0;
        return {
            get attempt() {
                return attempt;
            },
            shouldRetry: (error) => {
                return attempt < maxAttempts && !error.permanent;
            },
            getDelay: () => {
                return baseDelay * Math.pow(2, attempt); // Exponential backoff
            },
            retry: () => {
                attempt++;
            },
        };
    }
}
export const protocolHelpers = new ProtocolHelpers();
//# sourceMappingURL=a2a-multimedia-protocol-helpers.js.map
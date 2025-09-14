/**
 * Simple A2A Adapter (Fallback Implementation)
 *
 * Minimal implementation for environments where full A2A protocol is not available
 */
import { Logger } from "../utils/logger.js";
export class SimpleA2AAdapter {
    logger;
    initialized = false;
    topology;
    constructor(options) {
        this.logger = new Logger("SimpleA2AAdapter");
        this.topology = options.topology;
    }
    async initialize() {
        this.logger.info(`Simple A2A adapter initialized (fallback mode) with ${this.topology} topology`);
        this.initialized = true;
    }
    isInitialized() {
        return this.initialized;
    }
    async send(message) {
        this.logger.debug("A2A message sent (no-op in fallback mode)", { message });
        return { status: "fallback", message: "A2A not available" };
    }
    async receive() {
        return [];
    }
    async cleanup() {
        this.initialized = false;
    }
}
//# sourceMappingURL=simple-a2a-adapter.js.map
/**
 * Simple MCP Bridge (Fallback Implementation)
 *
 * Minimal implementation for environments where full MCP protocol is not available
 */
import { Logger } from "../utils/logger.js";
export class SimpleMCPBridge {
    logger;
    initialized = false;
    topology;
    constructor(options) {
        this.logger = new Logger("SimpleMCPBridge");
        this.topology = options.topology;
    }
    async initialize() {
        this.logger.info(`Simple MCP bridge initialized (fallback mode) with ${this.topology} topology`);
        this.initialized = true;
    }
    isInitialized() {
        return this.initialized;
    }
    async bridge(request) {
        this.logger.debug("MCP request bridged (no-op in fallback mode)", {
            request,
        });
        return { status: "fallback", message: "MCP not available" };
    }
    async cleanup() {
        this.initialized = false;
    }
}

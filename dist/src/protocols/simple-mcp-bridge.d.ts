/**
 * Simple MCP Bridge (Fallback Implementation)
 *
 * Minimal implementation for environments where full MCP protocol is not available
 */
import { TopologyType } from "./protocol-activator.js";
export declare class SimpleMCPBridge {
    private logger;
    private initialized;
    private topology;
    constructor(options: {
        topology: TopologyType;
    });
    initialize(): Promise<void>;
    isInitialized(): boolean;
    bridge(request: any): Promise<any>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=simple-mcp-bridge.d.ts.map
/**
 * Simple A2A Adapter (Fallback Implementation)
 *
 * Minimal implementation for environments where full A2A protocol is not available
 */
import { TopologyType } from "./protocol-activator.js";
export declare class SimpleA2AAdapter {
    private logger;
    private initialized;
    private topology;
    constructor(options: {
        topology: TopologyType;
    });
    initialize(): Promise<void>;
    isInitialized(): boolean;
    send(message: any): Promise<any>;
    receive(): Promise<any[]>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=simple-a2a-adapter.d.ts.map
/**
 * Context Optimizer
 *
 * Optimizes context and prompts for better model performance
 */
import { MCPRequest } from "../types/mcp.js";
export declare class ContextOptimizer {
    private logger;
    constructor();
    /**
     * Optimize request for better performance
     */
    optimize(request: MCPRequest): Promise<MCPRequest>;
}
//# sourceMappingURL=context-optimizer.d.ts.map
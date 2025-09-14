/**
 * Dependency Graph
 *
 * Manages dependencies between operations for parallel execution
 */
export declare class DependencyGraph {
    private nodes;
    private dependencies;
    private logger;
    constructor();
    addNode(id: string, data: any): void;
    addDependency(nodeId: string, dependsOnId: string): void;
    getExecutionOrder(): string[][];
    hasCycles(): boolean;
    clear(): void;
}
//# sourceMappingURL=dependency-graph.d.ts.map
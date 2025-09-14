/**
 * SPARC Development Modes
 *
 * 17 specialized development modes for systematic TDD with AI assistance
 */
export interface SparcMode {
    id: string;
    name: string;
    description: string;
    phases: string[];
    agents: string[];
    workflow: string;
    temperature?: number;
    maxTokens?: number;
}
export declare const SPARC_MODES: Record<string, SparcMode>;
export declare enum SparcWorkflow {
    Sequential = "sequential",// Phases execute one after another
    Parallel = "parallel",// Phases can execute simultaneously
    Iterative = "iterative",// Phases repeat in cycles
    Pipeline = "pipeline",// Continuous flow through phases
    Collaborative = "collaborative",// Agents work together on phases
    Specialized = "specialized"
}
export interface SparcPhase {
    id: string;
    name: string;
    description: string;
    requiredAgents: string[];
    outputs: string[];
    successCriteria: string[];
}
export declare const SPARC_PHASES: Record<string, SparcPhase>;
export declare class SparcModeRunner {
    private mode;
    constructor(mode: SparcMode);
    execute(task: string, options?: any): Promise<any>;
}
//# sourceMappingURL=sparc-modes.d.ts.map
#!/usr/bin/env node
/**
 * Analyze Command - Repository/git analysis with tech debt reporting
 * Implements Command Bible analyze functionality
 */
import { Command } from "commander";
export declare class AnalyzeCommand extends Command {
    constructor();
    analyzeAction(options: any): Promise<void>;
    private analyzeRepositoryStructure;
    private analyzeGitHistory;
}
//# sourceMappingURL=analyze.d.ts.map
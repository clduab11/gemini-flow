#!/usr/bin/env node
/**
 * Generate Command - AI-powered code generation using learned styles
 * Implements Command Bible generate functionality
 */
import { Command } from "commander";
export declare class GenerateCommand extends Command {
    constructor();
    generateAction(description: string, options: any): Promise<void>;
    private loadStyleProfile;
    private writeGeneratedFiles;
}
//# sourceMappingURL=generate.d.ts.map
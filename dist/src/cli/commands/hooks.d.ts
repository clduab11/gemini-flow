/**
 * Hooks Command - Lifecycle Event Management
 *
 * Implements hook system for automated coordination
 */
import { Command } from "commander";
export declare class HooksCommand extends Command {
    private logger;
    constructor();
    private preTask;
    private postEdit;
    private postTask;
    private sessionRestore;
    private sessionEnd;
    private notify;
    private preSearch;
}
export default HooksCommand;
//# sourceMappingURL=hooks.d.ts.map
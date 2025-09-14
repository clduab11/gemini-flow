/**
 * Security Optimization Flags CLI Commands
 *
 * Command-line interface for all security-focused optimization flags:
 * --auto-route, --cost-optimize, --canary-deploy, --slack-updates,
 * --analyze-self, --meta-optimization
 */
import { Command } from "commander";
export declare class SecurityFlagsCommand extends Command {
    private logger;
    private securityManager;
    constructor();
    private setupCommands;
    private initializeSecurityManager;
    private handleAutoRoute;
    private handleCostOptimize;
    private handleCanaryDeploy;
    private handleSlackUpdates;
    private handleAnalyzeSelf;
    private handleMetaOptimization;
    private handleStatus;
    private handleDisable;
    private handleEmergencyStop;
    private handleSecurityLockdown;
}
//# sourceMappingURL=security-flags.d.ts.map
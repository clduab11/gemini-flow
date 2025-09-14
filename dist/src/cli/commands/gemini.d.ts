/**
 * Gemini Command Module
 *
 * Standalone command for Gemini CLI integration and context management
 */
import { Command } from "commander";
export declare class GeminiCommand extends Command {
    private logger;
    private integrationService;
    private quantumService;
    constructor();
    private createDetectCommand;
    private createContextCommand;
    private createStatusCommand;
    private createSetupCommand;
    private createQuantumCommand;
    private createPortfolioCommand;
    private createDrugDiscoveryCommand;
    private createCryptoCommand;
    private createClimateCommand;
    private generateDemoAssets;
    private generateDrugDiscoveryData;
    private generateRandomSMILES;
}
export default GeminiCommand;
//# sourceMappingURL=gemini.d.ts.map
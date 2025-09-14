export interface HiveMindSpawnOptions {
    agents?: number;
    workers?: number;
    autoScale?: boolean;
    faultTolerance?: boolean;
    consensus?: string;
}
export declare class HiveMindManager {
    private logger;
    constructor();
    spawn(objective: string, options: HiveMindSpawnOptions): Promise<void>;
}
//# sourceMappingURL=hive-mind-manager.d.ts.map
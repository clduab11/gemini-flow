export let testEnvironment: string;
export let testMatch: string[];
export let collectCoverage: boolean;
export let coverageDirectory: string;
export let coverageReporters: string[];
export let collectCoverageFrom: string[];
export let coverageThreshold: {
    global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
    './src/core/': {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
    };
};
export let setupFilesAfterEnv: string[];
export let testTimeout: number;
export let modulePaths: string[];
export let transform: {
    '^.+\\.jsx?$': string;
};
export let maxWorkers: string;
export let testResultsProcessor: string;
export let reporters: (string | (string | {
    outputFile: string;
})[] | (string | {
    outputDirectory: string;
    outputName: string;
})[])[];
export namespace globals {
    let TEST_ENVIRONMENT: string;
    let PERFORMANCE_MONITORING: boolean;
    let SWARM_TEST_MODE: boolean;
}
export let verbose: boolean;
export let clearMocks: boolean;
export let restoreMocks: boolean;
export let errorOnDeprecated: boolean;
export let projects: ({
    displayName: string;
    testMatch: string[];
    testTimeout: number;
    globals?: undefined;
} | {
    displayName: string;
    testMatch: string[];
    testTimeout: number;
    globals: {
        PERFORMANCE_MODE: boolean;
    };
})[];
//# sourceMappingURL=jest.config.d.ts.map
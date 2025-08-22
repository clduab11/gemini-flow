export let testEnvironment: string;
export let rootDir: string;
export let testMatch: string[];
export let collectCoverage: boolean;
export let coverageDirectory: string;
export let coverageReporters: string[];
export let collectCoverageFrom: string[];
export namespace coverageThreshold {
    namespace global {
        let branches: number;
        let functions: number;
        let lines: number;
        let statements: number;
    }
}
export let setupFilesAfterEnv: string[];
export let testTimeout: number;
export let moduleNameMapping: {
    '^@/(.*)$': string;
    '^@tests/(.*)$': string;
};
export let transform: {
    '^.+\\.(js|jsx|ts|tsx)$': (string | {
        presets: (string | (string | {
            targets: {
                node: string;
            };
        })[])[];
    })[];
};
export let moduleFileExtensions: string[];
export let reporters: (string | (string | {
    publicPath: string;
    filename: string;
    expand: boolean;
    hideIcon: boolean;
    pageTitle: string;
})[] | (string | {
    outputDirectory: string;
    outputName: string;
    suiteName: string;
})[])[];
export let verbose: boolean;
export let bail: boolean;
export let maxWorkers: string;
export let projects: {
    displayName: string;
    testMatch: string[];
    testTimeout: number;
}[];
export namespace globals {
    let __TEST_ENV__: boolean;
    let __VERSION__: string;
}
export let clearMocks: boolean;
export let restoreMocks: boolean;
export namespace testEnvironmentOptions {
    let NODE_ENV: string;
}
export let watchman: boolean;
export let watchPathIgnorePatterns: string[];
export let errorOnDeprecated: boolean;
export let setupFiles: string[];
//# sourceMappingURL=jest.config.d.cts.map
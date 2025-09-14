/**
 * @interface DocGeneratorConfig
 * @description Configuration for the Documentation Generator.
 */
export interface DocGeneratorConfig {
    outputDir: string;
    sourceDirs: {
        user: string;
        developer: string;
        operations: string;
    };
}
/**
 * @interface DocGeneratorOperations
 * @description Defines operations for generating comprehensive documentation.
 */
export interface DocGeneratorOperations {
    generateAllDocumentation(): Promise<void>;
    generateUserDocumentation(): Promise<void>;
    generateDeveloperDocumentation(): Promise<void>;
    generateOperationsDocumentation(): Promise<void>;
}
/**
 * @class DocumentationGenerator
 * @description Orchestrates the generation of comprehensive documentation for users, developers, and operations.
 */
export declare class DocumentationGenerator implements DocGeneratorOperations {
    private config;
    private logger;
    constructor(config: DocGeneratorConfig);
    /**
     * Generates all types of documentation (user, developer, operations).
     * @returns {Promise<void>}
     */
    generateAllDocumentation(): Promise<void>;
    /**
     * Generates user documentation.
     * @returns {Promise<void>}
     */
    generateUserDocumentation(): Promise<void>;
    /**
     * Generates developer documentation.
     * @returns {Promise<void>}
     */
    generateDeveloperDocumentation(): Promise<void>;
    /**
     * Generates operations documentation.
     * @returns {Promise<void>}
     */
    generateOperationsDocumentation(): Promise<void>;
}
//# sourceMappingURL=documentation-generator.d.ts.map
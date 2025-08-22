/**
 * Jest Test Setup
 * Global test configuration and utilities
 */
declare global {
    var testUtils: {
        delay: (ms: number) => Promise<void>;
        expectAsync: (asyncFn: () => Promise<any>) => Promise<boolean>;
        createMockResponse: (success?: boolean, data?: any) => any;
        generateRandomId: () => string;
        createMockStream: (config?: any) => any;
        waitForCondition: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<boolean>;
        expectToBeBetween: (actual: number, min: number, max: number) => void;
        expectArrayToContainObjectWithProperty: (array: any[], property: string, value: any) => void;
    };
}
export {};
//# sourceMappingURL=setup.d.ts.map
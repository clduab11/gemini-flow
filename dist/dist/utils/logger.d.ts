/**
 * Cross-Platform Logger Utility
 *
 * Provides consistent logging across Node.js environments
 * with fallback for environments without winston
 */
export const LogLevel: any;
export class Logger {
    constructor(name: any, level?: any);
    name: any;
    level: any;
    winston: any;
    getName(): any;
    initializeWinston(): Promise<void>;
    error(message: any, ...args: any[]): void;
    warn(message: any, ...args: any[]): void;
    info(message: any, ...args: any[]): void;
    debug(message: any, ...args: any[]): void;
    log(level: any, message: any, ...args: any[]): void;
    levelToString(level: any): "error" | "warn" | "info" | "debug";
    setLevel(level: any): void;
}
//# sourceMappingURL=logger.d.ts.map
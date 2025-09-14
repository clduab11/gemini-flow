/**
 * Cross-Platform Logger Utility
 *
 * Provides consistent logging across Node.js environments
 * with fallback for environments without winston
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export declare class Logger {
    private name;
    private level;
    private winston;
    constructor(name: string, level?: LogLevel);
    getName(): string;
    private initializeWinston;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    private log;
    private levelToString;
    setLevel(level: LogLevel): void;
}
//# sourceMappingURL=logger.d.ts.map
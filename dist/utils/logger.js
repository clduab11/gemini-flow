/**
 * Cross-Platform Logger Utility
 *
 * Provides consistent logging across Node.js environments
 * with fallback for environments without winston
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    name;
    level;
    winston;
    constructor(name, level = LogLevel.INFO) {
        this.name = name;
        this.level = level;
        this.initializeWinston();
    }
    // Green: Added getName method to make TDD test pass
    getName() {
        return this.name;
    }
    async initializeWinston() {
        try {
            const winston = require('winston');
            this.winston = winston.createLogger({
                level: this.levelToString(this.level),
                format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${this.name}] ${level.toUpperCase()}: ${message}`;
                })),
                transports: [new winston.transports.Console()],
            });
        }
        catch (error) {
            // Fallback to console logging if winston is not available
            this.winston = null;
        }
    }
    error(message, ...args) {
        if (this.level >= LogLevel.ERROR) {
            this.log("error", message, ...args);
        }
    }
    warn(message, ...args) {
        if (this.level >= LogLevel.WARN) {
            this.log("warn", message, ...args);
        }
    }
    info(message, ...args) {
        if (this.level >= LogLevel.INFO) {
            this.log("info", message, ...args);
        }
    }
    debug(message, ...args) {
        if (this.level >= LogLevel.DEBUG) {
            this.log("debug", message, ...args);
        }
    }
    log(level, message, ...args) {
        // Skip logging in test environment to avoid console noise
        if (process.env.NODE_ENV === "test") {
            return;
        }
        if (this.winston) {
            this.winston[level](message, ...args);
        }
        else {
            // Fallback to console
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} [${this.name}] ${level.toUpperCase()}: ${message}`;
            switch (level) {
                case "error":
                    console.error(logMessage, ...args);
                    break;
                case "warn":
                    console.warn(logMessage, ...args);
                    break;
                case "info":
                    console.info(logMessage, ...args);
                    break;
                case "debug":
                    console.debug(logMessage, ...args);
                    break;
                default:
                    console.log(logMessage, ...args);
            }
        }
    }
    levelToString(level) {
        switch (level) {
            case LogLevel.ERROR:
                return "error";
            case LogLevel.WARN:
                return "warn";
            case LogLevel.INFO:
                return "info";
            case LogLevel.DEBUG:
                return "debug";
            default:
                return "info";
        }
    }
    setLevel(level) {
        this.level = level;
        if (this.winston) {
            this.winston.level = this.levelToString(level);
        }
    }
}

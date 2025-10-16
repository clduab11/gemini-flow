/**
 * Jules Tools Integration Types
 *
 * Type definitions for Jules API/CLI integration
 */
/**
 * Jules error types
 */
export var JulesErrorType;
(function (JulesErrorType) {
    JulesErrorType["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    JulesErrorType["INVALID_CONFIGURATION"] = "INVALID_CONFIGURATION";
    JulesErrorType["TASK_CREATION_FAILED"] = "TASK_CREATION_FAILED";
    JulesErrorType["TASK_NOT_FOUND"] = "TASK_NOT_FOUND";
    JulesErrorType["TASK_EXECUTION_FAILED"] = "TASK_EXECUTION_FAILED";
    JulesErrorType["API_ERROR"] = "API_ERROR";
    JulesErrorType["CLI_ERROR"] = "CLI_ERROR";
    JulesErrorType["GITHUB_AUTH_FAILED"] = "GITHUB_AUTH_FAILED";
    JulesErrorType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    JulesErrorType["VM_TIMEOUT"] = "VM_TIMEOUT";
    JulesErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    JulesErrorType["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    JulesErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(JulesErrorType || (JulesErrorType = {}));
/**
 * Jules error
 */
export class JulesError extends Error {
    constructor(message, type, options) {
        super(message);
        this.name = 'JulesError';
        this.type = type;
        this.taskId = options?.taskId;
        this.statusCode = options?.statusCode;
        this.details = options?.details;
        if (options?.cause) {
            this.cause = options.cause;
        }
    }
}

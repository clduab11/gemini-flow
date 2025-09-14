/**
 * @interface SecurityConfig
 * @description Configuration for Enterprise Security.
 */
export interface SecurityConfig {
    enableEncryption: boolean;
    iamIntegration: boolean;
    apiRateLimit: number;
}
/**
 * @interface SecurityOperations
 * @description Defines operations for enterprise-grade security.
 */
export interface SecurityOperations {
    encryptData(data: string): Promise<string>;
    decryptData(encryptedData: string): Promise<string>;
    checkIAMPermissions(userId: string, resource: string, action: string): Promise<boolean>;
    auditLog(action: string, userId: string, details: any): Promise<void>;
    runSecurityScan(target: string): Promise<any>;
}
/**
 * @class EnterpriseSecurity
 * @description Implements enterprise-grade security features including encryption, IAM integration, and audit logging.
 */
export declare class EnterpriseSecurity implements SecurityOperations {
    private config;
    private logger;
    constructor(config: SecurityConfig);
    /**
     * Encrypts data using a secure encryption mechanism (conceptual).
     * @param {string} data The data to encrypt.
     * @returns {Promise<string>} The encrypted data.
     */
    encryptData(data: string): Promise<string>;
    /**
     * Decrypts data using a secure decryption mechanism (conceptual).
     * @param {string} encryptedData The encrypted data.
     * @returns {Promise<string>} The decrypted data.
     */
    decryptData(encryptedData: string): Promise<string>;
    /**
     * Checks Google Cloud IAM permissions for a user/service account (conceptual).
     * @param {string} userId The ID of the user or service account.
     * @param {string} resource The resource to check access for.
     * @param {string} action The action to check (e.g., 'read', 'write').
     * @returns {Promise<boolean>} True if permission is granted, false otherwise.
     */
    checkIAMPermissions(userId: string, resource: string, action: string): Promise<boolean>;
    /**
     * Logs an audit entry for system operations and user actions (conceptual).
     * @param {string} action The action performed.
     * @param {string} userId The ID of the user or agent performing the action.
     * @param {any} details Additional details about the action.
     * @returns {Promise<void>}
     */
    auditLog(action: string, userId: string, details: any): Promise<void>;
    /**
     * Runs a security scan on a specified target (conceptual).
     * @param {string} target The target for the security scan (e.g., 'api_endpoint', 'gcs_bucket').
     * @returns {Promise<any>} The scan results.
     */
    runSecurityScan(target: string): Promise<any>;
}
//# sourceMappingURL=security.d.ts.map
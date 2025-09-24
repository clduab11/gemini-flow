/**
 * Secure API Key Management System
 *
 * Provides enterprise-grade security for API key storage, rotation,
 * access control, and audit logging. Implements multiple layers of
 * protection including encryption, access controls, and monitoring.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface ApiKeyMetadata {
  name: string;
  description: string;
  createdAt: Date;
  lastRotated: Date;
  expiresAt?: Date;
  permissions: string[];
  accessLevel: 'read' | 'write' | 'admin';
  rotationDays: number;
  isActive: boolean;
}

interface KeyRotationConfig {
  keyName: string;
  rotationIntervalDays: number;
  autoRotate: boolean;
  backupEnabled: boolean;
  notificationEnabled: boolean;
}

interface SecurityAuditLog {
  timestamp: Date;
  action: 'access' | 'rotate' | 'create' | 'delete' | 'validate';
  keyName: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: string;
}

export class SecureKeyManager {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;

  private static readonly DEFAULT_CONFIGS: Record<string, KeyRotationConfig> = {
    'GITHUB_PERSONAL_ACCESS_TOKEN': {
      keyName: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      rotationIntervalDays: 90,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: true
    },
    'SUPABASE_ACCESS_TOKEN': {
      keyName: 'SUPABASE_ACCESS_TOKEN',
      rotationIntervalDays: 30,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: true
    },
    'TAVILY_API_KEY': {
      keyName: 'TAVILY_API_KEY',
      rotationIntervalDays: 365,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: false
    },
    'PERPLEXITY_API_KEY': {
      keyName: 'PERPLEXITY_API_KEY',
      rotationIntervalDays: 365,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: false
    },
    'KAGI_API_KEY': {
      keyName: 'KAGI_API_KEY',
      rotationIntervalDays: 365,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: false
    },
    'JINA_AI_API_KEY': {
      keyName: 'JINA_AI_API_KEY',
      rotationIntervalDays: 365,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: false
    },
    'BRAVE_API_KEY': {
      keyName: 'BRAVE_API_KEY',
      rotationIntervalDays: 365,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: false
    },
    'FIRECRAWL_API_KEY': {
      keyName: 'FIRECRAWL_API_KEY',
      rotationIntervalDays: 365,
      autoRotate: false,
      backupEnabled: true,
      notificationEnabled: false
    }
  };

  private static masterKey: Buffer | null = null;
  private static keyMetadata: Map<string, ApiKeyMetadata> = new Map();
  private static auditLogs: SecurityAuditLog[] = [];
  private static readonly STORAGE_PATH = path.join(process.cwd(), '.secure', 'keys');
  private static readonly AUDIT_LOG_PATH = path.join(process.cwd(), '.secure', 'audit.log');

  /**
   * Initialize the secure key manager
   */
  public static async initialize(): Promise<void> {
    console.log('🔐 Initializing Secure Key Manager...');

    // Ensure secure storage directories exist
    await this.ensureSecureStorage();

    // Load master encryption key
    await this.loadMasterKey();

    // Load existing key metadata
    await this.loadKeyMetadata();

    // Load audit logs
    await this.loadAuditLogs();

    console.log('✅ Secure Key Manager initialized successfully');
  }

  /**
   * Store an API key securely with encryption
   */
  public static async storeApiKey(
    keyName: string,
    apiKey: string,
    metadata: Partial<ApiKeyMetadata> = {}
  ): Promise<void> {
    const auditEntry: SecurityAuditLog = {
      timestamp: new Date(),
      action: 'create',
      keyName,
      success: false
    };

    try {
      if (!this.masterKey) {
        throw new Error('Master key not initialized');
      }

      // Validate API key format before storing
      this.validateApiKeyFormat(keyName, apiKey);

      // Encrypt the API key
      const encryptedKey = this.encryptApiKey(apiKey);

      // Create metadata
      const keyMetadata: ApiKeyMetadata = {
        name: keyName,
        description: metadata.description || `${keyName} API key`,
        createdAt: new Date(),
        lastRotated: new Date(),
        expiresAt: metadata.expiresAt,
        permissions: metadata.permissions || ['read'],
        accessLevel: metadata.accessLevel || 'read',
        rotationDays: metadata.rotationDays || this.DEFAULT_CONFIGS[keyName]?.rotationIntervalDays || 365,
        isActive: true
      };

      // Store encrypted key
      const keyPath = path.join(this.STORAGE_PATH, `${keyName}.enc`);
      await fs.promises.writeFile(keyPath, encryptedKey);

      // Store metadata
      this.keyMetadata.set(keyName, keyMetadata);
      await this.saveKeyMetadata();

      // Set environment variable for immediate use
      process.env[keyName] = apiKey;

      // Log successful operation
      auditEntry.success = true;
      this.auditLogs.push(auditEntry);
      await this.saveAuditLogs();

      console.log(`✅ API key ${keyName} stored securely`);
    } catch (error) {
      auditEntry.success = false;
      auditEntry.details = error instanceof Error ? error.message : 'Unknown error';
      this.auditLogs.push(auditEntry);
      await this.saveAuditLogs();

      throw new Error(`Failed to store API key ${keyName}: ${auditEntry.details}`);
    }
  }

  /**
   * Retrieve and decrypt an API key
   */
  public static async getApiKey(keyName: string): Promise<string | null> {
    const auditEntry: SecurityAuditLog = {
      timestamp: new Date(),
      action: 'access',
      keyName,
      success: false
    };

    try {
      // Check if key exists in environment (for development)
      const envKey = process.env[keyName];
      if (envKey && !envKey.includes('YOUR_') && !envKey.includes('_HERE')) {
        auditEntry.success = true;
        this.auditLogs.push(auditEntry);
        return envKey;
      }

      // Try to load from secure storage
      const keyPath = path.join(this.STORAGE_PATH, `${keyName}.enc`);
      if (!fs.existsSync(keyPath)) {
        throw new Error('API key not found in secure storage');
      }

      const encryptedData = await fs.promises.readFile(keyPath);
      const decryptedKey = this.decryptApiKey(encryptedData);

      // Set in environment for current session
      process.env[keyName] = decryptedKey;

      auditEntry.success = true;
      this.auditLogs.push(auditEntry);
      await this.saveAuditLogs();

      return decryptedKey;
    } catch (error) {
      auditEntry.success = false;
      auditEntry.details = error instanceof Error ? error.message : 'Unknown error';
      this.auditLogs.push(auditEntry);
      await this.saveAuditLogs();

      console.error(`❌ Failed to retrieve API key ${keyName}: ${auditEntry.details}`);
      return null;
    }
  }

  /**
   * Rotate an API key with backup and validation
   */
  public static async rotateApiKey(
    keyName: string,
    newApiKey: string,
    userId?: string
  ): Promise<void> {
    const auditEntry: SecurityAuditLog = {
      timestamp: new Date(),
      action: 'rotate',
      keyName,
      userId,
      success: false
    };

    try {
      if (!this.masterKey) {
        throw new Error('Master key not initialized');
      }

      // Validate new API key
      this.validateApiKeyFormat(keyName, newApiKey);

      // Create backup of current key if it exists
      const currentKey = await this.getApiKey(keyName);
      if (currentKey) {
        await this.createBackup(keyName, currentKey);
      }

      // Update metadata
      const metadata = this.keyMetadata.get(keyName);
      if (metadata) {
        metadata.lastRotated = new Date();
        metadata.isActive = true;
      }

      // Store new encrypted key
      const encryptedKey = this.encryptApiKey(newApiKey);
      const keyPath = path.join(this.STORAGE_PATH, `${keyName}.enc`);
      await fs.promises.writeFile(keyPath, encryptedKey);

      // Update environment
      process.env[keyName] = newApiKey;

      // Save metadata
      await this.saveKeyMetadata();

      auditEntry.success = true;
      this.auditLogs.push(auditEntry);
      await this.saveAuditLogs();

      console.log(`✅ API key ${keyName} rotated successfully`);
    } catch (error) {
      auditEntry.success = false;
      auditEntry.details = error instanceof Error ? error.message : 'Unknown error';
      this.auditLogs.push(auditEntry);
      await this.saveAuditLogs();

      throw new Error(`Failed to rotate API key ${keyName}: ${auditEntry.details}`);
    }
  }

  /**
   * Validate API key format and requirements
   */
  private static validateApiKeyFormat(keyName: string, apiKey: string): void {
    if (!apiKey || apiKey.trim().length < 10) {
      throw new Error(`API key ${keyName} is too short or empty`);
    }

    // Check for placeholder patterns
    if (apiKey.includes('YOUR_') || apiKey.includes('_HERE') || apiKey.includes('...')) {
      throw new Error(`API key ${keyName} appears to be a placeholder value`);
    }

    // Service-specific validation
    const patterns: Record<string, RegExp> = {
      'GITHUB_PERSONAL_ACCESS_TOKEN': /^github_pat_[A-Za-z0-9_]+$/,
      'SUPABASE_ACCESS_TOKEN': /^sbp_[A-Za-z0-9_]+$/,
      'TAVILY_API_KEY': /^tvly-[A-Za-z0-9_]+$/,
      'PERPLEXITY_API_KEY': /^pplx-[A-Za-z0-9_]+$/,
      'KAGI_API_KEY': /^[A-Za-z0-9_]+$/,
      'JINA_AI_API_KEY': /^jina_[A-Za-z0-9_]+$/,
      'BRAVE_API_KEY': /^BSA[A-Za-z0-9_]+$/,
      'FIRECRAWL_API_KEY': /^fc-[A-Za-z0-9_]+$/
    };

    const pattern = patterns[keyName];
    if (pattern && !pattern.test(apiKey)) {
      throw new Error(`API key ${keyName} format is invalid. Expected format: ${pattern}`);
    }
  }

  /**
   * Encrypt an API key using AES-256-GCM
   */
  private static encryptApiKey(apiKey: string): Buffer {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, this.masterKey);
    cipher.setAAD(Buffer.from('gemini-flow-mcp'));

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag]);
  }

  /**
   * Decrypt an API key using AES-256-GCM
   */
  private static decryptApiKey(encryptedData: Buffer): string {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const iv = encryptedData.subarray(0, this.IV_LENGTH);
    const authTag = encryptedData.subarray(encryptedData.length - 16);
    const encrypted = encryptedData.subarray(this.IV_LENGTH, encryptedData.length - 16);

    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, this.masterKey);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('gemini-flow-mcp'));

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a backup of the current API key
   */
  private static async createBackup(keyName: string, apiKey: string): Promise<void> {
    const backupDir = path.join(this.STORAGE_PATH, 'backups');
    await fs.promises.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${keyName}_${timestamp}.enc`);

    const encryptedBackup = this.encryptApiKey(apiKey);
    await fs.promises.writeFile(backupPath, encryptedBackup);

    // Keep only last 5 backups
    await this.cleanupOldBackups(backupDir, keyName);
  }

  /**
   * Clean up old backups keeping only the most recent ones
   */
  private static async cleanupOldBackups(backupDir: string, keyName: string): Promise<void> {
    const backupFiles = await fs.promises.readdir(backupDir);
    const keyBackups = backupFiles
      .filter(file => file.startsWith(`${keyName}_`) && file.endsWith('.enc'))
      .sort()
      .reverse();

    // Remove all but the 5 most recent backups
    for (let i = 5; i < keyBackups.length; i++) {
      await fs.promises.unlink(path.join(backupDir, keyBackups[i]));
    }
  }

  /**
   * Load the master encryption key
   */
  private static async loadMasterKey(): Promise<void> {
    const keyPath = path.join(this.STORAGE_PATH, 'master.key');

    try {
      // Try to load existing key
      if (fs.existsSync(keyPath)) {
        const keyData = await fs.promises.readFile(keyPath);
        this.masterKey = keyData;
        return;
      }

      // Generate new master key
      this.masterKey = crypto.randomBytes(this.KEY_LENGTH);

      // Save master key with appropriate permissions
      await fs.promises.mkdir(this.STORAGE_PATH, { recursive: true, mode: 0o700 });
      await fs.promises.writeFile(keyPath, this.masterKey, { mode: 0o600 });

      console.log('🔑 Generated new master encryption key');
    } catch (error) {
      throw new Error(`Failed to initialize master key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load key metadata from storage
   */
  private static async loadKeyMetadata(): Promise<void> {
    const metadataPath = path.join(this.STORAGE_PATH, 'metadata.json');

    try {
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
        this.keyMetadata = new Map(Object.entries(metadata));
      }
    } catch (error) {
      console.warn(`Failed to load key metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save key metadata to storage
   */
  private static async saveKeyMetadata(): Promise<void> {
    const metadataPath = path.join(this.STORAGE_PATH, 'metadata.json');
    const metadata = Object.fromEntries(this.keyMetadata);

    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Load audit logs from storage
   */
  private static async loadAuditLogs(): Promise<void> {
    try {
      if (fs.existsSync(this.AUDIT_LOG_PATH)) {
        const logs = JSON.parse(await fs.promises.readFile(this.AUDIT_LOG_PATH, 'utf8'));
        this.auditLogs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn(`Failed to load audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save audit logs to storage
   */
  private static async saveAuditLogs(): Promise<void> {
    // Keep only last 1000 audit entries
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    await fs.promises.writeFile(this.AUDIT_LOG_PATH, JSON.stringify(this.auditLogs, null, 2));
  }

  /**
   * Ensure secure storage directories exist with proper permissions
   */
  private static async ensureSecureStorage(): Promise<void> {
    try {
      await fs.promises.mkdir(this.STORAGE_PATH, { recursive: true, mode: 0o700 });
      await fs.promises.mkdir(path.join(this.STORAGE_PATH, 'backups'), { recursive: true, mode: 0o700 });
    } catch (error) {
      throw new Error(`Failed to create secure storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get audit log summary
   */
  public static getAuditSummary(): SecurityAuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Get key metadata summary
   */
  public static getKeyMetadata(): ApiKeyMetadata[] {
    return Array.from(this.keyMetadata.values());
  }

  /**
   * Check if any API keys need rotation
   */
  public static getKeysNeedingRotation(): string[] {
    const keysNeedingRotation: string[] = [];
    const now = new Date();

    for (const [keyName, metadata] of this.keyMetadata) {
      const daysSinceRotation = Math.floor((now.getTime() - metadata.lastRotated.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceRotation >= metadata.rotationDays) {
        keysNeedingRotation.push(keyName);
      }
    }

    return keysNeedingRotation;
  }
}
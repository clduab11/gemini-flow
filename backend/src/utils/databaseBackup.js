/**
 * Database Backup Manager
 * 
 * Automated backup system with scheduling, compression, and retention policies.
 * 
 * Features:
 * - Scheduled automatic backups
 * - Compression support (gzip)
 * - Retention policies (daily, weekly, monthly)
 * - Backup restoration
 * - Metadata tracking
 * - Storage optimization
 * 
 * @module utils/databaseBackup
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { createModuleLogger } from './logger.js';
import { atomicWriteFile } from './atomicFileOperations.js';

const logger = createModuleLogger('database-backup');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Default backup configuration
 */
const DEFAULT_CONFIG = {
  backupDir: process.env.BACKUP_DIR || './backups',
  schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2 AM daily
  compression: process.env.BACKUP_COMPRESSION === 'true',
  retention: {
    daily: parseInt(process.env.BACKUP_RETENTION_DAILY || '7', 10),
    weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY || '4', 10),
    monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY || '12', 10)
  }
};

/**
 * Database Backup Manager Class
 */
export class DatabaseBackupManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.backupTimer = null;
    this.metadataFile = path.join(this.config.backupDir, 'backup-metadata.json');
    this.metadata = [];
    
    // Ensure backup directory exists
    this.initializeBackupDirectory();
    this.loadMetadata();
  }
  
  /**
   * Initialize backup directory structure
   */
  async initializeBackupDirectory() {
    try {
      await fs.promises.mkdir(this.config.backupDir, { recursive: true });
      logger.info({ backupDir: this.config.backupDir }, 'Backup directory initialized');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize backup directory');
      throw error;
    }
  }
  
  /**
   * Load backup metadata
   */
  async loadMetadata() {
    try {
      if (fs.existsSync(this.metadataFile)) {
        const data = await fs.promises.readFile(this.metadataFile, 'utf8');
        this.metadata = JSON.parse(data);
        logger.debug({ count: this.metadata.length }, 'Loaded backup metadata');
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to load backup metadata');
      this.metadata = [];
    }
  }
  
  /**
   * Save backup metadata
   */
  async saveMetadata() {
    try {
      await atomicWriteFile(
        this.metadataFile,
        JSON.stringify(this.metadata, null, 2),
        { backup: true }
      );
      logger.debug({ count: this.metadata.length }, 'Saved backup metadata');
    } catch (error) {
      logger.error({ err: error }, 'Failed to save backup metadata');
      throw error;
    }
  }
  
  /**
   * Create a backup
   * 
   * @param {string|Array<string>} dbPaths - Database file path(s) to backup
   * @returns {Promise<Object>} Backup result
   */
  async createBackup(dbPaths) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;
    
    try {
      const paths = Array.isArray(dbPaths) ? dbPaths : [dbPaths];
      const backedUpFiles = [];
      let totalSize = 0;
      
      for (const dbPath of paths) {
        if (!fs.existsSync(dbPath)) {
          logger.warn({ dbPath }, 'Database file not found, skipping');
          continue;
        }
        
        const dbName = path.basename(dbPath);
        const backupFileName = `${backupId}-${dbName}${this.config.compression ? '.gz' : ''}`;
        const backupPath = path.join(this.config.backupDir, backupFileName);
        
        // Read database file
        const data = await fs.promises.readFile(dbPath);
        totalSize += data.length;
        
        // Compress if enabled
        let backupData = data;
        if (this.config.compression) {
          backupData = await gzip(data);
          logger.debug({ dbPath, originalSize: data.length, compressedSize: backupData.length }, 'Compressed backup');
        }
        
        // Write backup file
        await fs.promises.writeFile(backupPath, backupData);
        
        backedUpFiles.push({
          originalPath: dbPath,
          backupPath,
          size: data.length,
          compressedSize: this.config.compression ? backupData.length : data.length
        });
        
        logger.debug({ dbPath, backupPath }, 'Backed up database file');
      }
      
      const duration = Date.now() - startTime;
      
      // Save metadata
      const metadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        files: backedUpFiles,
        totalSize,
        compressed: this.config.compression,
        duration
      };
      
      this.metadata.push(metadata);
      await this.saveMetadata();
      
      logger.info({
        backupId,
        fileCount: backedUpFiles.length,
        totalSize,
        duration
      }, 'Backup completed');
      
      // Apply retention policy
      await this.applyRetentionPolicy();
      
      return {
        success: true,
        backupId,
        files: backedUpFiles,
        totalSize,
        duration
      };
    } catch (error) {
      logger.error({ err: error, dbPaths }, 'Backup failed');
      throw error;
    }
  }
  
  /**
   * Restore from backup
   * 
   * @param {string} backupId - Backup ID to restore
   * @param {string} targetDir - Target directory for restoration
   * @returns {Promise<Object>} Restoration result
   */
  async restoreBackup(backupId, targetDir = null) {
    try {
      const backup = this.metadata.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }
      
      const restoredFiles = [];
      
      for (const file of backup.files) {
        const backupPath = file.backupPath;
        
        if (!fs.existsSync(backupPath)) {
          throw new Error(`Backup file not found: ${backupPath}`);
        }
        
        // Read backup file
        let data = await fs.promises.readFile(backupPath);
        
        // Decompress if needed
        if (backup.compressed) {
          data = await gunzip(data);
        }
        
        // Determine target path
        const targetPath = targetDir
          ? path.join(targetDir, path.basename(file.originalPath))
          : file.originalPath;
        
        // Ensure target directory exists
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Write restored file
        await atomicWriteFile(targetPath, data, { backup: true });
        
        restoredFiles.push({
          originalPath: file.originalPath,
          targetPath,
          size: data.length
        });
        
        logger.debug({ backupPath, targetPath }, 'Restored file');
      }
      
      logger.info({ backupId, fileCount: restoredFiles.length }, 'Restoration completed');
      
      return {
        success: true,
        backupId,
        files: restoredFiles
      };
    } catch (error) {
      logger.error({ err: error, backupId }, 'Restoration failed');
      throw error;
    }
  }
  
  /**
   * Apply retention policy
   * Removes old backups based on retention rules
   */
  async applyRetentionPolicy() {
    try {
      const now = new Date();
      const backupsByCategory = {
        daily: [],
        weekly: [],
        monthly: [],
        other: []
      };
      
      // Categorize backups
      for (const backup of this.metadata) {
        const backupDate = new Date(backup.timestamp);
        const ageInDays = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
        
        if (ageInDays < 7) {
          backupsByCategory.daily.push(backup);
        } else if (ageInDays < 30) {
          backupsByCategory.weekly.push(backup);
        } else if (ageInDays < 365) {
          backupsByCategory.monthly.push(backup);
        } else {
          backupsByCategory.other.push(backup);
        }
      }
      
      // Apply retention limits
      const toDelete = [];
      
      if (backupsByCategory.daily.length > this.config.retention.daily) {
        const excess = backupsByCategory.daily
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(0, backupsByCategory.daily.length - this.config.retention.daily);
        toDelete.push(...excess);
      }
      
      if (backupsByCategory.weekly.length > this.config.retention.weekly) {
        const excess = backupsByCategory.weekly
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(0, backupsByCategory.weekly.length - this.config.retention.weekly);
        toDelete.push(...excess);
      }
      
      if (backupsByCategory.monthly.length > this.config.retention.monthly) {
        const excess = backupsByCategory.monthly
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(0, backupsByCategory.monthly.length - this.config.retention.monthly);
        toDelete.push(...excess);
      }
      
      // Delete old backups
      for (const backup of toDelete) {
        for (const file of backup.files) {
          if (fs.existsSync(file.backupPath)) {
            await fs.promises.unlink(file.backupPath);
            logger.debug({ backupPath: file.backupPath }, 'Deleted old backup file');
          }
        }
        
        // Remove from metadata
        this.metadata = this.metadata.filter(b => b.id !== backup.id);
      }
      
      if (toDelete.length > 0) {
        await this.saveMetadata();
        logger.info({ deleted: toDelete.length }, 'Applied retention policy');
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to apply retention policy');
    }
  }
  
  /**
   * Start scheduled backups
   * 
   * @param {string|Array<string>} dbPaths - Database paths to backup
   * @param {number} intervalMs - Backup interval in milliseconds (default: 24 hours)
   */
  startScheduledBackups(dbPaths, intervalMs = 24 * 60 * 60 * 1000) {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.backupTimer = setInterval(async () => {
      logger.info('Starting scheduled backup');
      try {
        await this.createBackup(dbPaths);
      } catch (error) {
        logger.error({ err: error }, 'Scheduled backup failed');
      }
    }, intervalMs);
    
    logger.info({ intervalMs, intervalHours: intervalMs / (60 * 60 * 1000) }, 'Scheduled backups started');
  }
  
  /**
   * Stop scheduled backups
   */
  stopScheduledBackups() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      logger.info('Scheduled backups stopped');
    }
  }
  
  /**
   * List all backups
   */
  listBackups() {
    return this.metadata.map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp,
      fileCount: backup.files.length,
      totalSize: backup.totalSize,
      compressed: backup.compressed,
      duration: backup.duration
    }));
  }
}

/**
 * Export singleton instance
 */
export const backupManager = new DatabaseBackupManager();

export default DatabaseBackupManager;

/**
 * Automated Database Backup System
 *
 * Implements automated backups for SQLite and file-based storage
 * Issue #73: Implement Automated Database Backup System
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { logger } from './logger.js';
import { writeFileAtomic } from './atomicFileOperations.js';

const backupLogger = logger.child({ module: 'database-backup' });

/**
 * Database Backup Manager
 */
export class DatabaseBackupManager {
  constructor(options = {}) {
    this.options = {
      backupDir: options.backupDir || './backups',
      databasePaths: options.databasePaths || [],
      schedule: options.schedule || '0 2 * * *', // Daily at 2 AM
      retention: {
        daily: options.retention?.daily || 7,
        weekly: options.retention?.weekly || 4,
        monthly: options.retention?.monthly || 3
      },
      compression: options.compression !== false,
      maxBackupSize: options.maxBackupSize || 1024 * 1024 * 1024, // 1GB
      ...options
    };

    this.isRunning = false;
  }

  /**
   * Initialize backup manager and start scheduled backups
   */
  async initialize() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.options.backupDir, { recursive: true });

      backupLogger.info({
        backupDir: this.options.backupDir,
        databaseCount: this.options.databasePaths.length,
        retention: this.options.retention
      }, 'Database backup manager initialized');

      // Start scheduled backups
      this.startScheduledBackups();
    } catch (error) {
      backupLogger.error({ err: error }, 'Failed to initialize backup manager');
      throw error;
    }
  }

  /**
   * Start scheduled automatic backups
   */
  startScheduledBackups() {
    // Run backup every 24 hours
    const intervalMs = 24 * 60 * 60 * 1000; // 24 hours

    this.backupInterval = setInterval(async () => {
      try {
        await this.performBackup();
      } catch (error) {
        backupLogger.error({ err: error }, 'Scheduled backup failed');
      }
    }, intervalMs);

    // Perform initial backup
    this.performBackup().catch(error => {
      backupLogger.error({ err: error }, 'Initial backup failed');
    });

    backupLogger.info({
      intervalHours: 24
    }, 'Scheduled backups started');
  }

  /**
   * Stop scheduled backups
   */
  stopScheduledBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      backupLogger.info('Scheduled backups stopped');
    }
  }

  /**
   * Perform backup of all configured databases
   */
  async performBackup() {
    if (this.isRunning) {
      backupLogger.warn('Backup already in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupResults = [];

      for (const dbPath of this.options.databasePaths) {
        try {
          const result = await this.backupDatabase(dbPath, timestamp);
          backupResults.push(result);
        } catch (error) {
          backupLogger.error({
            err: error,
            dbPath
          }, 'Failed to backup database');

          backupResults.push({
            dbPath,
            success: false,
            error: error.message
          });
        }
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      const successCount = backupResults.filter(r => r.success).length;

      backupLogger.info({
        total: backupResults.length,
        success: successCount,
        failed: backupResults.length - successCount,
        durationMs: duration
      }, 'Backup completed');

      // Save backup metadata
      await this.saveBackupMetadata({
        timestamp,
        results: backupResults,
        duration
      });

      return backupResults;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Backup single database file
   */
  async backupDatabase(dbPath, timestamp) {
    try {
      // Check if database file exists
      await fs.access(dbPath);

      const stats = await fs.stat(dbPath);
      const dbName = path.basename(dbPath);
      const backupFileName = `${dbName}.${timestamp}${this.options.compression ? '.gz' : ''}`;
      const backupPath = path.join(this.options.backupDir, backupFileName);

      backupLogger.debug({
        dbPath,
        backupPath,
        sizeBytes: stats.size
      }, 'Starting database backup');

      if (this.options.compression) {
        // Compressed backup
        await this.compressFile(dbPath, backupPath);
      } else {
        // Direct copy
        await fs.copyFile(dbPath, backupPath);
      }

      const backupStats = await fs.stat(backupPath);

      backupLogger.info({
        dbPath,
        backupPath,
        originalSize: stats.size,
        backupSize: backupStats.size,
        compressionRatio: this.options.compression
          ? (stats.size / backupStats.size).toFixed(2)
          : '1.00'
      }, 'Database backed up successfully');

      return {
        dbPath,
        backupPath,
        timestamp,
        success: true,
        originalSize: stats.size,
        backupSize: backupStats.size
      };
    } catch (error) {
      backupLogger.error({
        err: error,
        dbPath
      }, 'Database backup failed');

      throw error;
    }
  }

  /**
   * Compress file using gzip
   */
  async compressFile(sourcePath, destPath) {
    const source = createReadStream(sourcePath);
    const destination = createWriteStream(destPath);
    const gzip = createGzip({ level: 9 }); // Maximum compression

    await pipeline(source, gzip, destination);
  }

  /**
   * Decompress backup file
   */
  async decompressFile(sourcePath, destPath) {
    const { createGunzip } = await import('zlib');
    const source = createReadStream(sourcePath);
    const destination = createWriteStream(destPath);
    const gunzip = createGunzip();

    await pipeline(source, gunzip, destination);
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath, targetPath) {
    try {
      backupLogger.info({
        backupPath,
        targetPath
      }, 'Starting database restore');

      // Create backup of current database before restore
      try {
        await fs.access(targetPath);
        const preRestoreBackup = `${targetPath}.pre-restore.${Date.now()}`;
        await fs.copyFile(targetPath, preRestoreBackup);
        backupLogger.info({ preRestoreBackup }, 'Created pre-restore backup');
      } catch (err) {
        // Target doesn't exist, no pre-restore backup needed
      }

      if (backupPath.endsWith('.gz')) {
        await this.decompressFile(backupPath, targetPath);
      } else {
        await fs.copyFile(backupPath, targetPath);
      }

      backupLogger.info({
        backupPath,
        targetPath
      }, 'Database restored successfully');

      return true;
    } catch (error) {
      backupLogger.error({
        err: error,
        backupPath,
        targetPath
      }, 'Database restore failed');

      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.options.backupDir);
      const backups = [];

      // Parse backup files
      for (const file of files) {
        const match = file.match(/^(.+?)\.([\d-T]+?)(?:\.gz)?$/);
        if (match) {
          const [, dbName, timestamp] = match;
          const filePath = path.join(this.options.backupDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            file,
            filePath,
            dbName,
            timestamp: new Date(timestamp.replace(/-/g, ':')),
            size: stats.size
          });
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp - a.timestamp);

      // Group by database name
      const backupsByDb = {};
      for (const backup of backups) {
        if (!backupsByDb[backup.dbName]) {
          backupsByDb[backup.dbName] = [];
        }
        backupsByDb[backup.dbName].push(backup);
      }

      // Apply retention policy for each database
      const toDelete = [];

      for (const [dbName, dbBackups] of Object.entries(backupsByDb)) {
        const keep = this.selectBackupsToKeep(dbBackups);
        const keepPaths = new Set(keep.map(b => b.filePath));

        for (const backup of dbBackups) {
          if (!keepPaths.has(backup.filePath)) {
            toDelete.push(backup);
          }
        }
      }

      // Delete old backups
      for (const backup of toDelete) {
        await fs.unlink(backup.filePath);
        backupLogger.debug({
          file: backup.file,
          age: Math.floor((Date.now() - backup.timestamp) / 86400000)
        }, 'Deleted old backup');
      }

      if (toDelete.length > 0) {
        backupLogger.info({
          deleted: toDelete.length,
          kept: backups.length - toDelete.length
        }, 'Cleaned up old backups');
      }
    } catch (error) {
      backupLogger.error({ err: error }, 'Backup cleanup failed');
    }
  }

  /**
   * Select backups to keep based on retention policy
   */
  selectBackupsToKeep(backups) {
    const keep = [];
    const now = Date.now();
    const dayMs = 86400000;

    // Keep daily backups (last N days)
    const dailyBackups = backups.filter(b =>
      now - b.timestamp < this.options.retention.daily * dayMs
    );
    keep.push(...dailyBackups);

    // Keep weekly backups (one per week for last N weeks)
    const weeklyBackups = this.selectWeeklyBackups(
      backups,
      this.options.retention.weekly
    );
    keep.push(...weeklyBackups);

    // Keep monthly backups (one per month for last N months)
    const monthlyBackups = this.selectMonthlyBackups(
      backups,
      this.options.retention.monthly
    );
    keep.push(...monthlyBackups);

    // Remove duplicates
    return [...new Set(keep)];
  }

  /**
   * Select one backup per week
   */
  selectWeeklyBackups(backups, weeks) {
    const selected = [];
    const weeksSeen = new Set();

    for (const backup of backups) {
      const weekKey = this.getWeekKey(backup.timestamp);

      if (!weeksSeen.has(weekKey)) {
        weeksSeen.add(weekKey);
        selected.push(backup);

        if (weeksSeen.size >= weeks) {
          break;
        }
      }
    }

    return selected;
  }

  /**
   * Select one backup per month
   */
  selectMonthlyBackups(backups, months) {
    const selected = [];
    const monthsSeen = new Set();

    for (const backup of backups) {
      const monthKey = this.getMonthKey(backup.timestamp);

      if (!monthsSeen.has(monthKey)) {
        monthsSeen.add(monthKey);
        selected.push(backup);

        if (monthsSeen.size >= months) {
          break;
        }
      }
    }

    return selected;
  }

  /**
   * Get week key for grouping
   */
  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.floor((date - new Date(year, 0, 1)) / (7 * 86400000));
    return `${year}-W${week}`;
  }

  /**
   * Get month key for grouping
   */
  getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Save backup metadata for auditing
   */
  async saveBackupMetadata(metadata) {
    const metadataPath = path.join(this.options.backupDir, 'backup-metadata.jsonl');

    try {
      const entry = JSON.stringify(metadata) + '\n';
      await fs.appendFile(metadataPath, entry, 'utf-8');
    } catch (error) {
      backupLogger.error({ err: error }, 'Failed to save backup metadata');
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    const files = await fs.readdir(this.options.backupDir);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.jsonl') || file.endsWith('.json')) {
        continue; // Skip metadata files
      }

      const filePath = path.join(this.options.backupDir, file);
      const stats = await fs.stat(filePath);

      backups.push({
        file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }

    return backups.sort((a, b) => b.created - a.created);
  }
}

/**
 * Create and initialize default backup manager
 */
export async function createBackupManager(options = {}) {
  const defaultPaths = [
    './data/gemini-flow.db',
    './data/rate-limits.json',
    './data/memory.db'
  ];

  const manager = new DatabaseBackupManager({
    databasePaths: options.databasePaths || defaultPaths,
    backupDir: options.backupDir || './backups',
    ...options
  });

  await manager.initialize();

  return manager;
}

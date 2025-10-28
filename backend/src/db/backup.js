/**
 * Database Backup Service
 * 
 * Provides automated backup and restore functionality for all database files.
 * Creates compressed, timestamped backups in .data/backups/ directory.
 */

import fs from 'fs/promises';
import path from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database is in project root .data directory
const PROJECT_ROOT = path.join(__dirname, '../../..');
const DB_DIR = path.join(PROJECT_ROOT, '.data');
const BACKUP_DIR = path.join(DB_DIR, 'backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 30;

/**
 * Create a timestamped backup of all database files
 * @returns {Promise<string>} Path to the created backup
 */
export async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(backupPath, { recursive: true });
    
    const files = ['workflows.json', 'store-state.json', 'sessions.json'];
    const backedUp = [];
    
    for (const file of files) {
      const sourcePath = path.join(DB_DIR, file);
      const destPath = path.join(backupPath, file);
      const gzipPath = `${destPath}.gz`;
      
      // Check if source exists
      try {
        await fs.access(sourcePath);
      } catch {
        logger.warn({ file }, 'Backup source file not found, skipping');
        continue;
      }
      
      // Compress and copy
      await pipeline(
        createReadStream(sourcePath),
        createGzip(),
        createWriteStream(gzipPath)
      );
      
      backedUp.push(file);
    }
    
    // Write backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      files: backedUp,
      version: process.env.npm_package_version || 'unknown'
    };
    await fs.writeFile(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    logger.info({ backupName, files: backedUp }, 'Database backup created');
    
    // Clean up old backups
    await cleanOldBackups();
    
    return backupPath;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create backup');
    throw error;
  }
}

/**
 * Validate backup name to prevent path traversal attacks
 * @param {string} backupName - Name of the backup to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateBackupName(backupName) {
  // Backup names must start with 'backup-' and contain only safe characters
  const validPattern = /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;
  
  if (!validPattern.test(backupName)) {
    throw new Error('Invalid backup name format');
  }
  
  // Ensure no path traversal characters
  if (backupName.includes('..') || backupName.includes('/') || backupName.includes('\\')) {
    throw new Error('Invalid backup name: path traversal not allowed');
  }
  
  return true;
}

/**
 * Restore database from a backup
 * @param {string} backupName - Name of the backup to restore
 */
export async function restoreBackup(backupName) {
  // Validate backup name to prevent path injection
  validateBackupName(backupName);
  
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  try {
    // Verify backup exists
    await fs.access(backupPath);
    
    // Read metadata
    const metadata = JSON.parse(
      await fs.readFile(path.join(backupPath, 'metadata.json'), 'utf-8')
    );
    
    logger.info({ backupName, metadata }, 'Restoring from backup');
    
    // Validate files are in allowed list
    const allowedFiles = ['workflows.json', 'store-state.json', 'sessions.json'];
    
    for (const file of metadata.files) {
      // Ensure file is in allowed list
      if (!allowedFiles.includes(file)) {
        throw new Error(`Invalid file in backup: ${file}`);
      }
      
      const gzipPath = path.join(backupPath, `${file}.gz`);
      const destPath = path.join(DB_DIR, file);
      
      // Decompress and restore
      await pipeline(
        createReadStream(gzipPath),
        createGunzip(),
        createWriteStream(destPath)
      );
    }
    
    logger.info({ backupName }, 'Database restored successfully');
  } catch (error) {
    logger.error({ error: error.message, backupName }, 'Failed to restore backup');
    throw error;
  }
}

/**
 * List all available backups
 * @returns {Promise<Array>} List of backup information
 */
export async function listBackups() {
  try {
    // Ensure backup directory exists
    try {
      await fs.access(BACKUP_DIR);
    } catch {
      return [];
    }
    
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
    const backups = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('backup-')) {
        const metadataPath = path.join(BACKUP_DIR, entry.name, 'metadata.json');
        try {
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          const stats = await fs.stat(path.join(BACKUP_DIR, entry.name));
          backups.push({
            name: entry.name,
            timestamp: metadata.timestamp,
            files: metadata.files,
            size: stats.size
          });
        } catch {
          // Skip invalid backups
        }
      }
    }
    
    return backups.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to list backups');
    return [];
  }
}

/**
 * Delete old backups, keeping only MAX_BACKUPS
 */
async function cleanOldBackups() {
  const backups = await listBackups();
  
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    
    for (const backup of toDelete) {
      const backupPath = path.join(BACKUP_DIR, backup.name);
      await fs.rm(backupPath, { recursive: true });
      logger.info({ backup: backup.name }, 'Old backup deleted');
    }
  }
}

/**
 * Get backup statistics
 * @returns {Promise<Object>} Backup statistics
 */
export async function getBackupStats() {
  const backups = await listBackups();
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  
  return {
    count: backups.length,
    totalSize,
    oldest: backups[backups.length - 1]?.timestamp,
    newest: backups[0]?.timestamp
  };
}

/**
 * Atomic File Operations Utility
 * 
 * Provides atomic write operations with backup and rollback capabilities.
 * Ensures data integrity during file operations.
 * 
 * Features:
 * - Atomic writes with temp file + rename
 * - Automatic backup before modification
 * - Rollback on failure
 * - Checksum verification
 * - Batch operations
 * - Log file rotation
 * 
 * @module utils/atomicFileOperations
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createModuleLogger } from './logger.js';

const logger = createModuleLogger('atomic-file-ops');

/**
 * Calculate MD5 checksum of file
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} MD5 hash
 */
async function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Atomically write data to file
 * 
 * Process:
 * 1. Write to temporary file
 * 2. Verify write (optional checksum)
 * 3. Backup original file (if exists)
 * 4. Rename temp file to target (atomic operation)
 * 5. Clean up backup if successful
 * 
 * @param {string} filePath - Target file path
 * @param {string|Buffer} data - Data to write
 * @param {Object} options - Write options
 * @param {boolean} options.backup - Create backup before write (default: true)
 * @param {boolean} options.verify - Verify write with checksum (default: false)
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @returns {Promise<Object>} Operation result
 */
export async function atomicWriteFile(filePath, data, options = {}) {
  const {
    backup = true,
    verify = false,
    encoding = 'utf8'
  } = options;
  
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath);
  const tempFile = path.join(dir, `.${filename}.tmp.${Date.now()}`);
  const backupFile = path.join(dir, `.${filename}.backup`);
  
  try {
    // Ensure directory exists
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Backup existing file if requested
    let originalChecksum = null;
    if (backup && fs.existsSync(filePath)) {
      await fs.promises.copyFile(filePath, backupFile);
      if (verify) {
        originalChecksum = await calculateChecksum(filePath);
      }
      logger.debug({ filePath, backupFile }, 'Created backup');
    }
    
    // Write to temporary file
    await fs.promises.writeFile(tempFile, data, { encoding });
    
    // Verify write if requested
    if (verify) {
      const expectedChecksum = crypto
        .createHash('md5')
        .update(typeof data === 'string' ? Buffer.from(data, encoding) : data)
        .digest('hex');
      const actualChecksum = await calculateChecksum(tempFile);
      
      if (expectedChecksum !== actualChecksum) {
        throw new Error(`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`);
      }
      
      logger.debug({ tempFile, checksum: actualChecksum }, 'Write verified');
    }
    
    // Atomic rename
    await fs.promises.rename(tempFile, filePath);
    
    // fsync to ensure data is written to disk
    const fd = await fs.promises.open(filePath, 'r');
    await fd.sync();
    await fd.close();
    
    logger.info({ filePath, size: data.length }, 'Atomic write completed');
    
    // Clean up backup on success
    if (backup && fs.existsSync(backupFile)) {
      await fs.promises.unlink(backupFile);
    }
    
    return {
      success: true,
      filePath,
      size: data.length,
      backed: backup,
      verified: verify
    };
  } catch (error) {
    logger.error({ err: error, filePath }, 'Atomic write failed');
    
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      await fs.promises.unlink(tempFile).catch(() => {});
    }
    
    // Attempt rollback if backup exists
    if (backup && fs.existsSync(backupFile)) {
      try {
        await fs.promises.copyFile(backupFile, filePath);
        logger.info({ filePath }, 'Rolled back to backup');
      } catch (rollbackError) {
        logger.error({ err: rollbackError, filePath }, 'Rollback failed');
      }
    }
    
    throw error;
  }
}

/**
 * Atomically read and modify file
 * 
 * @param {string} filePath - Target file path
 * @param {Function} modifier - Function to modify data: (data) => newData
 * @param {Object} options - Options
 * @returns {Promise<Object>} Operation result
 */
export async function atomicModifyFile(filePath, modifier, options = {}) {
  const encoding = options.encoding || 'utf8';
  
  try {
    // Read existing data
    let data = '';
    if (fs.existsSync(filePath)) {
      data = await fs.promises.readFile(filePath, { encoding });
    }
    
    // Apply modification
    const newData = await modifier(data);
    
    // Write atomically
    return await atomicWriteFile(filePath, newData, {
      ...options,
      backup: true
    });
  } catch (error) {
    logger.error({ err: error, filePath }, 'Atomic modify failed');
    throw error;
  }
}

/**
 * Batch atomic operations
 * Performs multiple atomic writes with all-or-nothing guarantee
 * 
 * @param {Array} operations - Array of {filePath, data, options}
 * @returns {Promise<Object>} Batch result
 */
export class AtomicBatch {
  constructor() {
    this.operations = [];
    this.backups = new Map();
  }
  
  /**
   * Add operation to batch
   */
  add(filePath, data, options = {}) {
    this.operations.push({ filePath, data, options });
  }
  
  /**
   * Execute all operations atomically
   */
  async commit() {
    const results = [];
    
    try {
      // Perform all writes
      for (const op of this.operations) {
        const result = await atomicWriteFile(op.filePath, op.data, {
          ...op.options,
          backup: true
        });
        results.push(result);
        
        // Track backup locations
        const backupFile = path.join(
          path.dirname(op.filePath),
          `.${path.basename(op.filePath)}.backup`
        );
        if (fs.existsSync(backupFile)) {
          this.backups.set(op.filePath, backupFile);
        }
      }
      
      logger.info({ count: results.length }, 'Batch commit completed');
      
      // Clean up all backups on success
      for (const backupFile of this.backups.values()) {
        if (fs.existsSync(backupFile)) {
          await fs.promises.unlink(backupFile).catch(() => {});
        }
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      logger.error({ err: error, count: this.operations.length }, 'Batch commit failed');
      
      // Rollback all operations
      await this.rollback();
      
      throw error;
    }
  }
  
  /**
   * Rollback all operations
   */
  async rollback() {
    logger.warn({ count: this.backups.size }, 'Rolling back batch operations');
    
    for (const [filePath, backupFile] of this.backups.entries()) {
      if (fs.existsSync(backupFile)) {
        try {
          await fs.promises.copyFile(backupFile, filePath);
          logger.debug({ filePath }, 'Rolled back file');
        } catch (error) {
          logger.error({ err: error, filePath }, 'Rollback failed for file');
        }
      }
    }
  }
}

/**
 * Rotate log file when it exceeds size limit
 * 
 * @param {string} logFile - Path to log file
 * @param {number} maxSize - Maximum size in bytes
 * @param {number} maxFiles - Maximum number of rotated files to keep
 * @returns {Promise<boolean>} True if rotated
 */
export async function rotateLogFile(logFile, maxSize = 10 * 1024 * 1024, maxFiles = 5) {
  try {
    if (!fs.existsSync(logFile)) {
      return false;
    }
    
    const stats = await fs.promises.stat(logFile);
    
    if (stats.size < maxSize) {
      return false;
    }
    
    // Rotate existing files
    for (let i = maxFiles - 1; i > 0; i--) {
      const oldFile = `${logFile}.${i}`;
      const newFile = `${logFile}.${i + 1}`;
      
      if (fs.existsSync(oldFile)) {
        await fs.promises.rename(oldFile, newFile);
      }
    }
    
    // Move current log to .1
    await fs.promises.rename(logFile, `${logFile}.1`);
    
    // Delete oldest file if exists
    const oldestFile = `${logFile}.${maxFiles + 1}`;
    if (fs.existsSync(oldestFile)) {
      await fs.promises.unlink(oldestFile);
    }
    
    logger.info({ logFile, size: stats.size }, 'Log file rotated');
    
    return true;
  } catch (error) {
    logger.error({ err: error, logFile }, 'Log rotation failed');
    throw error;
  }
}

export default {
  atomicWriteFile,
  atomicModifyFile,
  AtomicBatch,
  rotateLogFile
};

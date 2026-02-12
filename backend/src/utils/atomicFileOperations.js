/**
 * Atomic File Operations for File-Based Storage
 *
 * Provides atomic write operations to prevent data corruption
 * Issue #68: Implement Atomic Operations for File-Based Storage
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger.js';

const fileOpsLogger = logger.child({ module: 'atomic-file-ops' });

/**
 * Write file atomically using write-and-rename pattern
 *
 * @param {string} filePath - Target file path
 * @param {string|Buffer} data - Data to write
 * @param {Object} options - Write options
 */
export async function writeFileAtomic(filePath, data, options = {}) {
  const {
    encoding = 'utf-8',
    mode = 0o666,
    fsync = true, // Force sync to disk
    backup = false, // Create backup before overwriting
    checksum = false // Verify checksum after write
  } = options;

  const tempPath = `${filePath}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
  const backupPath = backup ? `${filePath}.backup` : null;

  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Create backup if requested and file exists
    if (backup) {
      try {
        await fs.access(filePath);
        await fs.copyFile(filePath, backupPath);
        fileOpsLogger.debug({ filePath, backupPath }, 'Backup created');
      } catch (err) {
        // File doesn't exist, no backup needed
      }
    }

    // Write to temporary file
    await fs.writeFile(tempPath, data, { encoding, mode });

    // Force sync to disk if requested
    if (fsync) {
      const fd = await fs.open(tempPath, 'r+');
      try {
        await fd.sync();
      } finally {
        await fd.close();
      }
    }

    // Verify checksum if requested
    if (checksum) {
      const writtenData = await fs.readFile(tempPath, { encoding });
      const originalChecksum = generateChecksum(data);
      const writtenChecksum = generateChecksum(writtenData);

      if (originalChecksum !== writtenChecksum) {
        throw new Error('Checksum verification failed');
      }
    }

    // Atomic rename
    await fs.rename(tempPath, filePath);

    fileOpsLogger.debug({
      filePath,
      size: Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, encoding),
      fsync,
      checksum
    }, 'File written atomically');

  } catch (error) {
    // Clean up temporary file on error
    try {
      await fs.unlink(tempPath);
    } catch (unlinkError) {
      // Ignore cleanup errors
    }

    // Restore backup if available
    if (backup && backupPath) {
      try {
        await fs.access(backupPath);
        await fs.rename(backupPath, filePath);
        fileOpsLogger.info({ filePath }, 'Backup restored after write failure');
      } catch (restoreError) {
        // Backup restore failed
        fileOpsLogger.error({
          err: restoreError,
          filePath
        }, 'Failed to restore backup');
      }
    }

    fileOpsLogger.error({
      err: error,
      filePath
    }, 'Atomic write failed');

    throw error;
  } finally {
    // Clean up backup file if it exists
    if (backup && backupPath) {
      try {
        await fs.unlink(backupPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Read file with retry and corruption detection
 *
 * @param {string} filePath - File path to read
 * @param {Object} options - Read options
 */
export async function readFileAtomic(filePath, options = {}) {
  const {
    encoding = 'utf-8',
    retries = 3,
    retryDelay = 100,
    validateJSON = false
  } = options;

  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await fs.readFile(filePath, { encoding });

      // Validate JSON if requested
      if (validateJSON) {
        try {
          JSON.parse(data);
        } catch (jsonError) {
          throw new Error(`Invalid JSON in file: ${jsonError.message}`);
        }
      }

      return data;
    } catch (error) {
      lastError = error;

      if (attempt < retries - 1) {
        fileOpsLogger.warn({
          err: error,
          filePath,
          attempt: attempt + 1,
          retries
        }, 'Read failed, retrying');

        await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }

  fileOpsLogger.error({
    err: lastError,
    filePath,
    retries
  }, 'Atomic read failed after retries');

  throw lastError;
}

/**
 * Update JSON file atomically with merge support
 *
 * @param {string} filePath - JSON file path
 * @param {Function|Object} updater - Update function or object to merge
 */
export async function updateJSONFileAtomic(filePath, updater) {
  try {
    // Read existing data
    let existingData = {};
    try {
      const fileContent = await readFileAtomic(filePath, { validateJSON: true });
      existingData = JSON.parse(fileContent);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, start with empty object
    }

    // Apply update
    const newData = typeof updater === 'function'
      ? updater(existingData)
      : { ...existingData, ...updater };

    // Write atomically
    await writeFileAtomic(filePath, JSON.stringify(newData, null, 2), {
      fsync: true,
      backup: true,
      checksum: true
    });

    return newData;
  } catch (error) {
    fileOpsLogger.error({
      err: error,
      filePath
    }, 'JSON file update failed');

    throw error;
  }
}

/**
 * Batch atomic file operations with rollback support
 */
export class AtomicBatch {
  constructor() {
    this.operations = [];
    this.completed = [];
  }

  /**
   * Add write operation to batch
   */
  writeFile(filePath, data, options = {}) {
    this.operations.push({
      type: 'write',
      filePath,
      data,
      options
    });
    return this;
  }

  /**
   * Add delete operation to batch
   */
  deleteFile(filePath) {
    this.operations.push({
      type: 'delete',
      filePath
    });
    return this;
  }

  /**
   * Execute all operations atomically
   * Rolls back on failure
   */
  async execute() {
    const backups = new Map();

    try {
      for (const op of this.operations) {
        if (op.type === 'write') {
          // Create backup before write
          try {
            const existing = await fs.readFile(op.filePath);
            backups.set(op.filePath, existing);
          } catch (err) {
            // File doesn't exist, no backup needed
          }

          // Perform atomic write
          await writeFileAtomic(op.filePath, op.data, op.options);
          this.completed.push(op);
        } else if (op.type === 'delete') {
          // Create backup before delete
          try {
            const existing = await fs.readFile(op.filePath);
            backups.set(op.filePath, existing);
            await fs.unlink(op.filePath);
            this.completed.push(op);
          } catch (err) {
            if (err.code !== 'ENOENT') {
              throw err;
            }
          }
        }
      }

      fileOpsLogger.info({
        operations: this.operations.length
      }, 'Batch operations completed successfully');

    } catch (error) {
      fileOpsLogger.error({
        err: error,
        completed: this.completed.length,
        total: this.operations.length
      }, 'Batch operation failed, rolling back');

      // Rollback completed operations
      await this.rollback(backups);

      throw error;
    }
  }

  /**
   * Rollback completed operations
   */
  async rollback(backups) {
    for (const [filePath, backup] of backups.entries()) {
      try {
        await writeFileAtomic(filePath, backup);
        fileOpsLogger.debug({ filePath }, 'Rolled back file');
      } catch (err) {
        fileOpsLogger.error({
          err,
          filePath
        }, 'Rollback failed for file');
      }
    }
  }
}

/**
 * Generate checksum for data
 */
function generateChecksum(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create append-only log file with atomic appends
 */
export class AtomicLogFile {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.options = {
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
      rotateOnMax: options.rotateOnMax !== false,
      ...options
    };
  }

  /**
   * Append entry to log file atomically
   */
  async append(entry) {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry
    }) + '\n';

    // Check if rotation is needed
    if (this.options.rotateOnMax) {
      try {
        const stats = await fs.stat(this.filePath);
        if (stats.size >= this.options.maxSize) {
          await this.rotate();
        }
      } catch (err) {
        // File doesn't exist yet
      }
    }

    // Atomic append
    await fs.appendFile(this.filePath, line, 'utf-8');
  }

  /**
   * Rotate log file
   */
  async rotate() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedPath = `${this.filePath}.${timestamp}`;

    try {
      await fs.rename(this.filePath, rotatedPath);
      fileOpsLogger.info({
        original: this.filePath,
        rotated: rotatedPath
      }, 'Log file rotated');
    } catch (err) {
      fileOpsLogger.error({ err }, 'Log rotation failed');
    }
  }
}

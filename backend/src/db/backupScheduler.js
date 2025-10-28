/**
 * Backup Scheduler
 * 
 * Manages periodic automated backups of the database.
 * Runs backups at configured intervals (default: 24 hours).
 */

import { createBackup } from './backup.js';
import { logger } from '../utils/logger.js';

const BACKUP_INTERVAL = parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24;

let backupInterval;

/**
 * Start the backup scheduler
 * Creates an initial backup on startup and schedules periodic backups
 */
export function startBackupScheduler() {
  if (backupInterval) {
    logger.warn('Backup scheduler already running');
    return;
  }
  
  // Create initial backup on startup
  createBackup().catch(err => 
    logger.error({ err: err.message }, 'Initial backup failed')
  );
  
  // Schedule periodic backups
  backupInterval = setInterval(() => {
    createBackup().catch(err => 
      logger.error({ err: err.message }, 'Scheduled backup failed')
    );
  }, BACKUP_INTERVAL * 60 * 60 * 1000);
  
  logger.info({ intervalHours: BACKUP_INTERVAL }, 'Backup scheduler started');
}

/**
 * Stop the backup scheduler
 */
export function stopBackupScheduler() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    logger.info('Backup scheduler stopped');
  }
}

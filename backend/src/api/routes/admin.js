/**
 * Admin API Routes
 * 
 * Provides endpoints for manual backup and restore operations.
 * All endpoints require authentication via X-API-Key header.
 */

import express from 'express';
import { authenticate, asyncHandler } from '../middleware/auth.js';
import * as backup from '../../db/backup.js';

const router = express.Router();

/**
 * GET /api/admin/backups
 * List all available backups with statistics
 */
router.get('/backups', 
  authenticate({ required: true }),
  asyncHandler(async (req, res) => {
    const backups = await backup.listBackups();
    const stats = await backup.getBackupStats();
    res.json({ success: true, data: { backups, stats } });
  })
);

/**
 * POST /api/admin/backups
 * Create a new backup manually
 */
router.post('/backups',
  authenticate({ required: true }),
  asyncHandler(async (req, res) => {
    const backupPath = await backup.createBackup();
    res.json({ success: true, data: { backupPath } });
  })
);

/**
 * POST /api/admin/backups/:name/restore
 * Restore database from a backup
 * Requires confirmation in request body: {"confirm": "RESTORE"}
 */
router.post('/backups/:name/restore',
  authenticate({ required: true }),
  asyncHandler(async (req, res) => {
    if (req.body.confirm !== 'RESTORE') {
      return res.status(400).json({
        success: false,
        error: { message: 'Confirmation required: send {"confirm": "RESTORE"}' }
      });
    }
    await backup.restoreBackup(req.params.name);
    res.json({ 
      success: true, 
      message: 'Database restored. Restart recommended.' 
    });
  })
);

export default router;

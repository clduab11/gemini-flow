# Database Backup System

## Overview

The automated backup system provides comprehensive protection for all database files in the `.data/` directory. It creates compressed, timestamped backups automatically at configurable intervals.

## Features

- ✅ **Automated Backups**: Runs every 24 hours by default (configurable)
- ✅ **Startup Backup**: Creates backup on server startup
- ✅ **Shutdown Backup**: Creates final backup on graceful shutdown
- ✅ **Compression**: Uses gzip compression to save disk space
- ✅ **Rotation**: Automatically keeps only the last 30 backups (configurable)
- ✅ **Metadata**: Each backup includes timestamp and file list
- ✅ **API Endpoints**: Manual backup/restore via REST API

## Backed Up Files

The system backs up the following files from `.data/`:
- `workflows.json` - User-created workflow definitions
- `store-state.json` - Current UI state
- `sessions.json` - Active session data

## Configuration

Set these environment variables in your `.env` file:

```bash
# Backup configuration
BACKUP_INTERVAL_HOURS=24  # Backup every 24 hours
MAX_BACKUPS=30            # Keep last 30 backups
API_KEY=your-secure-api-key-for-admin-endpoints
```

## Directory Structure

```
.data/
├── workflows.json
├── store-state.json
├── sessions.json
└── backups/
    ├── backup-2025-10-27T23-51-02-293Z/
    │   ├── workflows.json.gz
    │   ├── store-state.json.gz
    │   ├── sessions.json.gz
    │   └── metadata.json
    └── backup-2025-10-27T23-52-19-819Z/
        └── ...
```

## API Endpoints

### List Backups
```bash
curl http://localhost:3001/api/admin/backups \
  -H "X-API-Key: $API_KEY"
```

Response:
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "name": "backup-2025-10-27T23-51-02-293Z",
        "timestamp": "2025-10-27T23:51:02.303Z",
        "files": ["workflows.json", "store-state.json", "sessions.json"],
        "size": 4096
      }
    ],
    "stats": {
      "count": 5,
      "totalSize": 20480,
      "oldest": "2025-10-27T23:51:02.303Z",
      "newest": "2025-10-27T23:52:19.823Z"
    }
  }
}
```

### Create Manual Backup
```bash
curl -X POST http://localhost:3001/api/admin/backups \
  -H "X-API-Key: $API_KEY"
```

Response:
```json
{
  "success": true,
  "data": {
    "backupPath": "/path/to/.data/backups/backup-2025-10-27T23-52-19-819Z"
  }
}
```

### Restore from Backup
```bash
curl -X POST http://localhost:3001/api/admin/backups/backup-2025-10-27T23-51-02-293Z/restore \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "RESTORE"}'
```

Response:
```json
{
  "success": true,
  "message": "Database restored. Restart recommended."
}
```

⚠️ **Warning**: Restoring a backup will overwrite current database files. Consider creating a manual backup first.

## Programmatic Usage

### Create Backup
```javascript
import { createBackup } from './backend/src/db/backup.js';

const backupPath = await createBackup();
console.log('Backup created:', backupPath);
```

### List Backups
```javascript
import { listBackups, getBackupStats } from './backend/src/db/backup.js';

const backups = await listBackups();
const stats = await getBackupStats();

console.log('Available backups:', backups.length);
console.log('Total size:', stats.totalSize, 'bytes');
```

### Restore Backup
```javascript
import { restoreBackup } from './backend/src/db/backup.js';

await restoreBackup('backup-2025-10-27T23-51-02-293Z');
console.log('Database restored');
```

## Security

- **Authentication**: All admin endpoints require `X-API-Key` header (when `API_KEY` env var is set)
- **Confirmation**: Restore operations require explicit `{"confirm": "RESTORE"}` in request body
- **Read-only by Default**: Backups are created but never automatically deleted except during rotation

## Monitoring

The backup system logs all operations:
- Backup creation success/failure
- Backup restoration success/failure
- Old backup deletion
- Scheduler start/stop

Example log output:
```
[2025-10-27T23:51:02.303Z] INFO: Database backup created {"backupName":"backup-2025-10-27T23-51-02-293Z","files":["workflows.json","store-state.json","sessions.json"]}
[2025-10-27T23:51:56.350Z] INFO: Backup scheduler started {"intervalHours":24}
[2025-10-27T23:52:32.682Z] INFO: Final backup completed
```

## Troubleshooting

### Backup Not Created
- Check that `.data/` directory exists
- Verify database files exist in `.data/`
- Check server logs for error messages

### Restore Failed
- Verify backup exists in `.data/backups/`
- Check backup metadata.json is valid
- Ensure sufficient disk space

### Too Many Backups
- Reduce `MAX_BACKUPS` environment variable
- Manually delete old backups from `.data/backups/`

## Future Enhancements

- **Cloud Backup**: Integration with cloud storage (S3, Google Cloud Storage)
- **Encryption**: Encrypt backups at rest
- **Incremental Backups**: Only backup changed files
- **Backup Verification**: Automatically verify backup integrity
- **Email Notifications**: Alert on backup success/failure

## Related Issues

- Issue #73: Automated Backup System (this implementation)
- Issue #68: Atomic Database Operations (dependency)
- Pull Request #66: Original review discussion

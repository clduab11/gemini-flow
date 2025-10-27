# Rate Limiting with Persistent Storage

This backend implements persistent rate limiting to prevent abuse and bypass attacks through server restarts.

## Features

- **Dual Persistence Modes**: File-based (single instance) or Redis-based (distributed)
- **Automatic Cleanup**: Expired entries are removed before persistence
- **Graceful Shutdown**: Rate limits are saved on SIGTERM/SIGINT
- **Periodic Persistence**: Data is saved every 30 seconds
- **Resilient**: Fails open if Redis is unavailable

## Configuration

### File-Based Persistence (Default)

No additional configuration needed. Rate limits are automatically persisted to `.data/rate-limits.json`.

**Advantages:**
- ✅ No external dependencies
- ✅ Simple setup
- ✅ Suitable for single-instance deployments

**Limitations:**
- ❌ Not suitable for multi-instance deployments
- ❌ File I/O overhead

### Redis-Based Persistence (Production)

Set the following environment variables in your `.env` file:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optional
REDIS_DB=0                          # Optional, default is 0
```

**Advantages:**
- ✅ Supports multiple instances
- ✅ Better performance
- ✅ Efficient time-window queries
- ✅ Automatic failover to in-memory if Redis fails

**Requirements:**
- Redis server running and accessible
- `ioredis` package installed (included as optional dependency)

## Rate Limit Configuration

Default settings (defined in `backend/src/api/middleware/rateLimit.js`):

```javascript
const MAX_REQUESTS_PER_WINDOW = 100;  // Maximum requests per client
const WINDOW_MS = 15 * 60 * 1000;      // 15 minutes window
const PERSIST_INTERVAL_MS = 30000;     // Persist every 30 seconds
```

## Response Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100          # Maximum requests allowed
X-RateLimit-Remaining: 95       # Requests remaining in current window
X-RateLimit-Reset: 1234567890   # Unix timestamp when limit resets
```

## Rate Limit Exceeded Response

When the limit is exceeded, the server returns a 429 status:

```json
{
  "error": {
    "message": "Too many requests",
    "retryAfter": 300  // Seconds until limit resets
  }
}
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. For Redis support (optional):
   ```bash
   npm install ioredis
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite verifies:
- ✅ Basic rate limiting
- ✅ Rate limit enforcement
- ✅ File persistence across restarts
- ✅ Expired entries cleanup
- ✅ Multiple client isolation

## Security Benefits

### Attack Prevention

**Before (Vulnerable):**
```
Attacker makes 99 requests → Server restarts → Counter resets → Attacker makes 99 more requests
Result: 10x rate limit bypass through restart cycling
```

**After (Protected):**
```
Attacker makes 99 requests → Server restarts → Counter persists → Attacker limited to 1 more request
Result: Rate limit enforced across restarts
```

### Persistence Guarantees

1. **Startup**: Existing rate limits loaded from storage
2. **Runtime**: Periodic saves every 30 seconds
3. **Shutdown**: Final save on SIGTERM/SIGINT signals
4. **Cleanup**: Expired entries removed before each save

## Architecture

### File-Based Flow

```
┌─────────────┐
│   Startup   │ → Load from .data/rate-limits.json
└─────────────┘
       ↓
┌─────────────┐
│   Runtime   │ → In-memory Map + Periodic saves (30s)
└─────────────┘
       ↓
┌─────────────┐
│  Shutdown   │ → Save to .data/rate-limits.json
└─────────────┘
```

### Redis-Based Flow

```
┌─────────────┐
│   Startup   │ → Connect to Redis
└─────────────┘
       ↓
┌─────────────┐
│   Runtime   │ → Redis Sorted Sets (zremrangebyscore, zadd)
└─────────────┘
       ↓
┌─────────────┐
│   Fallback  │ → In-memory if Redis unavailable
└─────────────┘
```

## Data Structure

### File Format (.data/rate-limits.json)

```json
[
  ["client-ip-1", [1234567890123, 1234567891234, 1234567892345]],
  ["client-ip-2", [1234567893456, 1234567894567]]
]
```

Each entry is `[clientId, [timestamps]]` where timestamps are within the current 15-minute window.

### Redis Format

```
Key: ratelimit:client-ip-1
Type: Sorted Set
Members: {
  "1234567890123-0.123": 1234567890123,
  "1234567891234-0.456": 1234567891234,
  "1234567892345-0.789": 1234567892345
}
Score: Request timestamp (used for range queries)
```

## Monitoring

### Check Rate Limit Status

```bash
# View persisted data (file-based)
cat .data/rate-limits.json | jq

# View active clients count (Redis)
redis-cli KEYS "ratelimit:*" | wc -l

# View requests for specific client (Redis)
redis-cli ZRANGE ratelimit:192.168.1.1 0 -1 WITHSCORES
```

## Troubleshooting

### File Persistence Issues

**Problem**: `.data/rate-limits.json` not created

**Solution**: Ensure write permissions on the data directory
```bash
mkdir -p .data
chmod 755 .data
```

### Redis Connection Issues

**Problem**: "Redis unavailable, using in-memory rate limiting"

**Solutions**:
1. Verify Redis is running: `redis-cli ping`
2. Check connection details in `.env`
3. Verify network connectivity
4. Check Redis logs for errors

**Note**: The system automatically falls back to in-memory storage if Redis fails

### Rate Limits Not Persisting

**Problem**: Rate limits reset after restart

**Checklist**:
1. Verify `.data` directory exists and is writable
2. Check server logs for persistence errors
3. Ensure graceful shutdown (SIGTERM/SIGINT, not SIGKILL)
4. For Redis: verify `REDIS_HOST` is set in environment

## Production Recommendations

1. **Use Redis** for multi-instance deployments
2. **Configure Redis persistence** (AOF or RDB)
3. **Monitor Redis memory** usage
4. **Set up alerting** for rate limit events
5. **Review limits** based on actual traffic patterns
6. **Implement IP allowlisting** for trusted clients

## API Integration Example

```javascript
// Making a request to the API
const response = await fetch('http://localhost:3001/api/gemini/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nodes: [], edges: [] })
});

// Check rate limit status
console.log('Limit:', response.headers.get('X-RateLimit-Limit'));
console.log('Remaining:', response.headers.get('X-RateLimit-Remaining'));
console.log('Reset:', new Date(response.headers.get('X-RateLimit-Reset') * 1000));

// Handle rate limit
if (response.status === 429) {
  const data = await response.json();
  console.log(`Rate limited. Retry after ${data.error.retryAfter} seconds`);
}
```

## License

Part of the gemini-flow project. See main LICENSE file.

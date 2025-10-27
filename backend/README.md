# Gemini Flow Backend

Backend API server for Gemini Flow visual execution, providing REST APIs and real-time WebSocket communication.

## Features

- **REST API**: CRUD operations for workflows and store state
- **WebSocket Server**: Real-time bidirectional synchronization
- **API Key Authentication**: Secure access control for WebSocket connections
- **File-based Storage**: JSON-based persistence (easily replaceable with database)

## Getting Started

### Prerequisites

- Node.js v18+ 
- npm v8+

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
API_KEY=your-secret-api-key-here
```

### Running the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3001` with WebSocket support at `ws://localhost:3001/ws`.

## WebSocket Authentication

### Overview

All WebSocket connections require API key authentication for security. Unauthenticated connections are rejected with WebSocket close code 1008 (Policy Violation).

### Authentication Methods

#### Method 1: Query Parameter (Recommended)

Pass the API key as a query parameter:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws?apiKey=your-secret-api-key-here');
```

#### Method 2: HTTP Header

Pass the API key in the upgrade request headers:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws', {
  headers: {
    'x-api-key': 'your-secret-api-key-here'
  }
});
```

### Client Examples

#### JavaScript/Node.js

```javascript
import { WebSocket } from 'ws';

const apiKey = process.env.API_KEY || 'dev-api-key-change-in-production';
const ws = new WebSocket(`ws://localhost:3001/ws?apiKey=${apiKey}`);

ws.on('open', () => {
  console.log('Connected to WebSocket server');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
});

ws.on('close', (code, reason) => {
  if (code === 1008) {
    console.error('Authentication failed:', reason.toString());
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

#### Python

```python
import websockets
import asyncio
import os

async def connect():
    api_key = os.getenv('API_KEY', 'dev-api-key-change-in-production')
    uri = f"ws://localhost:3001/ws?apiKey={api_key}"
    
    async with websockets.connect(uri) as websocket:
        # Receive connection confirmation
        message = await websocket.recv()
        print(f"Received: {message}")
        
        # Handle messages
        async for message in websocket:
            print(f"Received: {message}")

asyncio.run(connect())
```

#### cURL (Testing)

```bash
# Test connection (will be immediately closed, but shows authentication)
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: localhost:3001" \
     --header "Origin: http://localhost:3001" \
     --header "Sec-WebSocket-Key: $(echo -n "test" | base64)" \
     --header "Sec-WebSocket-Version: 13" \
     --header "x-api-key: dev-api-key-change-in-production" \
     http://localhost:3001/ws
```

### Error Handling

| Scenario | Close Code | Reason | Description |
|----------|-----------|---------|-------------|
| No API key | 1008 | Unauthorized | API key not provided |
| Invalid API key | 1008 | Unauthorized | API key doesn't match server key |
| Valid API key | 1000 | Normal closure | Connection successful |

### Security Considerations

1. **Never commit API keys**: Use environment variables
2. **Use HTTPS/WSS in production**: Encrypt WebSocket traffic
3. **Rotate keys regularly**: Change API keys periodically
4. **Monitor failed attempts**: Check logs for unauthorized access attempts
5. **Use different keys per environment**: Dev, staging, production

### Authenticated Client Metadata

Upon successful authentication, the server stores client metadata:

```javascript
{
  ws: WebSocket,           // WebSocket instance
  authenticated: true,     // Authentication status
  connectedAt: 1234567890, // Timestamp
  remoteAddress: "::1"     // Client IP address
}
```

## REST API Endpoints

### Workflows

- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow by ID
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/import` - Import workflow
- `GET /api/workflows/:id/export` - Export workflow

### Store State

- `GET /api/store/state` - Get current store state
- `PUT /api/store/state` - Update store state
- `PUT /api/store/nodes` - Set all nodes
- `PUT /api/store/edges` - Set all edges
- `POST /api/store/nodes` - Add node
- `PATCH /api/store/nodes/:id` - Update node
- `DELETE /api/store/nodes/:id` - Delete node
- `POST /api/store/edges` - Add edge
- `DELETE /api/store/edges/:id` - Delete edge
- `POST /api/store/workflow` - Load workflow into store
- `POST /api/store/clear` - Clear store
- `POST /api/store/sync` - Sync workflow to store

## WebSocket Events

### Client Events

- `client.connected` - Sent when client successfully connects
- `client.disconnected` - Broadcast when client disconnects

### Workflow Events

- `workflow.created` - Broadcast when workflow is created
- `workflow.updated` - Broadcast when workflow is updated
- `workflow.deleted` - Broadcast when workflow is deleted

### Store Events

- `store.updated` - Broadcast when store state changes
- `store.synced` - Broadcast when workflow syncs to store

### Connection Events

- `ping` - Heartbeat request from client
- `pong` - Heartbeat response from server

## Testing

### Manual WebSocket Authentication Test

```bash
# Make sure server is running
npm start

# In another terminal, run the test
node src/websocket/__tests__/manual-test.js
```

Expected output:
```
🧪 Testing WebSocket Authentication
...
══════════════════════════════════════════════════
Tests Passed: 5
Tests Failed: 0
══════════════════════════════════════════════════
```

## Architecture

```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/          # Data models and validation
│   │   ├── routes/          # API route definitions
│   │   └── services/        # Business logic
│   ├── db/
│   │   └── database.js      # File-based storage
│   ├── websocket/
│   │   ├── server.js        # WebSocket server with auth
│   │   ├── types.js         # WebSocket event types
│   │   └── __tests__/       # Authentication tests
│   └── server.js            # Main server entry point
└── package.json
```

## Production Deployment

### Security Checklist

- [ ] Set strong API key in production environment
- [ ] Use HTTPS/WSS for encrypted communication
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure CORS for production domains
- [ ] Use process manager (PM2, systemd)
- [ ] Set up health checks
- [ ] Configure firewall rules

### Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
docker build -t gemini-flow-backend .
docker run -p 3001:3001 -e API_KEY=your-production-key gemini-flow-backend
```

## Troubleshooting

### WebSocket Connection Refused

Check if the server is running and API key is correct:

```bash
# Check server status
curl http://localhost:3001/health

# Test with correct API key
node src/websocket/__tests__/manual-test.js
```

### Unauthorized Connection Attempts

Check server logs for failed authentication attempts:

```
❌ Unauthorized WebSocket connection attempt from ::1
```

This indicates clients are attempting to connect without valid API keys.

## License

MIT

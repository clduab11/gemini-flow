# Gemini Flow Backend API

Backend API server for Gemini Flow visual execution platform.

## Features

- **Visual Flow Execution**: Execute visual workflows via Google Gemini API
- **Workflow Management**: CRUD operations for workflows with validation
- **Store State Management**: Manage application store state
- **Request Validation**: Comprehensive payload size and complexity validation
- **Security**: Protection against denial-of-service attacks via large payloads

## Installation

```bash
cd backend
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure the required environment variables:

```bash
cp .env.example .env
```

### Required Environment Variables

- `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default: 3001)

### Optional Validation Limits

These limits protect against denial-of-service attacks. All have sensible defaults but can be overridden:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_REQUEST_SIZE` | `1mb` | Maximum request payload size |
| `MAX_NODES` | `1000` | Maximum nodes in a workflow |
| `MAX_EDGES` | `5000` | Maximum edges in a workflow |
| `MAX_NAME_LENGTH` | `200` | Maximum workflow name length |
| `MAX_DESCRIPTION_LENGTH` | `5000` | Maximum workflow description length |
| `MAX_TAGS` | `50` | Maximum number of tags |
| `MAX_NESTED_DEPTH` | `10` | Maximum object nesting depth |
| `MAX_ARRAY_LENGTH` | `10000` | Maximum array length |
| `MIN_VIEWPORT_ZOOM` | `0.1` | Minimum viewport zoom level |
| `MAX_VIEWPORT_ZOOM` | `10` | Maximum viewport zoom level |

## Running the Server

### Development Mode

```bash
npm run dev
```

Server runs on `http://localhost:3001` with auto-reload on file changes.

### Production Mode

```bash
npm start
```

## API Endpoints

### Health Check

**GET** `/health`

Returns server health status.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "gemini-flow-backend"
}
```

### Gemini Execution

**POST** `/api/gemini/execute`

Execute a visual flow via Google Gemini API.

**Request Body:**
```json
{
  "nodes": [
    { "id": "node1", "type": "input", "data": { "label": "Start" } },
    { "id": "node2", "type": "output", "data": { "label": "End" } }
  ],
  "edges": [
    { "source": "node1", "target": "node2" }
  ]
}
```

**Validation:**
- Maximum nodes: 1000
- Maximum edges: 5000
- Maximum nesting depth: 10 levels

**Response:**
```json
{
  "success": true,
  "result": "Generated text from Gemini",
  "metadata": {
    "nodesProcessed": 2,
    "edgesProcessed": 1,
    "promptLength": 123,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**GET** `/api/gemini/status`

Check Gemini API connection status.

### Workflow Management

**POST** `/api/workflows`

Create a new workflow with validation.

**PUT** `/api/workflows/:id`

Update an existing workflow.

**GET** `/api/workflows/:id`

Get a workflow by ID.

**DELETE** `/api/workflows/:id`

Delete a workflow.

**GET** `/api/workflows`

List all workflows.

### Store State Management

**PUT** `/api/store`

Update store state.

**Request Body:**
```json
{
  "viewport": { "zoom": 1, "x": 0, "y": 0 },
  "selectedNodes": ["node1", "node2"]
}
```

**Validation:**
- Zoom must be between 0.1 and 10
- Maximum selected nodes: 1000
- Maximum nesting depth: 10 levels

**GET** `/api/store`

Get current store state.

**POST** `/api/store/reset`

Reset store state to defaults.

## Security Features

### Payload Size Limits

- Request body size limited to 1MB by default
- Prevents memory exhaustion from large payloads
- Configurable via `MAX_REQUEST_SIZE` environment variable

### Complexity Validation

All workflow and store data is validated for:

1. **Node Count**: Prevents workflows with excessive nodes (default max: 1000)
2. **Edge Count**: Prevents workflows with excessive edges (default max: 5000)
3. **String Lengths**: Limits name and description fields
4. **Array Sizes**: Prevents array flooding attacks
5. **Nesting Depth**: Prevents stack overflow from deeply nested objects (max depth: 10)

### Error Responses

Validation failures return `400 Bad Request` with detailed error information:

```json
{
  "error": {
    "message": "Workflow validation failed",
    "details": [
      "Too many nodes (max 1000, received 1500)",
      "Name too long (max 200 characters, received 250)"
    ]
  }
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

### Test Coverage

The test suite includes:
- Unit tests for validation functions
- Integration tests for all API endpoints
- Boundary condition tests for all limits
- Security validation tests

## Architecture

```
backend/
├── src/
│   ├── api/
│   │   ├── gemini/          # Gemini API integration
│   │   │   └── index.js
│   │   ├── middleware/      # Request validation middleware
│   │   │   └── validation.js
│   │   └── routes/          # API route handlers
│   │       ├── workflows.js
│   │       └── store.js
│   ├── config/              # Configuration
│   │   └── limits.js        # Validation limits
│   ├── __tests__/           # Test suite
│   │   ├── validation.test.js
│   │   ├── workflows.test.js
│   │   └── store.test.js
│   └── server.js            # Express server setup
├── .env.example             # Environment variables template
└── package.json
```

## Error Handling

The server includes comprehensive error handling:

- **400**: Validation errors (payload too large, complexity exceeded)
- **401**: Authentication errors (invalid API key)
- **404**: Not found
- **413**: Payload too large (exceeds Express limit)
- **429**: Rate limit exceeded
- **500**: Internal server errors

## Performance Considerations

The validation limits are designed to balance functionality with security:

- Limits prevent denial-of-service attacks
- Depth checking uses early cutoff to avoid performance degradation
- All validations run in O(n) time or better
- Minimal overhead added to request processing

## Development

### Adding New Endpoints

1. Create route handler in `src/api/routes/`
2. Apply appropriate validation middleware
3. Register route in `src/server.js`
4. Add tests in `src/__tests__/`

### Modifying Validation Rules

Edit `src/config/limits.js` to change default limits or add new ones.

## Support

For issues and questions:
- GitHub Issues: https://github.com/clduab11/gemini-flow/issues
- Reference: Issue #70, PR #66

## License

See main repository LICENSE file.

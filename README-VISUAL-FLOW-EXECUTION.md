# Visual Flow Execution Feature Implementation

## Overview

This feature enables execution of visual workflows created in the `gemini-flow` editor through the Google Gemini API. Users can create visual node graphs in the React Flow interface and execute them with AI processing.

## Architecture

### Backend (Express API Server)
- **Location**: `/backend/`
- **Port**: 3001 (configurable via `PORT` environment variable)
- **Main Files**:
  - `backend/src/server.js` - Main Express server
  - `backend/src/api/gemini/index.js` - Gemini API routes and graph traversal logic

### Frontend (React + Vite)
- **Location**: `/frontend/`
- **Port**: 5173 (Vite default)
- **Key Files**:
  - `frontend/src/lib/store.ts` - Zustand store with execution state
  - `frontend/src/components/Flow.tsx` - React Flow component with Run button

## Features Implemented

### ✅ Core Functionality
1. **"Run Flow" Button** - Added to the Flow Controls panel
2. **Graph Traversal Logic** - Converts visual nodes and edges into coherent prompts
3. **Gemini API Integration** - Uses `@google/generative-ai` SDK
4. **Real-time Execution State** - Loading indicators and progress feedback
5. **Result Display Panel** - Shows AI responses with metadata
6. **Error Handling** - Comprehensive error display and recovery

### ✅ UI Components
- **Run Flow Button**: Green button with rocket emoji, disabled during execution
- **Loading State**: Shows "🔄 Running..." with spinner animation
- **Result Panel**: Bottom-right panel with AI response, metadata, and close button
- **Clear Result Button**: Orange button to clear execution results
- **Error Display**: Red-bordered panel for error messages

### ✅ State Management (Zustand)
- `isExecuting`: Boolean for loading state
- `executionResult`: String containing AI response
- `executionError`: String containing error messages
- `executionMetadata`: Object with execution statistics
- `executeFlow()`: Async function to run the flow
- `clearExecutionResult()`: Function to clear results

## API Endpoints

### POST `/api/gemini/execute`
Executes a visual flow by converting nodes and edges into a prompt for Gemini API.

**Request Body**:
```json
{
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "data": { "label": "Write a hello world program" },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    }
  ]
}
```

**Success Response**:
```json
{
  "success": true,
  "result": "Here's a simple hello world program...",
  "metadata": {
    "nodesProcessed": 3,
    "edgesProcessed": 2,
    "promptLength": 45,
    "timestamp": "2025-01-20T10:30:00.000Z"
  }
}
```

**Error Response**:
```json
{
  "error": "Authentication failed",
  "message": "Invalid or missing API key"
}
```

### GET `/api/gemini/status`
Checks Gemini API connection status and API key validity.

**Response**:
```json
{
  "status": "ready",
  "hasApiKey": true,
  "apiKeyPrefix": "AIzaSyBN...",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Add your Gemini API key to .env
echo "GEMINI_API_KEY=your_api_key_here" >> .env

# Start backend server
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start frontend dev server
npm run dev
```

### 3. Combined Development
Run both servers simultaneously:
```bash
# From project root
npm run dev:full
```

## Graph Traversal Logic

The system converts visual node graphs into coherent prompts using a depth-first traversal algorithm:

1. **Find Input Node**: Locates the starting node (type: 'input')
2. **Build Edge Map**: Creates a lookup table for node connections
3. **Traverse Graph**: Recursively follows edges to build prompt
4. **Handle Node Types**:
   - `input`: "Input: {label}"
   - `output`: "Output: {label}" 
   - `default`: "Step N: {label}"

**Example Flow**:
```
Input Node: "Write a web server"
   ↓
Default Node: "Use Node.js and Express"
   ↓  
Output Node: "Return the complete code"
```

**Generated Prompt**:
```
Input: Write a web server
Step 1: Use Node.js and Express
Output: Return the complete code
```

## Error Handling

### Authentication Errors (401)
- Missing or invalid Gemini API key
- Displays: "Authentication failed" with setup instructions

### Rate Limiting (429) 
- API quota exceeded
- Displays: "Rate limit exceeded, try again later"

### Network Errors
- Backend server not running
- Displays: "Failed to fetch" with connection instructions

### Validation Errors (400)
- Empty nodes array
- Missing required fields
- Displays specific validation message

## Testing

### Manual Testing
1. Open frontend at http://localhost:5173
2. Ensure backend is running at http://localhost:3001
3. Click "🚀 Run Flow" button
4. Verify loading state appears
5. Check result or error display

### API Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test Gemini status
curl http://localhost:3001/api/gemini/status

# Test flow execution
curl -X POST http://localhost:3001/api/gemini/execute \
  -H "Content-Type: application/json" \
  -d '{"nodes":[{"id":"1","type":"input","data":{"label":"Hello world"}}],"edges":[]}'
```

## Environment Variables

### Backend (.env)
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
PORT=3001
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Getting a Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

## Development Notes

### Performance Optimizations
- **Zustand State Management**: Prevents unnecessary re-renders
- **Selective Subscriptions**: Components only re-render when their specific state changes
- **Stable References**: Action hooks maintain stable references across renders
- **Callback Optimization**: All event handlers use `useCallback` for performance

### Security Considerations
- API key stored in backend environment variables only
- CORS configured for specific origins
- Input validation on all API endpoints
- Error messages don't expose sensitive information

### Future Enhancements
- [ ] Support for complex graph structures (branches, loops)
- [ ] Custom node types with specific behaviors
- [ ] Flow templates and presets
- [ ] Real-time streaming responses
- [ ] Flow execution history
- [ ] Export/import flow definitions
- [ ] Collaborative editing features

## Troubleshooting

### "Failed to fetch" Error
- Ensure backend server is running on port 3001
- Check if CORS is properly configured
- Verify frontend is making requests to correct URL

### "Authentication failed" Error  
- Verify `GEMINI_API_KEY` is set in backend `.env` file
- Test API key validity at Google AI Studio
- Check API key format (should start with 'AIza')

### Empty Response
- Check if flow has at least one input node
- Verify nodes have meaningful labels
- Check browser console for JavaScript errors

### Performance Issues
- Ensure Zustand store is properly configured
- Check for unnecessary re-renders in React DevTools
- Monitor network requests in browser DevTools

## Screenshots

### Main Interface with Run Button
![Gemini Flow UI with Run Button](https://github.com/user-attachments/assets/ad2df56e-777c-4c7f-b568-70e0eda46497)

### Error Handling Display  
![Error Handling UI](https://github.com/user-attachments/assets/b771e5ce-dbf2-41f1-b2b9-da2f4dc238af)

## Implementation Details

This implementation follows the requirements specified in the original issue:

1. ✅ **`@google/generative-ai` dependency** - Already present in package.json
2. ✅ **"Run Flow" button** - Added to Flow Controls panel with proper styling
3. ✅ **`executeFlow` action** - Implemented in Zustand store with async/await
4. ✅ **API endpoint `/api/gemini/execute`** - Created with graph traversal logic
5. ✅ **Gemini API integration** - Working with proper error handling
6. ✅ **Frontend result display** - Result panel with metadata
7. ✅ **Loading state feedback** - Button disabled, spinner animation, clear UX

The implementation provides a solid foundation for visual flow execution while maintaining the existing architecture and performance optimizations.
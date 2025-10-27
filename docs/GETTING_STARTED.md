# Getting Started with Gemini Flow

**Sprint 8: System Integration & Developer Experience**

Quick start guide to get Gemini Flow running locally in under 10 minutes.

---

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 9+** (comes with Node.js)
- **Git** (for cloning the repository)

Optional:
- **Docker & Docker Compose** (for containerized deployment)

---

## Quick Start (Automated Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/gemini-flow.git
cd gemini-flow
```

### 2. Run Setup Script

**On Unix/Linux/macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**On Windows:**
```powershell
# Coming soon: scripts/setup.bat
# For now, follow Manual Setup below
```

### 3. Start All Services

```bash
./scripts/dev.sh
```

This starts:
- Backend API on `http://localhost:3001`
- Frontend UI on `http://localhost:5173`
- WebSocket on `ws://localhost:3001/ws`

### 4. Access the Application

Open your browser to **http://localhost:5173**

---

## Manual Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Install Super Terminal Dependencies

```bash
cd ..
npm install
```

### Step 4: Create Environment Files

**backend/.env:**
```env
PORT=3001
API_KEY=dev-api-key-change-in-production
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
VITE_API_KEY=dev-api-key-change-in-production
```

**.env (root, for Super Terminal):**
```env
API_KEY=dev-api-key-change-in-production
API_BASE_URL=http://localhost:3001/api
WS_URL=ws://localhost:3001/ws
```

### Step 5: Start Services Individually

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Super Terminal (Optional):**
```bash
npm run super-terminal -- --tui
```

---

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

### Access Services

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- Health Check: `http://localhost:3001/health`

---

## Verify Installation

### Check Service Health

```bash
# Using helper script
./scripts/health-check.sh

# Or manually
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T...",
  "service": "gemini-flow-backend",
  "version": "1.0.0",
  "components": {
    "database": { "status": "healthy" },
    "websocket": { "status": "healthy", "clientsConnected": 1 }
  }
}
```

---

## First Workflow

### 1. Create Workflow in Frontend

1. Open `http://localhost:5173`
2. Drag nodes onto canvas
3. Connect nodes with edges
4. Click "Save Workflow"

### 2. Verify in Super Terminal

```bash
npm run super-terminal -- --tui
# Navigate to Dashboard
# Your workflow should appear in the list
```

### 3. Test Real-Time Sync

1. Edit workflow in frontend → Changes appear in TUI instantly
2. Edit workflow in TUI → Changes appear in frontend instantly

---

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests (coming soon)
npm run test:integration
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Linting & Formatting

```bash
# Lint all code
npm run lint

# Format all code
npm run format
```

---

## Common Commands

```bash
# Start all services
./scripts/dev.sh

# Check service health
./scripts/health-check.sh

# Generate new API key
node scripts/generate-api-key.js

# Reset database
rm -rf backend/.data/*
rm -rf ~/.gemini-flow/workflows/*

# View logs
tail -f ~/.gemini-flow/logs/super-terminal.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Backend Won't Start

1. Check Node.js version: `node -v` (must be 18+)
2. Check `.env` file exists in `backend/`
3. Check port 3001 is available
4. View logs: `cd backend && npm start`

### Frontend Won't Connect

1. Verify backend is running: `curl http://localhost:3001/health`
2. Check frontend `.env` has correct API_URL
3. Check browser console for CORS errors
4. Verify WebSocket connection in Network tab

### Database Issues

```bash
# Reset database
rm -rf backend/.data/*
cd backend && npm start
```

---

## Next Steps

- **Tutorial:** Follow the [User Guide](./USER_GUIDE.md) for detailed workflows
- **Architecture:** Understand the system in [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- **API Reference:** See [API Documentation](./API_DOCUMENTATION.md)
- **Contributing:** Read [Contributing Guidelines](./CONTRIBUTING.md)

---

## Support

- **Issues:** [GitHub Issues](https://github.com/your-org/gemini-flow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/gemini-flow/discussions)
- **Documentation:** `docs/` directory

---

**Last Updated:** October 27, 2025
**Sprint:** 8 - System Integration

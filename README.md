# gemini-flow-project

AI-powered project using Gemini-Flow

## Getting Started

This project is powered by Gemini-Flow, an AI orchestration platform with intelligent agent swarms.

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Project (for AI features)

### Installation

```bash
npm install
```

### Configuration

1. Set up Google Cloud credentials:
```bash
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

2. Initialize swarm:
```bash
npm run swarm:init
```

3. Spawn agents:
```bash
npm run agents:spawn
```

### Usage

#### Development Mode
```bash
npm run dev
```

#### Build Project
```bash
npm run build
```

#### Run Tests
```bash
npm run test
```

## Gemini-Flow Commands

- `gemini-flow swarm init` - Initialize agent swarm
- `gemini-flow agent spawn` - Spawn AI agents
- `gemini-flow sparc run <mode>` - Run SPARC methodology
- `gemini-flow hive-mind sync` - Sync collective intelligence

## Project Structure

```
gemini-flow-project/
├── .gemini-flow/          # Gemini-Flow configuration
├── src/                   # Source code
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/               # Build scripts
```

## License

MIT
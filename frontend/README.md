# Gemini Flow - React Flow Frontend

This is the React frontend for the Gemini Flow project, featuring React Flow visualization with optimized Zustand state management.

## 🚀 Architectural Refactor Complete

This implementation addresses the performance issues described in the original GitHub issue by migrating from local component state (`useNodesState`, `useEdgesState`) to a centralized Zustand store.

### Performance Benefits

✅ **Eliminated Full Component Re-renders**: Components only re-render when their specific state slice changes  
✅ **Selective State Subscriptions**: Individual hooks for nodes, edges, and actions  
✅ **Optimized Canvas Operations**: Smooth dragging, panning, and zooming  
✅ **Scalable Architecture**: Handles complex flows with many nodes efficiently  

## 🏗️ Architecture

### State Management (Zustand)
- **`src/lib/store.ts`**: Central store with nodes, edges, and canvas state
- **Individual Hooks**: `useNodes()`, `useEdges()`, `useOnNodesChange()`, etc.
- **Action Separation**: Actions don't cause re-renders when accessed

### Components
- **`src/app/page.tsx`**: Main page component (equivalent to the issue's src/app/page.tsx)
- **`src/components/Flow.tsx`**: React Flow canvas with Zustand integration
- **`src/App.tsx`**: Application entry point

### Performance Optimizations
- Stable action references prevent unnecessary re-renders
- Selective state subscriptions using Zustand selectors
- React Flow optimizations with proper callbacks

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm 8+

### Quick Start

```bash
# From project root
npm run frontend:install  # Install dependencies
npm run frontend:dev      # Start development server
npm run frontend:build    # Build for production
```

### From Frontend Directory
```bash
cd frontend
npm install     # Install dependencies  
npm run dev     # Start dev server at http://localhost:5173
npm run build   # Build for production
npm run preview # Preview production build
```

## 🎯 Features

### Interactive Canvas
- **Add Nodes**: Click "Add Node" to create new nodes
- **Drag & Drop**: Move nodes around the canvas
- **Connect Nodes**: Drag from node handles to create connections
- **Canvas Controls**: Zoom, pan, fit view, toggle interactivity
- **Mini Map**: Navigation aid for large flows

### Real-time State Display
- Live node and edge counts
- Performance mode indicator
- Architecture migration status

### Clean UI
- Modern header with project branding
- Control panel for flow management
- Performance indicators
- Footer with architectural notes

## 📊 Performance Comparison

### Before (Local useState)
```tsx
// ❌ Causes full component tree re-renders
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

### After (Zustand Store)
```tsx
// ✅ Selective subscriptions, no unnecessary re-renders
const nodes = useNodes();
const edges = useEdges();
const onNodesChange = useOnNodesChange();
const onEdgesChange = useOnEdgesChange();
```

## 🔧 Integration with Backend

The frontend is designed to integrate with the existing Gemini Flow backend:

- API endpoints can be called from Zustand actions
- Backend state can be synchronized with the frontend store  
- Real-time updates via WebSocket integration (future enhancement)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   └── store.ts          # Zustand store with performance optimizations
│   ├── components/
│   │   └── Flow.tsx          # React Flow canvas component
│   ├── app/
│   │   └── page.tsx          # Main page component
│   ├── App.tsx               # Application entry point
│   ├── main.tsx              # React DOM entry point
│   └── index.css             # Global styles
├── package.json              # Frontend dependencies
├── vite.config.ts            # Vite configuration
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Deployment

The frontend can be deployed as a static site:

```bash
npm run build
# Deploy the dist/ folder to any static hosting service
```

## 🔮 Future Enhancements

- **Custom Node Types**: Extend with domain-specific node components
- **Persistence**: Save/load flows from backend API  
- **Collaboration**: Real-time multi-user editing
- **Advanced Controls**: Undo/redo, keyboard shortcuts
- **Theme System**: Dark/light mode support
- **Export Options**: PNG, SVG, JSON export functionality

---

**Migration Status**: ✅ **Complete** - Successfully migrated from local useState to global Zustand state management with significant performance improvements.

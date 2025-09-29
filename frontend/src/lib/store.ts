/**
 * Zustand Store for React Flow Global State Management
 * 
 * This replaces local useNodesState/useEdgesState hooks to eliminate
 * full component tree re-renders on every state change.
 * 
 * Performance Benefits:
 * - Selective subscriptions to specific state slices
 * - Only components using affected state will re-render
 * - Optimized for canvas operations (drag, pan, zoom)
 */

import { create } from 'zustand';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges
} from '@xyflow/react';
import type { 
  Node, 
  Edge, 
  Connection,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from '@xyflow/react';

// Define the shape of our store
interface FlowState {
  // Core state
  nodes: Node[];
  edges: Edge[];
  
  // Actions for nodes
  setNodes: (nodes: Node[]) => void;
  onNodesChange: OnNodesChange;
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  
  // Actions for edges  
  setEdges: (edges: Edge[]) => void;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addEdgeConnection: (edge: Edge) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Canvas state
  selectedNodes: string[];
  selectedEdges: string[];
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  
  // Utility actions
  clearFlow: () => void;
  resetFlow: () => void;
}

// Initial state
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
  },
  {
    id: '2',
    data: { label: 'Default Node' },
    position: { x: 100, y: 125 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Output Node' },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

// Create the Zustand store
const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodes: [],
  selectedEdges: [],

  // Node actions
  setNodes: (nodes) => set({ nodes }),
  
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  updateNode: (nodeId, updates) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    const { nodes, edges } = get();
    set({
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  // Edge actions
  setEdges: (edges) => set({ edges }),

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addEdgeConnection: (edge) => {
    set({
      edges: [...get().edges, edge],
    });
  },

  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
    });
  },

  // Selection state
  setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
  setSelectedEdges: (edgeIds) => set({ selectedEdges: edgeIds }),

  // Utility actions
  clearFlow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
    });
  },

  resetFlow: () => {
    set({
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodes: [],
      selectedEdges: [],
    });
  },
}));

// Selector hooks for performance optimization
export const useNodes = () => useFlowStore((state) => state.nodes);
export const useEdges = () => useFlowStore((state) => state.edges);
export const useSelectedNodes = () => useFlowStore((state) => state.selectedNodes);
export const useSelectedEdges = () => useFlowStore((state) => state.selectedEdges);

// Individual action hooks (stable references)
export const useSetNodes = () => useFlowStore((state) => state.setNodes);
export const useOnNodesChange = () => useFlowStore((state) => state.onNodesChange);
export const useAddNode = () => useFlowStore((state) => state.addNode);
export const useUpdateNode = () => useFlowStore((state) => state.updateNode);
export const useDeleteNode = () => useFlowStore((state) => state.deleteNode);

export const useSetEdges = () => useFlowStore((state) => state.setEdges);
export const useOnEdgesChange = () => useFlowStore((state) => state.onEdgesChange);
export const useOnConnect = () => useFlowStore((state) => state.onConnect);
export const useAddEdgeConnection = () => useFlowStore((state) => state.addEdgeConnection);
export const useDeleteEdge = () => useFlowStore((state) => state.deleteEdge);

export const useSetSelectedNodes = () => useFlowStore((state) => state.setSelectedNodes);
export const useSetSelectedEdges = () => useFlowStore((state) => state.setSelectedEdges);

export const useClearFlow = () => useFlowStore((state) => state.clearFlow);
export const useResetFlow = () => useFlowStore((state) => state.resetFlow);

// Export the store itself for direct access when needed
export { useFlowStore };
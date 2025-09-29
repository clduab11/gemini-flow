/**
 * React Flow Component with Enhanced UI Components
 * 
 * This component demonstrates the performance benefits of using Zustand
 * instead of local component state, with modern enhanced UI components.
 * 
 * Key Benefits:
 * - No full component tree re-renders on node/edge changes
 * - Selective subscriptions to specific state slices
 * - Optimized canvas operations
 * - Enhanced UI with Tailwind CSS components
 * - User authentication and flow persistence
 */

import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import enhanced components
import EnhancedAuthPanel from './EnhancedAuthPanel';
import EnhancedFlowControls from './EnhancedFlowControls';
import EnhancedFlowStats from './EnhancedFlowStats';

// Import our Zustand store hooks
import { 
  useNodes, 
  useEdges, 
  useOnNodesChange,
  useOnEdgesChange,
  useOnConnect,
  useAddNode
} from '../lib/store';

// Custom node types (can be extended)
const nodeTypes: NodeTypes = {
  // Add custom node types here if needed
};

// Custom edge types (can be extended) 
const edgeTypes: EdgeTypes = {
  // Add custom edge types here if needed
};

// Default node styling
const defaultViewport = { x: 0, y: 0, zoom: 1 };

const Flow: React.FC = () => {
  // Subscribe to specific state slices (performance optimized)
  const nodes = useNodes();
  const edges = useEdges();
  
  // Get individual action hooks (stable references)
  const onNodesChange = useOnNodesChange();
  const onEdgesChange = useOnEdgesChange();
  const onConnect = useOnConnect();
  const addNode = useAddNode();

  // Handle node selection
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleConnect = useCallback((connection: Connection) => {
    onConnect(connection);
  }, [onConnect]);

  // Keyboard shortcuts for enhanced UX
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n': {
            event.preventDefault();
            const newNode = {
              id: `node-${Date.now()}`,
              type: 'default',
              data: { label: `Node ${nodes.length + 1}` },
              position: { 
                x: Math.random() * 300 + 100,
                y: Math.random() * 300 + 100
              },
            };
            addNode(newNode);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNode, nodes.length]);

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={4}
        attributionPosition="bottom-left"
      >
        {/* Background with dot pattern */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        
        {/* Navigation controls */}
        <Controls />
        
        {/* Mini map for navigation */}
        <MiniMap 
          zoomable
          pannable
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.type === 'input') return '#10b981';
            if (node.type === 'output') return '#ef4444';
            if (node.type === 'process') return '#8b5cf6';
            return '#6b7280';
          }}
        />
        
        {/* Enhanced Authentication Panel */}
        <Panel position="top-left">
          <EnhancedAuthPanel />
        </Panel>

        {/* Enhanced Control Panel */}
        <Panel position="top-right">
          <EnhancedFlowControls />
        </Panel>

        {/* Enhanced Statistics Panel */}
        <Panel position="bottom-right">
          <EnhancedFlowStats />
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider for context
const FlowWithProvider: React.FC = () => (
  <ReactFlowProvider>
    <Flow />
  </ReactFlowProvider>
);

export default FlowWithProvider;
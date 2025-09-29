/**
 * React Flow Component with Zustand Integration
 * 
 * This component demonstrates the performance benefits of using Zustand
 * instead of local component state (useNodesState, useEdgesState).
 * 
 * Key Benefits:
 * - No full component tree re-renders on node/edge changes
 * - Selective subscriptions to specific state slices
 * - Optimized canvas operations
 */

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import our Zustand store hooks
import { 
  useNodes, 
  useEdges, 
  useOnNodesChange,
  useOnEdgesChange,
  useOnConnect,
  useAddNode,
  useClearFlow,
  useResetFlow
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
  const clearFlow = useClearFlow();
  const resetFlow = useResetFlow();

  // Handle adding new nodes
  const handleAddNode = useCallback(() => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      data: { label: `New Node ${nodes.length + 1}` },
      position: { 
        x: Math.random() * 400, 
        y: Math.random() * 400 
      },
    };
    addNode(newNode);
  }, [addNode, nodes.length]);

  // Handle node selection
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleConnect = useCallback((connection: any) => {
    onConnect(connection);
  }, [onConnect]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
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
            switch (node.type) {
              case 'input':
                return '#00ff00';
              case 'output':
                return '#ff0000';
              default:
                return '#1a192b';
            }
          }}
        />
        
        {/* Control panel */}
        <Panel position="top-right">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              Flow Controls
            </h3>
            <button 
              onClick={handleAddNode}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Add Node
            </button>
            <button 
              onClick={clearFlow}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
            <button 
              onClick={resetFlow}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Reset Flow
            </button>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginTop: '8px',
              padding: '8px',
              background: '#f9f9f9',
              borderRadius: '4px'
            }}>
              <div>Nodes: {nodes.length}</div>
              <div>Edges: {edges.length}</div>
              <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                ✅ Zustand Optimized
              </div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                No full re-renders on changes
              </div>
            </div>
          </div>
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
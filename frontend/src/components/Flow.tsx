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
  useResetFlow,
  // Execution hooks
  useIsExecuting,
  useExecutionResult,
  useExecutionError,
  useExecutionMetadata,
  useExecuteFlow,
  useClearExecutionResult
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
  
  // Execution hooks
  const isExecuting = useIsExecuting();
  const executionResult = useExecutionResult();
  const executionError = useExecutionError();
  const executionMetadata = useExecutionMetadata();
  const executeFlow = useExecuteFlow();
  const clearExecutionResult = useClearExecutionResult();

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

  // Handle flow execution
  const handleExecuteFlow = useCallback(async () => {
    await executeFlow();
  }, [executeFlow]);

  const handleClearResult = useCallback(() => {
    clearExecutionResult();
  }, [clearExecutionResult]);

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
            
            {/* Run Flow Button */}
            <button 
              onClick={handleExecuteFlow}
              disabled={isExecuting || nodes.length === 0}
              style={{
                padding: '8px 16px',
                border: isExecuting ? '1px solid #ccc' : '1px solid #10b981',
                borderRadius: '4px',
                background: isExecuting ? '#f3f4f6' : '#10b981',
                color: isExecuting ? '#6b7280' : 'white',
                cursor: isExecuting || nodes.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {isExecuting ? '🔄 Running...' : '🚀 Run Flow'}
            </button>
            
            {/* Clear Result Button */}
            {(executionResult || executionError) && (
              <button 
                onClick={handleClearResult}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #f59e0b',
                  borderRadius: '4px',
                  background: '#fef3c7',
                  color: '#92400e',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear Result
              </button>
            )}
            
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
        
        {/* Execution Result Panel */}
        {(executionResult || executionError || isExecuting) && (
          <Panel position="bottom-right">
            <div style={{ 
              width: '400px',
              maxHeight: '300px',
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  🤖 Gemini Response
                </h3>
                <button
                  onClick={handleClearResult}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>
              
              {isExecuting && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <div style={{ animation: 'spin 1s linear infinite' }}>🔄</div>
                  Processing your flow...
                </div>
              )}
              
              {executionError && (
                <div style={{
                  padding: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#dc2626'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>❌ Error:</div>
                  {executionError}
                </div>
              )}
              
              {executionResult && (
                <div style={{
                  padding: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#166534',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ Result:</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{executionResult}</div>
                  
                  {executionMetadata && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #bbf7d0',
                      fontSize: '12px',
                      color: '#059669'
                    }}>
                      <div>Nodes processed: {executionMetadata.nodesProcessed}</div>
                      <div>Edges processed: {executionMetadata.edgesProcessed}</div>
                      <div>Generated at: {new Date(executionMetadata.timestamp).toLocaleTimeString()}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
      
      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
/**
 * Flow component with drag and drop support
 */

import React, { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
  useReactFlow,
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

// Import custom node types
import { orchestratorNodeTypes } from './OrchestratorNodes';
import { bacowrNodeTypes } from './BACOWRNodes';
import { seoIntelligenceNodeTypes } from './SEOIntelligenceNodes';
import { NodePalette } from './NodePalette';
import { OrchestratorPanel } from './OrchestratorPanel';

// Custom node types (can be extended)
const nodeTypes: NodeTypes = {
  // Add custom node types here if needed
  ...orchestratorNodeTypes,
  ...bacowrNodeTypes,
  ...seoIntelligenceNodeTypes
};

// Custom edge types (can be extended)
const edgeTypes: EdgeTypes = {
  // Add custom edge types here if needed
};

// Default node styling
const defaultViewport = { x: 0, y: 0, zoom: 1 };

const FlowInner: React.FC = () => {
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

  // React Flow instance for drag and drop
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project, screenToFlowPosition } = useReactFlow();

  // Handle drag over
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      try {
        const nodeData = JSON.parse(type);

        const position = screenToFlowPosition({
          x: event.clientX - (reactFlowBounds?.left || 0),
          y: event.clientY - (reactFlowBounds?.top || 0),
        });

        const newNode = {
          id: `${nodeData.type}-${Date.now()}`,
          type: nodeData.type,
          position,
          data: nodeData.data || { label: `${nodeData.type} node` },
        };

        addNode(newNode);
      } catch (e) {
        console.error('Failed to parse dropped node data', e);
      }
    },
    [addNode, screenToFlowPosition]
  );

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
    <div style={{ width: '100%', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={4}
        attributionPosition="bottom-left"
      >
        {/* Background with dot pattern */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

        {/* Node Palette for dragging nodes */}
        <NodePalette />

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
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
              Flow Controls
            </h3>

            {/* Node counter */}
            <div style={{ fontSize: '12px', color: '#666' }}>
              Nodes: {nodes.length} | Edges: {edges.length}
            </div>

            {/* Action buttons */}
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
              Clear Flow
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
            {executionResult && (
              <button
                onClick={handleClearResult}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #f97316',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#f97316',
                  cursor: 'pointer'
                }}
              >
                Clear Result
              </button>
            )}
          </div>
        </Panel>

        {/* Orchestrator Panel */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '280px',
          width: '300px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <OrchestratorPanel />
        </div>

        {/* Execution Result Panel */}
        {(executionResult || executionError) && (
          <Panel position="bottom-right">
            <div style={{
              background: executionError ? '#fef2f2' : '#f0fdf4',
              border: executionError ? '1px solid #fecaca' : '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px',
              maxWidth: '400px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: executionError ? '#dc2626' : '#15803d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {executionError ? '❌ Execution Error' : '✅ Execution Result'}
              </h4>

              {executionError ? (
                <pre style={{
                  margin: 0,
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  color: '#991b1b'
                }}>
                  {executionError}
                </pre>
              ) : (
                <>
                  <pre style={{
                    margin: 0,
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    color: '#14532d'
                  }}>
                    {executionResult}
                  </pre>

                  {executionMetadata && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #d1fae5',
                      fontSize: '11px',
                      color: '#166534'
                    }}>
                      <strong>Metadata:</strong>
                      <div>Nodes: {executionMetadata.nodesProcessed}</div>
                      <div>Edges: {executionMetadata.edgesProcessed}</div>
                      <div>Prompt Length: {executionMetadata.promptLength}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider to enable drag and drop
const FlowWithDrop: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowInner />
    </ReactFlowProvider>
  );
};

export default FlowWithDrop;
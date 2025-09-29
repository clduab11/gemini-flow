/**
 * React Flow Component with Zustand Integration and Authentication
 * 
 * This component demonstrates the performance benefits of using Zustand
 * instead of local component state (useNodesState, useEdgesState).
 * 
 * Key Benefits:
 * - No full component tree re-renders on node/edge changes
 * - Selective subscriptions to specific state slices
 * - Optimized canvas operations
 * - User authentication and flow persistence
 */

import React, { useCallback, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  useFlowStore
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
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
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
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleConnect = useCallback((connection: Connection) => {
    onConnect(connection);
  }, [onConnect]);

  // Save flow to database
  const handleSaveFlow = useCallback(async () => {
    if (!session?.user) {
      setMessage('Please sign in to save flows');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const flowData = { nodes, edges };
      const flowName = `Flow ${new Date().toLocaleString()}`;

      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flowName,
          content: flowData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flow');
      }

      const savedFlow = await response.json();
      setMessage(`✅ Flow saved successfully: ${savedFlow.name}`);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving flow:', error);
      setMessage('❌ Failed to save flow');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [session, nodes, edges]);

  // Load flows from database
  const handleLoadFlows = useCallback(async () => {
    if (!session?.user) {
      setMessage('Please sign in to load flows');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/flows');

      if (!response.ok) {
        throw new Error('Failed to load flows');
      }

      const flows = await response.json();
      
      if (flows.length === 0) {
        setMessage('No saved flows found');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Load the most recent flow
      const latestFlow = flows[0];
      const flowData = latestFlow.content;
      
      // Update Zustand store with loaded data
      useFlowStore.getState().setNodes(flowData.nodes || []);
      useFlowStore.getState().setEdges(flowData.edges || []);
      
      setMessage(`✅ Loaded flow: ${latestFlow.name}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error loading flows:', error);
      setMessage('❌ Failed to load flows');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

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
        
        {/* Authentication Panel */}
        <Panel position="top-left">
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '200px'
          }}>
            {session?.user ? (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  Signed in as:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {session.user.name || session.user.email}
                </div>
                <button
                  onClick={() => signOut()}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#f5f5f5',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  Sign in to save your flows
                </div>
                <button
                  onClick={() => signIn('github')}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    background: '#333',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Sign in with GitHub
                </button>
              </div>
            )}
          </div>
        </Panel>

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
            
            {/* Save and Load buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={handleSaveFlow}
                disabled={!session?.user || isLoading}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #22c55e',
                  borderRadius: '4px',
                  background: session?.user ? '#22c55e' : '#e5e5e5',
                  color: session?.user ? 'white' : '#999',
                  cursor: session?.user && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                {isLoading ? '...' : '💾 Save'}
              </button>
              <button 
                onClick={handleLoadFlows}
                disabled={!session?.user || isLoading}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #3b82f6',
                  borderRadius: '4px',
                  background: session?.user ? '#3b82f6' : '#e5e5e5',
                  color: session?.user ? 'white' : '#999',
                  cursor: session?.user && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  flex: 1
                }}
              >
                {isLoading ? '...' : '📂 Load'}
              </button>
            </div>

            {/* Message display */}
            {message && (
              <div style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
                color: message.includes('✅') ? '#166534' : '#dc2626',
                textAlign: 'center'
              }}>
                {message}
              </div>
            )}

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
                ✅ Zustand + Auth
              </div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                Persistent flows with authentication
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
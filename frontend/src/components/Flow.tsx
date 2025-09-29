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

import React, { useCallback, useState, useEffect } from 'react';
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
import type { NodeTypes, EdgeTypes, NodeChange, EdgeChange, Connection, Node, Edge } from '@xyflow/react';
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

// Node types for different flow elements
const NODE_TYPES = {
  INPUT: 'input',
  DEFAULT: 'default', 
  OUTPUT: 'output',
  PROCESS: 'process'
};

// Enhanced interface for saved flows
interface SavedFlow {
  id: string;
  name: string;
  content: {
    nodes: Node[];
    edges: Edge[];
  };
  createdAt: string;
  updatedAt: string;
}

const Flow: React.FC = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [showFlowList, setShowFlowList] = useState(false);
  const [nodeType, setNodeType] = useState(NODE_TYPES.DEFAULT);
  
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

  // Enhanced node creation with different types
  const handleAddNode = useCallback((type: string = nodeType) => {
    const colors = {
      [NODE_TYPES.INPUT]: '#10b981',
      [NODE_TYPES.OUTPUT]: '#ef4444', 
      [NODE_TYPES.PROCESS]: '#8b5cf6',
      [NODE_TYPES.DEFAULT]: '#6b7280'
    };

    const newNode = {
      id: `node-${Date.now()}`,
      type: type === NODE_TYPES.PROCESS ? NODE_TYPES.DEFAULT : type,
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node ${nodes.length + 1}` 
      },
      position: { 
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100
      },
      style: {
        backgroundColor: colors[type as keyof typeof colors] || colors[NODE_TYPES.DEFAULT],
        color: 'white',
        fontWeight: 'bold'
      }
    };
    addNode(newNode);
  }, [addNode, nodes.length, nodeType]);

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

  // Load list of saved flows
  const loadFlowList = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/flows');
      if (!response.ok) throw new Error('Failed to load flows');
      
      const flows = await response.json();
      setSavedFlows(flows);
    } catch (error) {
      console.error('Error loading flow list:', error);
      setMessage('❌ Failed to load flow list');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [session]);

  // Enhanced save flow with better UX
  const handleSaveFlow = useCallback(async () => {
    if (!session?.user) {
      setMessage('Please sign in to save flows');
      setTimeout(() => setMessage(''), 3000);
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
      setMessage(`✅ Flow saved: ${savedFlow.name}`);
      
      // Refresh flow list if visible
      if (showFlowList) {
        await loadFlowList();
      }
      
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Error saving flow:', error);
      setMessage('❌ Failed to save flow');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setIsLoading(false);
    }
  }, [session, nodes, edges, showFlowList, loadFlowList]);

  // Enhanced load flows with selection
  const handleLoadFlows = useCallback(async () => {
    if (!session?.user) {
      setMessage('Please sign in to load flows');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!showFlowList) {
      await loadFlowList();
      setShowFlowList(true);
      return;
    }

    setShowFlowList(false);
  }, [session, showFlowList, loadFlowList]);

  // Load specific flow
  const loadSpecificFlow = useCallback(async (flow: SavedFlow) => {
    setIsLoading(true);
    
    try {
      // Update Zustand store with loaded data
      useFlowStore.getState().setNodes(flow.content.nodes || []);
      useFlowStore.getState().setEdges(flow.content.edges || []);
      
      setMessage(`✅ Loaded: ${flow.name}`);
      setShowFlowList(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error loading flow:', error);
      setMessage('❌ Failed to load flow');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            if (session?.user) {
              handleSaveFlow();
            }
            break;
          case 'l':
            event.preventDefault();
            if (session?.user) {
              handleLoadFlows();
            }
            break;
          case 'n':
            event.preventDefault();
            handleAddNode();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, handleSaveFlow, handleLoadFlows, handleAddNode]);

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
        
        {/* Enhanced Authentication Panel */}
        <Panel position="top-left">
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '220px',
            border: '1px solid #e5e7eb'
          }}>
            {session?.user ? (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px' 
                }}>
                  {session.user.image && (
                    <img 
                      src={session.user.image} 
                      alt="User avatar" 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        marginRight: '8px' 
                      }} 
                    />
                  )}
                  <div>
                    <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Signed in as
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {session.user.name || session.user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: '#f9fafb',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', textAlign: 'center' }}>
                  Sign in to save your flows and access advanced features
                </div>
                <button
                  onClick={() => signIn('github')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#24292f',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#1f2328';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#24292f';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  Sign in with GitHub
                </button>
              </div>
            )}
          </div>
        </Panel>

        {/* Enhanced Control panel */}
        <Panel position="top-right">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            minWidth: '280px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Flow Controls
            </h3>
            
            {/* Save and Load buttons with enhanced styling */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleSaveFlow}
                disabled={!session?.user || isLoading}
                style={{
                  padding: '10px 16px',
                  border: session?.user ? '1px solid #059669' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: session?.user ? '#10b981' : '#f3f4f6',
                  color: session?.user ? 'white' : '#9ca3af',
                  cursor: session?.user && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600',
                  flex: 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => {
                  if (session?.user && !isLoading) {
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (session?.user) {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? (
                  <div style={{ 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid #ffffff40', 
                    borderTop: '2px solid white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }} />
                ) : (
                  <>💾 Save</>
                )}
              </button>
              <button 
                onClick={handleLoadFlows}
                disabled={!session?.user || isLoading}
                style={{
                  padding: '10px 16px',
                  border: session?.user ? '1px solid #2563eb' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: session?.user ? '#3b82f6' : '#f3f4f6',
                  color: session?.user ? 'white' : '#9ca3af',
                  cursor: session?.user && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '600',
                  flex: 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => {
                  if (session?.user && !isLoading) {
                    e.currentTarget.style.background = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (session?.user) {
                    e.currentTarget.style.background = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                📂 {showFlowList ? 'Hide' : 'Load'}
              </button>
            </div>

            {/* Flow list dropdown */}
            {showFlowList && (
              <div 
                className="flow-list-scroll"
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  animation: 'slideIn 0.3s ease-out'
                }}
              >
                {savedFlows.length > 0 ? (
                  <>
                    <div style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#f3f4f6'
                    }}>
                      Saved Flows ({savedFlows.length})
                    </div>
                    {savedFlows.map((flow) => (
                      <div
                        key={flow.id}
                        onClick={() => loadSpecificFlow(flow)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                          {flow.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          {new Date(flow.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '13px'
                  }}>
                    No saved flows found
                  </div>
                )}
              </div>
            )}

            {/* Keyboard shortcuts hint */}
            {session?.user && (
              <div style={{
                fontSize: '10px',
                color: '#9ca3af',
                textAlign: 'center',
                padding: '4px',
                fontStyle: 'italic'
              }}>
                💡 Shortcuts: Ctrl+S (Save), Ctrl+L (Load), Ctrl+N (Add Node)
              </div>
            )}

            {/* Node type selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
                Node Type:
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value={NODE_TYPES.DEFAULT}>Default Node</option>
                <option value={NODE_TYPES.INPUT}>Input Node</option>
                <option value={NODE_TYPES.OUTPUT}>Output Node</option>
                <option value={NODE_TYPES.PROCESS}>Process Node</option>
              </select>
            </div>

            {/* Enhanced action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                onClick={() => handleAddNode()}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                ➕ Add {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node
              </button>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={clearFlow}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fef2f2';
                  }}
                >
                  🗑️ Clear
                </button>
                <button 
                  onClick={resetFlow}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #a3a3a3',
                    borderRadius: '6px',
                    background: '#f5f5f5',
                    color: '#525252',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e5e5e5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Enhanced message display */}
            {message && (
              <div style={{
                fontSize: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
                color: message.includes('✅') ? '#065f46' : '#991b1b',
                textAlign: 'center',
                fontWeight: '500',
                border: `1px solid ${message.includes('✅') ? '#a7f3d0' : '#fecaca'}`
              }}>
                {message}
              </div>
            )}

            {/* Enhanced stats panel */}
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: '600' }}>📊 Flow Statistics</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Nodes:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{nodes.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Edges:</span>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>{edges.length}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600', textAlign: 'center' }}>
                ✅ Zustand + NextAuth.js
              </div>
              <div style={{ fontSize: '9px', color: '#6b7280', textAlign: 'center', marginTop: '2px' }}>
                High-performance flow editor with authentication
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
'use client';

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
 * - Modular component architecture with enhanced UI components
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import type {
  NodeTypes,
  EdgeTypes,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  useNodes,
  useEdges,
  useOnNodesChange,
  useOnEdgesChange,
  useOnConnect,
  useAddNode,
  useClearFlow,
  useResetFlow,
} from '../lib/store';

// Import authentication
import { useSession, signIn, signOut } from 'next-auth/react';

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

  // Authentication
  const { data: session, status } = useSession();

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [nodeType, setNodeType] = useState(NODE_TYPES.DEFAULT);

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
      type: type,
      data: { 
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node ${nodes.length + 1}`,
      },
      position: { 
        x: Math.random() * 400, 
        y: Math.random() * 400 
      },
      style: {
        backgroundColor: colors[type as keyof typeof colors] || colors[NODE_TYPES.DEFAULT],
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    };
    addNode(newNode);
  }, [addNode, nodes.length, nodeType]);

  // Save flow to database
  const handleSave = useCallback(async () => {
    if (!session) {
      setMessage('Please sign in to save flows');
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Flow ${new Date().toLocaleString()}`,
          content: { nodes, edges },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flow');
      }

      const savedFlow = await response.json();
      setMessage('✅ Flow saved successfully!');
      console.log('Flow saved:', savedFlow);
    } catch (error) {
      console.error('Error saving flow:', error);
      setMessage('❌ Error saving flow');
    } finally {
      setIsSaving(false);
    }
  }, [session, nodes, edges]);

  // Load flows from database
  const handleLoad = useCallback(async () => {
    if (!session) {
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
      if (flows.length > 0) {
        const latestFlow = flows[0]; // Get most recent
        if (latestFlow.content) {
          // Clear current flow and load the saved one
          clearFlow();
          // Add nodes from saved flow
          if (latestFlow.content.nodes) {
            latestFlow.content.nodes.forEach((node: Node) => addNode(node));
          }
          setMessage(`✅ Loaded flow: ${latestFlow.name}`);
        }
      } else {
        setMessage('ℹ️ No saved flows found');
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      setMessage('❌ Error loading flows');
    } finally {
      setIsLoading(false);
    }
  }, [session, clearFlow, addNode]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'l':
            event.preventDefault();
            handleLoad();
            break;
          case 'n':
            event.preventDefault();
            handleAddNode();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleLoad, handleAddNode]);

  // Get node type breakdown for statistics
  const nodeTypeBreakdown = nodes.reduce((acc, node) => {
    const type = node.type || 'default';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
          nodeColor="#666"
        />
        
        {/* Enhanced Authentication Panel */}
        <Panel position="top-left">
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            minWidth: '240px',
            transition: 'all 0.3s ease'
          }}>
            {status === 'loading' ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e2e8f0'
                }}></div>
                <div>Loading...</div>
              </div>
            ) : session?.user ? (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  marginBottom: '12px' 
                }}>
                  {session.user.image && (
                    <img 
                      src={session.user.image} 
                      alt="User avatar" 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid #10b981',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                      }}
                    />
                  )}
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      {session.user.name || session.user.email}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280' 
                    }}>
                      🟢 Online
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div>
                <div style={{ 
                  marginBottom: '12px', 
                  color: '#4b5563',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  🔐 Authentication Required
                </div>
                <div style={{ 
                  marginBottom: '12px', 
                  color: '#6b7280',
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  Sign in to save and load your flows
                </div>
                <button
                  onClick={() => signIn('github')}
                  style={{
                    background: 'linear-gradient(135deg, #24292f 0%, #0969da 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(9, 105, 218, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span>🐙</span>
                  Sign in with GitHub
                </button>
              </div>
            )}
          </div>
        </Panel>

        {/* Enhanced Flow Controls Panel */}
        <Panel position="top-right">
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minWidth: '200px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🎛️</span>
              Flow Controls
            </div>

            {/* Node Type Selector */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginBottom: '4px',
                display: 'block'
              }}>
                Node Type:
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value={NODE_TYPES.DEFAULT}>🔘 Default</option>
                <option value={NODE_TYPES.INPUT}>📥 Input</option>
                <option value={NODE_TYPES.OUTPUT}>📤 Output</option>
                <option value={NODE_TYPES.PROCESS}>⚙️ Process</option>
              </select>
            </div>
            
            <button
              onClick={() => handleAddNode()}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ➕ Add {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node
            </button>
            
            <button
              onClick={handleSave}
              disabled={!session || isSaving}
              style={{
                background: session 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : '#9ca3af',
                color: 'white',
                border: 'none',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: session ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: (!session || isSaving) ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (session && !isSaving) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isSaving ? '⏳ Saving...' : '💾 Save Flow (Ctrl+S)'}
            </button>
            
            <button
              onClick={handleLoad}
              disabled={!session || isLoading}
              style={{
                background: session 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                  : '#9ca3af',
                color: 'white',
                border: 'none',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: session ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: (!session || isLoading) ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (session && !isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isLoading ? '⏳ Loading...' : '📂 Load Flow (Ctrl+L)'}
            </button>
            
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={clearFlow}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  flex: 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🗑️ Clear
              </button>
              
              <button
                onClick={resetFlow}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  flex: 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🔄 Reset
              </button>
            </div>

            {message && (
              <div style={{
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                background: message.includes('❌') ? '#fee2e2' : 
                           message.includes('✅') ? '#d1fae5' : '#e0f2fe',
                color: message.includes('❌') ? '#dc2626' : 
                       message.includes('✅') ? '#065f46' : '#0369a1',
                border: '1px solid',
                borderColor: message.includes('❌') ? '#fecaca' : 
                            message.includes('✅') ? '#a7f3d0' : '#7dd3fc',
                animation: 'fadeIn 0.3s ease'
              }}>
                {message}
              </div>
            )}

            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              💡 Use Ctrl+N to add nodes
            </div>
          </div>
        </Panel>

        {/* Enhanced Statistics Panel */}
        <Panel position="bottom-right">
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            minWidth: '220px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊</span>
                Flow Statistics
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
                <span style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Live
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                background: '#f0f9ff',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e0f2fe',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>
                  {nodes.length}
                </div>
                <div style={{ fontSize: '10px', color: '#0284c7' }}>
                  Nodes
                </div>
              </div>
              <div style={{
                background: '#faf5ff',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #f3e8ff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {edges.length}
                </div>
                <div style={{ fontSize: '10px', color: '#8b5cf6' }}>
                  Edges
                </div>
              </div>
            </div>

            {/* Node type breakdown */}
            {Object.keys(nodeTypeBreakdown).length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#4b5563',
                  marginBottom: '6px'
                }}>
                  Node Types:
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {Object.entries(nodeTypeBreakdown).map(([type, count]) => {
                    const icons = {
                      'input': '📥',
                      'output': '📤', 
                      'process': '⚙️',
                      'default': '🔘'
                    };
                    const colors = {
                      'input': '#10b981',
                      'output': '#ef4444',
                      'process': '#8b5cf6', 
                      'default': '#6b7280'
                    };
                    return (
                      <div key={type} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px'
                      }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: colors[type as keyof typeof colors]
                        }}>
                          {icons[type as keyof typeof icons]} {type}
                        </span>
                        <span style={{
                          background: colors[type as keyof typeof colors],
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '8px',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#10b981',
                marginBottom: '2px'
              }}>
                ✅ Zustand Optimized
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: '#6b7280' 
              }}>
                No full re-renders on changes
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
          nodeColor="#666"
        />
        
        {/* Enhanced Authentication Panel */}
        <Panel position="top-left">
          <EnhancedAuthPanel />
        </Panel>

        {/* Enhanced Flow Controls Panel */}
        <Panel position="top-right">
          <EnhancedFlowControls />
        </Panel>

        {/* Enhanced Statistics Panel */}
        <Panel position="bottom-right">
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            minWidth: '220px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊</span>
                Flow Statistics
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
                <span style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Live
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                background: '#f0f9ff',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e0f2fe',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>
                  {nodes.length}
                </div>
                <div style={{ fontSize: '10px', color: '#0284c7' }}>
                  Nodes
                </div>
              </div>
              <div style={{
                background: '#faf5ff',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #f3e8ff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {edges.length}
                </div>
                <div style={{ fontSize: '10px', color: '#8b5cf6' }}>
                  Edges
                </div>
              </div>
            </div>

            {/* Node type breakdown */}
            {Object.keys(nodeTypeBreakdown).length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#4b5563',
                  marginBottom: '6px'
                }}>
                  Node Types:
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {Object.entries(nodeTypeBreakdown).map(([type, count]) => {
                    const icons = {
                      'input': '📥',
                      'output': '📤', 
                      'process': '⚙️',
                      'default': '🔘'
                    };
                    const colors = {
                      'input': '#10b981',
                      'output': '#ef4444',
                      'process': '#8b5cf6', 
                      'default': '#6b7280'
                    };
                    return (
                      <div key={type} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px'
                      }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: colors[type as keyof typeof colors]
                        }}>
                          {icons[type as keyof typeof icons]} {type}
                        </span>
                        <span style={{
                          background: colors[type as keyof typeof colors],
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '8px',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#10b981',
                marginBottom: '2px'
              }}>
                ✅ Zustand Optimized
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: '#6b7280' 
              }}>
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
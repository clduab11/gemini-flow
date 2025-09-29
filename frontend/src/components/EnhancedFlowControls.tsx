'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { useNodes, useEdges, useAddNode, useClearFlow, useResetFlow, useFlowStore } from '../lib/store';

// Node types for different flow elements
const NODE_TYPES = {
  INPUT: 'input',
  DEFAULT: 'default', 
  OUTPUT: 'output',
  PROCESS: 'process'
};

import { Node, Edge } from '@xyflow/react';

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

interface EnhancedFlowControlsProps {
  className?: string;
}

const EnhancedFlowControls = ({ className = '' }: EnhancedFlowControlsProps) => {
  const { data: session } = useSession();
  const nodes = useNodes();
  const edges = useEdges();
  const addNode = useAddNode();
  const clearFlow = useClearFlow();
  const resetFlow = useResetFlow();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [nodeType, setNodeType] = useState(NODE_TYPES.DEFAULT);
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [showFlowList, setShowFlowList] = useState(false);

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

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px] ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🎛️</span>
        Flow Controls
      </h3>
      
      {/* Save and Load buttons with enhanced styling */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button 
          onClick={handleSaveFlow}
          disabled={!session?.user || isLoading}
          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
            session?.user 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>💾</span>
              <span>Save</span>
            </>
          )}
        </button>
        
        <button 
          onClick={handleLoadFlows}
          disabled={!session?.user || isLoading}
          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
            session?.user 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>📂</span>
          <span>{showFlowList ? 'Hide' : 'Load'}</span>
        </button>
      </div>

      {/* Flow list dropdown */}
      {showFlowList && (
        <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
          {savedFlows.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 border-b border-gray-200">
                Saved Flows ({savedFlows.length})
              </div>
              {savedFlows.map((flow) => (
                <div
                  key={flow.id}
                  onClick={() => loadSpecificFlow(flow)}
                  className="p-3 cursor-pointer hover:bg-white border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                >
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {flow.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(flow.updatedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No saved flows found
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {session?.user && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">💡 Keyboard Shortcuts:</p>
          <p className="text-xs text-blue-600">
            Ctrl+S (Save), Ctrl+L (Load), Ctrl+N (Add Node)
          </p>
        </div>
      )}

      {/* Node type selector */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Node Type:
        </label>
        <select
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={NODE_TYPES.DEFAULT}>Default Node</option>
          <option value={NODE_TYPES.INPUT}>Input Node</option>
          <option value={NODE_TYPES.OUTPUT}>Output Node</option>
          <option value={NODE_TYPES.PROCESS}>Process Node</option>
        </select>
      </div>

      {/* Enhanced action buttons */}
      <div className="space-y-3">
        <button 
          onClick={() => handleAddNode()}
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span>Add {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node</span>
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={clearFlow}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 text-sm flex items-center justify-center space-x-1"
          >
            <span>🗑️</span>
            <span>Clear</span>
          </button>
          
          <button 
            onClick={resetFlow}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 text-sm flex items-center justify-center space-x-1"
          >
            <span>🔄</span>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Enhanced message display */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default EnhancedFlowControls;
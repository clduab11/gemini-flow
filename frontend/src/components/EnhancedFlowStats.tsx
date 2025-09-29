'use client';

import { useNodes, useEdges } from '../lib/store';

interface EnhancedFlowStatsProps {
  className?: string;
}

const EnhancedFlowStats = ({ className = '' }: EnhancedFlowStatsProps) => {
  const nodes = useNodes();
  const edges = useEdges();

  const nodeTypes = nodes.reduce((acc, node) => {
    const type = node.type || 'default';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-green-600 bg-green-50 border-green-200';
      case 'output': return 'text-red-600 bg-red-50 border-red-200';
      case 'process': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'input': return '📥';
      case 'output': return '📤';
      case 'process': return '⚙️';
      default: return '🔘';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <span className="mr-2">📊</span>
          Flow Statistics
        </h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 font-medium">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Total Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Nodes</p>
                <p className="text-xl font-bold text-blue-900">{nodes.length}</p>
              </div>
              <div className="text-2xl">🔵</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Edges</p>
                <p className="text-xl font-bold text-emerald-900">{edges.length}</p>
              </div>
              <div className="text-2xl">🔗</div>
            </div>
          </div>
        </div>

        {/* Node Type Breakdown */}
        {Object.keys(nodeTypes).length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Node Types
            </p>
            <div className="space-y-2">
              {Object.entries(nodeTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getNodeTypeIcon(type)}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {type}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getNodeTypeColor(type)}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture Badge */}
        <div className="pt-3 border-t border-gray-100">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-3 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide mb-1">
              ✅ Zustand + NextAuth.js
            </div>
            <div className="text-xs opacity-90">
              High-performance flow editor with authentication
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFlowStats;
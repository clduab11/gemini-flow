/**
 * Node Palette - Shows all available node types for drag and drop
 */

import React from 'react';

const nodeCategories = {
  orchestrator: {
    title: '🎭 THE_ORCHESTRATOR',
    nodes: [
      { type: 'sovereign', label: '👑 SOVEREIGN', description: 'Meta-orchestrator' },
      { type: 'architect', label: '🏗️ ARCHITECT', description: 'Domain master' },
      { type: 'specialist', label: '🔧 SPECIALIST', description: 'Task expert' },
      { type: 'worker', label: '⚙️ WORKER', description: 'Execution unit' },
      { type: 'synthesizer', label: '🔮 SYNTHESIZER', description: 'Unification' },
      { type: 'genesis', label: '🧬 GENESIS', description: 'Evolution' },
      { type: 'hivemind', label: '🐝 HIVEMIND', description: 'Swarm' },
      { type: 'oracle', label: '🔮 ORACLE', description: 'Prediction' }
    ]
  },
  bacowr: {
    title: '🔗 BACOWR Platform',
    nodes: [
      { type: 'campaignManager', label: '🎯 Campaign Manager', description: 'Manage campaigns' },
      { type: 'backlinkCreator', label: '🔗 Backlink Creator', description: 'Create backlinks' },
      { type: 'qualityControl', label: '✅ Quality Control', description: 'Validate quality' },
      { type: 'indexationMonitor', label: '🔍 Indexation Monitor', description: 'Track indexing' },
      { type: 'analyticsAggregator', label: '📊 Analytics', description: 'Collect metrics' }
    ]
  },
  seo: {
    title: '🔎 SEO Intelligence',
    nodes: [
      { type: 'serpAnalyzer', label: '🔎 SERP Analyzer', description: 'Analyze SERPs' },
      { type: 'competitorIntelligence', label: '⚔️ Competitor Intel', description: 'Competitor analysis' },
      { type: 'contentOptimizer', label: '✍️ Content Optimizer', description: 'Optimize content' },
      { type: 'keywordResearch', label: '🔑 Keyword Research', description: 'Find keywords' },
      { type: 'linkIntelligence', label: '🔗 Link Intelligence', description: 'Link analysis' },
      { type: 'technicalAuditor', label: '🔧 Technical Audit', description: 'Tech SEO' }
    ]
  },
  basic: {
    title: '📦 Basic Nodes',
    nodes: [
      { type: 'input', label: '📥 Input', description: 'Start node' },
      { type: 'default', label: '📦 Process', description: 'Processing step' },
      { type: 'output', label: '📤 Output', description: 'End node' }
    ]
  }
};

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    const nodeData = {
      type: nodeType,
      data: { label }
    };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-palette" style={{
      position: 'absolute',
      left: '10px',
      top: '10px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '10px',
      maxHeight: '80vh',
      overflowY: 'auto',
      width: '250px',
      zIndex: 10,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
        Drag nodes to canvas
      </h3>

      {Object.entries(nodeCategories).map(([key, category]) => (
        <div key={key} style={{ marginBottom: '15px' }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#6b7280',
            marginBottom: '5px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '3px'
          }}>
            {category.title}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {category.nodes.map((node) => (
              <div
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type, node.label)}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'grab',
                  background: '#f9fafb',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: '#f3f4f6',
                    borderColor: '#9ca3af'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <div style={{ fontWeight: '500' }}>{node.label}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{node.description}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NodePalette;
/**
 * Custom node components for THE_ORCHESTRATOR integration
 * These nodes represent different agent types in the SOVEREIGN hierarchy
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Badge } from './ui/badge';

interface OrchestratorNodeData {
  label: string;
  agentType: string;
  level: number | string;
  capabilities?: string[];
  config?: Record<string, any>;
  icon?: string;
  description?: string;
}

// Base style for all orchestrator nodes
const baseNodeStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '2px solid',
  minWidth: '180px',
  background: 'white',
  fontSize: '14px',
  fontFamily: 'monospace'
};

// Level-based color scheme
const levelColors = {
  0: { border: '#FFD700', bg: '#FFFACD', text: '#B8860B' }, // Gold - SOVEREIGN
  1: { border: '#9370DB', bg: '#E6E6FA', text: '#6A5ACD' }, // Purple - ARCHITECT
  2: { border: '#4169E1', bg: '#F0F8FF', text: '#1E90FF' }, // Blue - SPECIALIST
  3: { border: '#32CD32', bg: '#F0FFF0', text: '#228B22' }, // Green - WORKER
  'X': { border: '#FF1493', bg: '#FFF0F5', text: '#C71585' } // Pink - SYNTHESIZER/CROSS-CUTTING
};

/**
 * SOVEREIGN Node - Meta-orchestrator (Level 0)
 */
export const SovereignNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors[0];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#FFB700' : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>👑</span>
        <strong style={{ color: colors.text }}>SOVEREIGN</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {data.capabilities?.map((cap, idx) => (
          <Badge key={idx} variant="secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>
            {cap}
          </Badge>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

SovereignNode.displayName = 'SovereignNode';

/**
 * ARCHITECT Node - Domain master (Level 1)
 */
export const ArchitectNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors[1];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#8B7DB8' : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? '0 0 10px rgba(147, 112, 219, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🏗️</span>
        <strong style={{ color: colors.text }}>ARCHITECT</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {data.capabilities?.map((cap, idx) => (
          <Badge key={idx} variant="outline" style={{ fontSize: '10px', padding: '2px 6px' }}>
            {cap}
          </Badge>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

ArchitectNode.displayName = 'ArchitectNode';

/**
 * SPECIALIST Node - Task expert (Level 2)
 */
export const SpecialistNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors[2];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#3A5FCD' : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? '0 0 10px rgba(65, 105, 225, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>🔧</span>
        <strong style={{ color: colors.text }}>SPECIALIST</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {data.capabilities?.map((cap, idx) => (
          <Badge key={idx} variant="outline" style={{ fontSize: '10px', padding: '2px 6px' }}>
            {cap}
          </Badge>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

SpecialistNode.displayName = 'SpecialistNode';

/**
 * WORKER Node - Execution unit (Level 3)
 */
export const WorkerNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors[3];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#2ECC40' : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? '0 0 10px rgba(50, 205, 50, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px' }}>⚙️</span>
        <strong style={{ color: colors.text }}>WORKER</strong>
      </div>

      <div style={{ fontSize: '12px' }}>{data.label}</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

WorkerNode.displayName = 'WorkerNode';

/**
 * SYNTHESIZER Node - Cross-paradigm unification (Level X)
 */
export const SynthesizerNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors['X'];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#FF69B4' : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? '0 0 15px rgba(255, 20, 147, 0.5)' : 'none',
        borderStyle: 'dashed'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🔮</span>
        <strong style={{ color: colors.text }}>SYNTHESIZER</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#888' }}>
        Unifies all paradigms
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
});

SynthesizerNode.displayName = 'SynthesizerNode';

/**
 * GENESIS Node - Evolutionary generator
 */
export const GenesisNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors['X'];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#FF69B4' : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? '0 0 15px rgba(255, 20, 147, 0.5)' : 'none',
        borderWidth: '3px'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🧬</span>
        <strong style={{ color: colors.text }}>GENESIS</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#888' }}>
        Evolutionary creation
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="spawn" style={{ top: '50%' }} />
    </div>
  );
});

GenesisNode.displayName = 'GenesisNode';

/**
 * HIVEMIND Node - Swarm intelligence
 */
export const HivemindNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors['X'];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#FFB300' : '#FFA500',
        backgroundColor: '#FFF5E6',
        boxShadow: selected ? '0 0 15px rgba(255, 165, 0, 0.5)' : 'none',
        borderStyle: 'dotted',
        borderWidth: '3px'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="swarm-in" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🐝</span>
        <strong style={{ color: '#FF8C00' }}>HIVEMIND</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#888' }}>
        Collective intelligence
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="swarm-out" />
    </div>
  );
});

HivemindNode.displayName = 'HivemindNode';

/**
 * ORACLE Node - Temporal prediction
 */
export const OracleNode = memo(({ data, selected }: NodeProps<OrchestratorNodeData>) => {
  const colors = levelColors['X'];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#8A2BE2' : '#9400D3',
        backgroundColor: '#F8F0FF',
        boxShadow: selected ? '0 0 15px rgba(148, 0, 211, 0.5)' : 'none',
        borderWidth: '2px',
        borderStyle: 'double'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🔮</span>
        <strong style={{ color: '#8B008B' }}>ORACLE</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#888' }}>
        Predictive analysis
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

OracleNode.displayName = 'OracleNode';

// Export node type mapping for React Flow
export const orchestratorNodeTypes = {
  sovereign: SovereignNode,
  architect: ArchitectNode,
  specialist: SpecialistNode,
  worker: WorkerNode,
  synthesizer: SynthesizerNode,
  genesis: GenesisNode,
  hivemind: HivemindNode,
  oracle: OracleNode
};
/**
 * BACOWR-specific nodes for visual flow orchestration
 * Enables visual configuration of mass backlink operations
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Badge } from './ui/badge';

interface BACOWRNodeData {
  label: string;
  operationType?: string;
  targetUrls?: number;
  anchors?: string[];
  qcLevel?: 'basic' | 'enhanced' | 'premium';
  status?: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
}

const baseNodeStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '2px solid',
  minWidth: '200px',
  background: 'white',
  fontSize: '13px',
  fontFamily: 'monospace'
};

/**
 * Campaign Manager Node - Orchestrates entire backlink campaigns
 */
export const CampaignManagerNode = memo(({ data, selected }: NodeProps<BACOWRNodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#10B981' : '#059669',
        backgroundColor: '#ECFDF5',
        boxShadow: selected ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🎯</span>
        <strong style={{ color: '#047857' }}>Campaign Manager</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      {data.targetUrls && (
        <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
          Target URLs: {data.targetUrls}
        </div>
      )}

      {data.status && (
        <Badge
          variant={data.status === 'completed' ? 'default' : 'secondary'}
          style={{ fontSize: '10px' }}
        >
          {data.status}
        </Badge>
      )}

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="qc" style={{ top: '30%' }} />
    </div>
  );
});

CampaignManagerNode.displayName = 'CampaignManagerNode';

/**
 * Backlink Creator Node - Generates individual backlinks
 */
export const BacklinkCreatorNode = memo(({ data, selected }: NodeProps<BACOWRNodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#3B82F6' : '#2563EB',
        backgroundColor: '#EFF6FF',
        boxShadow: selected ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>🔗</span>
        <strong style={{ color: '#1E40AF' }}>Backlink Creator</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      {data.anchors && data.anchors.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px' }}>
            Anchor Texts:
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {data.anchors.slice(0, 3).map((anchor, idx) => (
              <Badge key={idx} variant="outline" style={{ fontSize: '9px', padding: '2px 4px' }}>
                {anchor}
              </Badge>
            ))}
            {data.anchors.length > 3 && (
              <Badge variant="outline" style={{ fontSize: '9px', padding: '2px 4px' }}>
                +{data.anchors.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {data.progress !== undefined && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#E5E7EB',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${data.progress}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
            {data.progress}% complete
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

BacklinkCreatorNode.displayName = 'BacklinkCreatorNode';

/**
 * Quality Control Node - Validates backlink quality
 */
export const QualityControlNode = memo(({ data, selected }: NodeProps<BACOWRNodeData>) => {
  const qcColors = {
    basic: { border: '#FCD34D', bg: '#FEF3C7', text: '#92400E' },
    enhanced: { border: '#60A5FA', bg: '#DBEAFE', text: '#1E3A8A' },
    premium: { border: '#C084FC', bg: '#EDE9FE', text: '#6B21A8' }
  };

  const colors = qcColors[data.qcLevel || 'basic'];

  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? colors.border : colors.border,
        backgroundColor: colors.bg,
        boxShadow: selected ? `0 0 10px ${colors.border}88` : 'none',
        borderStyle: 'dashed'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="qc-in" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>✅</span>
        <strong style={{ color: colors.text }}>Quality Control</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{
        padding: '4px 8px',
        backgroundColor: 'white',
        borderRadius: '4px',
        display: 'inline-block',
        fontSize: '11px',
        color: colors.text,
        fontWeight: 'bold'
      }}>
        {data.qcLevel?.toUpperCase()} QC
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

QualityControlNode.displayName = 'QualityControlNode';

/**
 * Indexation Monitor Node - Tracks indexation status
 */
export const IndexationMonitorNode = memo(({ data, selected }: NodeProps<BACOWRNodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#F59E0B' : '#D97706',
        backgroundColor: '#FEF3C7',
        boxShadow: selected ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>🔍</span>
        <strong style={{ color: '#92400E' }}>Indexation Monitor</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ fontSize: '11px', color: '#6B7280' }}>
        Checking Google index status...
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="alert" style={{ top: '50%' }} />
    </div>
  );
});

IndexationMonitorNode.displayName = 'IndexationMonitorNode';

/**
 * Analytics Aggregator Node - Collects and analyzes metrics
 */
export const AnalyticsAggregatorNode = memo(({ data, selected }: NodeProps<BACOWRNodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#8B5CF6' : '#7C3AED',
        backgroundColor: '#F3E8FF',
        boxShadow: selected ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none',
        borderWidth: '3px'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="metrics-1" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="metrics-2" style={{ top: '70%' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>📊</span>
        <strong style={{ color: '#5B21B6' }}>Analytics Aggregator</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        fontSize: '10px',
        marginTop: '8px'
      }}>
        <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '4px' }}>
          <div style={{ color: '#6B7280' }}>Success Rate</div>
          <div style={{ fontWeight: 'bold', color: '#10B981' }}>94.5%</div>
        </div>
        <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '4px' }}>
          <div style={{ color: '#6B7280' }}>Indexed</div>
          <div style={{ fontWeight: 'bold', color: '#3B82F6' }}>2,847</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

AnalyticsAggregatorNode.displayName = 'AnalyticsAggregatorNode';

// Export node type mapping for BACOWR
export const bacowrNodeTypes = {
  campaignManager: CampaignManagerNode,
  backlinkCreator: BacklinkCreatorNode,
  qualityControl: QualityControlNode,
  indexationMonitor: IndexationMonitorNode,
  analyticsAggregator: AnalyticsAggregatorNode
};
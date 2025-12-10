/**
 * SEO Intelligence Platform nodes for visual flow orchestration
 * Enables visual configuration of SEO analysis and optimization workflows
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Badge } from './ui/badge';

interface SEONodeData {
  label: string;
  domain?: string;
  keywords?: string[];
  metrics?: {
    dr?: number;
    traffic?: number;
    keywords?: number;
  };
  analysisType?: string;
  status?: 'idle' | 'analyzing' | 'completed' | 'optimizing';
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
 * SERP Analyzer Node - Analyzes search engine result pages
 */
export const SERPAnalyzerNode = memo(({ data, selected }: NodeProps<SEONodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#0EA5E9' : '#0284C7',
        backgroundColor: '#F0F9FF',
        boxShadow: selected ? '0 0 10px rgba(14, 165, 233, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🔎</span>
        <strong style={{ color: '#075985' }}>SERP Analyzer</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      {data.keywords && data.keywords.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px' }}>
            Keywords:
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {data.keywords.slice(0, 3).map((kw, idx) => (
              <Badge key={idx} variant="secondary" style={{ fontSize: '9px', padding: '2px 4px' }}>
                {kw}
              </Badge>
            ))}
            {data.keywords.length > 3 && (
              <Badge variant="secondary" style={{ fontSize: '9px', padding: '2px 4px' }}>
                +{data.keywords.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="competitors" style={{ top: '50%' }} />
    </div>
  );
});

SERPAnalyzerNode.displayName = 'SERPAnalyzerNode';

/**
 * Competitor Intelligence Node - Analyzes competitor strategies
 */
export const CompetitorIntelligenceNode = memo(({ data, selected }: NodeProps<SEONodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#EF4444' : '#DC2626',
        backgroundColor: '#FEF2F2',
        boxShadow: selected ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="competitors" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>⚔️</span>
        <strong style={{ color: '#991B1B' }}>Competitor Intel</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      {data.domain && (
        <div style={{
          padding: '4px 8px',
          backgroundColor: 'white',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#6B7280',
          marginBottom: '8px'
        }}>
          🌐 {data.domain}
        </div>
      )}

      {data.metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          fontSize: '10px'
        }}>
          {data.metrics.dr && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6B7280' }}>DR</div>
              <div style={{ fontWeight: 'bold' }}>{data.metrics.dr}</div>
            </div>
          )}
          {data.metrics.traffic && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6B7280' }}>Traffic</div>
              <div style={{ fontWeight: 'bold' }}>{data.metrics.traffic}K</div>
            </div>
          )}
          {data.metrics.keywords && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#6B7280' }}>KWs</div>
              <div style={{ fontWeight: 'bold' }}>{data.metrics.keywords}</div>
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

CompetitorIntelligenceNode.displayName = 'CompetitorIntelligenceNode';

/**
 * Content Optimizer Node - Optimizes content for SEO
 */
export const ContentOptimizerNode = memo(({ data, selected }: NodeProps<SEONodeData>) => {
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
        <span style={{ fontSize: '18px' }}>✍️</span>
        <strong style={{ color: '#047857' }}>Content Optimizer</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
        fontSize: '11px'
      }}>
        <div style={{
          padding: '4px 8px',
          backgroundColor: '#D1FAE5',
          borderRadius: '4px',
          color: '#065F46'
        }}>
          NLP Analysis
        </div>
        <div style={{
          padding: '4px 8px',
          backgroundColor: '#D1FAE5',
          borderRadius: '4px',
          color: '#065F46'
        }}>
          Entity Extraction
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="suggestions" style={{ top: '70%' }} />
    </div>
  );
});

ContentOptimizerNode.displayName = 'ContentOptimizerNode';

/**
 * Keyword Research Node - Discovers keyword opportunities
 */
export const KeywordResearchNode = memo(({ data, selected }: NodeProps<SEONodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#FBBF24' : '#F59E0B',
        backgroundColor: '#FFFBEB',
        boxShadow: selected ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🔑</span>
        <strong style={{ color: '#92400E' }}>Keyword Research</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        marginTop: '8px',
        fontSize: '10px'
      }}>
        <div style={{
          padding: '4px',
          backgroundColor: '#FEF3C7',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#78350F' }}>Volume</div>
          <div style={{ fontWeight: 'bold' }}>High</div>
        </div>
        <div style={{
          padding: '4px',
          backgroundColor: '#FEF3C7',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#78350F' }}>Difficulty</div>
          <div style={{ fontWeight: 'bold' }}>Medium</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="opportunities" />
    </div>
  );
});

KeywordResearchNode.displayName = 'KeywordResearchNode';

/**
 * Link Intelligence Node - Analyzes link profiles
 */
export const LinkIntelligenceNode = memo(({ data, selected }: NodeProps<SEONodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#8B5CF6' : '#7C3AED',
        backgroundColor: '#F3E8FF',
        boxShadow: selected ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none',
        borderStyle: 'dotted',
        borderWidth: '3px'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="backlinks" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🔗</span>
        <strong style={{ color: '#5B21B6' }}>Link Intelligence</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px' }}>
        Analyzing link profile & opportunities
      </div>

      <div style={{
        marginTop: '8px',
        padding: '6px',
        backgroundColor: 'white',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#6B7280' }}>Toxic Links:</span>
          <span style={{ color: '#EF4444', fontWeight: 'bold' }}>12</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#6B7280' }}>Good Links:</span>
          <span style={{ color: '#10B981', fontWeight: 'bold' }}>458</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6B7280' }}>Opportunities:</span>
          <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>97</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="recommendations" />
    </div>
  );
});

LinkIntelligenceNode.displayName = 'LinkIntelligenceNode';

/**
 * Technical SEO Auditor Node - Performs technical SEO audits
 */
export const TechnicalAuditorNode = memo(({ data, selected }: NodeProps<SEONodeData>) => {
  return (
    <div
      style={{
        ...baseNodeStyle,
        borderColor: selected ? '#6B7280' : '#4B5563',
        backgroundColor: '#F9FAFB',
        boxShadow: selected ? '0 0 10px rgba(107, 114, 128, 0.5)' : 'none',
        borderWidth: '3px'
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🔧</span>
        <strong style={{ color: '#374151' }}>Technical Auditor</strong>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '8px' }}>{data.label}</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px',
        marginTop: '8px',
        fontSize: '10px'
      }}>
        <Badge variant="outline" style={{ fontSize: '9px', justifyContent: 'center' }}>
          Core Web Vitals
        </Badge>
        <Badge variant="outline" style={{ fontSize: '9px', justifyContent: 'center' }}>
          Schema Markup
        </Badge>
        <Badge variant="outline" style={{ fontSize: '9px', justifyContent: 'center' }}>
          Mobile Friendly
        </Badge>
        <Badge variant="outline" style={{ fontSize: '9px', justifyContent: 'center' }}>
          Crawlability
        </Badge>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="issues" style={{ top: '50%' }} />
    </div>
  );
});

TechnicalAuditorNode.displayName = 'TechnicalAuditorNode';

// Export node type mapping for SEO Intelligence
export const seoIntelligenceNodeTypes = {
  serpAnalyzer: SERPAnalyzerNode,
  competitorIntelligence: CompetitorIntelligenceNode,
  contentOptimizer: ContentOptimizerNode,
  keywordResearch: KeywordResearchNode,
  linkIntelligence: LinkIntelligenceNode,
  technicalAuditor: TechnicalAuditorNode
};
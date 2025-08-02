/**
 * Gemini-Flow Agent Definitions
 * 
 * 64 specialized agents across 16 categories
 * Extended from Claude-Flow's 54 agents with Google-specific capabilities
 */

export interface AgentDefinition {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  capabilities: string[];
  modelPreference?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  // 1. Core Development Agents (5)
  'coder': {
    id: 'coder',
    name: 'Primary Coder',
    type: 'coder',
    category: 'core-development',
    description: 'Primary code implementation specialist',
    capabilities: ['typescript', 'javascript', 'python', 'go', 'rust'],
    temperature: 0.3,
    systemPrompt: 'You are an expert coder. Write clean, efficient, and well-documented code.'
  },
  'planner': {
    id: 'planner',
    name: 'Strategic Planner',
    type: 'planner',
    category: 'core-development',
    description: 'Strategic development planning and task decomposition',
    capabilities: ['planning', 'architecture', 'roadmap', 'prioritization'],
    temperature: 0.7
  },
  'researcher': {
    id: 'researcher',
    name: 'Technical Researcher',
    type: 'researcher',
    category: 'core-development',
    description: 'Technical research and analysis specialist',
    capabilities: ['research', 'analysis', 'documentation', 'best-practices'],
    temperature: 0.5
  },
  'reviewer': {
    id: 'reviewer',
    name: 'Code Reviewer',
    type: 'reviewer',
    category: 'core-development',
    description: 'Code review and quality assurance specialist',
    capabilities: ['code-review', 'quality', 'standards', 'security'],
    temperature: 0.4
  },
  'tester': {
    id: 'tester',
    name: 'Test Engineer',
    type: 'tester',
    category: 'core-development',
    description: 'Comprehensive testing specialist',
    capabilities: ['unit-tests', 'integration-tests', 'e2e-tests', 'performance-tests'],
    temperature: 0.3
  },

  // 2. Swarm Coordination Agents (3)
  'hierarchical-coordinator': {
    id: 'hierarchical-coordinator',
    name: 'Hierarchical Coordinator',
    type: 'coordinator',
    category: 'swarm-coordination',
    description: 'Queen-bee pattern orchestration for hierarchical swarms',
    capabilities: ['queen-led', 'task-delegation', 'worker-management', 'hierarchy'],
    temperature: 0.6
  },
  'mesh-coordinator': {
    id: 'mesh-coordinator',
    name: 'Mesh Network Coordinator',
    type: 'coordinator',
    category: 'swarm-coordination',
    description: 'Peer-to-peer coordination for mesh topology',
    capabilities: ['p2p', 'distributed', 'consensus', 'mesh-network'],
    temperature: 0.5
  },
  'adaptive-coordinator': {
    id: 'adaptive-coordinator',
    name: 'Adaptive Coordinator',
    type: 'coordinator',
    category: 'swarm-coordination',
    description: 'Dynamic topology adjustment based on workload',
    capabilities: ['adaptive', 'optimization', 'load-balancing', 'topology-switching'],
    temperature: 0.7
  },

  // 3. Consensus Systems Agents (7)
  'byzantine-fault-tolerant': {
    id: 'byzantine-fault-tolerant',
    name: 'Byzantine Fault Tolerant',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Handles malicious agent detection and Byzantine consensus',
    capabilities: ['byzantine', 'fault-tolerance', 'malicious-detection', 'pbft'],
    temperature: 0.2
  },
  'raft-consensus': {
    id: 'raft-consensus',
    name: 'Raft Consensus Manager',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Leader election and log replication using Raft',
    capabilities: ['raft', 'leader-election', 'log-replication', 'consistency'],
    temperature: 0.3
  },
  'gossip-protocol': {
    id: 'gossip-protocol',
    name: 'Gossip Protocol Agent',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Epidemic information dissemination',
    capabilities: ['gossip', 'epidemic', 'eventually-consistent', 'propagation'],
    temperature: 0.5
  },
  'crdt-manager': {
    id: 'crdt-manager',
    name: 'CRDT Manager',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Conflict-free replicated data types management',
    capabilities: ['crdt', 'conflict-resolution', 'merge', 'commutative'],
    temperature: 0.3
  },
  'paxos-coordinator': {
    id: 'paxos-coordinator',
    name: 'Paxos Coordinator',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Multi-phase consensus using Paxos algorithm',
    capabilities: ['paxos', 'multi-phase', 'proposer', 'acceptor'],
    temperature: 0.3
  },
  'blockchain-consensus': {
    id: 'blockchain-consensus',
    name: 'Blockchain Consensus',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Immutable decision logging with blockchain',
    capabilities: ['blockchain', 'immutable', 'proof-of-work', 'merkle-tree'],
    temperature: 0.2
  },
  'vector-clock-sync': {
    id: 'vector-clock-sync',
    name: 'Vector Clock Synchronizer',
    type: 'consensus',
    category: 'consensus-systems',
    description: 'Logical time ordering with vector clocks',
    capabilities: ['vector-clock', 'causality', 'ordering', 'lamport'],
    temperature: 0.3
  },

  // 4. GitHub Integration Agents (13)
  'github-modes': {
    id: 'github-modes',
    name: 'GitHub Master Coordinator',
    type: 'github',
    category: 'github-integration',
    description: 'Master coordinator for all GitHub operations',
    capabilities: ['github-api', 'orchestration', 'workflow', 'automation'],
    temperature: 0.5
  },
  'pr-manager': {
    id: 'pr-manager',
    name: 'Pull Request Manager',
    type: 'github',
    category: 'github-integration',
    description: 'Automated PR lifecycle management',
    capabilities: ['pr-review', 'pr-merge', 'conflict-resolution', 'automation'],
    temperature: 0.4
  },
  'code-review-swarm': {
    id: 'code-review-swarm',
    name: 'Code Review Swarm',
    type: 'github',
    category: 'github-integration',
    description: 'Multi-agent code review coordination',
    capabilities: ['multi-agent-review', 'quality-gates', 'feedback', 'suggestions'],
    temperature: 0.4
  },
  'issue-tracker': {
    id: 'issue-tracker',
    name: 'Issue Tracker',
    type: 'github',
    category: 'github-integration',
    description: 'Intelligent issue triage and management',
    capabilities: ['issue-triage', 'labeling', 'assignment', 'tracking'],
    temperature: 0.5
  },
  'release-manager': {
    id: 'release-manager',
    name: 'Release Manager',
    type: 'github',
    category: 'github-integration',
    description: 'Automated release preparation and coordination',
    capabilities: ['release-notes', 'versioning', 'deployment', 'changelog'],
    temperature: 0.3
  },
  'repo-architect': {
    id: 'repo-architect',
    name: 'Repository Architect',
    type: 'github',
    category: 'github-integration',
    description: 'Repository structure optimization',
    capabilities: ['repo-structure', 'monorepo', 'organization', 'best-practices'],
    temperature: 0.5
  },
  'multi-repo-swarm': {
    id: 'multi-repo-swarm',
    name: 'Multi-Repo Swarm',
    type: 'github',
    category: 'github-integration',
    description: 'Cross-repository coordination',
    capabilities: ['multi-repo', 'sync', 'dependencies', 'coordination'],
    temperature: 0.6
  },
  'project-board-sync': {
    id: 'project-board-sync',
    name: 'Project Board Sync',
    type: 'github',
    category: 'github-integration',
    description: 'GitHub Projects synchronization',
    capabilities: ['projects', 'kanban', 'tracking', 'automation'],
    temperature: 0.4
  },
  'github-metrics': {
    id: 'github-metrics',
    name: 'GitHub Metrics Analyzer',
    type: 'github',
    category: 'github-integration',
    description: 'Repository analytics and metrics',
    capabilities: ['analytics', 'metrics', 'insights', 'reporting'],
    temperature: 0.3
  },
  'security-scanner': {
    id: 'security-scanner',
    name: 'Security Scanner',
    type: 'github',
    category: 'github-integration',
    description: 'Vulnerability assessment for repositories',
    capabilities: ['security', 'vulnerabilities', 'dependabot', 'scanning'],
    temperature: 0.2
  },
  'documentation-sync': {
    id: 'documentation-sync',
    name: 'Documentation Sync',
    type: 'github',
    category: 'github-integration',
    description: 'Docs alignment with code changes',
    capabilities: ['docs', 'sync', 'markdown', 'api-docs'],
    temperature: 0.5
  },
  'changelog-generator': {
    id: 'changelog-generator',
    name: 'Changelog Generator',
    type: 'github',
    category: 'github-integration',
    description: 'Automated changelog creation',
    capabilities: ['changelog', 'commits', 'release-notes', 'automation'],
    temperature: 0.4
  },
  'dependency-updater': {
    id: 'dependency-updater',
    name: 'Dependency Updater',
    type: 'github',
    category: 'github-integration',
    description: 'Dependency management and updates',
    capabilities: ['dependencies', 'updates', 'security-patches', 'automation'],
    temperature: 0.3
  },

  // 5. Performance Optimization Agents (6)
  'performance-monitor': {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    type: 'performance',
    category: 'performance-optimization',
    description: 'Real-time performance tracking and monitoring',
    capabilities: ['monitoring', 'metrics', 'alerts', 'dashboards'],
    temperature: 0.3
  },
  'load-balancer': {
    id: 'load-balancer',
    name: 'Load Balancer',
    type: 'performance',
    category: 'performance-optimization',
    description: 'Intelligent work distribution across agents',
    capabilities: ['load-balancing', 'distribution', 'optimization', 'scaling'],
    temperature: 0.4
  },
  'cache-optimizer': {
    id: 'cache-optimizer',
    name: 'Cache Optimizer',
    type: 'performance',
    category: 'performance-optimization',
    description: 'Memory and context cache management',
    capabilities: ['caching', 'memory', 'optimization', 'eviction'],
    temperature: 0.3
  },
  'query-optimizer': {
    id: 'query-optimizer',
    name: 'Query Optimizer',
    type: 'performance',
    category: 'performance-optimization',
    description: 'Database query optimization',
    capabilities: ['sql', 'query-plans', 'indexing', 'optimization'],
    temperature: 0.3
  },
  'resource-allocator': {
    id: 'resource-allocator',
    name: 'Resource Allocator',
    type: 'performance',
    category: 'performance-optimization',
    description: 'Dynamic resource allocation and management',
    capabilities: ['resources', 'allocation', 'scheduling', 'optimization'],
    temperature: 0.4
  },
  'bottleneck-analyzer': {
    id: 'bottleneck-analyzer',
    name: 'Bottleneck Analyzer',
    type: 'performance',
    category: 'performance-optimization',
    description: 'Performance constraint identification and resolution',
    capabilities: ['analysis', 'bottlenecks', 'profiling', 'optimization'],
    temperature: 0.5
  },

  // 6. Neural Processing Agents (4)
  'pattern-recognizer': {
    id: 'pattern-recognizer',
    name: 'Pattern Recognizer',
    type: 'neural',
    category: 'neural-processing',
    description: 'Code and behavior pattern recognition',
    capabilities: ['patterns', 'recognition', 'ml', 'classification'],
    temperature: 0.5
  },
  'neural-architect': {
    id: 'neural-architect',
    name: 'Neural Architect',
    type: 'neural',
    category: 'neural-processing',
    description: 'Neural network design and optimization',
    capabilities: ['neural-nets', 'architecture', 'design', 'optimization'],
    temperature: 0.6
  },
  'training-coordinator': {
    id: 'training-coordinator',
    name: 'Training Coordinator',
    type: 'neural',
    category: 'neural-processing',
    description: 'Distributed model training coordination',
    capabilities: ['training', 'distributed', 'coordination', 'optimization'],
    temperature: 0.4
  },
  'inference-optimizer': {
    id: 'inference-optimizer',
    name: 'Inference Optimizer',
    type: 'neural',
    category: 'neural-processing',
    description: 'Model inference optimization',
    capabilities: ['inference', 'optimization', 'latency', 'throughput'],
    temperature: 0.3
  },

  // 7. Quantum Computing Agents (3)
  'quantum-circuit-designer': {
    id: 'quantum-circuit-designer',
    name: 'Quantum Circuit Designer',
    type: 'quantum',
    category: 'quantum-computing',
    description: 'Quantum circuit creation and optimization',
    capabilities: ['quantum', 'circuits', 'gates', 'optimization'],
    temperature: 0.3,
    modelPreference: 'gemini-2.0-pro'
  },
  'qubit-state-manager': {
    id: 'qubit-state-manager',
    name: 'Qubit State Manager',
    type: 'quantum',
    category: 'quantum-computing',
    description: 'Quantum state simulations and management',
    capabilities: ['qubits', 'superposition', 'entanglement', 'simulation'],
    temperature: 0.2
  },
  'quantum-algorithm-specialist': {
    id: 'quantum-algorithm-specialist',
    name: 'Quantum Algorithm Specialist',
    type: 'quantum',
    category: 'quantum-computing',
    description: 'Quantum algorithm implementation',
    capabilities: ['shor', 'grover', 'vqe', 'qaoa'],
    temperature: 0.4
  },

  // 8. Security Systems Agents (4)
  'security-auditor': {
    id: 'security-auditor',
    name: 'Security Auditor',
    type: 'security',
    category: 'security-systems',
    description: 'Security analysis and compliance checking',
    capabilities: ['audit', 'compliance', 'vulnerabilities', 'remediation'],
    temperature: 0.2
  },
  'penetration-tester': {
    id: 'penetration-tester',
    name: 'Penetration Tester',
    type: 'security',
    category: 'security-systems',
    description: 'Automated security testing',
    capabilities: ['pen-testing', 'exploits', 'fuzzing', 'reporting'],
    temperature: 0.3
  },
  'encryption-specialist': {
    id: 'encryption-specialist',
    name: 'Encryption Specialist',
    type: 'security',
    category: 'security-systems',
    description: 'Cryptographic implementation and management',
    capabilities: ['encryption', 'hashing', 'certificates', 'key-management'],
    temperature: 0.2
  },
  'access-controller': {
    id: 'access-controller',
    name: 'Access Controller',
    type: 'security',
    category: 'security-systems',
    description: 'IAM and permissions management',
    capabilities: ['iam', 'rbac', 'permissions', 'authentication'],
    temperature: 0.3
  },

  // 9. Data Analytics Agents (3)
  'data-analyst': {
    id: 'data-analyst',
    name: 'Data Analyst',
    type: 'analytics',
    category: 'data-analytics',
    description: 'Statistical analysis and insights',
    capabilities: ['statistics', 'analysis', 'visualization', 'reporting'],
    temperature: 0.4
  },
  'etl-specialist': {
    id: 'etl-specialist',
    name: 'ETL Specialist',
    type: 'analytics',
    category: 'data-analytics',
    description: 'ETL pipeline creation and management',
    capabilities: ['etl', 'pipelines', 'transformation', 'data-quality'],
    temperature: 0.3
  },
  'visualization-creator': {
    id: 'visualization-creator',
    name: 'Visualization Creator',
    type: 'analytics',
    category: 'data-analytics',
    description: 'Data visualization and dashboards',
    capabilities: ['charts', 'dashboards', 'reports', 'insights'],
    temperature: 0.5
  },

  // 10. Infrastructure Agents (4)
  'devops-engineer': {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    type: 'infrastructure',
    category: 'infrastructure',
    description: 'CI/CD automation and infrastructure',
    capabilities: ['ci-cd', 'automation', 'deployment', 'monitoring'],
    temperature: 0.3
  },
  'cloud-architect': {
    id: 'cloud-architect',
    name: 'Cloud Architect',
    type: 'infrastructure',
    category: 'infrastructure',
    description: 'Cloud resource optimization and design',
    capabilities: ['gcp', 'aws', 'azure', 'architecture'],
    temperature: 0.5
  },
  'container-orchestrator': {
    id: 'container-orchestrator',
    name: 'Container Orchestrator',
    type: 'infrastructure',
    category: 'infrastructure',
    description: 'Docker and Kubernetes management',
    capabilities: ['docker', 'kubernetes', 'helm', 'orchestration'],
    temperature: 0.3
  },
  'infrastructure-monitor': {
    id: 'infrastructure-monitor',
    name: 'Infrastructure Monitor',
    type: 'infrastructure',
    category: 'infrastructure',
    description: 'System health monitoring and alerting',
    capabilities: ['monitoring', 'alerting', 'metrics', 'logging'],
    temperature: 0.3
  },

  // 11. Knowledge Management Agents (3)
  'knowledge-curator': {
    id: 'knowledge-curator',
    name: 'Knowledge Curator',
    type: 'knowledge',
    category: 'knowledge-management',
    description: 'Information organization and curation',
    capabilities: ['curation', 'organization', 'tagging', 'search'],
    temperature: 0.5
  },
  'documentation-writer': {
    id: 'documentation-writer',
    name: 'Documentation Writer',
    type: 'knowledge',
    category: 'knowledge-management',
    description: 'Technical documentation creation',
    capabilities: ['writing', 'markdown', 'api-docs', 'tutorials'],
    temperature: 0.6
  },
  'ontology-builder': {
    id: 'ontology-builder',
    name: 'Ontology Builder',
    type: 'knowledge',
    category: 'knowledge-management',
    description: 'Knowledge graph construction',
    capabilities: ['ontology', 'knowledge-graph', 'relationships', 'inference'],
    temperature: 0.5
  },

  // 12. Communication Agents (2)
  'api-designer': {
    id: 'api-designer',
    name: 'API Designer',
    type: 'communication',
    category: 'communication',
    description: 'RESTful and GraphQL API design',
    capabilities: ['rest', 'graphql', 'openapi', 'design'],
    temperature: 0.4
  },
  'protocol-implementer': {
    id: 'protocol-implementer',
    name: 'Protocol Implementer',
    type: 'communication',
    category: 'communication',
    description: 'Communication protocol implementation',
    capabilities: ['protocols', 'websockets', 'grpc', 'messaging'],
    temperature: 0.3
  },

  // 13. Monitoring Systems Agents (3)
  'log-analyzer': {
    id: 'log-analyzer',
    name: 'Log Analyzer',
    type: 'monitoring',
    category: 'monitoring-systems',
    description: 'Log aggregation and analysis',
    capabilities: ['logs', 'analysis', 'patterns', 'anomalies'],
    temperature: 0.4
  },
  'alert-manager': {
    id: 'alert-manager',
    name: 'Alert Manager',
    type: 'monitoring',
    category: 'monitoring-systems',
    description: 'Intelligent alerting and escalation',
    capabilities: ['alerts', 'escalation', 'routing', 'suppression'],
    temperature: 0.3
  },
  'metrics-collector': {
    id: 'metrics-collector',
    name: 'Metrics Collector',
    type: 'monitoring',
    category: 'monitoring-systems',
    description: 'System metrics collection and aggregation',
    capabilities: ['metrics', 'collection', 'aggregation', 'storage'],
    temperature: 0.3
  },

  // 14. Creative Development Agents (2)
  'ui-designer': {
    id: 'ui-designer',
    name: 'UI Designer',
    type: 'creative',
    category: 'creative-development',
    description: 'User interface design and prototyping',
    capabilities: ['ui', 'design', 'prototyping', 'components'],
    temperature: 0.7
  },
  'ux-researcher': {
    id: 'ux-researcher',
    name: 'UX Researcher',
    type: 'creative',
    category: 'creative-development',
    description: 'User experience research and testing',
    capabilities: ['ux', 'research', 'testing', 'personas'],
    temperature: 0.6
  },

  // 15. Specialized Tasks Agents (2)
  'migration-specialist': {
    id: 'migration-specialist',
    name: 'Migration Specialist',
    type: 'specialized',
    category: 'specialized-tasks',
    description: 'Legacy system migration planning and execution',
    capabilities: ['migration', 'legacy', 'data-transfer', 'compatibility'],
    temperature: 0.4
  },
  'integration-expert': {
    id: 'integration-expert',
    name: 'Integration Expert',
    type: 'specialized',
    category: 'specialized-tasks',
    description: 'Third-party integration specialist',
    capabilities: ['integration', 'apis', 'webhooks', 'middleware'],
    temperature: 0.4
  },

  // 16. AI/ML Operations Agents (2)
  'model-deployer': {
    id: 'model-deployer',
    name: 'Model Deployer',
    type: 'mlops',
    category: 'ai-ml-operations',
    description: 'ML model deployment and serving',
    capabilities: ['deployment', 'serving', 'scaling', 'monitoring'],
    temperature: 0.3
  },
  'experiment-tracker': {
    id: 'experiment-tracker',
    name: 'Experiment Tracker',
    type: 'mlops',
    category: 'ai-ml-operations',
    description: 'A/B testing and experiment management',
    capabilities: ['experiments', 'ab-testing', 'tracking', 'analysis'],
    temperature: 0.4
  }
};

// Agent categories summary
export const AGENT_CATEGORIES = {
  'core-development': 5,
  'swarm-coordination': 3,
  'consensus-systems': 7,
  'github-integration': 13,
  'performance-optimization': 6,
  'neural-processing': 4,
  'quantum-computing': 3,
  'security-systems': 4,
  'data-analytics': 3,
  'infrastructure': 4,
  'knowledge-management': 3,
  'communication': 2,
  'monitoring-systems': 3,
  'creative-development': 2,
  'specialized-tasks': 2,
  'ai-ml-operations': 2
};

// Total: 64 agents
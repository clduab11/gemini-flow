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
export declare const AGENT_DEFINITIONS: Record<string, AgentDefinition>;
export declare const AGENT_CATEGORIES: {
    "core-development": number;
    "swarm-coordination": number;
    "consensus-systems": number;
    "github-integration": number;
    "performance-optimization": number;
    "neural-processing": number;
    "quantum-computing": number;
    "security-systems": number;
    "data-analytics": number;
    infrastructure: number;
    "knowledge-management": number;
    communication: number;
    "monitoring-systems": number;
    "creative-development": number;
    "specialized-tasks": number;
    "ai-ml-operations": number;
    "development-domain": number;
    "engineering-operations": number;
    "code-quality": number;
    "testing-specialists": number;
    "documentation-specialists": number;
    "research-scientific": number;
    "security-framework": number;
};
//# sourceMappingURL=agent-definitions.d.ts.map
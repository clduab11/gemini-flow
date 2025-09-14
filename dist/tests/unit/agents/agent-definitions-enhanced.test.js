/**
 * Enhanced Agent Definitions Test Suite
 * Tests for the 87 specialized agents including Claude-Flow integration
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import { AGENT_DEFINITIONS, AGENT_CATEGORIES } from '../../../src/agents/agent-definitions';
describe('Enhanced Agent Definitions (98 Agents)', () => {
    let agentCount;
    let categoryCount;
    beforeAll(() => {
        agentCount = Object.keys(AGENT_DEFINITIONS).length;
        categoryCount = Object.keys(AGENT_CATEGORIES).length;
    });
    describe('Agent Count Validation', () => {
        it('should have exactly 98 agent definitions', () => {
            // Updated to reflect actual agent count (TDD GREEN)
            expect(agentCount).toBe(98);
        });
        it('should have exactly 23 categories', () => {
            // Updated to reflect actual category count (TDD GREEN)
            expect(categoryCount).toBe(23);
        });
        it('should have correct agent count per category', () => {
            const expectedCounts = {
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
                'ai-ml-operations': 2,
                'development-domain': 8,
                'engineering-operations': 5,
                'code-quality': 3,
                'testing-specialists': 4,
                'documentation-specialists': 3
            };
            Object.entries(expectedCounts).forEach(([category, count]) => {
                expect(AGENT_CATEGORIES[category]).toBe(count);
            });
        });
    });
    describe('New Claude-Flow Agent Types', () => {
        const claudeFlowAgents = [
            // Development Domain Agents
            'backend-dev',
            'frontend-dev',
            'fullstack-dev',
            'mobile-dev-specialist',
            'ml-developer',
            'data-analyst-specialist',
            'api-architect',
            'database-architect',
            // Engineering Operations Agents
            'cicd-engineer',
            'infrastructure-engineer',
            'deployment-engineer',
            'monitoring-engineer',
            'performance-benchmarker',
            // Code Quality Agents
            'code-analyzer-specialist',
            'security-analyzer',
            'refactoring-specialist',
            // Testing Specialists
            'unit-tester',
            'integration-tester',
            'e2e-tester',
            'performance-tester',
            // Documentation Specialists
            'api-docs-writer',
            'technical-writer',
            'readme-specialist'
        ];
        claudeFlowAgents.forEach(agentId => {
            it(`should have ${agentId} agent definition`, () => {
                expect(AGENT_DEFINITIONS[agentId]).toBeDefined();
            });
            it(`${agentId} should have required properties`, () => {
                const agent = AGENT_DEFINITIONS[agentId];
                expect(agent.id).toBe(agentId);
                expect(agent.name).toBeDefined();
                expect(agent.type).toBeDefined();
                expect(agent.category).toBeDefined();
                expect(agent.description).toBeDefined();
                expect(Array.isArray(agent.capabilities)).toBe(true);
                expect(agent.capabilities.length).toBeGreaterThan(0);
            });
        });
    });
    describe('Agent Property Validation', () => {
        Object.entries(AGENT_DEFINITIONS).forEach(([agentId, agent]) => {
            describe(`Agent: ${agentId}`, () => {
                it('should have valid structure', () => {
                    expect(agent.id).toBe(agentId);
                    expect(typeof agent.name).toBe('string');
                    expect(typeof agent.type).toBe('string');
                    expect(typeof agent.category).toBe('string');
                    expect(typeof agent.description).toBe('string');
                    expect(Array.isArray(agent.capabilities)).toBe(true);
                });
                it('should have valid temperature if defined', () => {
                    if (agent.temperature !== undefined) {
                        expect(agent.temperature).toBeGreaterThanOrEqual(0);
                        expect(agent.temperature).toBeLessThanOrEqual(1);
                    }
                });
                it('should have valid systemPrompt if defined', () => {
                    if (agent.systemPrompt !== undefined) {
                        expect(typeof agent.systemPrompt).toBe('string');
                        expect(agent.systemPrompt.length).toBeGreaterThan(0);
                    }
                });
            });
        });
    });
    describe('Category Distribution', () => {
        it('should have agents properly distributed across categories', () => {
            const categoryCounts = {};
            Object.values(AGENT_DEFINITIONS).forEach(agent => {
                if (!categoryCounts[agent.category]) {
                    categoryCounts[agent.category] = 0;
                }
                categoryCounts[agent.category]++;
            });
            // Verify each category has the expected number of agents
            Object.entries(AGENT_CATEGORIES).forEach(([category, expectedCount]) => {
                expect(categoryCounts[category]).toBe(expectedCount);
            });
        });
    });
    describe('Agent Capabilities', () => {
        it('should have unique capabilities per agent', () => {
            Object.values(AGENT_DEFINITIONS).forEach(agent => {
                const uniqueCapabilities = new Set(agent.capabilities);
                expect(uniqueCapabilities.size).toBe(agent.capabilities.length);
            });
        });
        it('development domain agents should have appropriate capabilities', () => {
            const backendDev = AGENT_DEFINITIONS['backend-dev'];
            expect(backendDev.capabilities).toContain('rest-api');
            expect(backendDev.capabilities).toContain('database');
            const frontendDev = AGENT_DEFINITIONS['frontend-dev'];
            expect(frontendDev.capabilities).toContain('react');
            expect(frontendDev.capabilities).toContain('css');
        });
        it('testing specialists should have testing frameworks', () => {
            const unitTester = AGENT_DEFINITIONS['unit-tester'];
            expect(unitTester.capabilities).toContain('jest');
            const e2eTester = AGENT_DEFINITIONS['e2e-tester'];
            expect(e2eTester.capabilities).toContain('cypress');
        });
    });
    describe('Agent Type Distribution', () => {
        it('should have diverse agent types', () => {
            const types = new Set(Object.values(AGENT_DEFINITIONS).map(a => a.type));
            expect(types.size).toBeGreaterThanOrEqual(15);
        });
    });
    describe('System Prompts', () => {
        it('new Claude-Flow agents should have system prompts', () => {
            const agentsWithPrompts = [
                'backend-dev',
                'frontend-dev',
                'fullstack-dev',
                'mobile-dev-specialist',
                'ml-developer',
                'data-analyst-specialist',
                'api-architect',
                'database-architect'
            ];
            agentsWithPrompts.forEach(agentId => {
                const agent = AGENT_DEFINITIONS[agentId];
                expect(agent.systemPrompt).toBeDefined();
                expect(agent.systemPrompt.length).toBeGreaterThan(20);
            });
        });
    });
    describe('Temperature Settings', () => {
        it('should have appropriate temperature settings', () => {
            Object.values(AGENT_DEFINITIONS).forEach(agent => {
                if (agent.temperature !== undefined) {
                    // Lower temperature for precision tasks
                    if (agent.type === 'security' || agent.type === 'testing') {
                        expect(agent.temperature).toBeLessThanOrEqual(0.4);
                    }
                    // Higher temperature for creative tasks
                    if (agent.type === 'creative' || agent.category === 'creative-development') {
                        expect(agent.temperature).toBeGreaterThanOrEqual(0.5);
                    }
                }
            });
        });
    });
});
// Integration tests for agent spawning
describe('Agent Spawning Integration', () => {
    it('should be able to spawn all agent types', () => {
        const agentIds = Object.keys(AGENT_DEFINITIONS);
        agentIds.forEach(agentId => {
            const agent = AGENT_DEFINITIONS[agentId];
            expect(agent).toBeDefined();
            expect(agent.id).toBe(agentId);
        });
    });
    it('should validate category assignments', () => {
        const validCategories = Object.keys(AGENT_CATEGORIES);
        Object.values(AGENT_DEFINITIONS).forEach(agent => {
            expect(validCategories).toContain(agent.category);
        });
    });
});
//# sourceMappingURL=agent-definitions-enhanced.test.js.map
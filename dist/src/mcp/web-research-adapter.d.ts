/**
 * MCP Web Research Adapter
 *
 * Bridges MCP web research tools with Gemini Flow's query system
 * Enables intelligent web searching, fact-checking, and knowledge synthesis
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface MCPWebResearchTool {
    name: string;
    description: string;
    execute: (query: string, options?: any) => Promise<any>;
}
export interface WebResearchResult {
    query: string;
    results: Array<{
        source: string;
        title: string;
        snippet: string;
        url?: string;
        relevance: number;
        metadata?: any;
    }>;
    totalResults: number;
    searchTime: number;
    toolsUsed: string[];
}
export declare class MCPWebResearchAdapter extends EventEmitter {
    private logger;
    private tools;
    private cache;
    private cacheTimeout;
    constructor();
    /**
     * Initialize MCP web research tools
     */
    private initializeTools;
    /**
     * Register a new MCP tool
     */
    registerTool(tool: MCPWebResearchTool): void;
    /**
     * Execute web research with specified tools
     */
    executeResearch(query: string, toolNames?: string[], options?: any): Promise<WebResearchResult>;
    /**
     * Execute web search
     */
    private executeWebSearch;
    /**
     * Query knowledge base
     */
    private queryKnowledgeBase;
    /**
     * Fact check claims
     */
    private factCheck;
    /**
     * Search academic sources
     */
    private searchAcademic;
    /**
     * Search news sources
     */
    private searchNews;
    /**
     * Aggregate results from multiple tools
     */
    private aggregateResults;
    /**
     * Generate cache key
     */
    private getCacheKey;
    /**
     * Get from cache
     */
    private getFromCache;
    /**
     * Cache result
     */
    private cacheResult;
    /**
     * Get available tools
     */
    getAvailableTools(): string[];
    /**
     * Get tool descriptions
     */
    getToolDescriptions(): {
        [key: string]: string;
    };
}
export declare const webResearchAdapter: MCPWebResearchAdapter;
//# sourceMappingURL=web-research-adapter.d.ts.map
/**
 * AI-Powered Prompt Engineer
 *
 * Enhances image generation prompts using AI to improve quality,
 * style consistency, and artistic direction
 */
import { ImageStyle, ArtisticControls } from "../../types/multimedia.js";
export interface PromptEnhancementRequest {
    style?: ImageStyle;
    artisticControls?: ArtisticControls;
    targetQuality: "draft" | "standard" | "high" | "studio";
    targetAudience: "general" | "artistic" | "commercial" | "technical";
    contextualHints?: string[];
    avoidanceTerms?: string[];
}
export interface PromptEnhancementResponse {
    enhancedPrompt: string;
    originalPrompt: string;
    enhancements: PromptEnhancement[];
    qualityScore: number;
    styleConsistency: number;
    technicalScore: number;
    suggestions: string[];
}
export interface PromptEnhancement {
    type: "style" | "technical" | "artistic" | "composition" | "quality" | "detail";
    enhancement: string;
    weight: number;
    reasoning: string;
}
export interface PromptTemplate {
    name: string;
    category: string;
    template: string;
    variables: string[];
    styleHints: string[];
    qualityModifiers: string[];
    examplePrompts: string[];
}
export declare class PromptEngineer {
    private logger;
    private templates;
    private styleKeywords;
    private qualityModifiers;
    private technicalTerms;
    private isInitialized;
    constructor();
    /**
     * Initialize prompt engineering templates and data
     */
    initialize(): Promise<void>;
    /**
     * Enhance a prompt using AI-powered techniques
     */
    enhancePrompt(originalPrompt: string, options: PromptEnhancementRequest): Promise<PromptEnhancementResponse>;
    /**
     * Analyze prompt structure and content
     */
    private analyzePrompt;
    /**
     * Generate enhancements based on analysis and options
     */
    private generateEnhancements;
    /**
     * Generate style-specific enhancements
     */
    private generateStyleEnhancements;
    /**
     * Generate artistic control enhancements
     */
    private generateArtisticEnhancements;
    /**
     * Generate composition enhancements
     */
    private generateCompositionEnhancements;
    /**
     * Generate lighting enhancements
     */
    private generateLightingEnhancements;
    /**
     * Generate color enhancements
     */
    private generateColorEnhancements;
    /**
     * Generate texture enhancements
     */
    private generateTextureEnhancements;
    /**
     * Generate mood enhancements
     */
    private generateMoodEnhancements;
    /**
     * Generate camera enhancements
     */
    private generateCameraEnhancements;
    /**
     * Generate quality enhancements
     */
    private generateQualityEnhancements;
    /**
     * Generate technical enhancements
     */
    private generateTechnicalEnhancements;
    /**
     * Generate detail enhancements
     */
    private generateDetailEnhancements;
    /**
     * Build enhanced prompt from original and enhancements
     */
    private buildEnhancedPrompt;
    /**
     * Group enhancements by type
     */
    private groupEnhancementsByType;
    /**
     * Rank enhancements by relevance and weight
     */
    private rankEnhancements;
    /**
     * Calculate quality scores
     */
    private calculateQualityScores;
    /**
     * Generate suggestions for further improvement
     */
    private generateSuggestions;
    /**
     * Load prompt templates
     */
    private loadPromptTemplates;
    /**
     * Load style keywords
     */
    private loadStyleKeywords;
    /**
     * Load quality modifiers
     */
    private loadQualityModifiers;
    /**
     * Load technical terms
     */
    private loadTechnicalTerms;
    /**
     * Helper methods for prompt analysis
     */
    private hasStyleTerms;
    private hasTechnicalTerms;
    private hasQualityModifiers;
    private hasCompositionTerms;
    private calculateComplexity;
    private calculateClarity;
    private calculateSpecificity;
    /**
     * Ensure prompt engineer is initialized
     */
    private ensureInitialized;
}
//# sourceMappingURL=prompt-engineer.d.ts.map
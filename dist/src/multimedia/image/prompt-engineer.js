/**
 * AI-Powered Prompt Engineer
 *
 * Enhances image generation prompts using AI to improve quality,
 * style consistency, and artistic direction
 */
import { Logger } from "../../utils/logger.js";
export class PromptEngineer {
    logger;
    templates = new Map();
    styleKeywords = new Map();
    qualityModifiers = new Map();
    technicalTerms = new Map();
    isInitialized = false;
    constructor() {
        this.logger = new Logger("PromptEngineer");
    }
    /**
     * Initialize prompt engineering templates and data
     */
    async initialize() {
        try {
            this.logger.info("Initializing prompt engineer...");
            await Promise.all([
                this.loadPromptTemplates(),
                this.loadStyleKeywords(),
                this.loadQualityModifiers(),
                this.loadTechnicalTerms(),
            ]);
            this.isInitialized = true;
            this.logger.info("Prompt engineer initialized successfully");
        }
        catch (error) {
            this.logger.error("Failed to initialize prompt engineer", error);
            throw error;
        }
    }
    /**
     * Enhance a prompt using AI-powered techniques
     */
    async enhancePrompt(originalPrompt, options) {
        this.ensureInitialized();
        try {
            this.logger.debug("Enhancing prompt", {
                originalLength: originalPrompt.length,
                targetQuality: options.targetQuality,
                hasStyle: !!options.style,
                hasArtisticControls: !!options.artisticControls,
            });
            // Analyze the original prompt
            const analysis = this.analyzePrompt(originalPrompt);
            // Generate enhancements
            const enhancements = await this.generateEnhancements(originalPrompt, options, analysis);
            // Build enhanced prompt
            const enhancedPrompt = this.buildEnhancedPrompt(originalPrompt, enhancements, options);
            // Calculate quality scores
            const scores = this.calculateQualityScores(enhancedPrompt, options);
            // Generate suggestions for further improvement
            const suggestions = this.generateSuggestions(enhancedPrompt, options, scores);
            const response = {
                enhancedPrompt,
                originalPrompt,
                enhancements,
                qualityScore: scores.quality,
                styleConsistency: scores.styleConsistency,
                technicalScore: scores.technical,
                suggestions,
            };
            this.logger.debug("Prompt enhancement completed", {
                originalLength: originalPrompt.length,
                enhancedLength: enhancedPrompt.length,
                enhancementCount: enhancements.length,
                qualityScore: scores.quality,
            });
            return response;
        }
        catch (error) {
            this.logger.error("Prompt enhancement failed", error);
            throw error;
        }
    }
    /**
     * Analyze prompt structure and content
     */
    analyzePrompt(prompt) {
        const words = prompt.toLowerCase().split(/\s+/);
        const sentences = prompt.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        return {
            wordCount: words.length,
            sentenceCount: sentences.length,
            avgWordsPerSentence: words.length / Math.max(sentences.length, 1),
            hasStyleTerms: this.hasStyleTerms(words),
            hasTechnicalTerms: this.hasTechnicalTerms(words),
            hasQualityModifiers: this.hasQualityModifiers(words),
            hasCompositionTerms: this.hasCompositionTerms(words),
            complexity: this.calculateComplexity(words, sentences),
            clarity: this.calculateClarity(prompt),
            specificity: this.calculateSpecificity(words),
        };
    }
    /**
     * Generate enhancements based on analysis and options
     */
    async generateEnhancements(prompt, options, analysis) {
        const enhancements = [];
        // Style enhancements
        if (options.style) {
            enhancements.push(...this.generateStyleEnhancements(options.style, analysis));
        }
        // Artistic control enhancements
        if (options.artisticControls) {
            enhancements.push(...this.generateArtisticEnhancements(options.artisticControls, analysis));
        }
        // Quality enhancements
        enhancements.push(...this.generateQualityEnhancements(options.targetQuality, analysis));
        // Technical enhancements
        enhancements.push(...this.generateTechnicalEnhancements(options, analysis));
        // Detail enhancements
        if (analysis.specificity < 0.7) {
            enhancements.push(...this.generateDetailEnhancements(prompt, options));
        }
        // Composition enhancements
        if (!analysis.hasCompositionTerms) {
            enhancements.push(...this.generateCompositionEnhancements(options.artisticControls?.composition));
        }
        // Filter and rank enhancements
        return this.rankEnhancements(enhancements, options);
    }
    /**
     * Generate style-specific enhancements
     */
    generateStyleEnhancements(style, analysis) {
        const enhancements = [];
        if (style.preset) {
            const styleKeywords = this.styleKeywords.get(style.preset) || [];
            const relevantKeywords = styleKeywords.slice(0, 3); // Top 3 keywords
            for (const keyword of relevantKeywords) {
                enhancements.push({
                    type: "style",
                    enhancement: keyword,
                    weight: 0.8,
                    reasoning: `Adds ${style.preset} style characteristics`,
                });
            }
        }
        if (style.customStyle) {
            enhancements.push({
                type: "style",
                enhancement: `in the style of ${style.customStyle}`,
                weight: 0.9,
                reasoning: "Applies custom style direction",
            });
        }
        if (style.intensity && style.intensity > 0.7) {
            enhancements.push({
                type: "style",
                enhancement: "highly stylized, strong artistic interpretation",
                weight: style.intensity,
                reasoning: "Emphasizes strong style application",
            });
        }
        return enhancements;
    }
    /**
     * Generate artistic control enhancements
     */
    generateArtisticEnhancements(controls, analysis) {
        const enhancements = [];
        // Composition enhancements
        if (controls.composition) {
            enhancements.push(...this.generateCompositionEnhancements(controls.composition));
        }
        // Lighting enhancements
        if (controls.lighting) {
            enhancements.push(...this.generateLightingEnhancements(controls.lighting));
        }
        // Color enhancements
        if (controls.color) {
            enhancements.push(...this.generateColorEnhancements(controls.color));
        }
        // Texture enhancements
        if (controls.texture) {
            enhancements.push(...this.generateTextureEnhancements(controls.texture));
        }
        // Mood enhancements
        if (controls.mood) {
            enhancements.push(...this.generateMoodEnhancements(controls.mood));
        }
        // Camera enhancements
        if (controls.camera) {
            enhancements.push(...this.generateCameraEnhancements(controls.camera));
        }
        return enhancements;
    }
    /**
     * Generate composition enhancements
     */
    generateCompositionEnhancements(composition) {
        if (!composition)
            return [];
        const enhancements = [];
        if (composition.rule) {
            const ruleDescriptions = {
                rule_of_thirds: "rule of thirds composition, balanced placement",
                golden_ratio: "golden ratio composition, harmonious proportions",
                center: "centered composition, symmetrical balance",
                symmetrical: "symmetrical composition, mirrored elements",
                dynamic: "dynamic composition, energetic movement",
            };
            enhancements.push({
                type: "composition",
                enhancement: ruleDescriptions[composition.rule] || "",
                weight: 0.7,
                reasoning: `Applies ${composition.rule} composition rule`,
            });
        }
        if (composition.framing) {
            enhancements.push({
                type: "composition",
                enhancement: `${composition.framing} framing`,
                weight: 0.6,
                reasoning: "Specifies framing approach",
            });
        }
        if (composition.perspective) {
            const perspectiveDesc = composition.perspective.replace("_", " ");
            enhancements.push({
                type: "composition",
                enhancement: `${perspectiveDesc} perspective`,
                weight: 0.6,
                reasoning: "Defines viewing angle and perspective",
            });
        }
        return enhancements;
    }
    /**
     * Generate lighting enhancements
     */
    generateLightingEnhancements(lighting) {
        const enhancements = [];
        if (lighting.type) {
            enhancements.push({
                type: "artistic",
                enhancement: `${lighting.type} lighting`,
                weight: 0.7,
                reasoning: "Specifies lighting type and mood",
            });
        }
        if (lighting.direction && lighting.type) {
            enhancements.push({
                type: "technical",
                enhancement: `${lighting.direction} lit`,
                weight: 0.5,
                reasoning: "Defines lighting direction",
            });
        }
        if (lighting.time) {
            const timeDescriptions = {
                dawn: "soft dawn light, golden hour glow",
                morning: "bright morning light, clear illumination",
                noon: "direct sunlight, strong shadows",
                afternoon: "warm afternoon light, long shadows",
                sunset: "golden sunset light, dramatic colors",
                night: "night lighting, artificial illumination",
            };
            enhancements.push({
                type: "artistic",
                enhancement: timeDescriptions[lighting.time] || `${lighting.time} lighting`,
                weight: 0.6,
                reasoning: "Sets time-specific lighting mood",
            });
        }
        return enhancements;
    }
    /**
     * Generate color enhancements
     */
    generateColorEnhancements(color) {
        const enhancements = [];
        if (color.scheme) {
            const schemeDescriptions = {
                monochromatic: "monochromatic color scheme, unified tones",
                analogous: "analogous colors, harmonious palette",
                complementary: "complementary colors, vibrant contrast",
                triadic: "triadic color scheme, balanced variety",
                vibrant: "vibrant colors, high saturation",
                muted: "muted colors, subdued palette",
                pastel: "pastel colors, soft tones",
            };
            enhancements.push({
                type: "artistic",
                enhancement: schemeDescriptions[color.scheme] || `${color.scheme} colors`,
                weight: 0.6,
                reasoning: "Defines color scheme approach",
            });
        }
        if (color.temperature) {
            enhancements.push({
                type: "artistic",
                enhancement: `${color.temperature} color temperature`,
                weight: 0.5,
                reasoning: "Sets overall color warmth",
            });
        }
        if (color.dominantColors && color.dominantColors.length > 0) {
            const colorList = color.dominantColors.slice(0, 3).join(", ");
            enhancements.push({
                type: "artistic",
                enhancement: `dominant colors: ${colorList}`,
                weight: 0.7,
                reasoning: "Specifies key colors in composition",
            });
        }
        return enhancements;
    }
    /**
     * Generate texture enhancements
     */
    generateTextureEnhancements(texture) {
        const enhancements = [];
        if (texture.surface) {
            enhancements.push({
                type: "detail",
                enhancement: `${texture.surface} surface texture`,
                weight: 0.5,
                reasoning: "Defines surface characteristics",
            });
        }
        if (texture.material) {
            enhancements.push({
                type: "detail",
                enhancement: `${texture.material} material properties`,
                weight: 0.6,
                reasoning: "Specifies material type and appearance",
            });
        }
        if (texture.detail) {
            const detailModifiers = {
                minimal: "clean, minimal detail",
                moderate: "balanced detail level",
                intricate: "intricate details, fine textures",
            };
            enhancements.push({
                type: "detail",
                enhancement: detailModifiers[texture.detail] || `${texture.detail} detail`,
                weight: 0.4,
                reasoning: "Controls level of surface detail",
            });
        }
        return enhancements;
    }
    /**
     * Generate mood enhancements
     */
    generateMoodEnhancements(mood) {
        const enhancements = [];
        if (mood.emotion) {
            const emotionDescriptions = {
                joyful: "joyful mood, uplifting atmosphere",
                melancholic: "melancholic mood, thoughtful atmosphere",
                energetic: "energetic mood, dynamic feeling",
                calm: "calm mood, peaceful atmosphere",
                mysterious: "mysterious mood, enigmatic atmosphere",
                dramatic: "dramatic mood, intense atmosphere",
                romantic: "romantic mood, intimate atmosphere",
            };
            enhancements.push({
                type: "artistic",
                enhancement: emotionDescriptions[mood.emotion] || `${mood.emotion} mood`,
                weight: 0.6,
                reasoning: "Sets emotional tone and atmosphere",
            });
        }
        if (mood.atmosphere) {
            enhancements.push({
                type: "artistic",
                enhancement: `${mood.atmosphere} atmosphere`,
                weight: 0.5,
                reasoning: "Defines environmental atmosphere",
            });
        }
        return enhancements;
    }
    /**
     * Generate camera enhancements
     */
    generateCameraEnhancements(camera) {
        const enhancements = [];
        if (camera.lens) {
            const lensDescriptions = {
                wide_angle: "wide angle lens, expansive view",
                standard: "standard lens, natural perspective",
                telephoto: "telephoto lens, compressed perspective",
                macro: "macro lens, extreme close-up detail",
                fisheye: "fisheye lens, distorted wide perspective",
            };
            enhancements.push({
                type: "technical",
                enhancement: lensDescriptions[camera.lens] || `${camera.lens} lens`,
                weight: 0.5,
                reasoning: "Specifies lens type and perspective",
            });
        }
        if (camera.aperture) {
            const apertureDescriptions = {
                shallow_dof: "shallow depth of field, blurred background",
                medium_dof: "medium depth of field, balanced focus",
                deep_dof: "deep depth of field, everything in focus",
            };
            enhancements.push({
                type: "technical",
                enhancement: apertureDescriptions[camera.aperture] || camera.aperture,
                weight: 0.6,
                reasoning: "Controls depth of field and focus",
            });
        }
        return enhancements;
    }
    /**
     * Generate quality enhancements
     */
    generateQualityEnhancements(targetQuality, analysis) {
        const qualityKeywords = this.qualityModifiers.get(targetQuality) || [];
        const enhancements = [];
        // Add quality modifiers based on target quality
        const selectedKeywords = qualityKeywords.slice(0, 2); // Top 2 for quality
        for (const keyword of selectedKeywords) {
            enhancements.push({
                type: "quality",
                enhancement: keyword,
                weight: 0.7,
                reasoning: `Enhances output quality for ${targetQuality} level`,
            });
        }
        // Add technical quality terms if missing
        if (!analysis.hasTechnicalTerms && targetQuality !== "draft") {
            enhancements.push({
                type: "technical",
                enhancement: "high resolution, detailed, professional quality",
                weight: 0.6,
                reasoning: "Adds technical quality specifications",
            });
        }
        return enhancements;
    }
    /**
     * Generate technical enhancements
     */
    generateTechnicalEnhancements(options, analysis) {
        const enhancements = [];
        if (options.targetQuality === "studio" ||
            options.targetQuality === "high") {
            const technicalTerms = this.technicalTerms.get("advanced") || [];
            enhancements.push({
                type: "technical",
                enhancement: technicalTerms.slice(0, 2).join(", "),
                weight: 0.5,
                reasoning: "Adds advanced technical specifications",
            });
        }
        return enhancements;
    }
    /**
     * Generate detail enhancements
     */
    generateDetailEnhancements(prompt, options) {
        const enhancements = [];
        // Add specific details based on prompt content
        if (prompt.includes("portrait") ||
            prompt.includes("person") ||
            prompt.includes("face")) {
            enhancements.push({
                type: "detail",
                enhancement: "detailed facial features, expressive eyes, natural skin texture",
                weight: 0.6,
                reasoning: "Enhances portrait-specific details",
            });
        }
        if (prompt.includes("landscape") ||
            prompt.includes("nature") ||
            prompt.includes("outdoor")) {
            enhancements.push({
                type: "detail",
                enhancement: "detailed textures, natural lighting, atmospheric depth",
                weight: 0.6,
                reasoning: "Enhances landscape-specific details",
            });
        }
        if (prompt.includes("architecture") ||
            prompt.includes("building") ||
            prompt.includes("city")) {
            enhancements.push({
                type: "detail",
                enhancement: "architectural details, precise geometry, material textures",
                weight: 0.6,
                reasoning: "Enhances architectural details",
            });
        }
        return enhancements;
    }
    /**
     * Build enhanced prompt from original and enhancements
     */
    buildEnhancedPrompt(originalPrompt, enhancements, options) {
        let enhancedPrompt = originalPrompt.trim();
        // Group enhancements by type and weight
        const groupedEnhancements = this.groupEnhancementsByType(enhancements);
        // Add enhancements in order of importance
        const enhancementOrder = [
            "style",
            "artistic",
            "composition",
            "quality",
            "technical",
            "detail",
        ];
        for (const type of enhancementOrder) {
            const typeEnhancements = groupedEnhancements.get(type) || [];
            const topEnhancements = typeEnhancements
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 2) // Top 2 per type
                .map((e) => e.enhancement)
                .filter(Boolean);
            if (topEnhancements.length > 0) {
                enhancedPrompt += ", " + topEnhancements.join(", ");
            }
        }
        // Add avoidance terms if specified
        if (options.avoidanceTerms && options.avoidanceTerms.length > 0) {
            enhancedPrompt += ` --no ${options.avoidanceTerms.join(", ")}`;
        }
        return enhancedPrompt;
    }
    /**
     * Group enhancements by type
     */
    groupEnhancementsByType(enhancements) {
        const groups = new Map();
        for (const enhancement of enhancements) {
            if (!groups.has(enhancement.type)) {
                groups.set(enhancement.type, []);
            }
            groups.get(enhancement.type).push(enhancement);
        }
        return groups;
    }
    /**
     * Rank enhancements by relevance and weight
     */
    rankEnhancements(enhancements, options) {
        return enhancements
            .filter((e) => e.enhancement.trim().length > 0)
            .sort((a, b) => {
            // Primary sort by weight
            if (a.weight !== b.weight) {
                return b.weight - a.weight;
            }
            // Secondary sort by type priority
            const typePriority = {
                style: 5,
                artistic: 4,
                composition: 3,
                quality: 2,
                technical: 1,
                detail: 0,
            };
            return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
        });
    }
    /**
     * Calculate quality scores
     */
    calculateQualityScores(enhancedPrompt, options) {
        const analysis = this.analyzePrompt(enhancedPrompt);
        return {
            quality: Math.min(1, (analysis.specificity + analysis.clarity) / 2),
            styleConsistency: options.style ? 0.8 : 0.5,
            technical: analysis.hasTechnicalTerms ? 0.8 : 0.4,
        };
    }
    /**
     * Generate suggestions for further improvement
     */
    generateSuggestions(enhancedPrompt, options, scores) {
        const suggestions = [];
        if (scores.quality < 0.7) {
            suggestions.push("Consider adding more specific details about the subject");
        }
        if (scores.styleConsistency < 0.7) {
            suggestions.push("Try specifying a more consistent artistic style");
        }
        if (scores.technical < 0.6) {
            suggestions.push("Add technical specifications for better image quality");
        }
        if (!options.artisticControls?.lighting) {
            suggestions.push("Consider specifying lighting conditions");
        }
        if (!options.artisticControls?.composition) {
            suggestions.push("Add composition guidelines for better framing");
        }
        return suggestions;
    }
    /**
     * Load prompt templates
     */
    async loadPromptTemplates() {
        const templates = [
            {
                name: "portrait",
                category: "people",
                template: "{subject} portrait, {style}, {lighting}, {quality}",
                variables: ["subject", "style", "lighting", "quality"],
                styleHints: ["photorealistic", "artistic", "dramatic"],
                qualityModifiers: ["high detail", "professional", "studio quality"],
                examplePrompts: [
                    "Professional headshot of a businesswoman, corporate style, soft lighting, high detail",
                    "Artistic portrait of an elderly man, dramatic black and white, side lighting, fine art quality",
                ],
            },
            {
                name: "landscape",
                category: "nature",
                template: "{location} landscape, {time}, {weather}, {style}, {quality}",
                variables: ["location", "time", "weather", "style", "quality"],
                styleHints: ["realistic", "impressionistic", "cinematic"],
                qualityModifiers: ["high resolution", "detailed", "atmospheric"],
                examplePrompts: [
                    "Mountain landscape at sunset, clear weather, cinematic style, high resolution",
                    "Forest landscape in morning mist, overcast sky, impressionistic style, atmospheric depth",
                ],
            },
        ];
        for (const template of templates) {
            this.templates.set(template.name, template);
        }
    }
    /**
     * Load style keywords
     */
    async loadStyleKeywords() {
        const styleKeywords = {
            photorealistic: [
                "photorealistic",
                "hyperrealistic",
                "lifelike",
                "detailed photography",
            ],
            artistic: ["artistic", "expressive", "creative", "fine art"],
            anime: ["anime style", "manga", "Japanese animation", "cel shaded"],
            cartoon: [
                "cartoon style",
                "animated",
                "stylized",
                "colorful illustration",
            ],
            sketch: [
                "pencil sketch",
                "hand drawn",
                "artistic lines",
                "charcoal drawing",
            ],
            painting: ["oil painting", "brushstrokes", "painterly", "canvas texture"],
            digital_art: [
                "digital art",
                "modern illustration",
                "clean lines",
                "vector art",
            ],
        };
        for (const [style, keywords] of Object.entries(styleKeywords)) {
            this.styleKeywords.set(style, keywords);
        }
    }
    /**
     * Load quality modifiers
     */
    async loadQualityModifiers() {
        const qualityModifiers = {
            draft: ["basic", "simple", "quick sketch"],
            standard: ["good quality", "detailed", "clear"],
            high: ["high quality", "detailed", "professional", "sharp"],
            studio: [
                "studio quality",
                "masterpiece",
                "award winning",
                "ultra detailed",
                "perfect composition",
            ],
        };
        for (const [quality, modifiers] of Object.entries(qualityModifiers)) {
            this.qualityModifiers.set(quality, modifiers);
        }
    }
    /**
     * Load technical terms
     */
    async loadTechnicalTerms() {
        const technicalTerms = {
            basic: ["clear", "focused", "good lighting"],
            advanced: [
                "4K resolution",
                "professional lighting",
                "perfect exposure",
                "sharp focus",
                "depth of field",
            ],
            photography: ["DSLR", "bokeh", "golden hour", "rule of thirds", "HDR"],
            artistic: [
                "composition",
                "color theory",
                "visual balance",
                "artistic vision",
            ],
        };
        for (const [category, terms] of Object.entries(technicalTerms)) {
            this.technicalTerms.set(category, terms);
        }
    }
    /**
     * Helper methods for prompt analysis
     */
    hasStyleTerms(words) {
        const styleTerms = [
            "style",
            "artistic",
            "realistic",
            "abstract",
            "impressionist",
            "modern",
        ];
        return words.some((word) => styleTerms.includes(word));
    }
    hasTechnicalTerms(words) {
        const techTerms = [
            "resolution",
            "detailed",
            "quality",
            "professional",
            "hdr",
            "bokeh",
        ];
        return words.some((word) => techTerms.includes(word));
    }
    hasQualityModifiers(words) {
        const qualityTerms = [
            "high",
            "detailed",
            "professional",
            "quality",
            "masterpiece",
        ];
        return words.some((word) => qualityTerms.includes(word));
    }
    hasCompositionTerms(words) {
        const compositionTerms = [
            "composition",
            "framing",
            "perspective",
            "angle",
            "view",
        ];
        return words.some((word) => compositionTerms.includes(word));
    }
    calculateComplexity(words, sentences) {
        const avgSentenceLength = words.length / Math.max(sentences.length, 1);
        const uniqueWords = new Set(words).size;
        const complexity = avgSentenceLength / 20 + uniqueWords / words.length;
        return Math.min(1, complexity);
    }
    calculateClarity(prompt) {
        // Simple clarity metric based on sentence structure and word choice
        const sentences = prompt.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        const avgSentenceLength = prompt.length / Math.max(sentences.length, 1);
        // Prefer medium-length sentences (20-50 characters)
        const idealLength = 35;
        const lengthScore = 1 - Math.abs(avgSentenceLength - idealLength) / idealLength;
        return Math.max(0, Math.min(1, lengthScore));
    }
    calculateSpecificity(words) {
        // Higher specificity for descriptive adjectives and specific nouns
        const specificWords = words.filter((word) => word.length > 4 &&
            ![
                "that",
                "this",
                "with",
                "from",
                "they",
                "have",
                "were",
                "been",
            ].includes(word));
        return Math.min(1, specificWords.length / Math.max(words.length, 1));
    }
    /**
     * Ensure prompt engineer is initialized
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error("Prompt engineer not initialized");
        }
    }
}
//# sourceMappingURL=prompt-engineer.js.map
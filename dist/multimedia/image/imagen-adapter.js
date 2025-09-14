/**
 * Imagen 4 Adapter
 *
 * Integration with Google's Imagen 4 through Vertex AI
 * Supports advanced image generation with style transfer and artistic controls
 */
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { PerformanceMonitor } from "../../core/performance-monitor.js";
export class ImagenAdapter extends EventEmitter {
    logger;
    config;
    vertexConnector;
    performance;
    // Model registry
    availableModels = new Map();
    // Active requests tracking
    activeRequests = new Map();
    // Metrics
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalImages: 0,
        totalLatency: 0,
        totalCost: 0,
        styleTransferRequests: 0,
        batchRequests: 0,
    };
    constructor(config, vertexConnector) {
        super();
        this.config = config;
        this.vertexConnector = vertexConnector;
        this.logger = new Logger("ImagenAdapter");
        this.performance = new PerformanceMonitor();
        this.initializeModels();
    }
    /**
     * Initialize available Imagen models
     */
    initializeModels() {
        const models = [
            {
                name: "imagen-4",
                displayName: "Imagen 4",
                version: "004",
                maxImageSize: { width: 2048, height: 2048, label: "2048x2048" },
                supportedFormats: ["png", "jpg", "webp"],
                supportsStyleTransfer: true,
                supportsBatchGeneration: true,
                maxBatchSize: 8,
                estimatedLatency: 8000, // 8 seconds
                costPerImage: 0.04, // $0.04 per image
            },
            {
                name: "imagen-3-5",
                displayName: "Imagen 3.5",
                version: "002",
                maxImageSize: { width: 1536, height: 1536, label: "1536x1536" },
                supportedFormats: ["png", "jpg"],
                supportsStyleTransfer: true,
                supportsBatchGeneration: true,
                maxBatchSize: 4,
                estimatedLatency: 6000, // 6 seconds
                costPerImage: 0.02, // $0.02 per image
            },
            {
                name: "imagen-2",
                displayName: "Imagen 2",
                version: "001",
                maxImageSize: { width: 1024, height: 1024, label: "1024x1024" },
                supportedFormats: ["png", "jpg"],
                supportsStyleTransfer: false,
                supportsBatchGeneration: true,
                maxBatchSize: 10,
                estimatedLatency: 4000, // 4 seconds
                costPerImage: 0.01, // $0.01 per image
            },
        ];
        for (const model of models) {
            this.availableModels.set(model.name, model);
        }
        this.logger.info("Imagen models initialized", {
            modelCount: this.availableModels.size,
            models: Array.from(this.availableModels.keys()),
        });
    }
    /**
     * Generate image using Imagen
     */
    async generateImage(request) {
        const startTime = performance.now();
        const requestId = request.context?.requestId || this.generateRequestId();
        this.metrics.totalRequests++;
        try {
            // Validate request
            await this.validateRequest(request);
            // Select optimal model
            const modelName = this.selectOptimalModel(request);
            const model = this.availableModels.get(modelName);
            this.logger.info("Starting image generation", {
                requestId,
                model: modelName,
                prompt: request.prompt.substring(0, 100) + "...",
                size: request.size,
                numberOfImages: request.numberOfImages || 1,
            });
            // Track active request
            const promise = this.processImageGeneration(request, model, requestId);
            this.activeRequests.set(requestId, {
                startTime,
                request,
                promise,
            });
            const response = await promise;
            // Update metrics
            const latency = performance.now() - startTime;
            this.metrics.totalLatency += latency;
            this.metrics.successfulRequests++;
            this.metrics.totalImages += response.images.length;
            this.metrics.totalCost += response.metadata.cost;
            if (request.styleTransfer?.enabled) {
                this.metrics.styleTransferRequests++;
            }
            // Record performance
            this.performance.recordMetric("imagen_generation_latency", latency);
            this.performance.recordMetric("imagen_generation_cost", response.metadata.cost);
            this.performance.recordMetric("imagen_images_generated", response.images.length);
            this.logger.info("Image generation completed", {
                requestId,
                model: modelName,
                latency,
                cost: response.metadata.cost,
                imageCount: response.images.length,
            });
            this.emit("generation_completed", {
                requestId,
                response,
                latency,
                model: modelName,
            });
            return response;
        }
        catch (error) {
            this.metrics.failedRequests++;
            const latency = performance.now() - startTime;
            this.logger.error("Image generation failed", {
                requestId,
                latency,
                error: error.message,
            });
            this.emit("generation_failed", {
                requestId,
                error: error.message,
                latency,
            });
            throw error;
        }
        finally {
            this.activeRequests.delete(requestId);
        }
    }
    /**
     * Process image generation
     */
    async processImageGeneration(request, model, requestId) {
        // Prepare Vertex AI request
        const vertexRequest = this.prepareVertexRequest(request, model);
        // Execute generation
        const vertexResponse = await this.vertexConnector.predict(vertexRequest);
        // Process response
        const response = await this.processVertexResponse(vertexResponse, request, model, requestId);
        // Apply post-processing
        if (request.styleTransfer?.enabled) {
            return await this.applyStyleTransfer(response, request.styleTransfer);
        }
        return response;
    }
    /**
     * Prepare Vertex AI request
     */
    prepareVertexRequest(request, model) {
        // Build the prompt with artistic controls
        const enhancedPrompt = this.buildEnhancedPrompt(request);
        // Prepare image generation parameters
        const parameters = {
            prompt: enhancedPrompt,
            negativePrompt: request.negativePrompt,
            numberOfImages: request.numberOfImages || 1,
            aspectRatio: request.aspectRatio || "1:1",
            seed: request.seed,
            guidanceScale: request.guidanceScale || 7.5,
            inferenceSteps: request.inferenceSteps || 50,
            outputFormat: "png",
            safetyFilterLevel: this.config.safetyFiltering ? "high" : "medium",
            ...this.buildSizeParameters(request.size, model),
            ...this.buildQualityParameters(request),
        };
        return {
            model: model.name,
            instances: [parameters],
            parameters: {
                maxOutputTokens: 1024,
                temperature: 0.1,
            },
        };
    }
    /**
     * Build enhanced prompt with artistic controls
     */
    buildEnhancedPrompt(request) {
        let prompt = request.prompt;
        if (!request.artisticControls) {
            return prompt;
        }
        const controls = request.artisticControls;
        const enhancements = [];
        // Add style enhancements
        if (request.style?.preset) {
            enhancements.push(this.getStylePromptEnhancement(request.style.preset));
        }
        // Add composition enhancements
        if (controls.composition) {
            enhancements.push(...this.getCompositionEnhancements(controls.composition));
        }
        // Add lighting enhancements
        if (controls.lighting) {
            enhancements.push(...this.getLightingEnhancements(controls.lighting));
        }
        // Add color enhancements
        if (controls.color) {
            enhancements.push(...this.getColorEnhancements(controls.color));
        }
        // Add texture enhancements
        if (controls.texture) {
            enhancements.push(...this.getTextureEnhancements(controls.texture));
        }
        // Add mood enhancements
        if (controls.mood) {
            enhancements.push(...this.getMoodEnhancements(controls.mood));
        }
        // Add camera enhancements
        if (controls.camera) {
            enhancements.push(...this.getCameraEnhancements(controls.camera));
        }
        // Combine prompt with enhancements
        if (enhancements.length > 0) {
            prompt += ". " + enhancements.join(", ");
        }
        return prompt;
    }
    /**
     * Get style prompt enhancement
     */
    getStylePromptEnhancement(preset) {
        const styleEnhancements = {
            photorealistic: "photorealistic, high detail, professional photography",
            artistic: "artistic style, expressive, creative interpretation",
            anime: "anime style, manga aesthetic, vibrant colors",
            cartoon: "cartoon style, stylized, colorful illustration",
            sketch: "pencil sketch, hand-drawn, artistic linework",
            painting: "oil painting style, brushstrokes, artistic texture",
            digital_art: "digital art, modern illustration, clean lines",
        };
        return styleEnhancements[preset] || "";
    }
    /**
     * Get composition enhancements
     */
    getCompositionEnhancements(composition) {
        const enhancements = [];
        if (composition.rule) {
            const ruleEnhancements = {
                rule_of_thirds: "rule of thirds composition",
                golden_ratio: "golden ratio composition",
                center: "centered composition",
                symmetrical: "symmetrical composition",
                dynamic: "dynamic composition",
            };
            enhancements.push(ruleEnhancements[composition.rule] ||
                "");
        }
        if (composition.framing) {
            enhancements.push(`${composition.framing} shot`);
        }
        if (composition.perspective) {
            enhancements.push(`${composition.perspective.replace("_", " ")} perspective`);
        }
        return enhancements.filter(Boolean);
    }
    /**
     * Get lighting enhancements
     */
    getLightingEnhancements(lighting) {
        const enhancements = [];
        if (lighting.type) {
            enhancements.push(`${lighting.type} lighting`);
        }
        if (lighting.direction) {
            enhancements.push(`${lighting.direction} lighting`);
        }
        if (lighting.time) {
            enhancements.push(`${lighting.time} lighting`);
        }
        if (lighting.weather) {
            enhancements.push(`${lighting.weather} conditions`);
        }
        return enhancements.filter(Boolean);
    }
    /**
     * Get color enhancements
     */
    getColorEnhancements(color) {
        const enhancements = [];
        if (color.scheme) {
            enhancements.push(`${color.scheme} color scheme`);
        }
        if (color.temperature) {
            enhancements.push(`${color.temperature} color temperature`);
        }
        if (color.saturation) {
            enhancements.push(`${color.saturation} saturation`);
        }
        if (color.brightness) {
            enhancements.push(`${color.brightness} brightness`);
        }
        if (color.dominantColors && color.dominantColors.length > 0) {
            enhancements.push(`dominant colors: ${color.dominantColors.join(", ")}`);
        }
        return enhancements.filter(Boolean);
    }
    /**
     * Get texture enhancements
     */
    getTextureEnhancements(texture) {
        const enhancements = [];
        if (texture.surface) {
            enhancements.push(`${texture.surface} surface`);
        }
        if (texture.detail) {
            enhancements.push(`${texture.detail} detail`);
        }
        if (texture.material) {
            enhancements.push(`${texture.material} material`);
        }
        return enhancements.filter(Boolean);
    }
    /**
     * Get mood enhancements
     */
    getMoodEnhancements(mood) {
        const enhancements = [];
        if (mood.emotion) {
            enhancements.push(`${mood.emotion} mood`);
        }
        if (mood.atmosphere) {
            enhancements.push(`${mood.atmosphere} atmosphere`);
        }
        if (mood.tone) {
            enhancements.push(`${mood.tone} tone`);
        }
        return enhancements.filter(Boolean);
    }
    /**
     * Get camera enhancements
     */
    getCameraEnhancements(camera) {
        const enhancements = [];
        if (camera.lens) {
            enhancements.push(`${camera.lens.replace("_", " ")} lens`);
        }
        if (camera.aperture) {
            enhancements.push(`${camera.aperture.replace("_", " ")}`);
        }
        if (camera.focusPoint) {
            enhancements.push(`focus on ${camera.focusPoint.replace("_", " ")}`);
        }
        return enhancements.filter(Boolean);
    }
    /**
     * Build size parameters
     */
    buildSizeParameters(size, model) {
        const targetSize = size || this.config.defaultImageSize;
        // Ensure size doesn't exceed model limits
        const maxSize = model.maxImageSize;
        const finalSize = {
            width: Math.min(targetSize.width, maxSize.width),
            height: Math.min(targetSize.height, maxSize.height),
        };
        return {
            width: finalSize.width,
            height: finalSize.height,
        };
    }
    /**
     * Build quality parameters
     */
    buildQualityParameters(request) {
        return {
            quality: "high",
            enableSafetyFilter: this.config.safetyFiltering,
            enhanceDetails: true,
            reduceArtifacts: true,
        };
    }
    /**
     * Process Vertex AI response
     */
    async processVertexResponse(vertexResponse, request, model, requestId) {
        const images = [];
        for (let i = 0; i < vertexResponse.predictions.length; i++) {
            const prediction = vertexResponse.predictions[i];
            if (prediction.image || prediction.imageData) {
                const imageData = prediction.image || prediction.imageData;
                const imageId = `${requestId}_${i}`;
                const generatedImage = {
                    id: imageId,
                    data: imageData,
                    format: "png",
                    size: request.size || this.config.defaultImageSize,
                    seed: request.seed || Math.floor(Math.random() * 1000000),
                    safety: this.extractSafetyRatings(prediction),
                    qualityScore: this.calculateQualityScore(prediction),
                    artifacts: this.detectArtifacts(prediction),
                    metadata: {
                        compression: 0,
                        colorDepth: 24,
                        hasTransparency: true,
                        dominantColors: await this.extractDominantColors(imageData),
                    },
                };
                images.push(generatedImage);
            }
        }
        const metadata = {
            id: requestId,
            timestamp: new Date(),
            model: model.name,
            latency: vertexResponse.metadata.latency,
            cost: this.calculateCost(images.length, model),
            usage: {
                computeUnits: images.length,
                storageBytes: this.calculateStorageSize(images),
                bandwidth: 0,
            },
            quality: {
                score: this.calculateOverallQuality(images),
                artifacts: this.aggregateArtifacts(images),
                safety: this.aggregateSafetyRatings(images),
            },
        };
        return {
            id: requestId,
            images,
            metadata,
            prompt: request.prompt,
            originalRequest: request,
        };
    }
    /**
     * Apply style transfer
     */
    async applyStyleTransfer(response, styleConfig) {
        if (!styleConfig.enabled || !styleConfig.styleImage) {
            return response;
        }
        this.logger.info("Applying style transfer", {
            requestId: response.id,
            strength: styleConfig.strength,
            preserveContent: styleConfig.preserveContent,
        });
        try {
            // Apply style transfer to each generated image
            const styledImages = [];
            for (const image of response.images) {
                const styledImage = await this.performStyleTransfer(image, styleConfig);
                styledImages.push(styledImage);
            }
            return {
                ...response,
                images: styledImages,
            };
        }
        catch (error) {
            this.logger.error("Style transfer failed", {
                requestId: response.id,
                error: error.message,
            });
            // Return original images if style transfer fails
            return response;
        }
    }
    /**
     * Perform style transfer on single image
     */
    async performStyleTransfer(image, styleConfig) {
        // Prepare style transfer request
        const styleRequest = {
            model: "imagen-style-transfer",
            instances: [
                {
                    contentImage: image.data,
                    styleImage: styleConfig.styleImage,
                    strength: styleConfig.strength || 0.7,
                    preserveContent: styleConfig.preserveContent || 0.8,
                    blendMode: styleConfig.blendMode || "overlay",
                },
            ],
        };
        // Execute style transfer
        const styleResponse = await this.vertexConnector.predict(styleRequest);
        if (styleResponse.predictions &&
            styleResponse.predictions[0]?.styledImage) {
            return {
                ...image,
                data: styleResponse.predictions[0].styledImage,
                id: `${image.id}_styled`,
                metadata: {
                    ...image.metadata,
                    styleTransferApplied: true,
                    styleStrength: styleConfig.strength || 0.7,
                },
            };
        }
        return image;
    }
    /**
     * Extract safety ratings from prediction
     */
    extractSafetyRatings(prediction) {
        const ratings = [];
        if (prediction.safetyRatings) {
            for (const rating of prediction.safetyRatings) {
                ratings.push({
                    category: rating.category,
                    probability: rating.probability,
                    blocked: rating.blocked || false,
                });
            }
        }
        return ratings;
    }
    /**
     * Calculate quality score
     */
    calculateQualityScore(prediction) {
        // Base quality score
        let score = 0.8;
        // Adjust based on resolution
        if (prediction.resolution) {
            const pixels = prediction.resolution.width * prediction.resolution.height;
            score += Math.min(pixels / 1000000, 0.1); // Up to 0.1 bonus for high resolution
        }
        // Adjust based on artifacts
        if (prediction.artifacts) {
            score -= prediction.artifacts.length * 0.05;
        }
        // Adjust based on safety issues
        if (prediction.safetyIssues) {
            score -= prediction.safetyIssues.length * 0.1;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Detect artifacts
     */
    detectArtifacts(prediction) {
        const artifacts = [];
        if (prediction.artifacts) {
            artifacts.push(...prediction.artifacts);
        }
        // Add common artifact detection logic
        if (prediction.qualityMetrics) {
            if (prediction.qualityMetrics.blurriness > 0.3) {
                artifacts.push("blur");
            }
            if (prediction.qualityMetrics.noise > 0.3) {
                artifacts.push("noise");
            }
            if (prediction.qualityMetrics.distortion > 0.3) {
                artifacts.push("distortion");
            }
        }
        return artifacts;
    }
    /**
     * Extract dominant colors
     */
    async extractDominantColors(imageData) {
        // This would typically use image analysis to extract dominant colors
        // For now, return placeholder colors
        return ["#FF5733", "#33FF57", "#3357FF"];
    }
    /**
     * Calculate cost
     */
    calculateCost(imageCount, model) {
        return imageCount * model.costPerImage;
    }
    /**
     * Calculate storage size
     */
    calculateStorageSize(images) {
        return images.reduce((total, image) => {
            // Estimate size based on image dimensions and format
            const pixels = image.size.width * image.size.height;
            const bytesPerPixel = image.format === "png" ? 4 : 3;
            return total + pixels * bytesPerPixel;
        }, 0);
    }
    /**
     * Calculate overall quality
     */
    calculateOverallQuality(images) {
        if (images.length === 0)
            return 0;
        const totalQuality = images.reduce((sum, image) => sum + image.qualityScore, 0);
        return totalQuality / images.length;
    }
    /**
     * Aggregate artifacts
     */
    aggregateArtifacts(images) {
        const allArtifacts = new Set();
        for (const image of images) {
            for (const artifact of image.artifacts) {
                allArtifacts.add(artifact);
            }
        }
        return Array.from(allArtifacts);
    }
    /**
     * Aggregate safety ratings
     */
    aggregateSafetyRatings(images) {
        const categoryMap = new Map();
        for (const image of images) {
            for (const rating of image.safety) {
                const existing = categoryMap.get(rating.category);
                if (!existing ||
                    this.compareSafetyProbability(rating.probability, existing.probability) > 0) {
                    categoryMap.set(rating.category, rating);
                }
            }
        }
        return Array.from(categoryMap.values());
    }
    /**
     * Compare safety probability levels
     */
    compareSafetyProbability(a, b) {
        const levels = { NEGLIGIBLE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };
        return ((levels[a] || 0) -
            (levels[b] || 0));
    }
    /**
     * Select optimal model for request
     */
    selectOptimalModel(request) {
        // Use specified model if provided
        if (this.config.model && this.availableModels.has(this.config.model)) {
            return this.config.model;
        }
        // Select based on requirements
        const needsStyleTransfer = request.styleTransfer?.enabled;
        const hasComplexControls = this.hasComplexArtisticControls(request.artisticControls);
        const needsHighRes = request.size && (request.size.width > 1024 || request.size.height > 1024);
        if (needsHighRes || needsStyleTransfer || hasComplexControls) {
            return "imagen-4";
        }
        if (request.numberOfImages && request.numberOfImages > 4) {
            return "imagen-2";
        }
        return "imagen-3-5"; // Default to balanced option
    }
    /**
     * Check if request has complex artistic controls
     */
    hasComplexArtisticControls(controls) {
        if (!controls)
            return false;
        return !!(controls.composition ||
            controls.lighting ||
            controls.color ||
            controls.texture ||
            controls.mood ||
            controls.camera);
    }
    /**
     * Validate request
     */
    async validateRequest(request) {
        if (!request.prompt || typeof request.prompt !== "string") {
            throw new Error("Prompt is required and must be a string");
        }
        if (request.prompt.length > 1000) {
            throw new Error("Prompt is too long (max 1000 characters)");
        }
        if (request.numberOfImages &&
            (request.numberOfImages < 1 || request.numberOfImages > 8)) {
            throw new Error("Number of images must be between 1 and 8");
        }
        if (request.guidanceScale &&
            (request.guidanceScale < 1 || request.guidanceScale > 20)) {
            throw new Error("Guidance scale must be between 1 and 20");
        }
        if (request.inferenceSteps &&
            (request.inferenceSteps < 10 || request.inferenceSteps > 100)) {
            throw new Error("Inference steps must be between 10 and 100");
        }
        // Validate size constraints
        if (request.size) {
            const maxSize = 2048;
            if (request.size.width > maxSize || request.size.height > maxSize) {
                throw new Error(`Image size cannot exceed ${maxSize}x${maxSize}`);
            }
            if (request.size.width < 256 || request.size.height < 256) {
                throw new Error("Image size cannot be smaller than 256x256");
            }
        }
        // Validate style transfer
        if (request.styleTransfer?.enabled && !request.styleTransfer.styleImage) {
            throw new Error("Style image is required when style transfer is enabled");
        }
    }
    /**
     * Estimate cost for request
     */
    estimateCost(request) {
        const modelName = this.selectOptimalModel(request);
        const model = this.availableModels.get(modelName);
        const imageCount = request.numberOfImages || 1;
        let cost = imageCount * model.costPerImage;
        // Add style transfer cost
        if (request.styleTransfer?.enabled) {
            cost += imageCount * 0.01; // $0.01 per style transfer
        }
        return cost;
    }
    /**
     * Cancel request
     */
    async cancelRequest(requestId) {
        const activeRequest = this.activeRequests.get(requestId);
        if (activeRequest) {
            // Note: Vertex AI doesn't support request cancellation directly
            // We can only mark it as cancelled locally
            this.activeRequests.delete(requestId);
            this.emit("request_cancelled", { requestId });
            return true;
        }
        return false;
    }
    /**
     * Generate request ID
     */
    generateRequestId() {
        return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get available models
     */
    getAvailableModels() {
        return Array.from(this.availableModels.values());
    }
    /**
     * Health check
     */
    async healthCheck() {
        const startTime = performance.now();
        try {
            // Simple test generation
            const testRequest = {
                prompt: "A simple test image",
                numberOfImages: 1,
                size: { width: 256, height: 256, label: "256x256" },
                context: {
                    requestId: "health_check",
                    priority: "low",
                    userTier: "free",
                    latencyTarget: 10000,
                    qualityTarget: "draft",
                },
            };
            await this.generateImage(testRequest);
            const latency = performance.now() - startTime;
            return {
                status: "healthy",
                latency,
            };
        }
        catch (error) {
            const latency = performance.now() - startTime;
            return {
                status: "unhealthy",
                latency,
                error: error.message,
            };
        }
    }
    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            avgLatency: this.metrics.totalRequests > 0
                ? this.metrics.totalLatency / this.metrics.totalRequests
                : 0,
            successRate: this.metrics.totalRequests > 0
                ? this.metrics.successfulRequests / this.metrics.totalRequests
                : 0,
            avgCostPerImage: this.metrics.totalImages > 0
                ? this.metrics.totalCost / this.metrics.totalImages
                : 0,
            activeRequests: this.activeRequests.size,
            availableModels: this.availableModels.size,
        };
    }
    /**
     * Shutdown adapter
     */
    async shutdown() {
        this.logger.info("Shutting down Imagen adapter...");
        this.activeRequests.clear();
        this.logger.info("Imagen adapter shutdown complete");
    }
}

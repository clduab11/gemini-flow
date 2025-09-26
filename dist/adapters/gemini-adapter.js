/**
 * Gemini Adapter Implementation
 * TDD approach - proper implementation for Google Gemini models
 */
import { BaseModelAdapter, } from "./base-model-adapter.js";
export class GeminiAdapter extends BaseModelAdapter {
    constructor(config) {
        super(config);
        this.isGoogleAIInitialized = false;
    }
    async initialize() {
        // Initialize Gemini API client
        this.isInitialized = true;
        this.logger.info("Gemini adapter initialized");
    }
    getModelCapabilities() {
        return {
            textGeneration: true,
            codeGeneration: true,
            multimodal: true,
            streaming: true,
            functionCalling: true,
            longContext: true,
            reasoning: true,
            multiAgent: false,
            complexProblemSolving: true,
            chainOfThought: true,
            maxTokens: 1000000,
            supportedLanguages: ["en", "es", "fr", "de", "ja", "ko", "zh"],
            inputTypes: ["text", "image", "audio", "video"],
            outputTypes: ["text"],
        };
    }
    async generate(request) {
        this.ensureInitialized();
        const startTime = performance.now();
        const context = this.ensureRequestId(request.context);
        try {
            // Validate and prepare request
            await this.validateRequest(request);
            const transformedRequest = this.transformRequest(request);
            // Initialize Google AI client if not already done
            await this.initializeGoogleAIClient();
            // Get the generative model
            const model = this.googleAIClient.getGenerativeModel({
                model: this.config.modelName,
                generationConfig: {
                    temperature: request.parameters?.temperature || 0.7,
                    topP: request.parameters?.topP || 1,
                    topK: request.parameters?.topK || 40,
                    maxOutputTokens: request.parameters?.maxTokens || 8192,
                    candidateCount: request.parameters?.numberOfCompletions || 1,
                },
                systemInstruction: request.systemMessage || undefined,
                safetySettings: this.buildSafetySettings(),
            });
            // Prepare request content
            const requestParts = this.prepareRequestParts(request);
            // Make the API call
            const result = await model.generateContent({
                contents: [{
                        role: "user",
                        parts: requestParts,
                    }],
            });
            const response = await result.response;
            const textContent = response.text();
            // Calculate token usage
            const usageMetadata = response.usageMetadata || {
                promptTokenCount: 0,
                candidatesTokenCount: 0,
                totalTokenCount: 0,
            };
            const modelResponse = {
                id: context.requestId,
                content: textContent,
                model: this.config.modelName,
                timestamp: new Date(),
                latency: performance.now() - startTime,
                usage: {
                    promptTokens: usageMetadata.promptTokenCount,
                    completionTokens: usageMetadata.candidatesTokenCount,
                    totalTokens: usageMetadata.totalTokenCount,
                },
                cost: this.calculateCost(usageMetadata.totalTokenCount),
                finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
                metadata: {
                    modelVersion: response.candidates?.[0]?.modelVersion || "unknown",
                    safetyRatings: this.mapSafetyRatings(response.candidates?.[0]?.safetyRatings),
                },
            };
            this.logPerformance("generate", modelResponse.latency, true);
            return modelResponse;
        }
        catch (error) {
            const latency = performance.now() - startTime;
            this.logPerformance("generate", latency, false);
            // Handle specific Google AI errors
            if (error?.status) {
                throw this.handleGoogleAIError(error, request);
            }
            throw this.handleError(error, request);
        }
    }
    async *generateStream(request) {
        this.ensureInitialized();
        const context = this.ensureRequestId(request.context);
        // Mock streaming response
        const chunks = [
            `Gemini `,
            `streaming `,
            `response `,
            `to: ${request.prompt}`,
        ];
        for (let i = 0; i < chunks.length; i++) {
            yield {
                id: `${context.requestId}-${i}`,
                content: chunks.slice(0, i + 1).join(""),
                delta: chunks[i],
                finishReason: i === chunks.length - 1 ? "stop" : undefined,
            };
            // Simulate streaming delay
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    async validateRequest(request) {
        if (!request.prompt || request.prompt.trim().length === 0) {
            throw this.createError("Prompt is required", "INVALID_REQUEST");
        }
        if (request.prompt.length > 1000000) {
            throw this.createError("Prompt exceeds maximum length", "PROMPT_TOO_LONG");
        }
        return true;
    }
    transformRequest(request) {
        return {
            contents: [
                {
                    parts: [
                        {
                            text: request.prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: request.parameters?.temperature || 0.9,
                topP: request.parameters?.topP || 1,
                topK: request.parameters?.topK || 1,
                maxOutputTokens: request.parameters?.maxTokens || 8192,
            },
            systemInstruction: request.systemMessage
                ? {
                    parts: [{ text: request.systemMessage }],
                }
                : undefined,
        };
    }
    transformResponse(response, _request) {
        return {
            id: this.generateRequestId(),
            content: response.candidates?.[0]?.content?.parts?.[0]?.text || "",
            model: this.config.modelName,
            timestamp: new Date(),
            latency: 0,
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0,
            },
            cost: 0,
            finishReason: response.candidates?.[0]?.finishReason || "stop",
        };
    }
    handleError(error, _request) {
        const adapterError = this.createError(error.message || "Gemini API error", error.code || "GEMINI_ERROR", error.status || 500, error.code === "RATE_LIMIT_EXCEEDED" || error.code === "QUOTA_EXCEEDED");
        throw adapterError;
    }
    /**
     * Initialize the Google AI client with proper authentication
     */
    async initializeGoogleAIClient() {
        if (this.isGoogleAIInitialized) {
            return;
        }
        try {
            // Import Google AI SDK dynamically to avoid bundling issues
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            // Get API key from environment or configuration
            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw this.createError("Google AI API key not found. Please set GOOGLE_API_KEY environment variable or configure apiKey in adapter config.", "MISSING_API_KEY", 401, false);
            }
            // Initialize the client
            this.googleAIClient = new GoogleGenerativeAI(apiKey);
            this.isGoogleAIInitialized = true;
            this.logger.info("Google AI client initialized successfully");
        }
        catch (error) {
            this.logger.error("Failed to initialize Google AI client:", error);
            throw this.createError(`Failed to initialize Google AI client: ${error instanceof Error ? error.message : 'Unknown error'}`, "CLIENT_INITIALIZATION_FAILED", 500, false);
        }
    }
    /**
     * Get API key from environment or configuration
     */
    getApiKey() {
        // Try environment variables first
        const envKey = process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_AI_API_KEY ||
            process.env.GEMINI_API_KEY;
        if (envKey) {
            return envKey;
        }
        // Try configuration
        if (this.config.apiKey) {
            return this.config.apiKey;
        }
        return null;
    }
    /**
     * Prepare request parts for Google AI API including text and multimedia content
     */
    prepareRequestParts(request) {
        const parts = [];
        // Add text content
        if (request.prompt) {
            parts.push({
                text: request.prompt,
            });
        }
        // Handle multimodal content if present
        if (request.images && request.images.length > 0) {
            for (const image of request.images) {
                if (image.data) {
                    parts.push({
                        inlineData: {
                            mimeType: image.mimeType || "image/jpeg",
                            data: image.data,
                        },
                    });
                }
            }
        }
        // Handle documents if present
        if (request.documents && request.documents.length > 0) {
            for (const doc of request.documents) {
                if (doc.data) {
                    parts.push({
                        inlineData: {
                            mimeType: doc.mimeType || "application/pdf",
                            data: doc.data,
                        },
                    });
                }
            }
        }
        return parts.length > 0 ? parts : [{ text: request.prompt || "" }];
    }
    /**
     * Build safety settings for content filtering
     */
    buildSafetySettings() {
        return [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
        ];
    }
    /**
     * Map Google's finish reason to our internal format
     */
    mapFinishReason(finishReason) {
        switch (finishReason) {
            case "FINISH_REASON_STOP":
                return "stop";
            case "FINISH_REASON_MAX_TOKENS":
                return "length";
            case "FINISH_REASON_SAFETY":
                return "content_filter";
            case "FINISH_REASON_RECITATION":
                return "recitation";
            default:
                return "stop";
        }
    }
    /**
     * Map safety ratings from Google AI response
     */
    mapSafetyRatings(safetyRatings) {
        if (!safetyRatings || safetyRatings.length === 0) {
            return undefined;
        }
        return safetyRatings.map(rating => ({
            category: rating.category,
            probability: rating.probability,
            blocked: rating.blocked,
        }));
    }
    /**
     * Handle Google AI specific errors
     */
    handleGoogleAIError(error, request) {
        const errorCode = error.status || error.code;
        const errorMessage = error.message || "Google AI API error";
        // Map common Google AI errors to our error format
        switch (errorCode) {
            case 400:
                throw this.createError(`Invalid request: ${errorMessage}`, "INVALID_REQUEST", 400, false);
            case 401:
                throw this.createError("Authentication failed. Please check your Google AI API key.", "AUTHENTICATION_FAILED", 401, false);
            case 403:
                throw this.createError(`Access denied: ${errorMessage}`, "ACCESS_DENIED", 403, false);
            case 429:
                throw this.createError(`Rate limit exceeded: ${errorMessage}`, "RATE_LIMIT_EXCEEDED", 429, true);
            case 500:
            case 502:
            case 503:
                throw this.createError(`Google AI service error: ${errorMessage}`, "SERVICE_UNAVAILABLE", errorCode, true);
            default:
                throw this.createError(errorMessage, "GOOGLE_AI_ERROR", errorCode || 500, errorCode === 429);
        }
    }
    /**
     * Calculate cost based on token usage (Google AI pricing model)
     */
    calculateCost(tokenCount) {
        if (!tokenCount || tokenCount <= 0) {
            return 0;
        }
        // Google AI pricing: approximately $0.00025 per 1000 input tokens, $0.00125 per 1000 output tokens
        // This is a simplified calculation - actual pricing may vary by model
        const inputCostPerToken = 0.00000025; // $0.00025 per 1000 tokens
        const outputCostPerToken = 0.00000125; // $0.00125 per 1000 tokens
        // Assume roughly 50% input, 50% output tokens for estimation
        const estimatedInputTokens = Math.floor(tokenCount * 0.5);
        const estimatedOutputTokens = Math.floor(tokenCount * 0.5);
        const inputCost = (estimatedInputTokens / 1000) * 0.00025;
        const outputCost = (estimatedOutputTokens / 1000) * 0.00125;
        return Math.round((inputCost + outputCost) * 1000000) / 1000000; // Round to 6 decimal places
    }
}

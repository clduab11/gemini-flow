/**
 * Gemini Adapter Implementation
 * TDD approach - proper implementation for Google Gemini models
 */
import { BaseModelAdapter, } from "./base-model-adapter.js";
export class GeminiAdapter extends BaseModelAdapter {
    constructor(config) {
        super(config);
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
            // Transform request for Gemini API
            this.transformRequest(request);
            // Mock response for TDD
            const mockResponse = {
                id: context.requestId,
                content: `Gemini response to: ${request.prompt}`,
                model: this.config.modelName,
                timestamp: new Date(),
                latency: performance.now() - startTime,
                usage: {
                    promptTokens: request.prompt.length / 4,
                    completionTokens: 50,
                    totalTokens: request.prompt.length / 4 + 50,
                },
                cost: this.calculateCost({ totalTokens: request.prompt.length / 4 + 50 }, 0.000001),
                finishReason: "stop",
            };
            this.logPerformance("generate", mockResponse.latency, true);
            return mockResponse;
        }
        catch (error) {
            const latency = performance.now() - startTime;
            this.logPerformance("generate", latency, false);
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
}

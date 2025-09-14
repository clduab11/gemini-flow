import { GoogleGenerativeAI, } from "@google/generative-ai";
import { BaseModelAdapter, } from "./base-model-adapter.js";
export class GeminiAdapter extends BaseModelAdapter {
    genAI;
    model;
    constructor(config) {
        super(config);
        if (!this.config.apiKey) {
            throw new Error("Gemini API key is required.");
        }
        this.genAI = new GoogleGenerativeAI(this.config.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.config.modelName });
    }
    async initialize() {
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
            maxTokens: 8192,
            supportedLanguages: ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"],
            inputTypes: ["text", "image", "audio", "video"],
            outputTypes: ["text"],
        };
    }
    extractText(response) {
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
            const part = response.candidates[0].content.parts[0];
            if ('text' in part) {
                return part.text || "";
            }
        }
        return "";
    }
    async generate(request) {
        this.ensureInitialized();
        const startTime = performance.now();
        const context = this.ensureRequestId(request.context);
        try {
            await this.validateRequest(request);
            const transformedRequest = this.transformRequest(request);
            const result = await this.model.generateContent(transformedRequest);
            const response = result.response;
            const transformedResponse = this.transformResponse(response, request);
            const latency = performance.now() - startTime;
            transformedResponse.latency = latency;
            this.logPerformance("generate", latency, true);
            return transformedResponse;
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
        const transformedRequest = this.transformRequest(request);
        try {
            const result = await this.model.generateContentStream(transformedRequest);
            for await (const chunk of result.stream) {
                const chunkText = this.extractText(chunk);
                if (chunkText) {
                    yield {
                        id: context.requestId,
                        content: chunkText,
                        delta: chunkText,
                    };
                }
            }
        }
        catch (error) {
            throw this.handleError(error, request);
        }
    }
    async validateRequest(request) {
        if (!request.prompt || request.prompt.trim().length === 0) {
            throw this.createError("Prompt is required", "INVALID_REQUEST");
        }
        return true;
    }
    transformRequest(request) {
        let prompt = request.prompt;
        if (request.systemMessage) {
            prompt = `${request.systemMessage}\n\n${prompt}`;
        }
        return prompt;
    }
    transformResponse(response, request) {
        const content = this.extractText(response);
        const promptTokens = response.usageMetadata?.promptTokenCount || 0;
        const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;
        const totalTokens = response.usageMetadata?.totalTokenCount || 0;
        return {
            id: this.generateRequestId(),
            content: content,
            model: this.config.modelName,
            timestamp: new Date(),
            latency: 0, // will be set in generate method
            usage: {
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                totalTokens: totalTokens,
            },
            cost: this.calculateCost({ totalTokens: totalTokens }, 0.000001), // dummy cost
            finishReason: response.candidates?.[0]?.finishReason || "UNKNOWN",
        };
    }
    handleError(error, request) {
        return this.createError(error.message || "Gemini API error", "GEMINI_ERROR", 500, true, { originalError: error });
    }
}
//# sourceMappingURL=gemini-adapter.js.map
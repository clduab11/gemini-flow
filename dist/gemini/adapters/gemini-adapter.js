import { GoogleGenerativeAI, } from "@google/generative-ai";
export class GeminiAdapter {
    genAI;
    model;
    config;
    constructor(config = {}) {
        const apiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API key is required. Set GOOGLE_AI_API_KEY environment variable or pass it in config.");
        }
        this.config = {
            ...config,
            apiKey: apiKey,
            modelName: config.modelName || "gemini-1.5-flash",
        };
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.config.modelName });
    }
    extractText(response) {
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
            return response.candidates[0].content.parts[0].text || "";
        }
        return "";
    }
    async generate(definition, task) {
        const systemPrompt = definition.systemPrompt || "You are a helpful assistant.";
        const prompt = `${systemPrompt}\n\nTask: ${task}`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return this.extractText(response);
        }
        catch (error) {
            console.error("Error generating content from Gemini:", error);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
    async *generateStream(definition, task) {
        const systemPrompt = definition.systemPrompt || "You are a helpful assistant.";
        const prompt = `${systemPrompt}\n\nTask: ${task}`;
        try {
            const result = await this.model.generateContentStream(prompt);
            for await (const chunk of result.stream) {
                const chunkText = this.extractText(chunk);
                if (chunkText) {
                    yield chunkText;
                }
            }
        }
        catch (error) {
            console.error("Error generating streaming content from Gemini:", error);
            throw new Error(`Failed to generate streaming content: ${error.message}`);
        }
    }
}
//# sourceMappingURL=gemini-adapter.js.map
/**
 * Gemini Service - Core AI integration service
 */

import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  CodeContext, 
  GeminiResponse, 
  CodeAssistRequest, 
  SecurityScanResult, 
  StreamingResponse 
} from '../types';
import { Logger } from '../utils/logger';
import { ConfigurationManager } from './configuration-manager';
import { AuthenticationService } from './authentication-service';

export class GeminiService implements vscode.Disposable {
  private _genAI?: GoogleGenerativeAI;
  private _model?: any;
  private _isInitialized = false;

  constructor(
    private readonly _configManager: ConfigurationManager,
    private readonly _authService: AuthenticationService,
    private readonly _logger: Logger
  ) {}

  /**
   * Initialize the Gemini service
   */
  async initialize(): Promise<void> {
    try {
      this._logger.info('Initializing Gemini service...');
      
      const apiKey = this._authService.getApiKey();
      if (!apiKey) {
        throw new Error('No API key available for Gemini service');
      }

      this._genAI = new GoogleGenerativeAI(apiKey);
      
      const config = this._configManager.getConfiguration();
      await this.updateModel(config.model);
      
      this._isInitialized = true;
      this._logger.info('Gemini service initialized successfully');
    } catch (error) {
      this._logger.error('Failed to initialize Gemini service', error as Error);
      throw error;
    }
  }

  /**
   * Update the model being used
   */
  async updateModel(modelName: string): Promise<void> {
    try {
      if (!this._genAI) {
        throw new Error('Gemini service not initialized');
      }

      this._model = this._genAI.getGenerativeModel({ model: modelName });
      this._logger.info(`Model updated to: ${modelName}`);
    } catch (error) {
      this._logger.error(`Failed to update model to ${modelName}`, error as Error);
      throw error;
    }
  }

  /**
   * Explain code using Gemini
   */
  async explainCode(
    context: CodeContext, 
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    try {
      this._logger.debug('Starting code explanation request');
      
      const prompt = this.buildExplanationPrompt(context);
      const response = await this.generateResponse(prompt, 'explanation', options);
      
      this._logger.debug('Code explanation completed');
      return response;
    } catch (error) {
      this._logger.error('Failed to explain code', error as Error);
      throw error;
    }
  }

  /**
   * Suggest refactoring for code
   */
  async suggestRefactoring(
    context: CodeContext,
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    try {
      this._logger.debug('Starting refactoring suggestion request');
      
      const prompt = this.buildRefactoringPrompt(context);
      const response = await this.generateResponse(prompt, 'refactoring', options);
      
      this._logger.debug('Refactoring suggestion completed');
      return response;
    } catch (error) {
      this._logger.error('Failed to suggest refactoring', error as Error);
      throw error;
    }
  }

  /**
   * Generate code from natural language
   */
  async generateCode(
    description: string,
    context: CodeContext,
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    try {
      this._logger.debug('Starting code generation request');
      
      const prompt = this.buildGenerationPrompt(description, context);
      const response = await this.generateResponse(prompt, 'generation', options);
      
      this._logger.debug('Code generation completed');
      return response;
    } catch (error) {
      this._logger.error('Failed to generate code', error as Error);
      throw error;
    }
  }

  /**
   * Optimize existing code
   */
  async optimizeCode(
    context: CodeContext,
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    try {
      this._logger.debug('Starting code optimization request');
      
      const prompt = this.buildOptimizationPrompt(context);
      const response = await this.generateResponse(prompt, 'optimization', options);
      
      this._logger.debug('Code optimization completed');
      return response;
    } catch (error) {
      this._logger.error('Failed to optimize code', error as Error);
      throw error;
    }
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(
    context: CodeContext,
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    try {
      this._logger.debug('Starting documentation generation request');
      
      const prompt = this.buildDocumentationPrompt(context);
      const response = await this.generateResponse(prompt, 'documentation', options);
      
      this._logger.debug('Documentation generation completed');
      return response;
    } catch (error) {
      this._logger.error('Failed to generate documentation', error as Error);
      throw error;
    }
  }

  /**
   * Perform security scan on code
   */
  async performSecurityScan(
    context: CodeContext,
    options: { cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<SecurityScanResult | null> {
    try {
      this._logger.debug('Starting security scan request');
      
      const prompt = this.buildSecurityScanPrompt(context);
      const response = await this.generateResponse(prompt, 'security', options);
      
      if (response) {
        return this.parseSecurityScanResult(response.content);
      }
      
      return null;
    } catch (error) {
      this._logger.error('Failed to perform security scan', error as Error);
      throw error;
    }
  }

  /**
   * Get code completion suggestions
   */
  async getCompletionSuggestions(
    context: CodeContext,
    position: vscode.Position,
    options: { maxSuggestions?: number; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<vscode.CompletionItem[]> {
    try {
      this._logger.debug('Starting completion suggestion request');
      
      const prompt = this.buildCompletionPrompt(context, position);
      const response = await this.generateResponse(prompt, 'completion', options);
      
      if (response) {
        return this.parseCompletionSuggestions(response.content, options.maxSuggestions || 5);
      }
      
      return [];
    } catch (error) {
      this._logger.error('Failed to get completion suggestions', error as Error);
      return [];
    }
  }

  /**
   * Chat with AI about code
   */
  async chatWithAI(
    message: string,
    context?: CodeContext,
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    try {
      this._logger.debug('Starting AI chat request');
      
      const prompt = this.buildChatPrompt(message, context);
      const response = await this.generateResponse(prompt, 'chat', options);
      
      this._logger.debug('AI chat completed');
      return response;
    } catch (error) {
      this._logger.error('Failed to chat with AI', error as Error);
      throw error;
    }
  }

  /**
   * Core method to generate responses from Gemini
   */
  private async generateResponse(
    prompt: string,
    type: string,
    options: { streaming?: boolean; cancellationToken?: vscode.CancellationToken } = {}
  ): Promise<GeminiResponse | null> {
    if (!this._isInitialized || !this._model) {
      throw new Error('Gemini service not initialized');
    }

    if (options.cancellationToken?.isCancellationRequested) {
      return null;
    }

    try {
      const startTime = Date.now();
      
      if (options.streaming) {
        return await this.generateStreamingResponse(prompt, type, options.cancellationToken);
      } else {
        const result = await this._model.generateContent(prompt);
        const responseTime = Date.now() - startTime;
        
        if (options.cancellationToken?.isCancellationRequested) {
          return null;
        }

        const response = result.response;
        const text = response.text();

        return {
          id: this.generateId(),
          content: text,
          type: type as any,
          streaming: false,
          metadata: {
            model: this._configManager.getConfiguration().model,
            tokensUsed: this.estimateTokens(prompt + text),
            responseTime
          }
        };
      }
    } catch (error) {
      await this._authService.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Generate streaming response
   */
  private async generateStreamingResponse(
    prompt: string,
    type: string,
    cancellationToken?: vscode.CancellationToken
  ): Promise<GeminiResponse | null> {
    try {
      const result = await this._model.generateContentStream(prompt);
      let fullContent = '';
      const startTime = Date.now();

      for await (const chunk of result.stream) {
        if (cancellationToken?.isCancellationRequested) {
          return null;
        }

        const chunkText = chunk.text();
        fullContent += chunkText;
        
        // You would emit chunk events here for streaming UI
        this._logger.debug('Received streaming chunk', { length: chunkText.length });
      }

      const responseTime = Date.now() - startTime;
      
      return {
        id: this.generateId(),
        content: fullContent,
        type: type as any,
        streaming: true,
        metadata: {
          model: this._configManager.getConfiguration().model,
          tokensUsed: this.estimateTokens(prompt + fullContent),
          responseTime
        }
      };
    } catch (error) {
      this._logger.error('Streaming response failed', error as Error);
      throw error;
    }
  }

  // Prompt building methods

  private buildExplanationPrompt(context: CodeContext): string {
    const selectedText = context.selectedText || context.fullText;
    
    return `You are an expert code reviewer and teacher. Please explain the following ${context.language} code in detail:

File: ${context.fileName}
Language: ${context.language}

Code to explain:
\`\`\`${context.language}
${selectedText}
\`\`\`

Please provide:
1. A clear, beginner-friendly explanation of what this code does
2. Key concepts and patterns used
3. How it fits into the larger context (if applicable)
4. Any potential issues or improvements

Keep the explanation concise but thorough.`;
  }

  private buildRefactoringPrompt(context: CodeContext): string {
    const selectedText = context.selectedText || context.fullText;
    
    return `You are an expert software engineer. Please analyze the following ${context.language} code and suggest refactoring improvements:

File: ${context.fileName}
Language: ${context.language}

Code to refactor:
\`\`\`${context.language}
${selectedText}
\`\`\`

Please provide:
1. Specific refactoring suggestions with explanations
2. Improved code examples
3. Benefits of each suggested change
4. Any design patterns that could be applied

Focus on readability, maintainability, and performance.`;
  }

  private buildGenerationPrompt(description: string, context: CodeContext): string {
    return `You are an expert ${context.language} developer. Please generate code based on the following requirements:

Requirements: ${description}

Context:
- Language: ${context.language}
- File: ${context.fileName}
${context.workspaceRoot ? `- Project: ${context.workspaceRoot}` : ''}

Please provide:
1. Clean, well-structured code that meets the requirements
2. Appropriate comments explaining complex logic
3. Error handling where appropriate
4. Follow ${context.language} best practices and conventions

Generate only the code that directly addresses the requirements.`;
  }

  private buildOptimizationPrompt(context: CodeContext): string {
    const selectedText = context.selectedText || context.fullText;
    
    return `You are a performance optimization expert. Please analyze and optimize the following ${context.language} code:

File: ${context.fileName}
Language: ${context.language}

Code to optimize:
\`\`\`${context.language}
${selectedText}
\`\`\`

Please provide:
1. Performance bottlenecks identified
2. Optimized version of the code
3. Explanation of improvements made
4. Expected performance gains
5. Trade-offs to consider

Focus on algorithm efficiency, memory usage, and execution speed.`;
  }

  private buildDocumentationPrompt(context: CodeContext): string {
    const selectedText = context.selectedText || context.fullText;
    
    return `You are a technical documentation expert. Please generate comprehensive documentation for the following ${context.language} code:

File: ${context.fileName}
Language: ${context.language}

Code to document:
\`\`\`${context.language}
${selectedText}
\`\`\`

Please provide:
1. Function/class/method documentation with proper formatting
2. Parameter descriptions and types
3. Return value descriptions
4. Usage examples
5. Any important notes or warnings

Use the appropriate documentation format for ${context.language} (JSDoc, docstrings, etc.).`;
  }

  private buildSecurityScanPrompt(context: CodeContext): string {
    const selectedText = context.selectedText || context.fullText;
    
    return `You are a cybersecurity expert. Please perform a security analysis of the following ${context.language} code:

File: ${context.fileName}
Language: ${context.language}

Code to analyze:
\`\`\`${context.language}
${selectedText}
\`\`\`

Please identify:
1. Security vulnerabilities (SQL injection, XSS, etc.)
2. Input validation issues
3. Authentication/authorization problems
4. Data exposure risks
5. Cryptographic issues

For each issue found, provide:
- Severity level (low/medium/high/critical)
- Detailed description
- Recommended fixes
- Code examples of secure alternatives

Return results in JSON format.`;
  }

  private buildCompletionPrompt(context: CodeContext, position: vscode.Position): string {
    const lines = context.fullText.split('\\n');
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.character);
    const afterCursor = currentLine.substring(position.character);
    
    // Get surrounding context
    const contextLines = 5;
    const startLine = Math.max(0, position.line - contextLines);
    const endLine = Math.min(lines.length - 1, position.line + contextLines);
    const surroundingCode = lines.slice(startLine, endLine + 1).join('\\n');
    
    return `You are an expert ${context.language} developer providing code completion.

File: ${context.fileName}
Language: ${context.language}

Context around cursor:
\`\`\`${context.language}
${surroundingCode}
\`\`\`

Current line: "${currentLine}"
Before cursor: "${beforeCursor}"
After cursor: "${afterCursor}"

Please suggest 3-5 most likely code completions that would make sense at the cursor position. 
Consider the context, language syntax, and common patterns.

Return suggestions in JSON format:
{
  "suggestions": [
    {
      "text": "completion text",
      "description": "what this does",
      "type": "method|variable|keyword|etc"
    }
  ]
}`;
  }

  private buildChatPrompt(message: string, context?: CodeContext): string {
    let prompt = `You are an expert software developer and helpful assistant. The user is asking: ${message}`;
    
    if (context) {
      prompt += `

Current context:
- File: ${context.fileName}
- Language: ${context.language}
${context.selectedText ? `- Selected code:\n\`\`\`${context.language}\\n${context.selectedText}\\n\`\`\`` : ''}

Please provide a helpful and accurate response considering this context.`;
    }
    
    return prompt;
  }

  // Helper methods

  private parseSecurityScanResult(content: string): SecurityScanResult {
    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/```json\\n(.*?)\\n```/s) || content.match(/{.*}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          vulnerabilities: parsed.vulnerabilities || [],
          recommendations: parsed.recommendations || [],
          score: parsed.score || 100
        };
      }
    } catch (error) {
      this._logger.error('Failed to parse security scan result', error as Error);
    }

    // Fallback: parse text response
    return {
      vulnerabilities: [],
      recommendations: [content],
      score: 50
    };
  }

  private parseCompletionSuggestions(content: string, maxSuggestions: number): vscode.CompletionItem[] {
    try {
      const jsonMatch = content.match(/```json\\n(.*?)\\n```/s) || content.match(/{.*}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return parsed.suggestions?.slice(0, maxSuggestions).map((suggestion: any) => {
          const item = new vscode.CompletionItem(suggestion.text, vscode.CompletionItemKind.Text);
          item.detail = suggestion.description;
          item.documentation = suggestion.description;
          return item;
        }) || [];
      }
    } catch (error) {
      this._logger.error('Failed to parse completion suggestions', error as Error);
    }

    return [];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this._isInitialized && !!this._model;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this._model = undefined;
    this._genAI = undefined;
    this._isInitialized = false;
  }
}
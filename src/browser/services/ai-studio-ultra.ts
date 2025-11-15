/**
 * AI Studio Ultra Service
 *
 * Playwright automation for https://aistudio.google.com
 * Provides access to Ultra-only features not available via API
 */

import { PlaywrightServiceBase, AuthenticationState } from '../playwright-service-base.js';

export interface AIStudioAction {
  type: 'generate' | 'chat' | 'tune' | 'analyze';
  prompt?: string;
  model?: string;
  parameters?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  };
}

export class AIStudioUltraService extends PlaywrightServiceBase {
  constructor(config = {}) {
    super('https://aistudio.google.com', 'AI Studio Ultra', config);
  }

  /**
   * Check if user is authenticated and has Ultra access
   */
  async checkAuthentication(): Promise<AuthenticationState> {
    console.log('[AI Studio Ultra] Checking authentication...');

    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    // Check for sign-in button (not authenticated)
    const signInButton = await this.page.$('button:has-text("Sign in")');
    if (signInButton) {
      console.log('[AI Studio Ultra] User not authenticated');
      return { isAuthenticated: false };
    }

    // Check for Ultra badge or features
    const ultraIndicator = await this.page.$('[data-ultra="true"], .ultra-badge, [aria-label*="Ultra"]');
    if (ultraIndicator) {
      console.log('[AI Studio Ultra] Ultra membership detected');
    } else {
      console.warn('[AI Studio Ultra] Ultra membership not detected - some features may be unavailable');
    }

    // Get cookies for session persistence
    const cookies = await this.context!.cookies();

    return {
      isAuthenticated: true,
      cookies
    };
  }

  /**
   * Authenticate with Google account
   * Note: This requires manual login or stored credentials
   */
  async authenticate(): Promise<void> {
    console.log('[AI Studio Ultra] Starting authentication flow...');

    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    // Look for sign-in button
    const signInButton = await this.page.$('button:has-text("Sign in")');
    if (signInButton) {
      await signInButton.click();

      // Wait for Google sign-in page
      await this.page.waitForURL('**/accounts.google.com/**', { timeout: 10000 }).catch(() => {
        console.log('[AI Studio Ultra] Not redirected to Google sign-in');
      });

      // User needs to complete sign-in manually in non-headless mode
      // or we need to use stored authentication state
      console.log('[AI Studio Ultra] Waiting for manual authentication...');
      console.log('[AI Studio Ultra] Please sign in with your Google account');

      // Wait for return to AI Studio
      await this.page.waitForURL('**/aistudio.google.com/**', { timeout: 120000 });
      console.log('[AI Studio Ultra] Authentication successful!');

      // Save auth state for future use
      await this.saveAuthState('./.auth/aistudio-auth.json');
    } else {
      console.log('[AI Studio Ultra] Already authenticated');
    }
  }

  /**
   * Execute AI Studio action
   */
  async executeAction(action: string, params: AIStudioAction): Promise<any> {
    console.log(`[AI Studio Ultra] Executing action: ${action}`);

    if (!this.page) {
      throw new Error('Page not initialized. Call initialize() first.');
    }

    switch (params.type) {
      case 'generate':
        return await this.generateContent(params);
      case 'chat':
        return await this.chatWithModel(params);
      case 'tune':
        return await this.tuneModel(params);
      case 'analyze':
        return await this.analyzeContent(params);
      default:
        throw new Error(`Unknown action type: ${params.type}`);
    }
  }

  /**
   * Generate content with AI Studio
   */
  private async generateContent(params: AIStudioAction): Promise<string> {
    console.log('[AI Studio Ultra] Generating content...');

    // Navigate to create page if not already there
    const currentUrl = this.page!.url();
    if (!currentUrl.includes('/prompts/new') && !currentUrl.includes('/create')) {
      await this.page!.click('button:has-text("Create"), a:has-text("New prompt")').catch(() => {
        console.log('[AI Studio Ultra] Create button not found, using direct navigation');
      });
      await this.page!.goto('https://aistudio.google.com/prompts/new');
    }

    // Wait for prompt input
    const promptInputFound = await this.waitForElement('textarea[placeholder*="prompt"], [contenteditable="true"]');
    if (!promptInputFound) {
      throw new Error('Prompt input not found');
    }

    // Enter prompt
    if (params.prompt) {
      // Try textarea first
      const textarea = await this.page!.$('textarea[placeholder*="prompt"]');
      if (textarea) {
        await this.page!.fill('textarea[placeholder*="prompt"]', params.prompt);
      } else {
        // For contenteditable elements, use type() or evaluate()
        const contentEditable = await this.page!.$('[contenteditable="true"]');
        if (contentEditable) {
          await this.page!.evaluate((el, text) => {
            (el as HTMLElement).textContent = text;
          }, contentEditable, params.prompt);
        }
      }
    }

    // Configure parameters if provided
    if (params.parameters) {
      await this.configureParameters(params.parameters);
    }

    // Click run/generate button
    await this.page!.click('button:has-text("Run"), button:has-text("Generate")');

    // Wait for response
    console.log('[AI Studio Ultra] Waiting for response...');
    await this.page!.waitForSelector('.response-container, .output-text, [data-response="true"]', {
      timeout: 60000
    });

    // Extract response text
    const responseElement = await this.page!.$('.response-container, .output-text, [data-response="true"]');
    const responseText = responseElement ? await responseElement.textContent() : '';

    console.log('[AI Studio Ultra] Content generated successfully');
    return responseText || '';
  }

  /**
   * Chat with AI model
   */
  private async chatWithModel(params: AIStudioAction): Promise<string> {
    console.log('[AI Studio Ultra] Starting chat...');

    // Navigate to chat interface
    await this.page!.goto('https://aistudio.google.com/chat');

    // Wait for chat input
    const chatInputFound = await this.waitForElement('textarea[placeholder*="message"], input[placeholder*="chat"]');
    if (!chatInputFound) {
      throw new Error('Chat input not found');
    }

    // Send message
    if (params.prompt) {
      await this.page!.fill('textarea[placeholder*="message"], input[placeholder*="chat"]', params.prompt);
      await this.page!.press('textarea[placeholder*="message"], input[placeholder*="chat"]', 'Enter');
    }

    // Wait for response
    await this.page!.waitForSelector('.message.assistant, .ai-response, [data-role="assistant"]', {
      timeout: 60000
    });

    // Get last assistant message
    const messages = await this.page!.$$('.message.assistant, .ai-response, [data-role="assistant"]');
    const lastMessage = messages[messages.length - 1];
    const responseText = lastMessage ? await lastMessage.textContent() : '';

    return responseText || '';
  }

  /**
   * Tune/fine-tune model
   */
  private async tuneModel(params: AIStudioAction): Promise<any> {
    console.log('[AI Studio Ultra] Tuning model...');
    // This would require accessing the tuning interface
    // Implementation depends on AI Studio's UI structure
    throw new Error('Model tuning not yet implemented');
  }

  /**
   * Analyze content
   */
  private async analyzeContent(params: AIStudioAction): Promise<any> {
    console.log('[AI Studio Ultra] Analyzing content...');
    // This would use AI Studio's analysis features
    throw new Error('Content analysis not yet implemented');
  }

  /**
   * Configure generation parameters
   */
  private async configureParameters(params: any): Promise<void> {
    console.log('[AI Studio Ultra] Configuring parameters:', params);

    // Look for settings/parameters panel
    const settingsButton = await this.page!.$('button[aria-label*="Settings"], button:has-text("Settings")');
    if (settingsButton) {
      await settingsButton.click();

      // Set temperature
      if (params.temperature !== undefined) {
        const tempInput = await this.page!.$('input[aria-label*="Temperature"], input[name="temperature"]');
        if (tempInput) {
          await tempInput.fill(params.temperature.toString());
        }
      }

      // Set other parameters...
      // Implementation depends on AI Studio's UI structure
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    console.log('[AI Studio Ultra] Listing available models...');

    // Navigate to model selection
    const modelSelector = await this.page!.$('select[aria-label*="Model"], .model-selector');
    if (modelSelector) {
      const options = await this.page!.$$eval(
        'select[aria-label*="Model"] option, .model-option',
        (elements) => elements.map(el => el.textContent || '')
      );
      return options.filter(Boolean);
    }

    return [];
  }
}

/**
 * Google Labs Services
 *
 * Playwright automation for https://labs.google.com
 * Provides access to experimental features: Flow, Whisk, Music, Image generation
 */

import { PlaywrightServiceBase, AuthenticationState } from '../playwright-service-base.js';

export interface LabsFlowAction {
  type: 'create-flow' | 'run-flow' | 'edit-flow';
  flowName?: string;
  steps?: Array<{
    action: string;
    params: any;
  }>;
  input?: any;
}

export interface LabsWhiskAction {
  type: 'generate' | 'edit' | 'remix';
  prompt?: string;
  style?: string;
  referenceImage?: string;
}

/**
 * Google Labs Flow Service
 * Automates workflow creation and execution
 */
export class LabsFlowService extends PlaywrightServiceBase {
  constructor(config = {}) {
    super('https://labs.google.com/flow', 'Google Labs Flow', config);
  }

  async checkAuthentication(): Promise<AuthenticationState> {
    console.log('[Labs Flow] Checking authentication...');

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    // Check for Google sign-in prompt
    const signInPrompt = await this.page.$('button:has-text("Sign in"), a:has-text("Sign in")');
    if (signInPrompt) {
      return { isAuthenticated: false };
    }

    // Check for user profile or account indicator
    const userProfile = await this.page.$('[aria-label*="Account"], .user-profile, [data-user]');
    const cookies = await this.context!.cookies();

    return {
      isAuthenticated: !!userProfile,
      cookies
    };
  }

  async authenticate(): Promise<void> {
    console.log('[Labs Flow] Authenticating...');

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const signInButton = await this.page.$('button:has-text("Sign in"), a:has-text("Sign in")');
    if (signInButton) {
      await signInButton.click();
      await this.page.waitForURL('**/accounts.google.com/**', { timeout: 10000 }).catch(() => {});

      console.log('[Labs Flow] Please complete authentication in the browser');
      await this.page.waitForURL('**/labs.google.com/**', { timeout: 120000 });

      await this.saveAuthState('./.auth/labs-flow-auth.json');
      console.log('[Labs Flow] Authentication successful');
    }
  }

  async executeAction(action: string, params: LabsFlowAction): Promise<any> {
    console.log(`[Labs Flow] Executing: ${params.type}`);

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    switch (params.type) {
      case 'create-flow':
        return await this.createFlow(params);
      case 'run-flow':
        return await this.runFlow(params);
      case 'edit-flow':
        return await this.editFlow(params);
      default:
        throw new Error(`Unknown Flow action: ${params.type}`);
    }
  }

  private async createFlow(params: LabsFlowAction): Promise<any> {
    console.log('[Labs Flow] Creating new flow:', params.flowName);

    // Click "New Flow" or "Create" button
    await this.page!.click('button:has-text("New"), button:has-text("Create"), a:has-text("New flow")');

    // Wait for flow editor
    await this.waitForElement('.flow-editor, [data-flow-editor="true"]', 10000);

    // Set flow name if provided
    if (params.flowName) {
      const nameInput = await this.page!.$('input[placeholder*="name"], [aria-label*="Name"]');
      if (nameInput) {
        await nameInput.fill(params.flowName);
      }
    }

    // Add flow steps
    if (params.steps && params.steps.length > 0) {
      for (const step of params.steps) {
        await this.addFlowStep(step);
      }
    }

    // Save flow
    await this.page!.click('button:has-text("Save"), button:has-text("Done")');
    console.log('[Labs Flow] Flow created successfully');

    return { success: true, flowName: params.flowName };
  }

  private async addFlowStep(step: { action: string; params: any }): Promise<void> {
    console.log('[Labs Flow] Adding step:', step.action);

    // Click "Add step" button
    await this.page!.click('button:has-text("Add step"), button[aria-label*="Add"]');

    // Select action type
    await this.page!.click(`text="${step.action}"`);

    // Configure step parameters
    // Implementation depends on Labs Flow UI structure
  }

  private async runFlow(params: LabsFlowAction): Promise<any> {
    console.log('[Labs Flow] Running flow:', params.flowName);

    // Find and open flow
    if (params.flowName) {
      await this.page!.click(`text="${params.flowName}"`);
    }

    // Provide input if specified
    if (params.input) {
      const inputField = await this.page!.$('textarea[placeholder*="input"], input[name="input"]');
      if (inputField) {
        await inputField.fill(JSON.stringify(params.input));
      }
    }

    // Run the flow
    await this.page!.click('button:has-text("Run"), button[aria-label*="Run"]');

    // Wait for completion
    await this.page!.waitForSelector('.flow-result, [data-flow-status="complete"]', {
      timeout: 60000
    });

    // Get results
    const resultElement = await this.page!.$('.flow-result, .output-container');
    const result = resultElement ? await resultElement.textContent() : '';

    return { success: true, result };
  }

  private async editFlow(params: LabsFlowAction): Promise<any> {
    console.log('[Labs Flow] Editing flow:', params.flowName);

    // Find and open flow for editing
    if (params.flowName) {
      await this.page!.click(`text="${params.flowName}"`);
      await this.page!.click('button:has-text("Edit"), button[aria-label*="Edit"]');
    }

    // Implementation depends on specific edits needed
    return { success: true };
  }
}

/**
 * Google Labs Whisk Service
 * Automates creative image generation and editing
 */
export class LabsWhiskService extends PlaywrightServiceBase {
  constructor(config = {}) {
    super('https://labs.google.com/whisk', 'Google Labs Whisk', config);
  }

  async checkAuthentication(): Promise<AuthenticationState> {
    console.log('[Labs Whisk] Checking authentication...');

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const signInPrompt = await this.page.$('button:has-text("Sign in"), a:has-text("Sign in")');
    if (signInPrompt) {
      return { isAuthenticated: false };
    }

    const userProfile = await this.page.$('[aria-label*="Account"], .user-profile');
    const cookies = await this.context!.cookies();

    return {
      isAuthenticated: !!userProfile,
      cookies
    };
  }

  async authenticate(): Promise<void> {
    console.log('[Labs Whisk] Authenticating...');

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const signInButton = await this.page.$('button:has-text("Sign in"), a:has-text("Sign in")');
    if (signInButton) {
      await signInButton.click();
      await this.page.waitForURL('**/accounts.google.com/**', { timeout: 10000 }).catch(() => {});

      console.log('[Labs Whisk] Please complete authentication');
      await this.page.waitForURL('**/labs.google.com/**', { timeout: 120000 });

      await this.saveAuthState('./.auth/labs-whisk-auth.json');
      console.log('[Labs Whisk] Authentication successful');
    }
  }

  async executeAction(action: string, params: LabsWhiskAction): Promise<any> {
    console.log(`[Labs Whisk] Executing: ${params.type}`);

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    switch (params.type) {
      case 'generate':
        return await this.generateImage(params);
      case 'edit':
        return await this.editImage(params);
      case 'remix':
        return await this.remixImage(params);
      default:
        throw new Error(`Unknown Whisk action: ${params.type}`);
    }
  }

  private async generateImage(params: LabsWhiskAction): Promise<any> {
    console.log('[Labs Whisk] Generating image with prompt:', params.prompt);

    // Wait for prompt input
    const promptInputFound = await this.waitForElement('textarea[placeholder*="prompt"], input[placeholder*="describe"]');
    if (!promptInputFound) {
      throw new Error('Prompt input not found');
    }

    // Enter prompt
    if (params.prompt) {
      await this.page!.fill('textarea[placeholder*="prompt"], input[placeholder*="describe"]', params.prompt);
    }

    // Select style if provided
    if (params.style) {
      const styleSelector = await this.page!.$('select[aria-label*="Style"], .style-selector');
      if (styleSelector) {
        await this.page!.selectOption('select[aria-label*="Style"]', params.style);
      }
    }

    // Generate
    await this.page!.click('button:has-text("Generate"), button:has-text("Create")');

    // Wait for generation to complete
    console.log('[Labs Whisk] Waiting for image generation...');
    await this.page!.waitForSelector('.generated-image, img[data-generated="true"]', {
      timeout: 90000
    });

    // Get image URL
    const imageElement = await this.page!.$('.generated-image, img[data-generated="true"]');
    const imageUrl = imageElement ? await imageElement.getAttribute('src') : '';

    console.log('[Labs Whisk] Image generated successfully');
    return { success: true, imageUrl };
  }

  private async editImage(params: LabsWhiskAction): Promise<any> {
    console.log('[Labs Whisk] Editing image...');

    // Upload reference image if provided
    if (params.referenceImage) {
      const uploadButton = await this.page!.$('input[type="file"], button:has-text("Upload")');
      if (uploadButton) {
        await uploadButton.click();
        // File upload logic
      }
    }

    // Apply edits based on prompt
    if (params.prompt) {
      await this.page!.fill('textarea[placeholder*="edit"], input[placeholder*="modify"]', params.prompt);
      await this.page!.click('button:has-text("Apply"), button:has-text("Edit")');

      await this.page!.waitForSelector('.edited-image', { timeout: 60000 });
    }

    return { success: true };
  }

  private async remixImage(params: LabsWhiskAction): Promise<any> {
    console.log('[Labs Whisk] Remixing image...');

    // Select image to remix
    // Apply style and transformations
    // Implementation depends on Whisk's UI

    return { success: true };
  }

  /**
   * Download generated image
   */
  async downloadImage(imageUrl: string, savePath: string): Promise<void> {
    console.log('[Labs Whisk] Downloading image to:', savePath);

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    // Navigate to image or trigger download
    const downloadButton = await this.page.$('button[aria-label*="Download"], a[download]');
    if (downloadButton) {
      const [download] = await Promise.all([
        this.page.waitForEvent('download'),
        downloadButton.click()
      ]);

      await download.saveAs(savePath);
      console.log('[Labs Whisk] Image downloaded successfully');
    }
  }
}

/**
 * Factory function to get appropriate Labs service
 */
export function getLabsService(service: 'flow' | 'whisk', config = {}): PlaywrightServiceBase {
  switch (service) {
    case 'flow':
      return new LabsFlowService(config);
    case 'whisk':
      return new LabsWhiskService(config);
    default:
      throw new Error(`Unknown Labs service: ${service}`);
  }
}

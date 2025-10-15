/**
 * Gemini CLI Extension Loader
 * 
 * Integrates gemini-flow with the official Gemini CLI Extensions framework.
 * Handles MCP server initialization, custom command registration, and lifecycle events.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extension lifecycle class
 */
export class GeminiFlowExtension {
  constructor() {
    this.manifest = null;
    this.mcpServers = new Map();
    this.customCommands = new Map();
    this.enabled = false;
  }

  /**
   * Load extension manifest
   */
  loadManifest() {
    try {
      const manifestPath = join(__dirname, '../../gemini-extension.json');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      this.manifest = JSON.parse(manifestContent);
      console.log(`[Gemini Flow Extension] Loaded manifest: ${this.manifest.name} v${this.manifest.version}`);
      return this.manifest;
    } catch (error) {
      console.error('[Gemini Flow Extension] Failed to load manifest:', error.message);
      throw error;
    }
  }

  /**
   * Initialize MCP servers
   */
  async initializeMCPServers() {
    if (!this.manifest) {
      throw new Error('Manifest not loaded. Call loadManifest() first.');
    }

    console.log('[Gemini Flow Extension] Initializing MCP servers...');
    
    const servers = this.manifest.mcpServers || {};
    const serverNames = Object.keys(servers);
    
    for (const serverName of serverNames) {
      const config = servers[serverName];
      
      try {
        // Store server configuration
        this.mcpServers.set(serverName, {
          name: serverName,
          command: config.command,
          args: config.args,
          env: config.env || {},
          description: config.description,
          status: 'configured'
        });
        
        console.log(`[Gemini Flow Extension] Configured MCP server: ${serverName}`);
      } catch (error) {
        console.error(`[Gemini Flow Extension] Failed to configure ${serverName}:`, error.message);
      }
    }
    
    console.log(`[Gemini Flow Extension] Initialized ${this.mcpServers.size} MCP servers`);
    return this.mcpServers;
  }

  /**
   * Register custom commands
   */
  registerCustomCommands() {
    if (!this.manifest) {
      throw new Error('Manifest not loaded. Call loadManifest() first.');
    }

    console.log('[Gemini Flow Extension] Registering custom commands...');
    
    const commands = this.manifest.customCommands || {};
    const commandNames = Object.keys(commands);
    
    for (const commandName of commandNames) {
      const config = commands[commandName];
      
      this.customCommands.set(commandName, {
        name: commandName,
        description: config.description,
        handler: config.handler,
        subcommands: config.subcommands || [],
        status: 'registered'
      });
      
      console.log(`[Gemini Flow Extension] Registered command: ${commandName}`);
    }
    
    console.log(`[Gemini Flow Extension] Registered ${this.customCommands.size} custom commands`);
    return this.customCommands;
  }

  /**
   * Enable extension
   */
  async enable() {
    console.log('[Gemini Flow Extension] Enabling extension...');
    
    try {
      // Load manifest
      this.loadManifest();
      
      // Initialize MCP servers
      await this.initializeMCPServers();
      
      // Register custom commands
      this.registerCustomCommands();
      
      this.enabled = true;
      console.log('[Gemini Flow Extension] Extension enabled successfully');
      
      return {
        success: true,
        manifest: this.manifest,
        mcpServers: Array.from(this.mcpServers.keys()),
        customCommands: Array.from(this.customCommands.keys())
      };
    } catch (error) {
      console.error('[Gemini Flow Extension] Failed to enable extension:', error.message);
      throw error;
    }
  }

  /**
   * Disable extension
   */
  async disable() {
    console.log('[Gemini Flow Extension] Disabling extension...');
    
    // Clear servers and commands
    this.mcpServers.clear();
    this.customCommands.clear();
    this.enabled = false;
    
    console.log('[Gemini Flow Extension] Extension disabled');
    
    return { success: true };
  }

  /**
   * Update extension
   */
  async update() {
    console.log('[Gemini Flow Extension] Updating extension...');
    
    // Reload manifest
    this.loadManifest();
    
    // Re-initialize if enabled
    if (this.enabled) {
      await this.disable();
      await this.enable();
    }
    
    console.log('[Gemini Flow Extension] Extension updated');
    
    return { success: true, version: this.manifest.version };
  }

  /**
   * Get extension status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      name: this.manifest?.name || 'unknown',
      version: this.manifest?.version || 'unknown',
      mcpServers: this.mcpServers.size,
      customCommands: this.customCommands.size
    };
  }
}

/**
 * Extension instance (singleton)
 */
let extensionInstance = null;

/**
 * Get extension instance
 */
export function getExtension() {
  if (!extensionInstance) {
    extensionInstance = new GeminiFlowExtension();
  }
  return extensionInstance;
}

/**
 * Lifecycle hooks for Gemini CLI
 */
export const extension = {
  /**
   * Called when extension is installed
   */
  async onInstall() {
    console.log('[Gemini Flow Extension] onInstall hook called');
    const ext = getExtension();
    return await ext.enable();
  },

  /**
   * Called when extension is enabled
   */
  async onEnable() {
    console.log('[Gemini Flow Extension] onEnable hook called');
    const ext = getExtension();
    return await ext.enable();
  },

  /**
   * Called when extension is disabled
   */
  async onDisable() {
    console.log('[Gemini Flow Extension] onDisable hook called');
    const ext = getExtension();
    return await ext.disable();
  },

  /**
   * Called when extension is updated
   */
  async onUpdate() {
    console.log('[Gemini Flow Extension] onUpdate hook called');
    const ext = getExtension();
    return await ext.update();
  },

  /**
   * Called when extension is uninstalled
   */
  async onUninstall() {
    console.log('[Gemini Flow Extension] onUninstall hook called');
    const ext = getExtension();
    await ext.disable();
    extensionInstance = null;
    return { success: true };
  },

  /**
   * Get extension status
   */
  getStatus() {
    const ext = getExtension();
    return ext.getStatus();
  }
};

// Export default for Gemini CLI
export default extension;

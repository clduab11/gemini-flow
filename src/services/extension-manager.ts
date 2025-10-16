/**
 * Extension Manager Service
 * 
 * Manages Gemini CLI Extensions for gemini-flow.
 * Handles installation, enabling, disabling, updating, and uninstalling of extensions.
 * 
 * Follows patterns from src/core/mcp-settings-manager.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Extension storage directory
const EXTENSIONS_DIR = path.join(process.cwd(), '.gemini-flow', 'extensions');
const EXTENSIONS_CONFIG_FILE = path.join(EXTENSIONS_DIR, 'extensions.json');

/**
 * Extension metadata interface
 */
export interface ExtensionMetadata {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  author?: string;
  enabled: boolean;
  installedAt: string;
  updatedAt?: string;
  source: string; // GitHub URL or local path
  manifestPath: string;
  entryPoint?: string;
}

/**
 * Extensions configuration
 */
export interface ExtensionsConfig {
  extensions: { [name: string]: ExtensionMetadata };
  lastUpdated: string;
}

/**
 * Extension Manager Service
 */
export class ExtensionManager {
  private config: ExtensionsConfig | null = null;

  constructor() {}

  /**
   * Initialize extension manager
   */
  async initialize(): Promise<void> {
    // Ensure extensions directory exists
    await fs.mkdir(EXTENSIONS_DIR, { recursive: true });
    
    // Load existing configuration
    await this.loadConfig();
  }

  /**
   * Load extensions configuration
   */
  async loadConfig(): Promise<ExtensionsConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const data = await fs.readFile(EXTENSIONS_CONFIG_FILE, 'utf-8');
      this.config = JSON.parse(data) as ExtensionsConfig;
      return this.config;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found, create default config
        this.config = {
          extensions: {},
          lastUpdated: new Date().toISOString()
        };
        await this.saveConfig();
        return this.config;
      }
      throw new Error(`Failed to load extensions config: ${error.message}`);
    }
  }

  /**
   * Save extensions configuration
   */
  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration to save');
    }

    this.config.lastUpdated = new Date().toISOString();
    await fs.writeFile(
      EXTENSIONS_CONFIG_FILE,
      JSON.stringify(this.config, null, 2),
      'utf-8'
    );
  }

  /**
   * Install extension from GitHub or local path
   */
  async install(source: string): Promise<ExtensionMetadata> {
    await this.initialize();

    let manifestPath: string;
    let extensionDir: string;
    let extensionName: string;

    // Check if source is GitHub URL or local path
    if (source.startsWith('github:') || source.includes('github.com')) {
      // Parse GitHub URL
      const match = source.match(/(?:github:|https:\/\/github\.com\/)([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = match;
      extensionName = repo.replace(/\.git$/, '');
      extensionDir = path.join(EXTENSIONS_DIR, extensionName);

      // Clone repository
      console.log(`Cloning ${owner}/${repo}...`);
      await execAsync(`git clone https://github.com/${owner}/${repo}.git ${extensionDir}`);
      
      manifestPath = path.join(extensionDir, 'gemini-extension.json');
    } else {
      // Local path
      const sourcePath = path.resolve(source);
      manifestPath = path.join(sourcePath, 'gemini-extension.json');
      
      // Verify manifest exists
      try {
        await fs.access(manifestPath);
      } catch {
        throw new Error(`Manifest not found at ${manifestPath}`);
      }

      // Read manifest to get extension name
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      extensionName = manifest.name;
      
      extensionDir = path.join(EXTENSIONS_DIR, extensionName);
      
      // Copy extension to extensions directory
      await this.copyDirectory(sourcePath, extensionDir);
      manifestPath = path.join(extensionDir, 'gemini-extension.json');
    }

    // Read and validate manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Create extension metadata
    const metadata: ExtensionMetadata = {
      name: manifest.name,
      version: manifest.version,
      displayName: manifest.displayName,
      description: manifest.description,
      author: manifest.author,
      enabled: false, // Not enabled by default
      installedAt: new Date().toISOString(),
      source,
      manifestPath,
      entryPoint: manifest.entryPoint
    };

    // Save to config
    if (!this.config) {
      this.config = { extensions: {}, lastUpdated: new Date().toISOString() };
    }
    this.config.extensions[extensionName] = metadata;
    await this.saveConfig();

    console.log(`Extension ${extensionName} installed successfully`);
    return metadata;
  }

  /**
   * Enable extension
   */
  async enable(name: string): Promise<void> {
    await this.initialize();

    if (!this.config?.extensions[name]) {
      throw new Error(`Extension ${name} not found`);
    }

    const extension = this.config.extensions[name];
    
    // Load extension loader and call onEnable
    if (extension.entryPoint) {
      const loaderPath = path.join(EXTENSIONS_DIR, name, extension.entryPoint);
      try {
        const loader = await import(loaderPath);
        if (loader.extension && loader.extension.onEnable) {
          await loader.extension.onEnable();
        }
      } catch (error: any) {
        console.error(`Failed to enable extension ${name}:`, error.message);
      }
    }

    extension.enabled = true;
    extension.updatedAt = new Date().toISOString();
    await this.saveConfig();

    console.log(`Extension ${name} enabled`);
  }

  /**
   * Disable extension
   */
  async disable(name: string): Promise<void> {
    await this.initialize();

    if (!this.config?.extensions[name]) {
      throw new Error(`Extension ${name} not found`);
    }

    const extension = this.config.extensions[name];
    
    // Load extension loader and call onDisable
    if (extension.entryPoint) {
      const loaderPath = path.join(EXTENSIONS_DIR, name, extension.entryPoint);
      try {
        const loader = await import(loaderPath);
        if (loader.extension && loader.extension.onDisable) {
          await loader.extension.onDisable();
        }
      } catch (error: any) {
        console.error(`Failed to disable extension ${name}:`, error.message);
      }
    }

    extension.enabled = false;
    extension.updatedAt = new Date().toISOString();
    await this.saveConfig();

    console.log(`Extension ${name} disabled`);
  }

  /**
   * Update extension
   */
  async update(name: string): Promise<void> {
    await this.initialize();

    if (!this.config?.extensions[name]) {
      throw new Error(`Extension ${name} not found`);
    }

    const extension = this.config.extensions[name];
    const extensionDir = path.join(EXTENSIONS_DIR, name);

    // Update from source
    if (extension.source.startsWith('github:') || extension.source.includes('github.com')) {
      console.log(`Updating ${name} from GitHub...`);
      await execAsync(`cd ${extensionDir} && git pull`);
    }

    // Reload manifest to get new version
    const manifestContent = await fs.readFile(extension.manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    extension.version = manifest.version;
    extension.updatedAt = new Date().toISOString();

    // Call onUpdate hook if extension is enabled
    if (extension.enabled && extension.entryPoint) {
      const loaderPath = path.join(EXTENSIONS_DIR, name, extension.entryPoint);
      try {
        const loader = await import(loaderPath);
        if (loader.extension && loader.extension.onUpdate) {
          await loader.extension.onUpdate();
        }
      } catch (error: any) {
        console.error(`Failed to call onUpdate for ${name}:`, error.message);
      }
    }

    await this.saveConfig();
    console.log(`Extension ${name} updated to version ${extension.version}`);
  }

  /**
   * Uninstall extension
   */
  async uninstall(name: string): Promise<void> {
    await this.initialize();

    if (!this.config?.extensions[name]) {
      throw new Error(`Extension ${name} not found`);
    }

    const extension = this.config.extensions[name];
    
    // Disable first if enabled
    if (extension.enabled) {
      await this.disable(name);
    }

    // Call onUninstall hook
    if (extension.entryPoint) {
      const loaderPath = path.join(EXTENSIONS_DIR, name, extension.entryPoint);
      try {
        const loader = await import(loaderPath);
        if (loader.extension && loader.extension.onUninstall) {
          await loader.extension.onUninstall();
        }
      } catch (error: any) {
        console.error(`Failed to call onUninstall for ${name}:`, error.message);
      }
    }

    // Remove extension directory
    const extensionDir = path.join(EXTENSIONS_DIR, name);
    await fs.rm(extensionDir, { recursive: true, force: true });

    // Remove from config
    delete this.config.extensions[name];
    await this.saveConfig();

    console.log(`Extension ${name} uninstalled`);
  }

  /**
   * List all installed extensions
   */
  async list(): Promise<ExtensionMetadata[]> {
    await this.initialize();

    if (!this.config) {
      return [];
    }

    return Object.values(this.config.extensions);
  }

  /**
   * Get extension info
   */
  async info(name: string): Promise<ExtensionMetadata | null> {
    await this.initialize();

    return this.config?.extensions[name] || null;
  }

  /**
   * Helper: Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// Export singleton instance
let extensionManagerInstance: ExtensionManager | null = null;

export function getExtensionManager(): ExtensionManager {
  if (!extensionManagerInstance) {
    extensionManagerInstance = new ExtensionManager();
  }
  return extensionManagerInstance;
}

export default ExtensionManager;

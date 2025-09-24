/**
 * CLI Preference Manager
 *
 * Manages user preferences for CLI routing behavior, integration settings,
 * and persistent configuration storage. Handles preference validation,
 * migration, and provides a unified interface for configuration access.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CLIPreferences {
  /** Whether to prefer official Gemini CLI over fallback */
  preferOfficialCLI: boolean;
  /** Show deprecation warnings for standalone CLI usage */
  showDeprecationWarnings: boolean;
  /** Enable verbose logging for CLI operations */
  verboseLogging: boolean;
  /** Default timeout for CLI command execution (in seconds) */
  commandTimeout: number;
  /** Maximum number of retry attempts for failed CLI commands */
  maxRetries: number;
  /** Enable context synchronization between CLI implementations */
  enableContextSync: boolean;
  /** Enable configuration synchronization */
  enableConfigSync: boolean;
  /** Enable state synchronization */
  enableStateSync: boolean;
  /** Cache CLI detection results */
  cacheDetection: boolean;
  /** Cache timeout for CLI detection (in minutes) */
  cacheTimeout: number;
  /** Last migration version applied */
  lastMigrationVersion: string;
}

export interface CLIPreferencesConfig {
  /** Default preferences */
  defaults: CLIPreferences;
  /** Configuration file path */
  configPath: string;
  /** Backup configuration path */
  backupPath: string;
  /** Migration handlers for version upgrades */
  migrations: Record<string, (config: CLIPreferences) => CLIPreferences>;
}

export class CLIPreferenceManager extends EventEmitter {
  private static instance: CLIPreferenceManager;
  private preferences: CLIPreferences;
  private configPath: string;
  private backupPath: string;
  private migrations: Record<string, (config: CLIPreferences) => CLIPreferences>;
  private isLoaded: boolean = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor(config: CLIPreferencesConfig) {
    super();
    this.preferences = { ...config.defaults };
    this.configPath = config.configPath;
    this.backupPath = config.backupPath;
    this.migrations = config.migrations;
  }

  /**
   * Get singleton instance of CLIPreferenceManager
   */
  public static getInstance(config?: CLIPreferencesConfig): CLIPreferenceManager {
    if (!CLIPreferenceManager.instance) {
      const defaultConfig: CLIPreferencesConfig = {
        defaults: {
          preferOfficialCLI: true,
          showDeprecationWarnings: true,
          verboseLogging: false,
          commandTimeout: 30,
          maxRetries: 3,
          enableContextSync: true,
          enableConfigSync: true,
          enableStateSync: true,
          cacheDetection: true,
          cacheTimeout: 60,
          lastMigrationVersion: '1.0.0'
        },
        configPath: path.join(os.homedir(), '.gemini-flow', 'cli-preferences.json'),
        backupPath: path.join(os.homedir(), '.gemini-flow', 'cli-preferences.backup.json'),
        migrations: {}
      };
      CLIPreferenceManager.instance = new CLIPreferenceManager(config || defaultConfig);
    }
    return CLIPreferenceManager.instance;
  }

  /**
   * Load preferences from disk
   */
  public async loadPreferences(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Load preferences from file
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const loadedPreferences = JSON.parse(configData) as Partial<CLIPreferences>;

        // Merge with defaults and validate
        this.preferences = this.validatePreferences({
          ...this.preferences,
          ...loadedPreferences
        });

        // Apply migrations
        await this.applyMigrations();

        this.emit('preferences:loaded', this.preferences);
      } else {
        // Create default configuration
        await this.savePreferences();
        this.emit('preferences:created', this.preferences);
      }

      this.isLoaded = true;
    } catch (error) {
      this.emit('preferences:error', error);
      throw new Error(`Failed to load CLI preferences: ${error}`);
    }
  }

  /**
   * Save preferences to disk
   */
  public async savePreferences(): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Create backup of existing config
      if (fs.existsSync(this.configPath)) {
        fs.copyFileSync(this.configPath, this.backupPath);
      }

      // Write preferences to file
      const configData = JSON.stringify(this.preferences, null, 2);
      fs.writeFileSync(this.configPath, configData, 'utf8');

      this.emit('preferences:saved', this.preferences);
    } catch (error) {
      this.emit('preferences:error', error);
      throw new Error(`Failed to save CLI preferences: ${error}`);
    }
  }

  /**
   * Update specific preferences
   */
  public async updatePreferences(updates: Partial<CLIPreferences>): Promise<void> {
    const originalPreferences = { ...this.preferences };

    try {
      // Validate updates
      const validatedUpdates = this.validatePreferences({
        ...this.preferences,
        ...updates
      });

      // Apply updates
      this.preferences = validatedUpdates;

      // Save to disk (debounced)
      await this.debouncedSave();

      this.emit('preferences:updated', {
        previous: originalPreferences,
        current: this.preferences,
        changes: updates
      });
    } catch (error) {
      this.emit('preferences:error', error);
      throw error;
    }
  }

  /**
   * Get current preferences
   */
  public getPreferences(): CLIPreferences {
    return { ...this.preferences };
  }

  /**
   * Get specific preference value
   */
  public getPreference<K extends keyof CLIPreferences>(key: K): CLIPreferences[K] {
    return this.preferences[key];
  }

  /**
   * Reset preferences to defaults
   */
  public async resetPreferences(): Promise<void> {
    const originalPreferences = { ...this.preferences };

    try {
      // Reset to defaults
      this.preferences = { ...this.getDefaultPreferences() };

      // Save to disk
      await this.savePreferences();

      this.emit('preferences:reset', {
        previous: originalPreferences,
        current: this.preferences
      });
    } catch (error) {
      this.emit('preferences:error', error);
      throw error;
    }
  }

  /**
   * Export preferences for backup or migration
   */
  public exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from external source
   */
  public async importPreferences(configData: string): Promise<void> {
    try {
      const importedPreferences = JSON.parse(configData) as Partial<CLIPreferences>;

      // Validate imported preferences
      const validatedPreferences = this.validatePreferences({
        ...this.preferences,
        ...importedPreferences
      });

      // Apply imported preferences
      this.preferences = validatedPreferences;

      // Save to disk
      await this.savePreferences();

      this.emit('preferences:imported', this.preferences);
    } catch (error) {
      this.emit('preferences:error', error);
      throw new Error(`Failed to import CLI preferences: ${error}`);
    }
  }

  /**
   * Add migration handler for version upgrades
   */
  public addMigration(version: string, handler: (config: CLIPreferences) => CLIPreferences): void {
    this.migrations[version] = handler;
  }

  /**
   * Validate preferences against schema
   */
  private validatePreferences(preferences: CLIPreferences): CLIPreferences {
    const validated = { ...preferences };

    // Boolean preferences
    const booleanKeys: (keyof CLIPreferences)[] = [
      'preferOfficialCLI',
      'showDeprecationWarnings',
      'verboseLogging',
      'enableContextSync',
      'enableConfigSync',
      'enableStateSync',
      'cacheDetection'
    ];

    booleanKeys.forEach(key => {
      if (typeof validated[key] !== 'boolean') {
        validated[key] = this.getDefaultPreferences()[key];
      }
    });

    // Numeric preferences
    if (typeof validated.commandTimeout !== 'number' || validated.commandTimeout < 1) {
      validated.commandTimeout = this.getDefaultPreferences().commandTimeout;
    }

    if (typeof validated.maxRetries !== 'number' || validated.maxRetries < 0) {
      validated.maxRetries = this.getDefaultPreferences().maxRetries;
    }

    if (typeof validated.cacheTimeout !== 'number' || validated.cacheTimeout < 0) {
      validated.cacheTimeout = this.getDefaultPreferences().cacheTimeout;
    }

    // String preferences
    if (typeof validated.lastMigrationVersion !== 'string') {
      validated.lastMigrationVersion = this.getDefaultPreferences().lastMigrationVersion;
    }

    return validated;
  }

  /**
   * Apply migrations to preferences
   */
  private async applyMigrations(): Promise<void> {
    const currentVersion = this.preferences.lastMigrationVersion;
    const migrationVersions = Object.keys(this.migrations)
      .filter(version => this.compareVersions(version, currentVersion) > 0)
      .sort((a, b) => this.compareVersions(a, b));

    for (const version of migrationVersions) {
      try {
        this.preferences = this.migrations[version](this.preferences);
        this.preferences.lastMigrationVersion = version;
        this.emit('preferences:migrated', { from: currentVersion, to: version });
      } catch (error) {
        this.emit('preferences:migration-error', { version, error });
        throw new Error(`Migration to version ${version} failed: ${error}`);
      }
    }

    // Save migrated preferences
    if (migrationVersions.length > 0) {
      await this.savePreferences();
    }
  }

  /**
   * Compare two version strings
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;

      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }

    return 0;
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): CLIPreferences {
    return {
      preferOfficialCLI: true,
      showDeprecationWarnings: true,
      verboseLogging: false,
      commandTimeout: 30,
      maxRetries: 3,
      enableContextSync: true,
      enableConfigSync: true,
      enableStateSync: true,
      cacheDetection: true,
      cacheTimeout: 60,
      lastMigrationVersion: '1.0.0'
    };
  }

  /**
   * Debounced save to prevent excessive disk writes
   */
  private async debouncedSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      await this.savePreferences();
      this.saveTimeout = null;
    }, 1000); // 1 second debounce
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.removeAllListeners();
  }
}

// Event types for type safety
export type CLIPreferenceEvents = {
  'preferences:loaded': [preferences: CLIPreferences];
  'preferences:created': [preferences: CLIPreferences];
  'preferences:saved': [preferences: CLIPreferences];
  'preferences:updated': [{
    previous: CLIPreferences;
    current: CLIPreferences;
    changes: Partial<CLIPreferences>;
  }];
  'preferences:reset': [{
    previous: CLIPreferences;
    current: CLIPreferences;
  }];
  'preferences:imported': [preferences: CLIPreferences];
  'preferences:migrated': [{ from: string; to: string }];
  'preferences:error': [error: Error];
  'preferences:migration-error': [{ version: string; error: Error }];
};
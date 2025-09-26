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
export class CLIPreferenceManager extends EventEmitter {
    constructor(config) {
        super();
        this.isLoaded = false;
        this.saveTimeout = null;
        this.preferences = { ...config.defaults };
        this.configPath = config.configPath;
        this.backupPath = config.backupPath;
        this.migrations = config.migrations;
    }
    /**
     * Get singleton instance of CLIPreferenceManager
     */
    static getInstance(config) {
        if (!CLIPreferenceManager.instance) {
            const defaultConfig = {
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
    async loadPreferences() {
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
                const loadedPreferences = JSON.parse(configData);
                // Merge with defaults and validate
                this.preferences = this.validatePreferences({
                    ...this.preferences,
                    ...loadedPreferences
                });
                // Apply migrations
                await this.applyMigrations();
                this.emit('preferences:loaded', this.preferences);
            }
            else {
                // Create default configuration
                await this.savePreferences();
                this.emit('preferences:created', this.preferences);
            }
            this.isLoaded = true;
        }
        catch (error) {
            this.emit('preferences:error', error);
            throw new Error(`Failed to load CLI preferences: ${error}`);
        }
    }
    /**
     * Save preferences to disk
     */
    async savePreferences() {
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
        }
        catch (error) {
            this.emit('preferences:error', error);
            throw new Error(`Failed to save CLI preferences: ${error}`);
        }
    }
    /**
     * Update specific preferences
     */
    async updatePreferences(updates) {
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
        }
        catch (error) {
            this.emit('preferences:error', error);
            throw error;
        }
    }
    /**
     * Get current preferences
     */
    getPreferences() {
        return { ...this.preferences };
    }
    /**
     * Get specific preference value
     */
    getPreference(key) {
        return this.preferences[key];
    }
    /**
     * Reset preferences to defaults
     */
    async resetPreferences() {
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
        }
        catch (error) {
            this.emit('preferences:error', error);
            throw error;
        }
    }
    /**
     * Export preferences for backup or migration
     */
    exportPreferences() {
        return JSON.stringify(this.preferences, null, 2);
    }
    /**
     * Import preferences from external source
     */
    async importPreferences(configData) {
        try {
            const importedPreferences = JSON.parse(configData);
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
        }
        catch (error) {
            this.emit('preferences:error', error);
            throw new Error(`Failed to import CLI preferences: ${error}`);
        }
    }
    /**
     * Add migration handler for version upgrades
     */
    addMigration(version, handler) {
        this.migrations[version] = handler;
    }
    /**
     * Validate preferences against schema
     */
    validatePreferences(preferences) {
        const validated = { ...preferences };
        // Boolean preferences
        const booleanKeys = [
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
    async applyMigrations() {
        const currentVersion = this.preferences.lastMigrationVersion;
        const migrationVersions = Object.keys(this.migrations)
            .filter(version => this.compareVersions(version, currentVersion) > 0)
            .sort((a, b) => this.compareVersions(a, b));
        for (const version of migrationVersions) {
            try {
                this.preferences = this.migrations[version](this.preferences);
                this.preferences.lastMigrationVersion = version;
                this.emit('preferences:migrated', { from: currentVersion, to: version });
            }
            catch (error) {
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
    compareVersions(a, b) {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const partA = partsA[i] || 0;
            const partB = partsB[i] || 0;
            if (partA > partB)
                return 1;
            if (partA < partB)
                return -1;
        }
        return 0;
    }
    /**
     * Get default preferences
     */
    getDefaultPreferences() {
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
    async debouncedSave() {
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
    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.removeAllListeners();
    }
}

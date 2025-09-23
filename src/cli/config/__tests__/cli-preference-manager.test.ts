/**
 * CLI Preference Manager Tests
 *
 * Comprehensive test suite for the CLIPreferenceManager class including:
 * - Configuration loading and saving
 * - Preference validation and updates
 * - Event emission and handling
 * - Migration functionality
 * - Error handling and edge cases
 */

import { CLIPreferenceManager, CLIPreferences, CLIPreferencesConfig } from '../cli-preference-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  copyFileSync: jest.fn()
}));

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('CLIPreferenceManager', () => {
  let testConfig: CLIPreferencesConfig;
  let testConfigPath: string;
  let testBackupPath: string;
  let manager: CLIPreferenceManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup test paths
    testConfigPath = '/test/.gemini-flow/cli-preferences.json';
    testBackupPath = '/test/.gemini-flow/cli-preferences.backup.json';

    // Mock homedir
    mockOs.homedir.mockReturnValue('/test');

    // Setup test configuration
    testConfig = {
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
      configPath: testConfigPath,
      backupPath: testBackupPath,
      migrations: {
        '1.1.0': (config: CLIPreferences) => ({
          ...config,
          showDeprecationWarnings: false
        }),
        '1.2.0': (config: CLIPreferences) => ({
          ...config,
          commandTimeout: 45
        })
      }
    };

    // Create fresh manager instance
    manager = CLIPreferenceManager.getInstance(testConfig);
  });

  afterEach(() => {
    // Clean up singleton instance
    (CLIPreferenceManager as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CLIPreferenceManager.getInstance();
      const instance2 = CLIPreferenceManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should allow configuration override', () => {
      const customConfig: CLIPreferencesConfig = {
        ...testConfig,
        defaults: {
          ...testConfig.defaults,
          preferOfficialCLI: false
        }
      };

      const instance = CLIPreferenceManager.getInstance(customConfig);
      expect(instance.getPreference('preferOfficialCLI')).toBe(false);
    });
  });

  describe('Preference Loading', () => {
    it('should load preferences from file when config exists', async () => {
      // Mock file exists and contains valid JSON
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        preferOfficialCLI: false,
        verboseLogging: true,
        commandTimeout: 45
      }));

      await manager.loadPreferences();

      expect(manager.getPreference('preferOfficialCLI')).toBe(false);
      expect(manager.getPreference('verboseLogging')).toBe(true);
      expect(manager.getPreference('commandTimeout')).toBe(45);
    });

    it('should create default preferences when config file does not exist', async () => {
      // Mock file does not exist
      mockFs.existsSync.mockReturnValue(false);

      await manager.loadPreferences();

      const preferences = manager.getPreferences();
      expect(preferences.preferOfficialCLI).toBe(true);
      expect(preferences.verboseLogging).toBe(false);
      expect(preferences.commandTimeout).toBe(30);

      // Verify file was created
      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      await expect(manager.loadPreferences()).rejects.toThrow();
    });

    it('should validate loaded preferences', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        preferOfficialCLI: 'invalid_boolean', // Should be boolean
        commandTimeout: 'invalid_number', // Should be number
        maxRetries: -1, // Should be non-negative
        lastMigrationVersion: null // Should be string
      }));

      await manager.loadPreferences();

      // Should fall back to defaults for invalid values
      expect(manager.getPreference('preferOfficialCLI')).toBe(true);
      expect(manager.getPreference('commandTimeout')).toBe(30);
      expect(manager.getPreference('maxRetries')).toBe(3);
      expect(manager.getPreference('lastMigrationVersion')).toBe('1.0.0');
    });
  });

  describe('Preference Saving', () => {
    it('should save preferences to file', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await manager.loadPreferences();
      await manager.savePreferences();

      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        testConfigPath,
        testBackupPath
      );
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await manager.savePreferences();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(testConfigPath),
        { recursive: true }
      );
    });
  });

  describe('Preference Updates', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      await manager.loadPreferences();
    });

    it('should update specific preferences', async () => {
      const updates: Partial<CLIPreferences> = {
        preferOfficialCLI: false,
        verboseLogging: true,
        commandTimeout: 60
      };

      await manager.updatePreferences(updates);

      expect(manager.getPreference('preferOfficialCLI')).toBe(false);
      expect(manager.getPreference('verboseLogging')).toBe(true);
      expect(manager.getPreference('commandTimeout')).toBe(60);
    });

    it('should validate updated preferences', async () => {
      const invalidUpdates: Partial<CLIPreferences> = {
        commandTimeout: -10, // Invalid negative value
        maxRetries: 'invalid' as any // Invalid type
      };

      await manager.updatePreferences(invalidUpdates);

      // Should use defaults for invalid values
      expect(manager.getPreference('commandTimeout')).toBe(30);
      expect(manager.getPreference('maxRetries')).toBe(3);
    });

    it('should emit update events', async () => {
      const mockListener = jest.fn();
      manager.on('preferences:updated', mockListener);

      const updates: Partial<CLIPreferences> = {
        preferOfficialCLI: false
      };

      await manager.updatePreferences(updates);

      expect(mockListener).toHaveBeenCalledWith({
        previous: expect.any(Object),
        current: expect.any(Object),
        changes: updates
      });
    });
  });

  describe('Preference Reset', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      await manager.loadPreferences();
    });

    it('should reset preferences to defaults', async () => {
      // First modify some preferences
      await manager.updatePreferences({
        preferOfficialCLI: false,
        commandTimeout: 60
      });

      // Then reset
      await manager.resetPreferences();

      expect(manager.getPreference('preferOfficialCLI')).toBe(true);
      expect(manager.getPreference('commandTimeout')).toBe(30);
    });

    it('should emit reset events', async () => {
      const mockListener = jest.fn();
      manager.on('preferences:reset', mockListener);

      await manager.resetPreferences();

      expect(mockListener).toHaveBeenCalledWith({
        previous: expect.any(Object),
        current: expect.any(Object)
      });
    });
  });

  describe('Preference Import/Export', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      await manager.loadPreferences();
    });

    it('should export preferences as JSON string', () => {
      const exported = manager.exportPreferences();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.preferOfficialCLI).toBe(true);
    });

    it('should import preferences from JSON string', async () => {
      const importData = JSON.stringify({
        preferOfficialCLI: false,
        verboseLogging: true,
        commandTimeout: 45
      });

      await manager.importPreferences(importData);

      expect(manager.getPreference('preferOfficialCLI')).toBe(false);
      expect(manager.getPreference('verboseLogging')).toBe(true);
      expect(manager.getPreference('commandTimeout')).toBe(45);
    });

    it('should validate imported preferences', async () => {
      const importData = JSON.stringify({
        commandTimeout: 'invalid', // Invalid type
        maxRetries: -5 // Invalid value
      });

      await manager.importPreferences(importData);

      // Should fall back to defaults for invalid values
      expect(manager.getPreference('commandTimeout')).toBe(30);
      expect(manager.getPreference('maxRetries')).toBe(3);
    });
  });

  describe('Migration System', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      await manager.loadPreferences();
    });

    it('should apply migrations when version is newer', async () => {
      // Simulate loading preferences with older version
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        ...testConfig.defaults,
        lastMigrationVersion: '1.0.0'
      }));

      const mockListener = jest.fn();
      manager.on('preferences:migrated', mockListener);

      await manager.loadPreferences();

      // Should have applied migrations
      expect(manager.getPreference('showDeprecationWarnings')).toBe(false);
      expect(manager.getPreference('commandTimeout')).toBe(45);
      expect(manager.getPreference('lastMigrationVersion')).toBe('1.2.0');

      expect(mockListener).toHaveBeenCalledWith({
        from: '1.0.0',
        to: '1.1.0'
      });
      expect(mockListener).toHaveBeenCalledWith({
        from: '1.1.0',
        to: '1.2.0'
      });
    });

    it('should skip migrations when version is current', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        ...testConfig.defaults,
        lastMigrationVersion: '1.2.0'
      }));

      const mockListener = jest.fn();
      manager.on('preferences:migrated', mockListener);

      await manager.loadPreferences();

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      // Add a migration that throws an error
      manager.addMigration('1.3.0', () => {
        throw new Error('Migration failed');
      });

      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        ...testConfig.defaults,
        lastMigrationVersion: '1.2.0'
      }));

      const mockErrorListener = jest.fn();
      manager.on('preferences:migration-error', mockErrorListener);

      await expect(manager.loadPreferences()).rejects.toThrow('Migration to version 1.3.0 failed');

      expect(mockErrorListener).toHaveBeenCalledWith({
        version: '1.3.0',
        error: expect.any(Error)
      });
    });
  });

  describe('Event System', () => {
    it('should emit events for all preference operations', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const events: string[] = [];
      manager.on('preferences:loaded', () => events.push('loaded'));
      manager.on('preferences:created', () => events.push('created'));
      manager.on('preferences:saved', () => events.push('saved'));
      manager.on('preferences:updated', () => events.push('updated'));
      manager.on('preferences:reset', () => events.push('reset'));
      manager.on('preferences:imported', () => events.push('imported'));

      await manager.loadPreferences();
      await manager.updatePreferences({ preferOfficialCLI: false });
      await manager.resetPreferences();
      await manager.importPreferences('{}');

      // Should have emitted events (order may vary)
      expect(events).toContain('loaded');
      expect(events).toContain('updated');
      expect(events).toContain('reset');
      expect(events).toContain('imported');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Filesystem error');
      });

      const mockErrorListener = jest.fn();
      manager.on('preferences:error', mockErrorListener);

      await expect(manager.loadPreferences()).rejects.toThrow('Filesystem error');
      expect(mockErrorListener).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const mockErrorListener = jest.fn();
      manager.on('preferences:error', mockErrorListener);

      await expect(manager.savePreferences()).rejects.toThrow('Write error');
      expect(mockErrorListener).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      await manager.loadPreferences();
    });

    it('should get individual preferences', () => {
      expect(manager.getPreference('preferOfficialCLI')).toBe(true);
      expect(manager.getPreference('commandTimeout')).toBe(30);
      expect(manager.getPreference('verboseLogging')).toBe(false);
    });

    it('should return copy of preferences to prevent mutation', () => {
      const preferences1 = manager.getPreferences();
      const preferences2 = manager.getPreferences();

      expect(preferences1).not.toBe(preferences2);
      expect(preferences1).toEqual(preferences2);
    });

    it('should destroy instance and clean up resources', () => {
      const mockRemoveAllListeners = jest.spyOn(manager, 'removeAllListeners');

      manager.destroy();

      expect(mockRemoveAllListeners).toHaveBeenCalled();
    });
  });
});
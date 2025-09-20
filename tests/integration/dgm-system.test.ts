/**
 * DGM System Integration Tests
 * 
 * Tests for Darwin Gödel Machine evolutionary cleanup system
 */

import { 
  DGMSystemCoordinator,
  DGMSystemFactory,
  createDGMSystem 
} from '../../src/core/dgm';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('DGM System Integration', () => {
  const testProjectPath = '/tmp/dgm-test-project';
  let dgmSystem: DGMSystemCoordinator;

  beforeAll(async () => {
    // Create test project directory
    await fs.mkdir(testProjectPath, { recursive: true });
    
    // Create mock project files
    await fs.writeFile(
      path.join(testProjectPath, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
    );
    
    await fs.mkdir(path.join(testProjectPath, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(testProjectPath, 'src', 'index.ts'),
      'console.log("Hello DGM test");'
    );
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    if (dgmSystem) {
      await dgmSystem.stop();
    }
  });

  describe('System Factory', () => {
    test('should create conservative DGM system', () => {
      dgmSystem = DGMSystemFactory.createConservative(testProjectPath);
      expect(dgmSystem).toBeDefined();
    });

    test('should create aggressive DGM system', () => {
      dgmSystem = DGMSystemFactory.createAggressive(testProjectPath);
      expect(dgmSystem).toBeDefined();
    });

    test('should create balanced DGM system', () => {
      dgmSystem = DGMSystemFactory.createBalanced(testProjectPath);
      expect(dgmSystem).toBeDefined();
    });

    test('should create research DGM system', () => {
      dgmSystem = DGMSystemFactory.createResearch(testProjectPath);
      expect(dgmSystem).toBeDefined();
    });
  });

  describe('System Initialization', () => {
    beforeEach(() => {
      dgmSystem = createDGMSystem(testProjectPath, {
        autoEvolutionEnabled: false
      });
    });

    test('should initialize DGM system successfully', async () => {
      await expect(dgmSystem.initialize()).resolves.not.toThrow();
      
      const status = dgmSystem.getSystemStatus();
      expect(status.systemHealth).toBeGreaterThanOrEqual(0);
      expect(status.debtMetrics).toBeDefined();
    }, 10000);

    test('should start and stop system', async () => {
      await dgmSystem.initialize();
      await dgmSystem.start();
      
      const status = dgmSystem.getSystemStatus();
      expect(status.isActive).toBe(true);
      
      await dgmSystem.stop();
      const stoppedStatus = dgmSystem.getSystemStatus();
      expect(stoppedStatus.isActive).toBe(false);
    }, 10000);
  });

  describe('Evolution Cycle', () => {
    beforeEach(async () => {
      dgmSystem = createDGMSystem(testProjectPath, {
        evolutionCycles: 3,
        fitnessThreshold: 0.5
      });
      await dgmSystem.initialize();
      await dgmSystem.start();
    });

    test('should execute manual evolution cycle', async () => {
      const report = await dgmSystem.executeEvolutionCycle();
      
      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.trigger).toBe('manual');
      expect(report.strategiesEvaluated).toBeGreaterThan(0);
      expect(report.status).toMatch(/^(completed|failed)$/);
      expect(typeof report.fitnessImprovement).toBe('number');
      expect(Array.isArray(report.recommendations)).toBe(true);
    }, 15000);

    test('should track evolution history', async () => {
      await dgmSystem.executeEvolutionCycle();
      
      const history = dgmSystem.getEvolutionHistory(5);
      expect(history).toBeDefined();
      expect(history.length).toBe(1);
      expect(history[0].trigger).toBe('manual');
    }, 15000);
  });

  describe('Pattern Management', () => {
    beforeEach(async () => {
      dgmSystem = createDGMSystem(testProjectPath);
      await dgmSystem.initialize();
    });

    test('should query archived patterns', async () => {
      const patterns = await dgmSystem.queryPatterns({
        minFitnessScore: 0.5,
        limit: 10
      });
      
      expect(Array.isArray(patterns)).toBe(true);
      // Initially empty, but should not throw
    }, 10000);
  });

  describe('System Insights', () => {
    beforeEach(async () => {
      dgmSystem = createDGMSystem(testProjectPath);
      await dgmSystem.initialize();
    });

    test('should generate system insights', async () => {
      const insights = await dgmSystem.generateSystemInsights();
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights.evolutionInsights)).toBe(true);
      expect(Array.isArray(insights.patternInsights)).toBe(true);
      expect(Array.isArray(insights.performanceInsights)).toBe(true);
      expect(Array.isArray(insights.recommendations)).toBe(true);
    }, 10000);

    test('should export system data', async () => {
      const exportData = await dgmSystem.exportSystemData();
      
      expect(exportData).toBeDefined();
      expect(exportData.config).toBeDefined();
      expect(exportData.status).toBeDefined();
      expect(Array.isArray(exportData.evolutionHistory)).toBe(true);
      expect(Array.isArray(exportData.recommendations)).toBe(true);
    }, 10000);
  });

  describe('Error Handling', () => {
    test('should handle invalid project path gracefully', () => {
      expect(() => {
        dgmSystem = createDGMSystem('/nonexistent/path/that/should/not/exist');
      }).not.toThrow();
    });

    test('should handle initialization without proper setup', async () => {
      dgmSystem = createDGMSystem(testProjectPath);
      
      // Should be able to get status before initialization
      const status = dgmSystem.getSystemStatus();
      expect(status).toBeDefined();
      expect(status.isActive).toBe(false);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      dgmSystem = createDGMSystem(testProjectPath);
      await dgmSystem.initialize();
    });

    test('should emit system events', (done) => {
      let eventReceived = false;
      
      dgmSystem.on('system_started', () => {
        if (!eventReceived) {
          eventReceived = true;
          done();
        }
      });
      
      dgmSystem.start();
    }, 10000);

    test('should emit evolution events', (done) => {
      let eventReceived = false;
      
      dgmSystem.on('evolution_completed', (report) => {
        if (!eventReceived) {
          eventReceived = true;
          expect(report).toBeDefined();
          expect(report.trigger).toBe('manual');
          done();
        }
      });
      
      dgmSystem.start().then(() => {
        dgmSystem.executeEvolutionCycle();
      });
    }, 20000);
  });
});
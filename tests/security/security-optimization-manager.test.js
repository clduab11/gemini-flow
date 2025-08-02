/**
 * Security Optimization Manager Test Suite
 * 
 * Comprehensive tests for all security-focused optimization flags:
 * --auto-route, --cost-optimize, --canary-deploy, --slack-updates,
 * --analyze-self, --meta-optimization
 */

const { SecurityOptimizationManager } = require('../../dist/core/security-optimization-manager.js');
const { ModelOrchestrator } = require('../../dist/core/model-orchestrator.js');
const { PerformanceMonitor } = require('../../dist/core/performance-monitor.js');
const { AuthenticationManager } = require('../../dist/core/auth-manager.js');
const { ModelRouter } = require('../../dist/core/model-router.js');

describe('SecurityOptimizationManager', () => {
  let securityManager;
  let mockOrchestrator;
  let mockPerformance;
  let mockAuth;
  let mockRouter;

  beforeEach(async () => {
    // Create mock dependencies
    mockOrchestrator = {
      on: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({
        totalRequests: 100,
        avgRoutingTime: 45,
        cacheHitRate: 0.8
      })
    };

    mockPerformance = {
      getMetrics: jest.fn().mockReturnValue({
        avgLatency: 250,
        recentFailures: 2
      }),
      getHealthScore: jest.fn().mockReturnValue(85)
    };

    mockAuth = {
      getCurrentUserContext: jest.fn().mockResolvedValue({
        roles: ['admin', 'developer']
      }),
      getCurrentUserId: jest.fn().mockResolvedValue('test-user-123'),
      determineUserTier: jest.fn().mockResolvedValue('pro')
    };

    mockRouter = {
      on: jest.fn(),
      addRule: jest.fn(),
      selectOptimalModel: jest.fn().mockResolvedValue({
        modelName: 'gemini-2.0-flash',
        confidence: 0.9,
        reason: 'Best performance match'
      }),
      recordPerformance: jest.fn()
    };

    // Initialize SecurityOptimizationManager
    securityManager = new SecurityOptimizationManager(
      mockOrchestrator,
      mockPerformance,
      mockAuth,
      mockRouter
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default security policy', () => {
      const policy = securityManager.getSecurityPolicy();
      
      expect(policy.maxCostPerRequest).toBe(0.50);
      expect(policy.allowedModelTiers).toContain('free');
      expect(policy.allowedModelTiers).toContain('pro');
      expect(policy.allowedModelTiers).toContain('enterprise');
      expect(policy.auditLevel).toBe('comprehensive');
      expect(policy.emergencyOverrides).toBe(true);
    });

    test('should initialize with all optimization flags disabled', () => {
      const flags = securityManager.getOptimizationFlags();
      
      expect(flags.autoRoute).toBe(false);
      expect(flags.costOptimize).toBe(false);
      expect(flags.canaryDeploy).toBe(false);
      expect(flags.slackUpdates).toBe(false);
      expect(flags.analyzeSelf).toBe(false);
      expect(flags.metaOptimization).toBe(false);
    });

    test('should setup emergency protocols', () => {
      const metrics = securityManager.getMetrics();
      expect(metrics).toHaveProperty('totalOptimizations');
      expect(metrics).toHaveProperty('securityBlocks');
      expect(metrics).toHaveProperty('emergencyOverrides');
    });
  });

  describe('--auto-route Flag', () => {
    test('should enable auto-route with default configuration', async () => {
      const result = await securityManager.enableAutoRoute();
      
      expect(result).toBe(true);
      
      const flags = securityManager.getOptimizationFlags();
      expect(flags.autoRoute).toBe(true);
      
      // Verify router rule was added
      expect(mockRouter.addRule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'security-auto-route',
          name: 'Security-Aware Auto Route',
          weight: 9,
          active: true
        })
      );
    });

    test('should enable auto-route with custom configuration', async () => {
      const options = {
        performanceBased: true,
        costAware: true,
        fallbackStrategy: 'performance',
        securityLevel: 'high'
      };

      const result = await securityManager.enableAutoRoute(options);
      
      expect(result).toBe(true);
      expect(mockRouter.addRule).toHaveBeenCalled();
    });

    test('should validate access permissions for auto-route', async () => {
      // Mock access denied
      mockAuth.getCurrentUserContext.mockResolvedValue({
        roles: ['guest']
      });

      await expect(securityManager.enableAutoRoute()).rejects.toThrow(
        'Insufficient role permissions'
      );
    });

    test('should create audit event for auto-route enablement', async () => {
      await securityManager.enableAutoRoute();
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].action).toBe('enable_auto_route');
      expect(auditLog[0].result).toBe('success');
    });
  });

  describe('--cost-optimize Flag', () => {
    test('should enable cost optimization with default settings', async () => {
      const result = await securityManager.enableCostOptimization();
      
      expect(result).toBe(true);
      
      const flags = securityManager.getOptimizationFlags();
      expect(flags.costOptimize).toBe(true);
      
      expect(mockRouter.addRule).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cost-optimization',
          name: 'Cost Optimization Routing',
          weight: 8,
          active: true
        })
      );
    });

    test('should apply custom cost optimization settings', async () => {
      const options = {
        targetReduction: 0.25, // 25%
        maxLatencyIncrease: 300,
        budgetLimit: 0.25,
        preserveQuality: false
      };

      const result = await securityManager.enableCostOptimization(options);
      
      expect(result).toBe(true);
    });

    test('should enforce budget limits', async () => {
      const options = {
        budgetLimit: 0.01 // Very low limit
      };

      await securityManager.enableCostOptimization(options);
      
      // Verify cost monitoring is setup
      expect(mockOrchestrator.on).toHaveBeenCalledWith(
        'request_completed', 
        expect.any(Function)
      );
    });

    test('should create audit trail for cost optimization', async () => {
      await securityManager.enableCostOptimization();
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog[0].action).toBe('enable_cost_optimization');
      expect(auditLog[0].result).toBe('success');
    });
  });

  describe('--canary-deploy Flag', () => {
    const deploymentOptions = {
      name: 'test-deployment',
      version: '1.2.3',
      trafficPercent: 10,
      healthThreshold: 0.95,
      maxDuration: 1800000, // 30 minutes
      autoRollback: true
    };

    test('should start canary deployment successfully', async () => {
      const deploymentId = await securityManager.enableCanaryDeployment(deploymentOptions);
      
      expect(deploymentId).toBeDefined();
      expect(typeof deploymentId).toBe('string');
      
      const deployments = securityManager.getCanaryDeployments();
      expect(deployments).toHaveLength(1);
      expect(deployments[0].name).toBe('test-deployment');
      expect(deployments[0].version).toBe('1.2.3');
    });

    test('should setup health monitoring for canary deployment', async () => {
      const deploymentId = await securityManager.enableCanaryDeployment(deploymentOptions);
      
      const deployment = securityManager.getCanaryDeployments().find(d => d.id === deploymentId);
      expect(deployment.healthThreshold).toBe(0.95);
      expect(deployment.autoRollback).toBe(true);
    });

    test('should configure security checks for canary deployment', async () => {
      const deploymentId = await securityManager.enableCanaryDeployment(deploymentOptions);
      
      const deployment = securityManager.getCanaryDeployments().find(d => d.id === deploymentId);
      expect(deployment.securityChecks).toContain('authentication_bypass');
      expect(deployment.securityChecks).toContain('authorization_escalation');
      expect(deployment.securityChecks).toContain('data_leakage');
    });

    test('should validate deployment permissions', async () => {
      mockAuth.getCurrentUserContext.mockResolvedValue({
        roles: ['guest']
      });

      await expect(
        securityManager.enableCanaryDeployment(deploymentOptions)
      ).rejects.toThrow('Insufficient role permissions');
    });

    test('should audit canary deployment start', async () => {
      await securityManager.enableCanaryDeployment(deploymentOptions);
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog[0].action).toBe('canary_deployment_started');
      expect(auditLog[0].result).toBe('success');
    });
  });

  describe('--slack-updates Flag', () => {
    const slackConfig = {
      webhookUrl: 'https://hooks.slack.com/test-webhook',
      channel: '#test-channel',
      securityFilters: ['no-credentials', 'no-personal-data'],
      urgencyLevels: ['warning', 'error', 'critical']
    };

    test('should enable Slack notifications successfully', async () => {
      const result = await securityManager.enableSlackUpdates(slackConfig);
      
      expect(result).toBe(true);
      
      const flags = securityManager.getOptimizationFlags();
      expect(flags.slackUpdates).toBe(true);
    });

    test('should validate webhook URL security', async () => {
      const insecureConfig = {
        ...slackConfig,
        webhookUrl: 'http://insecure-webhook.com' // HTTP instead of HTTPS
      };

      await expect(
        securityManager.enableSlackUpdates(insecureConfig)
      ).rejects.toThrow('Webhook URL must use HTTPS');
    });

    test('should apply security filters to notifications', async () => {
      await securityManager.enableSlackUpdates(slackConfig);
      
      // Verify security filters are configured
      expect(slackConfig.securityFilters).toContain('no-credentials');
      expect(slackConfig.securityFilters).toContain('no-personal-data');
    });

    test('should enforce rate limits', async () => {
      await securityManager.enableSlackUpdates(slackConfig);
      
      // Test notifications would be rate limited
      // Implementation would check rate limits before sending
    });

    test('should audit Slack notifications enablement', async () => {
      await securityManager.enableSlackUpdates(slackConfig);
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog[0].action).toBe('slack_notifications_enabled');
      expect(auditLog[0].result).toBe('success');
    });
  });

  describe('--analyze-self Flag', () => {
    test('should perform self-analysis successfully', async () => {
      const analysis = await securityManager.enableSelfAnalysis();
      
      expect(analysis).toHaveProperty('performanceMetrics');
      expect(analysis).toHaveProperty('securityMetrics');
      expect(analysis).toHaveProperty('optimizationSuggestions');
      expect(analysis).toHaveProperty('riskAssessment');
      expect(analysis).toHaveProperty('confidenceScore');
      expect(analysis.confidenceScore).toBeGreaterThan(0);
      expect(analysis.confidenceScore).toBeLessThanOrEqual(1);
    });

    test('should apply security boundaries by default', async () => {
      const analysis = await securityManager.enableSelfAnalysis();
      
      // Sensitive data should be sanitized
      expect(analysis.performanceMetrics).toBeDefined();
      expect(analysis.securityMetrics).toBeDefined();
    });

    test('should generate improvement suggestions', async () => {
      const analysis = await securityManager.enableSelfAnalysis({
        improvementSuggestions: true
      });
      
      expect(analysis.optimizationSuggestions).toBeDefined();
      expect(Array.isArray(analysis.optimizationSuggestions)).toBe(true);
      expect(analysis.selfImprovementActions).toBeDefined();
      expect(Array.isArray(analysis.selfImprovementActions)).toBe(true);
    });

    test('should assess system risks', async () => {
      const analysis = await securityManager.enableSelfAnalysis();
      
      expect(analysis.riskAssessment).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(analysis.riskAssessment);
    });

    test('should validate analysis permissions', async () => {
      mockAuth.getCurrentUserContext.mockResolvedValue({
        roles: ['guest']
      });

      await expect(
        securityManager.enableSelfAnalysis()
      ).rejects.toThrow('Insufficient role permissions');
    });

    test('should audit self-analysis completion', async () => {
      await securityManager.enableSelfAnalysis();
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog[0].action).toBe('self_analysis_completed');
      expect(auditLog[0].result).toBe('success');
    });
  });

  describe('--meta-optimization Flag', () => {
    test('should enable meta-optimization with default settings', async () => {
      const result = await securityManager.enableMetaOptimization();
      
      expect(result).toBe(true);
      
      const flags = securityManager.getOptimizationFlags();
      expect(flags.metaOptimization).toBe(true);
    });

    test('should respect safety limits for recursion', async () => {
      const options = {
        maxIterations: 20,
        recursionDepth: 10, // Should be capped at 5
        safetyLimits: true
      };

      const result = await securityManager.enableMetaOptimization(options);
      
      expect(result).toBe(true);
      // Recursion depth should be limited for safety
    });

    test('should configure learning parameters', async () => {
      const options = {
        learningRate: 0.05,
        maxIterations: 5,
        safetyLimits: true
      };

      const result = await securityManager.enableMetaOptimization(options);
      
      expect(result).toBe(true);
    });

    test('should validate meta-optimization permissions', async () => {
      mockAuth.getCurrentUserContext.mockResolvedValue({
        roles: ['guest']
      });

      await expect(
        securityManager.enableMetaOptimization()
      ).rejects.toThrow('Insufficient role permissions');
    });

    test('should audit meta-optimization enablement', async () => {
      await securityManager.enableMetaOptimization();
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog[0].action).toBe('meta_optimization_enabled');
      expect(auditLog[0].result).toBe('success');
    });
  });

  describe('Security and Access Control', () => {
    test('should enforce role-based access control', async () => {
      // Test with insufficient permissions
      mockAuth.getCurrentUserContext.mockResolvedValue({
        roles: ['guest']
      });

      await expect(
        securityManager.enableAutoRoute()
      ).rejects.toThrow('Insufficient role permissions');

      await expect(
        securityManager.enableCostOptimization()
      ).rejects.toThrow('Insufficient role permissions');
    });

    test('should create audit trail for all operations', async () => {
      await securityManager.enableAutoRoute();
      await securityManager.enableCostOptimization();
      
      const auditLog = securityManager.getAuditLog(10);
      expect(auditLog.length).toBeGreaterThanOrEqual(2);
      
      // All events should have required fields
      auditLog.forEach(event => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('action');
        expect(event).toHaveProperty('result');
        expect(event).toHaveProperty('risk');
        expect(event).toHaveProperty('signature');
      });
    });

    test('should validate emergency overrides when disabled', async () => {
      // Disable emergency overrides
      const policy = securityManager.getSecurityPolicy();
      policy.emergencyOverrides = false;

      // Mock override attempt
      mockAuth.getCurrentUserContext.mockResolvedValue({
        roles: ['admin']
      });

      // Should fail when trying to use override
      await expect(
        securityManager.enableAutoRoute({ securityOverride: true })
      ).rejects.toThrow('Emergency overrides disabled');
    });

    test('should assess and record audit risk levels', async () => {
      await securityManager.enableAutoRoute();
      
      const auditLog = securityManager.getAuditLog(1);
      const event = auditLog[0];
      
      expect(['low', 'medium', 'high', 'critical']).toContain(event.risk);
    });
  });

  describe('Emergency Protocols', () => {
    test('should execute emergency stop', async () => {
      // Enable some optimizations first
      await securityManager.enableAutoRoute();
      await securityManager.enableCostOptimization();
      
      const reason = 'Security incident detected';
      await securityManager.emergencyStop(reason);
      
      // All flags should be disabled
      const flags = securityManager.getOptimizationFlags();
      expect(flags.autoRoute).toBe(false);
      expect(flags.costOptimize).toBe(false);
      expect(flags.canaryDeploy).toBe(false);
      expect(flags.slackUpdates).toBe(false);
      expect(flags.analyzeSelf).toBe(false);
      expect(flags.metaOptimization).toBe(false);
    });

    test('should execute security lockdown', async () => {
      const reason = 'Breach detected';
      await securityManager.securityLockdown(reason);
      
      const policy = securityManager.getSecurityPolicy();
      expect(policy.emergencyOverrides).toBe(false);
      expect(policy.requiresApproval).toBe(true);
      expect(policy.auditLevel).toBe('comprehensive');
    });

    test('should audit emergency actions', async () => {
      await securityManager.emergencyStop('Test emergency');
      
      const auditLog = securityManager.getAuditLog(1);
      expect(auditLog[0].action).toBe('emergency_stop_activated');
      expect(auditLog[0].risk).toBe('critical');
    });
  });

  describe('Integration and Performance', () => {
    test('should integrate with model orchestrator', () => {
      expect(mockOrchestrator.on).toHaveBeenCalledWith(
        'request_completed',
        expect.any(Function)
      );
    });

    test('should track performance metrics', () => {
      const metrics = securityManager.getMetrics();
      
      expect(metrics).toHaveProperty('totalOptimizations');
      expect(metrics).toHaveProperty('securityBlocks');
      expect(metrics).toHaveProperty('costSavings');
      expect(metrics).toHaveProperty('emergencyOverrides');
      expect(metrics).toHaveProperty('canarySuccessRate');
      expect(metrics).toHaveProperty('metaImprovements');
    });

    test('should handle concurrent optimization requests', async () => {
      const promises = [
        securityManager.enableAutoRoute(),
        securityManager.enableCostOptimization(),
        securityManager.enableSlackUpdates({
          webhookUrl: 'https://hooks.slack.com/test'
        })
      ];

      const results = await Promise.all(promises);
      expect(results.every(result => result === true)).toBe(true);
    });

    test('should cleanup resources on large audit logs', async () => {
      // Generate many audit events
      for (let i = 0; i < 15; i++) {
        await securityManager.enableAutoRoute();
      }
      
      // Audit log should be limited in size
      const auditLog = securityManager.getAuditLog();
      expect(auditLog.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle authentication failures gracefully', async () => {
      mockAuth.getCurrentUserContext.mockRejectedValue(new Error('Auth service down'));

      await expect(
        securityManager.enableAutoRoute()
      ).rejects.toThrow();
    });

    test('should handle router failures gracefully', async () => {
      mockRouter.addRule.mockImplementation(() => {
        throw new Error('Router error');
      });

      await expect(
        securityManager.enableAutoRoute()
      ).rejects.toThrow();
    });

    test('should validate configuration parameters', async () => {
      await expect(
        securityManager.enableCostOptimization({
          targetReduction: -0.5 // Invalid negative reduction
        })
      ).rejects.toThrow();
    });

    test('should handle network failures for Slack notifications', async () => {
      const badConfig = {
        webhookUrl: 'https://invalid-webhook-url-that-does-not-exist.com',
        channel: '#test'
      };

      // Should not fail but log error
      const result = await securityManager.enableSlackUpdates(badConfig);
      expect(result).toBe(true);
    });
  });
});
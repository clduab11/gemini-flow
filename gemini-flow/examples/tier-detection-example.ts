/**
 * Auth Tier Detection System Example
 * 
 * Demonstrates the comprehensive tier detection capabilities
 */

import { AuthenticationManager, AuthConfig } from '../src/core/auth-manager.js';
import { Logger, LogLevel } from '../src/utils/logger.js';

async function demonstrateTierDetection() {
  const logger = new Logger('TierDetectionExample', LogLevel.INFO);

  // Initialize Auth Manager with tier detection configuration
  const config: AuthConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    projectId: process.env.GOOGLE_PROJECT_ID,
    tierDetection: {
      enableVertexAI: true,
      enableWorkspaceIntegration: true,
      customEnterprisePatterns: [
        'mycompany.corp',
        'enterprise-client.com'
      ],
      ultraFeatureChecks: [
        'ai-research.com',
        'tech-giant.com'
      ]
    }
  };

  const authManager = new AuthenticationManager(config);

  // Test different email scenarios
  const testEmails = [
    'user@gmail.com',           // Expected: free
    'developer@google.com',     // Expected: enterprise
    'admin@microsoft.com',      // Expected: enterprise
    'researcher@ai-research.com', // Expected: ultra
    'pro@paid-service.com',     // Expected: pro (if subscription detected)
    'executive@walmart.com'     // Expected: enterprise (Fortune 500)
  ];

  logger.info('🔍 Starting tier detection demonstration...');

  for (const email of testEmails) {
    try {
      logger.info(`\n📧 Testing: ${email}`);
      
      // Perform tier detection
      const tierResult = await (authManager as any).detectUserTier(email);
      
      logger.info(`✅ Tier: ${tierResult.tier}`);
      logger.info(`🎯 Method: ${tierResult.method}`);
      logger.info(`📊 Confidence: ${(tierResult.confidence * 100).toFixed(1)}%`);
      logger.info(`🏷️  Features: ${tierResult.features.join(', ') || 'none'}`);
      
      // Get permissions for this tier
      const permissions = await (authManager as any).getUserPermissions(email, tierResult.tier);
      logger.info(`🔑 Permissions: ${permissions.slice(0, 3).join(', ')}${permissions.length > 3 ? '...' : ''}`);
      
      // Get quotas for this tier
      const quotas = (authManager as any).getTierQuotas(tierResult.tier);
      logger.info(`📈 Quotas: Daily ${quotas.daily === -1 ? '∞' : quotas.daily}, Concurrent ${quotas.concurrent}`);
      
    } catch (error) {
      logger.error(`❌ Error detecting tier for ${email}:`, error);
    }
  }

  // Demonstrate caching behavior
  logger.info('\n🗄️ Testing cache behavior...');
  
  const testEmail = 'cache-test@example.com';
  
  // First call - should perform detection
  const start1 = performance.now();
  const result1 = await (authManager as any).detectUserTier(testEmail);
  const time1 = performance.now() - start1;
  logger.info(`First detection took ${time1.toFixed(2)}ms`);
  
  // Second call - should use cache
  const start2 = performance.now();
  const result2 = await (authManager as any).detectUserTier(testEmail);
  const time2 = performance.now() - start2;
  logger.info(`Cached detection took ${time2.toFixed(2)}ms (${((time1 - time2) / time1 * 100).toFixed(1)}% faster)`);
  
  logger.info('✅ Cache is working correctly');

  // Demonstrate error handling
  logger.info('\n🛡️ Testing error handling...');
  
  try {
    // Force an error by passing invalid data
    const errorResult = await (authManager as any).detectUserTier(null);
    logger.info(`Error handling result: ${errorResult.tier} (${errorResult.method})`);
  } catch (error) {
    logger.error('Unexpected error in error handling test');
  }

  logger.info('\n🎉 Tier detection demonstration completed!');
}

// Run the demonstration
if (require.main === module) {
  demonstrateTierDetection().catch(console.error);
}

export { demonstrateTierDetection };
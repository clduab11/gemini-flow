/**
 * Authentication Manager
 * 
 * Handles Google authentication and user tier detection
 * Integrates with Google Cloud Identity for enterprise features
 */

import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Logger } from '../utils/logger.js';
import { CacheManager } from './cache-manager.js';
import { EventEmitter } from 'events';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise' | 'ultra';
  organization?: string;
  permissions: string[];
  quotas: {
    daily: number;
    monthly: number;
    concurrent: number;
  };
  metadata: {
    createdAt: Date;
    lastActive: Date;
    totalRequests: number;
    subscription?: any;
    tierDetection?: {
      method: string;
      confidence: number;
      detectedAt: Date;
      features: string[];
    };
  };
}

export interface AuthConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  serviceAccountPath?: string;
  projectId?: string;
  tierDetection?: {
    enableVertexAI?: boolean;
    enableWorkspaceIntegration?: boolean;
    customEnterprisePatterns?: string[];
    ultraFeatureChecks?: string[];
  };
}

export class AuthenticationManager extends EventEmitter {
  private oauth2Client?: OAuth2Client;
  private googleAuth?: GoogleAuth;
  private cache: CacheManager;
  private logger: Logger;
  private config: AuthConfig;
  
  // Default scopes for user authentication
  private readonly DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cloud-platform'
  ];

  // Enhanced scopes for tier detection
  private readonly TIER_DETECTION_SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.domain.readonly',
    'https://www.googleapis.com/auth/apps.licensing',
    'https://www.googleapis.com/auth/cloud-billing.readonly'
  ];

  constructor(config: AuthConfig = {}) {
    super();
    this.config = config;
    this.logger = new Logger('AuthManager');
    this.cache = new CacheManager();
    
    this.initializeAuth();
  }

  /**
   * Initialize authentication clients
   */
  private initializeAuth(): void {
    try {
      // OAuth2 client for user authentication
      if (this.config.clientId && this.config.clientSecret) {
        this.oauth2Client = new google.auth.OAuth2(
          this.config.clientId,
          this.config.clientSecret,
          this.config.redirectUri || 'http://localhost:3000/callback'
        );
      }

      // Service account authentication for server-to-server
      if (this.config.serviceAccountPath || this.config.projectId) {
        this.googleAuth = new GoogleAuth({
          keyFilename: this.config.serviceAccountPath,
          projectId: this.config.projectId,
          scopes: this.DEFAULT_SCOPES
        });
      }

      this.logger.info('Authentication initialized', {
        hasOAuth: !!this.oauth2Client,
        hasServiceAccount: !!this.config.serviceAccountPath,
        projectId: this.config.projectId
      });

    } catch (error) {
      this.logger.error('Authentication initialization failed', error);
      throw error;
    }
  }

  /**
   * Generate OAuth URL for user authentication
   */
  generateAuthUrl(state?: string): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not configured');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.config.scopes || this.DEFAULT_SCOPES,
      state,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async authenticateUser(code: string): Promise<UserProfile> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not configured');
    }

    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user information
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client! });
      const userInfo = await oauth2.userinfo.get();

      // Detect comprehensive user tier
      const tierResult = await this.detectUserTier(userInfo.data.email!, tokens);

      // Create user profile
      const profile: UserProfile = {
        id: userInfo.data.id!,
        email: userInfo.data.email!,
        name: userInfo.data.name!,
        tier: tierResult.tier,
        organization: await this.getOrganization(userInfo.data.email!),
        permissions: await this.getUserPermissions(userInfo.data.email!, tierResult.tier),
        quotas: this.getTierQuotas(tierResult.tier),
        metadata: {
          createdAt: new Date(),
          lastActive: new Date(),
          totalRequests: 0,
          tierDetection: {
            method: tierResult.method,
            confidence: tierResult.confidence,
            detectedAt: new Date(),
            features: tierResult.features
          }
        }
      };

      // Cache user profile
      await this.cache.set(`user:${profile.id}`, profile, 3600); // 1 hour

      this.logger.info('User authenticated', {
        userId: profile.id,
        email: profile.email,
        tier: profile.tier
      });

      this.emit('user_authenticated', profile);
      return profile;

    } catch (error) {
      this.logger.error('User authentication failed', error);
      throw error;
    }
  }

  /**
   * Comprehensive user tier detection with multiple strategies
   */
  async detectUserTier(email?: string, tokens?: any): Promise<{
    tier: 'free' | 'pro' | 'enterprise' | 'ultra';
    method: string;
    confidence: number;
    features: string[];
  }> {
    if (!email) {
      return {
        tier: 'free',
        method: 'default',
        confidence: 1.0,
        features: []
      };
    }

    try {
      // Check cache first
      const cacheKey = `tier-detection:${email}`;
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult) {
        this.logger.debug('Using cached tier detection', { email, tier: cachedResult.tier });
        return cachedResult;
      }

      // Initialize detection result
      let detectionResult = {
        tier: 'free' as 'free' | 'pro' | 'enterprise' | 'ultra',
        method: 'domain-analysis',
        confidence: 0.5,
        features: [] as string[]
      };

      const domain = email.split('@')[1];
      const detectedFeatures: string[] = [];

      // 1. Ultra Tier Detection (Highest Priority)
      const ultraResult = await this.detectUltraTier(email, domain, tokens);
      if (ultraResult.isUltra) {
        detectionResult = {
          tier: 'ultra',
          method: 'ultra-features',
          confidence: ultraResult.confidence,
          features: ultraResult.features
        };
        detectedFeatures.push(...ultraResult.features);
      }

      // 2. Enterprise Tier Detection (High Priority)
      else {
        const enterpriseResult = await this.detectEnterpriseTier(email, domain, tokens);
        if (enterpriseResult.isEnterprise) {
          detectionResult = {
            tier: 'enterprise',
            method: 'enterprise-workspace',
            confidence: enterpriseResult.confidence,
            features: enterpriseResult.features
          };
          detectedFeatures.push(...enterpriseResult.features);
        }

        // 3. Pro Tier Detection (Medium Priority)
        else {
          const proResult = await this.detectProTier(email, domain);
          if (proResult.isPro) {
            detectionResult = {
              tier: 'pro',
              method: 'subscription-check',
              confidence: proResult.confidence,
              features: proResult.features
            };
            detectedFeatures.push(...proResult.features);
          }
        }
      }

      // Cache the result for 24 hours
      await this.cache.set(cacheKey, detectionResult, 86400);

      this.logger.info('Tier detection completed', {
        email,
        tier: detectionResult.tier,
        method: detectionResult.method,
        confidence: detectionResult.confidence,
        features: detectedFeatures.length
      });

      return detectionResult;

    } catch (error) {
      this.logger.error('Tier detection failed', { email, error });
      return {
        tier: 'free',
        method: 'error-fallback',
        confidence: 1.0,
        features: ['error-occurred']
      };
    }
  }

  /**
   * Detect Ultra tier features (Google AI Advanced, Vertex AI Enterprise)
   */
  private async detectUltraTier(email: string, domain: string, tokens?: any): Promise<{
    isUltra: boolean;
    confidence: number;
    features: string[];
  }> {
    const features: string[] = [];
    let confidence = 0;

    try {
      // Check for Vertex AI Enterprise access
      if (tokens && this.config.tierDetection?.enableVertexAI !== false) {
        const hasVertexAI = await this.checkVertexAIAccess(tokens);
        if (hasVertexAI) {
          features.push('vertex-ai-enterprise');
          confidence += 0.4;
        }
      }

      // Check for Google AI Advanced subscription markers
      const hasAdvancedAI = await this.checkGoogleAIAdvanced(email);
      if (hasAdvancedAI) {
        features.push('google-ai-advanced');
        confidence += 0.3;
      }

      // Check for enterprise billing patterns
      const hasEnterpriseBilling = await this.checkEnterpriseBilling(email, domain);
      if (hasEnterpriseBilling) {
        features.push('enterprise-billing');
        confidence += 0.2;
      }

      // Check for ultra-specific domains or patterns
      const ultraDomains = this.config.tierDetection?.ultraFeatureChecks || [
        'x.company',
        'meta.com',
        'openai.com',
        'anthropic.com'
      ];
      
      if (ultraDomains.includes(domain)) {
        features.push('ultra-domain');
        confidence += 0.3;
      }

      // Check for custom integration patterns
      const hasCustomIntegrations = await this.checkCustomIntegrations(email);
      if (hasCustomIntegrations) {
        features.push('custom-integrations');
        confidence += 0.2;
      }

      return {
        isUltra: confidence >= 0.7, // Require high confidence for ultra tier
        confidence: Math.min(confidence, 1.0),
        features
      };

    } catch (error) {
      this.logger.debug('Ultra tier detection error', { email, error });
      return { isUltra: false, confidence: 0, features: [] };
    }
  }

  /**
   * Detect Enterprise tier (Google Workspace + Enterprise features)
   */
  private async detectEnterpriseTier(email: string, domain: string, tokens?: any): Promise<{
    isEnterprise: boolean;
    confidence: number;
    features: string[];
  }> {
    const features: string[] = [];
    let confidence = 0;

    try {
      // Check known enterprise domains
      const enterpriseDomains = process.env.ENTERPRISE_DOMAINS?.split(',') || [
        'google.com',
        'alphabet.com',
        'deepmind.com',
        'microsoft.com',
        'amazon.com',
        'apple.com'
      ];

      // Add custom enterprise patterns
      const customPatterns = this.config.tierDetection?.customEnterprisePatterns || [];
      const allPatterns = [...enterpriseDomains, ...customPatterns];

      if (allPatterns.includes(domain)) {
        features.push('enterprise-domain');
        confidence += 0.6;
      }

      // Check Google Workspace status
      if (tokens && this.config.tierDetection?.enableWorkspaceIntegration !== false) {
        const workspaceResult = await this.checkGoogleWorkspace(email, tokens);
        if (workspaceResult.isWorkspace) {
          features.push('google-workspace');
          confidence += 0.4;
          
          if (workspaceResult.isEnterprise) {
            features.push('workspace-enterprise');
            confidence += 0.3;
          }
        }
      }

      // Check domain-based patterns
      const domainAnalysis = this.analyzeDomainPatterns(domain);
      if (domainAnalysis.isEnterprise) {
        features.push(...domainAnalysis.indicators);
        confidence += domainAnalysis.score;
      }

      // Check for enterprise OAuth scopes
      const hasEnterpriseScopes = await this.checkEnterpriseScopes(tokens);
      if (hasEnterpriseScopes) {
        features.push('enterprise-scopes');
        confidence += 0.2;
      }

      return {
        isEnterprise: confidence >= 0.5, // Moderate confidence threshold
        confidence: Math.min(confidence, 1.0),
        features
      };

    } catch (error) {
      this.logger.debug('Enterprise tier detection error', { email, error });
      return { isEnterprise: false, confidence: 0, features: [] };
    }
  }

  /**
   * Detect Pro tier (Paid subscription)
   */
  private async detectProTier(email: string, domain: string): Promise<{
    isPro: boolean;
    confidence: number;
    features: string[];
  }> {
    const features: string[] = [];
    let confidence = 0;

    try {
      // Check billing/subscription systems
      const hasProSubscription = await this.checkProSubscription(email);
      if (hasProSubscription) {
        features.push('pro-subscription');
        confidence += 0.8;
      }

      // Check payment method presence
      const hasPaymentMethod = await this.checkPaymentMethod(email);
      if (hasPaymentMethod) {
        features.push('payment-method');
        confidence += 0.3;
      }

      // Check usage patterns that suggest paid tier
      const usagePatterns = await this.analyzeUsagePatterns(email);
      if (usagePatterns.suggestsPro) {
        features.push('pro-usage-patterns');
        confidence += 0.2;
      }

      return {
        isPro: confidence >= 0.5,
        confidence: Math.min(confidence, 1.0),
        features
      };

    } catch (error) {
      this.logger.debug('Pro tier detection error', { email, error });
      return { isPro: false, confidence: 0, features: [] };
    }
  }

  /**
   * Check Vertex AI Enterprise access
   */
  private async checkVertexAIAccess(tokens: any): Promise<boolean> {
    try {
      // Set up temporary OAuth client with tokens
      const tempClient = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret
      );
      tempClient.setCredentials(tokens);

      // Try to access Vertex AI APIs
      const cloudResourceManager = google.cloudresourcemanager({ version: 'v1', auth: tempClient });
      const projects = await cloudResourceManager.projects.list();
      
      // Check if any projects have Vertex AI enabled
      if (projects.data.projects && projects.data.projects.length > 0) {
        for (const project of projects.data.projects) {
          try {
            const serviceUsage = google.serviceusage({ version: 'v1', auth: tempClient });
            const services = await serviceUsage.services.list({
              parent: `projects/${project.projectId}`,
              filter: 'state:ENABLED'
            });
            
            const hasVertexAI = services.data.services?.some(
              service => service.name?.includes('aiplatform.googleapis.com')
            );
            
            if (hasVertexAI) {
              return true;
            }
          } catch (error) {
            // Continue checking other projects
            continue;
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.debug('Vertex AI access check failed', error);
      return false;
    }
  }

  /**
   * Check Google AI Advanced subscription
   */
  private async checkGoogleAIAdvanced(email: string): Promise<boolean> {
    try {
      // This would integrate with Google AI subscription API
      // For now, return false as placeholder
      // TODO: Implement actual Google AI Advanced API integration
      return false;
    } catch (error) {
      this.logger.debug('Google AI Advanced check failed', { email, error });
      return false;
    }
  }

  /**
   * Check enterprise billing patterns
   */
  private async checkEnterpriseBilling(email: string, domain: string): Promise<boolean> {
    try {
      // Check for enterprise billing indicators
      // This would integrate with Google Cloud Billing API
      // TODO: Implement actual billing API integration
      return false;
    } catch (error) {
      this.logger.debug('Enterprise billing check failed', { email, error });
      return false;
    }
  }

  /**
   * Check for custom integrations
   */
  private async checkCustomIntegrations(email: string): Promise<boolean> {
    try {
      // Check for signs of custom API integrations
      // This could check API key usage, custom endpoints, etc.
      // TODO: Implement custom integration detection
      return false;
    } catch (error) {
      this.logger.debug('Custom integrations check failed', { email, error });
      return false;
    }
  }

  /**
   * Check Google Workspace status
   */
  private async checkGoogleWorkspace(email: string, tokens: any): Promise<{
    isWorkspace: boolean;
    isEnterprise: boolean;
  }> {
    try {
      // Set up temporary OAuth client with tokens
      const tempClient = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret
      );
      tempClient.setCredentials(tokens);

      // Try to access Admin Directory API
      const admin = google.admin({ version: 'directory_v1', auth: tempClient });
      const domain = email.split('@')[1];
      
      try {
        // This would require admin privileges to work fully
        const domainInfo = await admin.domains.get({ domain });
        
        if (domainInfo.data) {
          // Check for enterprise features
          const isEnterprise = domainInfo.data.verified && 
                              domainInfo.data.domainName === domain;
          
          return {
            isWorkspace: true,
            isEnterprise
          };
        }
      } catch (adminError) {
        // If admin API fails, try alternate detection methods
        // Check OAuth scopes to infer workspace status
        if (tokens.scope && tokens.scope.includes('admin.directory')) {
          return { isWorkspace: true, isEnterprise: false };
        }
      }

      return { isWorkspace: false, isEnterprise: false };

    } catch (error) {
      this.logger.debug('Google Workspace check failed', { email, error });
      return { isWorkspace: false, isEnterprise: false };
    }
  }

  /**
   * Analyze domain patterns for enterprise indicators
   */
  private analyzeDomainPatterns(domain: string): {
    isEnterprise: boolean;
    score: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let score = 0;

    // Common enterprise domain patterns
    const enterprisePatterns = [
      /\.corp$/i,
      /\.company$/i,
      /\.enterprise$/i,
      /\.inc$/i,
      /\.llc$/i,
      /\.ltd$/i
    ];

    for (const pattern of enterprisePatterns) {
      if (pattern.test(domain)) {
        indicators.push('enterprise-tld');
        score += 0.2;
        break;
      }
    }

    // Check for fortune 500 patterns or known enterprise domains
    const knownEnterprises = [
      'walmart.com', 'amazon.com', 'apple.com', 'berkshirehathaway.com',
      'unitedhealth.com', 'mckesson.com', 'cvshealth.com', 'alphabet.com'
    ];

    if (knownEnterprises.includes(domain.toLowerCase())) {
      indicators.push('fortune-500');
      score += 0.4;
    }

    // Check domain length and complexity (enterprise domains often longer)
    if (domain.length > 15 && domain.includes('-')) {
      indicators.push('complex-domain');
      score += 0.1;
    }

    return {
      isEnterprise: score >= 0.2,
      score,
      indicators
    };
  }

  /**
   * Check for enterprise OAuth scopes
   */
  private async checkEnterpriseScopes(tokens: any): Promise<boolean> {
    if (!tokens || !tokens.scope) {
      return false;
    }

    const enterpriseScopes = [
      'admin.directory',
      'admin.reports',
      'apps.licensing',
      'cloud-billing',
      'cloud-platform'
    ];

    const hasEnterpriseScope = enterpriseScopes.some(
      scope => tokens.scope.includes(scope)
    );

    return hasEnterpriseScope;
  }

  /**
   * Check for payment method (enhanced from existing stub)
   */
  private async checkPaymentMethod(email: string): Promise<boolean> {
    try {
      // This would integrate with payment processors (Stripe, etc.)
      // Check if user has valid payment method on file
      // TODO: Implement actual payment method verification
      return false;
    } catch (error) {
      this.logger.debug('Payment method check failed', { email, error });
      return false;
    }
  }

  /**
   * Analyze usage patterns to suggest tier
   */
  private async analyzeUsagePatterns(email: string): Promise<{
    suggestsPro: boolean;
    indicators: string[];
  }> {
    try {
      const indicators: string[] = [];
      
      // Check historical usage from cache
      const usageHistory = await this.cache.get(`usage:${email}`);
      if (usageHistory) {
        const { daily, requests, features } = usageHistory;
        
        // High daily usage suggests pro tier
        if (daily > 500) {
          indicators.push('high-daily-usage');
        }
        
        // Regular API usage
        if (requests > 50) {
          indicators.push('frequent-api-usage');
        }
        
        // Advanced feature usage
        if (features && features.includes('batch_processing')) {
          indicators.push('advanced-features');
        }
      }

      return {
        suggestsPro: indicators.length >= 2,
        indicators
      };

    } catch (error) {
      this.logger.debug('Usage pattern analysis failed', { email, error });
      return { suggestsPro: false, indicators: [] };
    }
  }

  /**
   * Get organization information from email domain
   */
  private async getOrganization(email: string): Promise<string | undefined> {
    try {
      const domain = email.split('@')[1];
      
      // For now, return domain as organization
      // TODO: Implement proper Google Workspace organization lookup
      return domain;
    } catch (error) {
      this.logger.debug('Organization lookup failed', { email, error });
      return undefined;
    }
  }

  /**
   * Get user permissions based on email and tier
   */
  private async getUserPermissions(email: string, tier: 'free' | 'pro' | 'enterprise' | 'ultra'): Promise<string[]> {
    const basePermissions = ['read', 'basic_ai'];
    
    switch (tier) {
      case 'free':
        return basePermissions;
        
      case 'pro':
        return [...basePermissions, 'advanced_ai', 'batch_processing', 'priority_support'];
        
      case 'enterprise':
        return [
          ...basePermissions,
          'advanced_ai',
          'batch_processing',
          'priority_support',
          'custom_models',
          'enterprise_security',
          'audit_logs',
          'admin_access'
        ];

      case 'ultra':
        return [
          ...basePermissions,
          'advanced_ai',
          'batch_processing',
          'priority_support',
          'custom_models',
          'enterprise_security',
          'audit_logs',
          'admin_access',
          'vertex_ai_access',
          'unlimited_requests',
          'custom_integrations',
          'dedicated_support',
          'early_access_features'
        ];
        
      default:
        return basePermissions;
    }
  }

  /**
   * Get quota limits for user tier
   */
  private getTierQuotas(tier: 'free' | 'pro' | 'enterprise' | 'ultra') {
    const quotas = {
      free: { daily: 100, monthly: 1000, concurrent: 2 },
      pro: { daily: 1000, monthly: 20000, concurrent: 10 },
      enterprise: { daily: 10000, monthly: 500000, concurrent: 50 },
      ultra: { daily: -1, monthly: -1, concurrent: 200 } // -1 means unlimited
    };

    return quotas[tier];
  }

  /**
   * Check for pro subscription (placeholder for billing integration)
   */
  private async checkProSubscription(_email: string): Promise<boolean> {
    // TODO: Integrate with billing system (Stripe, Google Cloud Billing, etc.)
    // For now, return false
    return false;
  }

  /**
   * Validate and refresh user session
   */
  async validateSession(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cachedProfile = await this.cache.get(`user:${userId}`);
      if (cachedProfile) {
        // Update last active
        cachedProfile.metadata.lastActive = new Date();
        await this.cache.set(`user:${userId}`, cachedProfile, 3600);
        return cachedProfile as UserProfile;
      }

      // Session expired
      this.logger.info('Session expired', { userId });
      this.emit('session_expired', userId);
      return null;

    } catch (error) {
      this.logger.error('Session validation failed', { userId, error });
      return null;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const profile = await this.validateSession(userId);
    if (!profile) {
      return false;
    }

    return profile.permissions.includes(permission);
  }

  /**
   * Check quota usage
   */
  async checkQuota(userId: string, requestCount: number = 1): Promise<boolean> {
    const profile = await this.validateSession(userId);
    if (!profile) {
      return false;
    }

    // Simple daily quota check (would be more sophisticated in production)
    const today = new Date().toISOString().split('T')[0];
    const dailyUsage = await this.cache.get(`quota:${userId}:${today}`) || 0;

    if (dailyUsage + requestCount > profile.quotas.daily) {
      this.logger.warn('Quota exceeded', {
        userId,
        dailyUsage,
        requestCount,
        limit: profile.quotas.daily
      });
      
      this.emit('quota_exceeded', { userId, usage: dailyUsage, limit: profile.quotas.daily });
      return false;
    }

    // Update usage
    await this.cache.set(`quota:${userId}:${today}`, dailyUsage + requestCount, 86400);
    return true;
  }

  /**
   * Service account authentication for internal operations
   */
  async getServiceAccountAuth(): Promise<any> {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Auth not initialized');
      }
      return await this.googleAuth.getClient();
    } catch (error) {
      this.logger.error('Service account authentication failed', error);
      throw error;
    }
  }

  /**
   * Revoke user tokens
   */
  async revokeUser(userId: string): Promise<void> {
    try {
      // Remove from cache
      await this.cache.delete(`user:${userId}`);
      
      // Revoke OAuth tokens if available
      if (this.oauth2Client) {
        try {
          await this.oauth2Client.revokeCredentials();
        } catch (error) {
          this.logger.debug('Token revocation failed', error);
        }
      }

      this.logger.info('User session revoked', { userId });
      this.emit('user_revoked', userId);

    } catch (error) {
      this.logger.error('User revocation failed', { userId, error });
      throw error;
    }
  }

  /**
   * Get authentication metrics
   */
  getMetrics() {
    return {
      configuredClients: {
        oauth2: !!this.oauth2Client,
        serviceAccount: !!this.config.serviceAccountPath
      },
      scopes: this.config.scopes || this.DEFAULT_SCOPES
    };
  }
}
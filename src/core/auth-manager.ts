/**
 * Authentication Manager
 * 
 * Handles Google authentication and user tier detection
 * Integrates with Google Cloud Identity for enterprise features
 */

import { Logger } from '../utils/logger.js';
import { CacheManager } from './cache-manager.js';
import { EventEmitter } from 'events';
import { safeImport, getFeatureCapabilities } from '../utils/feature-detection.js';
import { OAuth2Tokens, RefreshTokenResult, ValidationResult } from '../types/auth.js';

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
  private oauth2Client?: any; // OAuth2Client when available
  private googleAuth?: any; // GoogleAuth when available
  private cache: CacheManager;
  private logger: Logger;
  private config: AuthConfig;
  private userTokens: Map<string, OAuth2Tokens> = new Map(); // User token storage
  private tokenRefreshTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // Auto-refresh timers
  private readonly TOKEN_REFRESH_BUFFER = 300000; // 5 minutes before expiry
  
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
    
    // Initialize auth asynchronously
    this.initializeAuth().catch(error => {
      this.logger.error('Failed to initialize authentication', error);
    });
  }

  /**
   * Initialize authentication clients
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Check if Google services are available
      const capabilities = await getFeatureCapabilities();
      
      if (!capabilities.hasGoogleServices) {
        this.logger.warn('Google authentication services not available. Some features may be limited.');
        return;
      }

      const [googleApis, googleAuth] = await Promise.all([
        safeImport('googleapis'),
        safeImport('google-auth-library')
      ]);

      // OAuth2 client for user authentication
      if (this.config.clientId && this.config.clientSecret && googleApis?.google?.auth?.OAuth2) {
        this.oauth2Client = new googleApis.google.auth.OAuth2(
          this.config.clientId,
          this.config.clientSecret,
          this.config.redirectUri || 'http://localhost:3000/callback'
        );
      }
      
      // Service account authentication for server-to-server
      if ((this.config.serviceAccountPath || this.config.projectId) && googleAuth?.GoogleAuth) {
        this.googleAuth = new googleAuth.GoogleAuth({
          keyFilename: this.config.serviceAccountPath,
          projectId: this.config.projectId,
          scopes: this.DEFAULT_SCOPES
        });
      }
      
      this.logger.info('Authentication initialized', {
        hasOAuth: !!this.oauth2Client,
        hasServiceAccount: !!this.config.serviceAccountPath,
        projectId: this.config.projectId,
        googleServicesAvailable: capabilities.hasGoogleServices
      });

    } catch (error) {
      this.logger.error('Authentication initialization failed', error);
      // Don't throw in constructor context, just log the error
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

      // Store tokens for refresh functionality
      const oauth2Tokens: OAuth2Tokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        expiresAt: tokens.expiry_date || (Date.now() + 3600000),
        scope: tokens.scope ? tokens.scope.split(' ') : this.config.scopes || this.DEFAULT_SCOPES,
        idToken: tokens.id_token
      };

      // Get user information
      const googleApis = await safeImport('googleapis');
      if (!googleApis?.google?.oauth2) {
        throw new Error('Google APIs not available for user info retrieval');
      }
      
      const oauth2 = googleApis.google.oauth2({ 
        version: 'v2', 
        auth: this.oauth2Client! 
      });
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

      // Store tokens and schedule auto-refresh
      this.userTokens.set(profile.id, oauth2Tokens);
      this.scheduleTokenRefresh(profile.id, oauth2Tokens);

      // Cache user profile
      await this.cache.set(`user:${profile.id}`, profile, 3600); // 1 hour

      this.logger.info('User authenticated', {
        userId: profile.id,
        email: profile.email,
        tier: profile.tier,
        tokenExpiry: new Date(oauth2Tokens.expiresAt),
        hasRefreshToken: !!oauth2Tokens.refreshToken
      });

      this.emit('user_authenticated', profile);
      return profile;

    } catch (error) {
      this.logger.error('User authentication failed', error);
      throw error;
    }
  }

  /**
   * Refresh OAuth2 tokens for a user
   */
  async refreshToken(userId: string): Promise<RefreshTokenResult> {
    try {
      if (!this.oauth2Client) {
        return {
          success: false,
          requiresReauth: true,
          error: {
            name: 'ConfigurationError',
            message: 'OAuth2 client not configured',
            code: 'OAUTH2_CLIENT_NOT_CONFIGURED',
            type: 'configuration',
            retryable: false
          } as any
        };
      }

      const storedTokens = this.userTokens.get(userId);
      if (!storedTokens || !storedTokens.refreshToken) {
        this.logger.warn('No refresh token available for user', { userId });
        return {
          success: false,
          requiresReauth: true,
          error: {
            name: 'AuthenticationError',
            message: 'No refresh token available',
            code: 'NO_REFRESH_TOKEN',
            type: 'authentication',
            retryable: false
          } as any
        };
      }

      this.logger.info('Refreshing tokens for user', { userId });

      // Set the refresh token on the OAuth client
      this.oauth2Client.setCredentials({
        refresh_token: storedTokens.refreshToken
      });

      try {
        // Refresh the token
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Update stored tokens
        const updatedTokens: OAuth2Tokens = {
          ...storedTokens,
          accessToken: credentials.access_token!,
          refreshToken: credentials.refresh_token || storedTokens.refreshToken,
          expiresAt: credentials.expiry_date!,
          expiresIn: Math.floor((credentials.expiry_date! - Date.now()) / 1000),
          scope: credentials.scope ? credentials.scope.split(' ') : storedTokens.scope
        };

        // Update stored tokens and reschedule refresh
        this.userTokens.set(userId, updatedTokens);
        this.scheduleTokenRefresh(userId, updatedTokens);

        // Update OAuth client credentials
        this.oauth2Client.setCredentials(credentials);

        this.logger.info('Token refresh successful', {
          userId,
          newExpiry: new Date(updatedTokens.expiresAt),
          hasNewRefreshToken: credentials.refresh_token !== storedTokens.refreshToken
        });

        this.emit('token_refreshed', { userId, tokens: updatedTokens });

        return {
          success: true,
          credentials: {
            type: 'oauth2',
            provider: 'google',
            accessToken: updatedTokens.accessToken,
            refreshToken: updatedTokens.refreshToken,
            expiresAt: updatedTokens.expiresAt,
            scope: updatedTokens.scope,
            issuedAt: Date.now(),
            metadata: {
              tokenType: updatedTokens.tokenType,
              refreshedAt: Date.now()
            }
          }
        };

      } catch (refreshError: any) {
        this.logger.error('Token refresh failed', { userId, error: refreshError });

        // Check if refresh token is invalid (requires re-authentication)
        const requiresReauth = this.isRefreshTokenInvalid(refreshError);
        
        if (requiresReauth) {
          // Clean up stored tokens
          this.userTokens.delete(userId);
          this.clearTokenRefreshTimer(userId);
        }

        return {
          success: false,
          requiresReauth,
          error: {
            name: refreshError.name || 'TokenRefreshError',
            message: refreshError.message || 'Failed to refresh token',
            code: 'TOKEN_REFRESH_FAILED',
            type: 'authentication',
            retryable: !requiresReauth,
            originalError: refreshError
          } as any
        };
      }

    } catch (error: any) {
      this.logger.error('Token refresh process failed', { userId, error });
      return {
        success: false,
        requiresReauth: false,
        error: {
          name: error.name || 'TokenRefreshError',
          message: error.message || 'Token refresh process failed',
          code: 'TOKEN_REFRESH_PROCESS_FAILED',
          type: 'authentication',
          retryable: true,
          originalError: error
        } as any
      };
    }
  }

  /**
   * Validate OAuth2 tokens for a user
   */
  async validateTokens(userId: string): Promise<ValidationResult> {
    try {
      const storedTokens = this.userTokens.get(userId);
      if (!storedTokens) {
        return {
          valid: false,
          error: 'No tokens found for user'
        };
      }

      const now = Date.now();
      const timeUntilExpiry = storedTokens.expiresAt - now;
      const expiresIn = Math.floor(timeUntilExpiry / 1000);

      // Check if token is expired
      if (timeUntilExpiry <= 0) {
        this.logger.debug('Token expired', { userId, expiredAt: new Date(storedTokens.expiresAt) });
        return {
          valid: false,
          expired: true,
          error: 'Access token has expired'
        };
      }

      // Check if token is about to expire (within refresh buffer)
      const needsRefresh = timeUntilExpiry <= this.TOKEN_REFRESH_BUFFER;
      if (needsRefresh && storedTokens.refreshToken) {
        this.logger.debug('Token needs refresh soon', { userId, expiresIn });
      }

      return {
        valid: true,
        expired: false,
        expiresIn,
        scopes: storedTokens.scope
      };

    } catch (error: any) {
      this.logger.error('Token validation failed', { userId, error });
      return {
        valid: false,
        error: error.message || 'Token validation failed'
      };
    }
  }

  /**
   * Schedule automatic token refresh before expiration
   */
  private scheduleTokenRefresh(userId: string, tokens: OAuth2Tokens): void {
    // Clear any existing timer
    this.clearTokenRefreshTimer(userId);

    if (!tokens.refreshToken) {
      this.logger.debug('No refresh token available, skipping auto-refresh scheduling', { userId });
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = tokens.expiresAt - now;
    const refreshTime = timeUntilExpiry - this.TOKEN_REFRESH_BUFFER;

    // Only schedule if there's enough time before expiry
    if (refreshTime <= 0) {
      this.logger.warn('Token expires too soon to schedule refresh', { 
        userId, 
        expiresAt: new Date(tokens.expiresAt),
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000)
      });
      return;
    }

    const timer = setTimeout(async () => {
      this.logger.debug('Auto-refreshing token for user', { userId });
      try {
        const result = await this.refreshToken(userId);
        if (!result.success) {
          this.logger.warn('Auto token refresh failed', { userId, error: result.error });
          this.emit('token_refresh_failed', { userId, error: result.error });
        }
      } catch (error) {
        this.logger.error('Auto token refresh error', { userId, error });
        this.emit('token_refresh_failed', { userId, error });
      }
    }, refreshTime);

    this.tokenRefreshTimers.set(userId, timer);
    
    this.logger.debug('Scheduled token refresh', {
      userId,
      refreshIn: Math.floor(refreshTime / 1000),
      expiresAt: new Date(tokens.expiresAt)
    });
  }

  /**
   * Clear token refresh timer for a user
   */
  private clearTokenRefreshTimer(userId: string): void {
    const timer = this.tokenRefreshTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.tokenRefreshTimers.delete(userId);
      this.logger.debug('Cleared token refresh timer', { userId });
    }
  }

  /**
   * Check if refresh token error indicates need for re-authentication
   */
  private isRefreshTokenInvalid(error: any): boolean {
    if (!error) return false;

    const errorMessage = (error.message || '').toLowerCase();
    const invalidTokenIndicators = [
      'invalid_grant',
      'invalid_request',
      'unauthorized_client',
      'refresh token is invalid',
      'refresh token has expired',
      'token has been expired or revoked'
    ];

    return invalidTokenIndicators.some(indicator => 
      errorMessage.includes(indicator)
    );
  }

  /**
   * Get stored tokens for a user
   */
  getUserTokens(userId: string): OAuth2Tokens | undefined {
    return this.userTokens.get(userId);
  }

  /**
   * Check if user needs token refresh
   */
  async needsTokenRefresh(userId: string): Promise<boolean> {
    const validation = await this.validateTokens(userId);
    if (!validation.valid) return true;
    
    // Check if expiring within buffer time
    return (validation.expiresIn || 0) <= (this.TOKEN_REFRESH_BUFFER / 1000);
  }

  /**
   * Force refresh token for a user (even if not expired)
   */
  async forceRefreshToken(userId: string): Promise<RefreshTokenResult> {
    this.logger.info('Force refreshing token', { userId });
    return this.refreshToken(userId);
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
  private async detectProTier(email: string, _domain: string): Promise<{
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
      const googleApis = await safeImport('googleapis');
      if (!googleApis?.google) {
        return false; // Can't check without Google APIs
      }

      // Set up temporary OAuth client with tokens
      const tempClient = new googleApis.google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret
      );
      tempClient.setCredentials(tokens);

      // Try to access Vertex AI APIs
      const cloudResourceManager = googleApis.google.cloudresourcemanager({ version: 'v1', auth: tempClient });
      const projects = await cloudResourceManager.projects.list();
      
      // Check if any projects have Vertex AI enabled
      if (projects.data.projects && projects.data.projects.length > 0) {
        for (const project of projects.data.projects) {
          try {
            const serviceUsage = googleApis.google.serviceusage({ version: 'v1', auth: tempClient });
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
  private async checkEnterpriseBilling(email: string, _domain: string): Promise<boolean> {
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
      const googleApis = await safeImport('googleapis');
      if (!googleApis?.google) {
        return { isWorkspace: false, isEnterprise: false }; // Can't check without Google APIs
      }

      // Set up temporary OAuth client with tokens
      const tempClient = new googleApis.google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret
      );
      tempClient.setCredentials(tokens);

      // Try to access Admin Directory API
      const admin = googleApis.google.admin({ version: 'directory_v1', auth: tempClient });
      const domain = email.split('@')[1];
      
      try {
        // This would require admin privileges to work fully
        // Fix domains.get API parameter - use customer instead of domain
        const domainInfo = await admin.domains.get({ 
          customer: 'my_customer',
          domainName: domain 
        } as any);
        
        if (domainInfo.data) {
          // Check for enterprise features
          const isEnterprise = (domainInfo.data as any).verified && 
                              (domainInfo.data as any).domainName === domain;
          
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
      if (!cachedProfile) {
        this.logger.info('Session expired - no cached profile', { userId });
        this.emit('session_expired', userId);
        return null;
      }

      // Validate tokens if available
      const tokenValidation = await this.validateTokens(userId);
      if (!tokenValidation.valid) {
        // Try to refresh if token is expired but we have a refresh token
        if (tokenValidation.expired) {
          const storedTokens = this.userTokens.get(userId);
          if (storedTokens?.refreshToken) {
            this.logger.debug('Attempting token refresh for expired session', { userId });
            const refreshResult = await this.refreshToken(userId);
            
            if (refreshResult.success) {
              this.logger.info('Session restored via token refresh', { userId });
            } else if (refreshResult.requiresReauth) {
              this.logger.warn('Session requires re-authentication', { userId });
              // Clean up session
              await this.cache.delete(`user:${userId}`);
              this.emit('session_expired', userId);
              return null;
            }
          } else {
            this.logger.warn('Session expired and no refresh token available', { userId });
            await this.cache.delete(`user:${userId}`);
            this.emit('session_expired', userId);
            return null;
          }
        }
      }

      // Update last active
      cachedProfile.metadata.lastActive = new Date();
      await this.cache.set(`user:${userId}`, cachedProfile, 3600);
      return cachedProfile as UserProfile;

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
      
      // Clean up stored tokens and timers
      const storedTokens = this.userTokens.get(userId);
      if (storedTokens) {
        this.userTokens.delete(userId);
        this.clearTokenRefreshTimer(userId);
        
        // Revoke OAuth tokens at provider if available
        if (this.oauth2Client && storedTokens.accessToken) {
          try {
            this.oauth2Client.setCredentials({
              access_token: storedTokens.accessToken,
              refresh_token: storedTokens.refreshToken
            });
            await this.oauth2Client.revokeCredentials();
            this.logger.debug('OAuth tokens revoked at provider', { userId });
          } catch (error) {
            this.logger.debug('Token revocation at provider failed', { userId, error });
          }
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
   * Get current user context for security operations
   */
  async getCurrentUserContext(): Promise<{ userId: string; tier: string; permissions: string[] } | null> {
    try {
      // This would typically get from current session/token
      // For now, return null - should be implemented based on session management
      return null;
    } catch (error) {
      this.logger.error('Get current user context failed', error);
      return null;
    }
  }

  /**
   * Get current user ID from active session
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      // This would typically extract from JWT token or session
      // For now, return null - should be implemented based on session management
      return null;
    } catch (error) {
      this.logger.error('Get current user ID failed', error);
      return null;
    }
  }

  /**
   * Determine user tier (alias for detectUserTier for backwards compatibility)
   */
  async determineUserTier(email?: string, tokens?: any): Promise<{
    tier: 'free' | 'pro' | 'enterprise' | 'ultra';
    method: string;
    confidence: number;
    features: string[];
  }> {
    return this.detectUserTier(email, tokens);
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
      scopes: this.config.scopes || this.DEFAULT_SCOPES,
      tokenManagement: {
        activeUsers: this.userTokens.size,
        scheduledRefreshes: this.tokenRefreshTimers.size,
        refreshBufferMs: this.TOKEN_REFRESH_BUFFER
      }
    };
  }
}
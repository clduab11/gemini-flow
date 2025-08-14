/**
 * Authentication Types and Interfaces
 *
 * Comprehensive type definitions for OAuth2, Vertex AI, and unified authentication system
 */

import { EventEmitter } from "events";

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint?: string;
  userinfoEndpoint?: string;
  pkceEnabled: boolean;
  state?: string;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
  scope: string[];
  idToken?: string;
}

export interface OAuth2AuthorizationRequest {
  responseType: "code";
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  prompt?: "none" | "consent" | "select_account";
  accessType?: "online" | "offline";
}

export interface OAuth2TokenRequest {
  grantType: "authorization_code" | "refresh_token" | "client_credentials";
  code?: string;
  redirectUri?: string;
  clientId: string;
  clientSecret?: string;
  codeVerifier?: string;
  refreshToken?: string;
  scope?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface OAuth2ErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

export interface PKCECodePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export interface VertexAIConfig {
  projectId: string;
  location: string;
  serviceAccountKeyPath?: string;
  serviceAccountKey?: any;
  applicationDefaultCredentials?: boolean;
  scopes: string[];
  quotaProjectId?: string;
  keyFile?: string;
  credentials?: any;
}

export interface VertexAICredentials {
  type: "service_account" | "user" | "external_account";
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

export interface GoogleAuthTokens {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
}

export interface AuthProvider {
  name: string;
  type: "oauth2" | "service_account" | "api_key" | "jwt";
  authenticate(): Promise<AuthenticationResult>;
  refresh(credentials: AuthCredentials): Promise<RefreshTokenResult>;
  validate(credentials: AuthCredentials): Promise<ValidationResult>;
  revoke(credentials: AuthCredentials): Promise<void>;
}

export interface AuthCredentials {
  type: "oauth2" | "service_account" | "api_key" | "jwt";
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  serviceAccountKey?: any;
  jwtToken?: string;
  expiresAt?: number;
  scope?: string[];
  metadata?: Record<string, any>;
  issuedAt: number;
  provider: string;
}

export interface CredentialStorage extends EventEmitter {
  store(key: string, credentials: AuthCredentials): Promise<void>;
  retrieve(key: string): Promise<AuthCredentials | null>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface TokenCache extends EventEmitter {
  get(key: string): Promise<AuthCredentials | null>;
  set(key: string, credentials: AuthCredentials, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
  getMetrics?(): { hitRate: number };
  destroy?(): void;
}

export interface StorageConfig {
  type: "memory" | "file" | "encrypted-file" | "database" | "redis";
  basePath?: string;
  encryptionKey?: string;
  maxEntries?: number;
  ttl?: number;
  compressionEnabled?: boolean;
  encryption?: {
    enabled: boolean;
    algorithm?: string;
    keyDerivation?: string;
  };
  options?: Record<string, any>;
}

export interface AuthContext {
  userId?: string;
  sessionId: string;
  credentials: AuthCredentials;
  scopes: string[];
  permissions: string[];
  metadata: Record<string, any>;
  createdAt: number;
  expiresAt?: number;
  refreshable: boolean;
}

export interface SecurityContext {
  authContext: AuthContext;
  requestId: string;
  sourceIp?: string;
  userAgent?: string;
  timestamp: number;
  riskScore?: number;
  trustedDevice?: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  credentials?: AuthCredentials;
  error?: AuthError;
  context?: AuthContext;
  redirectUrl?: string;
  requiresMfa?: boolean;
}

export interface AuthError extends Error {
  code: string;
  type:
    | "authentication"
    | "authorization"
    | "validation"
    | "network"
    | "configuration";
  retryable: boolean;
  statusCode?: number;
  originalError?: Error;
  context?: Record<string, any>;
}

export interface RefreshTokenResult {
  success: boolean;
  credentials?: AuthCredentials;
  error?: AuthError;
  requiresReauth?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  expired?: boolean;
  error?: string;
  expiresIn?: number;
  scopes?: string[];
}

export interface AuthMetrics {
  totalAuthentications: number;
  successfulAuthentications: number;
  failedAuthentications: number;
  tokenRefreshes: number;
  tokenValidations: number;
  averageAuthTime: number;
  errorsByType: Record<string, number>;
  activeContexts: number;
  cacheHitRate: number;
}

export interface UnifiedAuthConfig {
  providers: {
    oauth2?: OAuth2Config;
    vertexAI?: VertexAIConfig;
    googleAI?: {
      apiKey: string;
      projectId?: string;
    };
  };
  storage: {
    type: "memory" | "file" | "encrypted-file" | "redis" | "database";
    encryption?: {
      enabled: boolean;
      algorithm?: string;
      keyDerivation?: string;
    };
    options?: Record<string, any>;
  };
  cache: {
    type: "memory" | "redis" | "file";
    ttl: number;
    maxSize?: number;
    options?: Record<string, any>;
  };
  security: {
    encryptCredentials?: boolean;
    encryptionKey?: string;
    hashSensitiveData?: boolean;
    requireHttps?: boolean;
    requireSecureTransport?: boolean;
    maxSessionAge: number;
    tokenRefreshBuffer: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    logCredentials?: boolean;
    logTokens?: boolean;
    enableMetrics?: boolean;
  };
}

// A2A Protocol Integration Types
export interface A2AAuthMessage {
  jsonrpc: "2.0";
  method:
    | "auth.authenticate"
    | "auth.refresh"
    | "auth.validate"
    | "auth.revoke";
  params: {
    provider: string;
    credentials?: any;
    context?: Record<string, any>;
  };
  id: string | number;
  from: string;
  to: string;
  timestamp: number;
  messageType: "request";
  signature?: string;
}

export interface A2AAuthResponse {
  jsonrpc: "2.0";
  result?: {
    success: boolean;
    credentials?: AuthCredentials;
    context?: AuthContext;
    error?: string;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
  from: string;
  to: string;
  timestamp: number;
  messageType: "response";
}

export interface A2ASecurityContext {
  agentId: string;
  authLevel: "none" | "basic" | "elevated" | "admin";
  permissions: string[];
  trustedPeers: string[];
  encryptionEnabled: boolean;
  signatureRequired: boolean;
  tokenValidated: boolean;
  contextCreatedAt: number;
  contextExpiresAt?: number;
}

// MCP Protocol Integration Types
export interface MCPAuthCapability {
  method: string;
  description: string;
  parameters?: Record<string, any>;
  required: boolean;
  version: string;
}

export interface MCPAuthProvider {
  name: string;
  version: string;
  capabilities: MCPAuthCapability[];
  authenticate(params: any): Promise<AuthenticationResult>;
  refresh(params: any): Promise<RefreshTokenResult>;
  validate(params: any): Promise<ValidationResult>;
}

// Event Types
export interface AuthEvent {
  type: "authentication" | "refresh" | "validation" | "revocation" | "error";
  timestamp: number;
  provider: string;
  userId?: string;
  sessionId?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AuthEventHandler {
  (event: AuthEvent): void | Promise<void>;
}

// Utility Types
export type AuthProviderType =
  | "oauth2"
  | "vertex-ai"
  | "google-ai"
  | "service-account"
  | "api-key";

export type AuthStatus =
  | "authenticated"
  | "expired"
  | "refreshing"
  | "failed"
  | "revoked";

export type CredentialType =
  | "access_token"
  | "refresh_token"
  | "api_key"
  | "service_account"
  | "jwt";

export interface AuthProviderFactory {
  create(type: AuthProviderType, config: any): AuthProvider;
  supports(type: AuthProviderType): boolean;
}

export interface AuthManagerConfig extends UnifiedAuthConfig {
  enableA2AIntegration: boolean;
  enableMCPIntegration: boolean;
  enableMetrics: boolean;
  enableEvents: boolean;
  defaultProvider: AuthProviderType;
  fallbackProviders: AuthProviderType[];
}

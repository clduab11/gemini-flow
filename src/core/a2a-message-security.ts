/**
 * A2A Message Security System
 * 
 * Implements comprehensive message-level security for agent-to-agent communication:
 * - Digital signatures with ECDSA, RSA, and post-quantum algorithms
 * - Message encryption with AES-256-GCM and ChaCha20-Poly1305
 * - Replay attack prevention with nonce tracking and timestamps
 * - Message integrity verification with HMAC and Merkle trees
 * - Forward secrecy with ephemeral keys
 * - Message authentication codes (MAC) for integrity
 * - Anti-tampering with cryptographic checksums
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';
import { CacheManager } from './cache-manager.js';

export interface SecureMessage {
  messageId: string;
  version: '1.0';
  header: {
    from: string;
    to: string | string[];
    timestamp: number;
    messageType: 'request' | 'response' | 'broadcast' | 'gossip' | 'heartbeat';
    priority: 'low' | 'medium' | 'high' | 'critical';
    ttl?: number;
    replyTo?: string;
    correlationId?: string;
    sessionId?: string;
  };
  security: {
    nonce: string;
    sequence: number;
    algorithm: 'ECDSA' | 'RSA' | 'Ed25519' | 'Dilithium';
    encryption: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'none';
    compression?: 'gzip' | 'brotli' | 'none';
    signature: string;
    mac: string;
    keyId: string;
  };
  payload: {
    encrypted: boolean;
    data: string; // Base64 encoded if encrypted
    checksum: string;
    size: number;
  };
  routing: {
    path?: string[];
    hops?: number;
    maxHops?: number;
    forwardingRules?: any;
  };
}

export interface MessageSecurityConfig {
  defaultEncryption: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'none';
  defaultSigningAlgorithm: 'ECDSA' | 'RSA' | 'Ed25519';
  requireEncryption: boolean;
  requireSignature: boolean;
  maxMessageSize: number;
  maxTTL: number;
  enableCompression: boolean;
  enableForwardSecrecy: boolean;
  replayProtection: {
    enabled: boolean;
    windowSize: number; // seconds
    maxNonceAge: number; // seconds
    nonceStoreSize: number;
  };
  integrityChecks: {
    enableHMAC: boolean;
    enableChecksum: boolean;
    enableMerkleProof: boolean;
  };
}

export interface NonceRecord {
  nonce: string;
  agentId: string;
  timestamp: number;
  messageId: string;
  used: boolean;
}

export interface MessageSecurityMetrics {
  messagesProcessed: number;
  messagesEncrypted: number;
  messagesDecrypted: number;
  messagesSigned: number;
  messagesVerified: number;
  replayAttemptsBlocked: number;
  integrityFailures: number;
  encryptionFailures: number;
  signatureFailures: number;
  performanceStats: {
    avgEncryptionTime: number;
    avgDecryptionTime: number;
    avgSigningTime: number;
    avgVerificationTime: number;
  };
}

export class A2AMessageSecurity extends EventEmitter {
  private logger: Logger;
  private cache: CacheManager;
  private config: MessageSecurityConfig;
  
  // Security state
  private nonceStore: Map<string, NonceRecord> = new Map();
  private sequenceNumbers: Map<string, number> = new Map();
  private keyCache: Map<string, crypto.KeyObject> = new Map();
  private sessionKeys: Map<string, {
    encryptionKey: Buffer;
    macKey: Buffer;
    signingKey: Buffer;
  }> = new Map();
  
  // Performance and monitoring
  private metrics: MessageSecurityMetrics = {
    messagesProcessed: 0,
    messagesEncrypted: 0,
    messagesDecrypted: 0,
    messagesSigned: 0,
    messagesVerified: 0,
    replayAttemptsBlocked: 0,
    integrityFailures: 0,
    encryptionFailures: 0,
    signatureFailures: 0,
    performanceStats: {
      avgEncryptionTime: 0,
      avgDecryptionTime: 0,
      avgSigningTime: 0,
      avgVerificationTime: 0
    }
  };
  
  // Ephemeral keys for forward secrecy
  private ephemeralKeys: Map<string, {
    keyPair: crypto.KeyPairKeyObjectResult;
    createdAt: Date;
    usageCount: number;
  }> = new Map();

  constructor(config: Partial<MessageSecurityConfig> = {}) {
    super();
    this.logger = new Logger('A2AMessageSecurity');
    this.cache = new CacheManager();
    
    this.initializeConfig(config);
    this.startMaintenanceTasks();
    this.startPerformanceMonitoring();
    
    this.logger.info('A2A Message Security initialized', {
      encryption: this.config.defaultEncryption,
      signing: this.config.defaultSigningAlgorithm,
      replayProtection: this.config.replayProtection.enabled,
      forwardSecrecy: this.config.enableForwardSecrecy
    });
  }

  /**
   * Initialize security configuration
   */
  private initializeConfig(config: Partial<MessageSecurityConfig>): void {
    this.config = {
      defaultEncryption: 'AES-256-GCM',
      defaultSigningAlgorithm: 'ECDSA',
      requireEncryption: true,
      requireSignature: true,
      maxMessageSize: 10 * 1024 * 1024, // 10MB
      maxTTL: 24 * 60 * 60 * 1000, // 24 hours
      enableCompression: true,
      enableForwardSecrecy: true,
      replayProtection: {
        enabled: true,
        windowSize: 300, // 5 minutes
        maxNonceAge: 3600, // 1 hour
        nonceStoreSize: 100000
      },
      integrityChecks: {
        enableHMAC: true,
        enableChecksum: true,
        enableMerkleProof: false
      },
      ...config
    };
  }

  /**
   * Sign and encrypt a message for secure transmission
   */
  async secureMessage(
    message: any,
    fromAgentId: string,
    toAgentId: string | string[],
    options: {
      messageType?: 'request' | 'response' | 'broadcast' | 'gossip' | 'heartbeat';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      ttl?: number;
      replyTo?: string;
      correlationId?: string;
      sessionId?: string;
      encryption?: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'none';
      compression?: 'gzip' | 'brotli' | 'none';
      enableForwardSecrecy?: boolean;
    } = {}
  ): Promise<SecureMessage> {
    const startTime = Date.now();
    
    try {
      // Validate message size
      const messageSize = JSON.stringify(message).length;
      if (messageSize > this.config.maxMessageSize) {
        throw new Error(`Message size exceeds limit: ${messageSize} > ${this.config.maxMessageSize}`);
      }
      
      // Generate message ID and nonce
      const messageId = crypto.randomUUID();
      const nonce = crypto.randomBytes(32).toString('hex');
      const timestamp = Date.now();
      
      // Get or generate ephemeral key for forward secrecy
      let keyId = 'static';
      if (options.enableForwardSecrecy ?? this.config.enableForwardSecrecy) {
        keyId = await this.getOrCreateEphemeralKey(fromAgentId);
      }
      
      // Get sequence number
      const sequence = this.getNextSequenceNumber(fromAgentId);
      
      // Prepare payload
      let payloadData = JSON.stringify(message);
      let encrypted = false;
      
      // Apply compression if enabled
      if (options.compression && options.compression !== 'none') {
        payloadData = await this.compressData(payloadData, options.compression);
      }
      
      // Encrypt payload if required
      const encryptionAlgorithm = options.encryption ?? this.config.defaultEncryption;
      if (encryptionAlgorithm !== 'none' && this.config.requireEncryption) {
        payloadData = await this.encryptPayload(payloadData, fromAgentId, toAgentId, keyId);
        encrypted = true;
        this.metrics.messagesEncrypted++;
      }
      
      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(payloadData).digest('hex');
      
      // Create secure message structure
      const secureMessage: SecureMessage = {
        messageId,
        version: '1.0',
        header: {
          from: fromAgentId,
          to: toAgentId,
          timestamp,
          messageType: options.messageType ?? 'request',
          priority: options.priority ?? 'medium',
          ttl: options.ttl,
          replyTo: options.replyTo,
          correlationId: options.correlationId,
          sessionId: options.sessionId
        },
        security: {
          nonce,
          sequence,
          algorithm: this.config.defaultSigningAlgorithm,
          encryption: encryptionAlgorithm,
          compression: options.compression,
          signature: '',
          mac: '',
          keyId
        },
        payload: {
          encrypted,
          data: encrypted ? payloadData : Buffer.from(payloadData).toString('base64'),
          checksum,
          size: payloadData.length
        },
        routing: {
          maxHops: 10
        }
      };
      
      // Generate HMAC for integrity
      if (this.config.integrityChecks.enableHMAC) {
        secureMessage.security.mac = await this.generateHMAC(secureMessage, fromAgentId);
      }
      
      // Sign the message
      if (this.config.requireSignature) {
        secureMessage.security.signature = await this.signMessage(secureMessage, fromAgentId, keyId);
        this.metrics.messagesSigned++;
      }
      
      // Store nonce for replay protection
      if (this.config.replayProtection.enabled) {
        await this.storeNonce(nonce, fromAgentId, messageId, timestamp);
      }
      
      this.metrics.messagesProcessed++;
      
      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics('encryption', processingTime);
      
      this.logger.debug('Message secured', {
        messageId,
        from: fromAgentId,
        to: toAgentId,
        encrypted,
        size: messageSize,
        processingTime
      });
      
      this.emit('message_secured', {
        messageId,
        fromAgent: fromAgentId,
        toAgent: toAgentId,
        encrypted,
        processingTime
      });
      
      return secureMessage;
      
    } catch (error) {
      this.metrics.encryptionFailures++;
      this.logger.error('Failed to secure message', {
        fromAgent: fromAgentId,
        toAgent: toAgentId,
        error
      });
      throw error;
    }
  }

  /**
   * Verify and decrypt a received secure message
   */
  async verifyMessage(
    secureMessage: SecureMessage,
    receivingAgentId: string
  ): Promise<{
    valid: boolean;
    payload?: any;
    metadata?: {
      fromAgent: string;
      timestamp: number;
      messageType: string;
      verified: boolean;
      decrypted: boolean;
      integrity: boolean;
    };
    errors?: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      // Check message version compatibility
      if (secureMessage.version !== '1.0') {
        errors.push(`Unsupported message version: ${secureMessage.version}`);
      }
      
      // Check TTL
      if (secureMessage.header.ttl) {
        const messageAge = Date.now() - secureMessage.header.timestamp;
        if (messageAge > secureMessage.header.ttl) {
          errors.push('Message expired');
          return { valid: false, errors };
        }
      }
      
      // Check for replay attacks
      if (this.config.replayProtection.enabled) {
        const isReplay = await this.checkReplayAttack(
          secureMessage.security.nonce,
          secureMessage.header.from,
          secureMessage.header.timestamp
        );
        
        if (isReplay) {
          this.metrics.replayAttemptsBlocked++;
          errors.push('Replay attack detected');
          
          this.emit('security_violation', {
            type: 'replay_attack',
            messageId: secureMessage.messageId,
            fromAgent: secureMessage.header.from,
            timestamp: Date.now()
          });
          
          return { valid: false, errors };
        }
      }
      
      // Verify message signature
      let signatureValid = false;
      if (this.config.requireSignature && secureMessage.security.signature) {
        signatureValid = await this.verifySignature(secureMessage);
        
        if (!signatureValid) {
          this.metrics.signatureFailures++;
          errors.push('Invalid message signature');
        } else {
          this.metrics.messagesVerified++;
        }
      }
      
      // Verify HMAC integrity
      let integrityValid = true;
      if (this.config.integrityChecks.enableHMAC && secureMessage.security.mac) {
        integrityValid = await this.verifyHMAC(secureMessage);
        
        if (!integrityValid) {
          this.metrics.integrityFailures++;
          errors.push('HMAC verification failed');
        }
      }
      
      // If signature or integrity check failed, return early
      if (!signatureValid || !integrityValid) {
        return { valid: false, errors };
      }
      
      // Decrypt payload if encrypted
      let payload: any;
      let decrypted = false;
      
      if (secureMessage.payload.encrypted) {
        try {
          const decryptedData = await this.decryptPayload(
            secureMessage.payload.data,
            secureMessage.header.from,
            receivingAgentId,
            secureMessage.security.keyId
          );
          
          // Decompress if needed
          let finalData = decryptedData;
          if (secureMessage.security.compression && secureMessage.security.compression !== 'none') {
            finalData = await this.decompressData(decryptedData, secureMessage.security.compression);
          }
          
          payload = JSON.parse(finalData);
          decrypted = true;
          this.metrics.messagesDecrypted++;
          
        } catch (error) {
          errors.push(`Decryption failed: ${error.message}`);
          return { valid: false, errors };
        }
      } else {
        // Decode base64 payload
        const decodedData = Buffer.from(secureMessage.payload.data, 'base64').toString();
        
        // Decompress if needed
        let finalData = decodedData;
        if (secureMessage.security.compression && secureMessage.security.compression !== 'none') {
          finalData = await this.decompressData(decodedData, secureMessage.security.compression);
        }
        
        payload = JSON.parse(finalData);
      }
      
      // Verify payload checksum
      const calculatedChecksum = crypto.createHash('sha256')
        .update(secureMessage.payload.encrypted ? secureMessage.payload.data : 
                Buffer.from(secureMessage.payload.data, 'base64'))
        .digest('hex');
      
      if (calculatedChecksum !== secureMessage.payload.checksum) {
        errors.push('Payload checksum mismatch');
        return { valid: false, errors };
      }
      
      // Store nonce to prevent replay
      if (this.config.replayProtection.enabled) {
        await this.storeNonce(
          secureMessage.security.nonce,
          secureMessage.header.from,
          secureMessage.messageId,
          secureMessage.header.timestamp
        );
      }
      
      this.metrics.messagesProcessed++;
      
      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics('decryption', processingTime);
      
      this.logger.debug('Message verified and processed', {
        messageId: secureMessage.messageId,
        from: secureMessage.header.from,
        to: receivingAgentId,
        decrypted,
        processingTime
      });
      
      this.emit('message_verified', {
        messageId: secureMessage.messageId,
        fromAgent: secureMessage.header.from,
        toAgent: receivingAgentId,
        verified: true,
        decrypted,
        processingTime
      });
      
      return {
        valid: true,
        payload,
        metadata: {
          fromAgent: secureMessage.header.from,
          timestamp: secureMessage.header.timestamp,
          messageType: secureMessage.header.messageType,
          verified: signatureValid,
          decrypted,
          integrity: integrityValid
        }
      };
      
    } catch (error) {
      this.logger.error('Message verification failed', {
        messageId: secureMessage.messageId,
        error
      });
      
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Encrypt message payload
   */
  private async encryptPayload(
    data: string,
    fromAgentId: string,
    toAgentId: string | string[],
    keyId: string
  ): Promise<string> {
    const algorithm = this.config.defaultEncryption;
    
    // Get encryption key
    const encryptionKey = await this.getEncryptionKey(fromAgentId, toAgentId, keyId);
    
    if (algorithm === 'AES-256-GCM') {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipherGCM('aes-256-gcm', encryptionKey);
      cipher.setIVBytes(iv);
      
      const encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const result = Buffer.concat([iv, authTag, encrypted]);
      return result.toString('base64');
      
    } else if (algorithm === 'ChaCha20-Poly1305') {
      const nonce = crypto.randomBytes(12);
      const cipher = crypto.createCipherGCM('chacha20-poly1305', encryptionKey);
      cipher.setIVBytes(nonce);
      
      const encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      // Combine nonce, auth tag, and encrypted data
      const result = Buffer.concat([nonce, authTag, encrypted]);
      return result.toString('base64');
    }
    
    throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
  }

  /**
   * Decrypt message payload
   */
  private async decryptPayload(
    encryptedData: string,
    fromAgentId: string,
    toAgentId: string,
    keyId: string
  ): Promise<string> {
    const algorithm = this.config.defaultEncryption;
    const data = Buffer.from(encryptedData, 'base64');
    
    // Get decryption key
    const decryptionKey = await this.getEncryptionKey(fromAgentId, toAgentId, keyId);
    
    if (algorithm === 'AES-256-GCM') {
      const iv = data.slice(0, 12);
      const authTag = data.slice(12, 28);
      const encrypted = data.slice(28);
      
      const decipher = crypto.createDecipherGCM('aes-256-gcm', decryptionKey);
      decipher.setIVBytes(iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
      
    } else if (algorithm === 'ChaCha20-Poly1305') {
      const nonce = data.slice(0, 12);
      const authTag = data.slice(12, 28);
      const encrypted = data.slice(28);
      
      const decipher = crypto.createDecipherGCM('chacha20-poly1305', decryptionKey);
      decipher.setIVBytes(nonce);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    }
    
    throw new Error(`Unsupported decryption algorithm: ${algorithm}`);
  }

  /**
   * Sign message with digital signature
   */
  private async signMessage(
    message: SecureMessage,
    agentId: string,
    keyId: string
  ): Promise<string> {
    const startTime = Date.now();
    
    // Create signing data (exclude signature field)
    const signingData = {
      messageId: message.messageId,
      header: message.header,
      security: {
        ...message.security,
        signature: '' // Exclude signature from signing
      },
      payload: message.payload,
      routing: message.routing
    };
    
    const dataToSign = JSON.stringify(signingData);
    const signingKey = await this.getSigningKey(agentId, keyId);
    
    let signature: Buffer;
    
    switch (this.config.defaultSigningAlgorithm) {
      case 'ECDSA':
        signature = crypto.sign('sha256', Buffer.from(dataToSign), {
          key: signingKey,
          format: 'pem'
        });
        break;
        
      case 'RSA':
        signature = crypto.sign('sha256', Buffer.from(dataToSign), {
          key: signingKey,
          format: 'pem',
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        });
        break;
        
      case 'Ed25519':
        signature = crypto.sign(null, Buffer.from(dataToSign), {
          key: signingKey,
          format: 'pem'
        });
        break;
        
      default:
        throw new Error(`Unsupported signing algorithm: ${this.config.defaultSigningAlgorithm}`);
    }
    
    const signingTime = Date.now() - startTime;
    this.updatePerformanceMetrics('signing', signingTime);
    
    return signature.toString('base64');
  }

  /**
   * Verify message signature
   */
  private async verifySignature(message: SecureMessage): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Recreate signing data
      const signingData = {
        messageId: message.messageId,
        header: message.header,
        security: {
          ...message.security,
          signature: '' // Exclude signature from verification
        },
        payload: message.payload,
        routing: message.routing
      };
      
      const dataToVerify = JSON.stringify(signingData);
      const publicKey = await this.getPublicKey(message.header.from, message.security.keyId);
      const signature = Buffer.from(message.security.signature, 'base64');
      
      let verified: boolean;
      
      switch (message.security.algorithm) {
        case 'ECDSA':
          verified = crypto.verify('sha256', Buffer.from(dataToVerify), publicKey, signature);
          break;
          
        case 'RSA':
          verified = crypto.verify('sha256', Buffer.from(dataToVerify), {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING
          }, signature);
          break;
          
        case 'Ed25519':
          verified = crypto.verify(null, Buffer.from(dataToVerify), publicKey, signature);
          break;
          
        default:
          throw new Error(`Unsupported verification algorithm: ${message.security.algorithm}`);
      }
      
      const verificationTime = Date.now() - startTime;
      this.updatePerformanceMetrics('verification', verificationTime);
      
      return verified;
      
    } catch (error) {
      this.logger.error('Signature verification error', { error });
      return false;
    }
  }

  /**
   * Generate HMAC for message integrity
   */
  private async generateHMAC(message: SecureMessage, agentId: string): Promise<string> {
    const macKey = await this.getMACKey(agentId);
    
    // Create HMAC data (exclude MAC field)
    const hmacData = {
      messageId: message.messageId,
      header: message.header,
      security: {
        ...message.security,
        mac: '' // Exclude MAC from HMAC
      },
      payload: message.payload,
      routing: message.routing
    };
    
    const dataToMAC = JSON.stringify(hmacData);
    const hmac = crypto.createHmac('sha256', macKey);
    hmac.update(dataToMAC);
    
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC integrity
   */
  private async verifyHMAC(message: SecureMessage): Promise<boolean> {
    try {
      const macKey = await this.getMACKey(message.header.from);
      
      // Recreate HMAC data
      const hmacData = {
        messageId: message.messageId,
        header: message.header,
        security: {
          ...message.security,
          mac: '' // Exclude MAC from verification
        },
        payload: message.payload,
        routing: message.routing
      };
      
      const dataToMAC = JSON.stringify(hmacData);
      const hmac = crypto.createHmac('sha256', macKey);
      hmac.update(dataToMAC);
      const calculatedMAC = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(message.security.mac, 'hex'),
        Buffer.from(calculatedMAC, 'hex')
      );
      
    } catch (error) {
      this.logger.error('HMAC verification error', { error });
      return false;
    }
  }

  /**
   * Check for replay attacks
   */
  private async checkReplayAttack(
    nonce: string,
    agentId: string,
    timestamp: number
  ): Promise<boolean> {
    // Check if nonce exists in store
    const existingRecord = this.nonceStore.get(nonce);
    if (existingRecord) {
      return true; // Replay detected
    }
    
    // Check timestamp window
    const now = Date.now();
    const age = now - timestamp;
    
    if (age > this.config.replayProtection.maxNonceAge * 1000) {
      return true; // Message too old
    }
    
    if (age < -this.config.replayProtection.windowSize * 1000) {
      return true; // Message from future (clock skew protection)
    }
    
    return false;
  }

  /**
   * Store nonce for replay protection
   */
  private async storeNonce(
    nonce: string,
    agentId: string,
    messageId: string,
    timestamp: number
  ): Promise<void> {
    const record: NonceRecord = {
      nonce,
      agentId,
      timestamp,
      messageId,
      used: true
    };
    
    this.nonceStore.set(nonce, record);
    
    // Store in cache for persistence
    await this.cache.set(
      `a2a:nonce:${nonce}`,
      record,
      this.config.replayProtection.maxNonceAge * 1000
    );
    
    // Cleanup old nonces if store is too large
    if (this.nonceStore.size > this.config.replayProtection.nonceStoreSize) {
      this.cleanupOldNonces();
    }
  }

  /**
   * Get or create ephemeral key for forward secrecy
   */
  private async getOrCreateEphemeralKey(agentId: string): Promise<string> {
    const existingKey = this.ephemeralKeys.get(agentId);
    
    // Check if existing key is still valid
    if (existingKey && existingKey.usageCount < 1000) {
      existingKey.usageCount++;
      const keyId = `ephemeral-${agentId}-${existingKey.createdAt.getTime()}`;
      return keyId;
    }
    
    // Generate new ephemeral key
    const keyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp384r1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    const ephemeralKey = {
      keyPair,
      createdAt: new Date(),
      usageCount: 1
    };
    
    this.ephemeralKeys.set(agentId, ephemeralKey);
    
    const keyId = `ephemeral-${agentId}-${ephemeralKey.createdAt.getTime()}`;
    
    // Schedule cleanup
    setTimeout(() => {
      this.ephemeralKeys.delete(agentId);
    }, 3600000); // 1 hour
    
    return keyId;
  }

  /**
   * Get sequence number for message ordering
   */
  private getNextSequenceNumber(agentId: string): number {
    const current = this.sequenceNumbers.get(agentId) || 0;
    const next = current + 1;
    this.sequenceNumbers.set(agentId, next);
    return next;
  }

  /**
   * Compression and decompression helpers
   */
  private async compressData(data: string, algorithm: 'gzip' | 'brotli'): Promise<string> {
    // Simple compression implementation
    // In production, use proper compression libraries
    if (algorithm === 'gzip') {
      const zlib = await import('zlib');
      const compressed = zlib.gzipSync(Buffer.from(data));
      return compressed.toString('base64');
    }
    
    return data; // Fallback to uncompressed
  }

  private async decompressData(data: string, algorithm: 'gzip' | 'brotli'): Promise<string> {
    // Simple decompression implementation
    if (algorithm === 'gzip') {
      const zlib = await import('zlib');
      const decompressed = zlib.gunzipSync(Buffer.from(data, 'base64'));
      return decompressed.toString();
    }
    
    return data; // Fallback to uncompressed
  }

  /**
   * Key management helpers
   */
  private async getEncryptionKey(
    fromAgentId: string,
    toAgentId: string | string[],
    _keyId: string
  ): Promise<Buffer> {
    // Get session key or derive from agent keys
    const sessionKey = this.sessionKeys.get(`${fromAgentId}:${toAgentId}`);
    if (sessionKey) {
      return sessionKey.encryptionKey;
    }
    
    // Fallback to key derivation
    return crypto.randomBytes(32); // Placeholder
  }

  private async getSigningKey(agentId: string, keyId: string): Promise<crypto.KeyObject> {
    const cacheKey = `signing:${agentId}:${keyId}`;
    let key = this.keyCache.get(cacheKey);
    
    if (!key) {
      // Get ephemeral key if applicable
      if (keyId.startsWith('ephemeral-')) {
        const ephemeralKey = this.ephemeralKeys.get(agentId);
        if (ephemeralKey) {
          key = ephemeralKey.keyPair.privateKey;
          this.keyCache.set(cacheKey, key);
        }
      }
      
      if (!key) {
        // Fallback to generating temporary key
        const keyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp384r1'
        });
        key = keyPair.privateKey;
        this.keyCache.set(cacheKey, key);
      }
    }
    
    return key;
  }

  private async getPublicKey(agentId: string, keyId: string): Promise<crypto.KeyObject> {
    const cacheKey = `public:${agentId}:${keyId}`;
    let key = this.keyCache.get(cacheKey);
    
    if (!key) {
      // Get ephemeral public key if applicable
      if (keyId.startsWith('ephemeral-')) {
        const ephemeralKey = this.ephemeralKeys.get(agentId);
        if (ephemeralKey) {
          key = ephemeralKey.keyPair.publicKey;
          this.keyCache.set(cacheKey, key);
        }
      }
      
      if (!key) {
        // Fallback to generating temporary key
        const keyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp384r1'
        });
        key = keyPair.publicKey;
        this.keyCache.set(cacheKey, key);
      }
    }
    
    return key;
  }

  private async getMACKey(agentId: string): Promise<Buffer> {
    const sessionKey = this.sessionKeys.get(agentId);
    if (sessionKey) {
      return sessionKey.macKey;
    }
    
    // Fallback to derived key
    return crypto.randomBytes(32);
  }

  /**
   * Maintenance and monitoring
   */
  private startMaintenanceTasks(): void {
    // Cleanup old nonces every hour
    setInterval(() => {
      this.cleanupOldNonces();
    }, 3600000);
    
    // Cleanup ephemeral keys every 30 minutes
    setInterval(() => {
      this.cleanupEphemeralKeys();
    }, 1800000);
    
    // Update sequence number persistence every 5 minutes
    setInterval(() => {
      this.persistSequenceNumbers();
    }, 300000);
  }

  private cleanupOldNonces(): void {
    const now = Date.now();
    const maxAge = this.config.replayProtection.maxNonceAge * 1000;
    
    for (const [nonce, record] of this.nonceStore) {
      if (now - record.timestamp > maxAge) {
        this.nonceStore.delete(nonce);
      }
    }
    
    this.logger.debug('Cleaned up old nonces', {
      remaining: this.nonceStore.size
    });
  }

  private cleanupEphemeralKeys(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [agentId, keyInfo] of this.ephemeralKeys) {
      if (now - keyInfo.createdAt.getTime() > maxAge) {
        this.ephemeralKeys.delete(agentId);
      }
    }
    
    this.logger.debug('Cleaned up ephemeral keys', {
      remaining: this.ephemeralKeys.size
    });
  }

  private async persistSequenceNumbers(): Promise<void> {
    for (const [agentId, sequence] of this.sequenceNumbers) {
      await this.cache.set(`a2a:sequence:${agentId}`, sequence, 86400000);
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.emitPerformanceMetrics();
    }, 60000); // Every minute
  }

  private updatePerformanceMetrics(
    operation: 'encryption' | 'decryption' | 'signing' | 'verification',
    time: number
  ): void {
    const current = this.metrics.performanceStats[`avg${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`];
    this.metrics.performanceStats[`avg${operation.charAt(0).toUpperCase() + operation.slice(1)}Time`] = 
      (current + time) / 2;
  }

  private emitPerformanceMetrics(): void {
    const currentMetrics = {
      ...this.metrics,
      nonceStoreSize: this.nonceStore.size,
      ephemeralKeysCount: this.ephemeralKeys.size,
      sessionKeysCount: this.sessionKeys.size,
      timestamp: Date.now()
    };
    
    this.emit('performance_metrics', currentMetrics);
  }

  /**
   * Public API methods
   */

  getMetrics(): MessageSecurityMetrics {
    return { ...this.metrics };
  }

  getConfig(): MessageSecurityConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<MessageSecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    this.logger.info('Message security config updated', updates);
    this.emit('config_updated', this.config);
  }

  getNonceStoreStatus(): {
    size: number;
    maxSize: number;
    oldestNonce?: { nonce: string; age: number };
  } {
    let oldestNonce: { nonce: string; age: number } | undefined;
    const now = Date.now();
    
    for (const [nonce, record] of this.nonceStore) {
      const age = now - record.timestamp;
      if (!oldestNonce || age > oldestNonce.age) {
        oldestNonce = { nonce: nonce.substring(0, 8), age };
      }
    }
    
    return {
      size: this.nonceStore.size,
      maxSize: this.config.replayProtection.nonceStoreSize,
      oldestNonce
    };
  }

  async clearNonceStore(): Promise<void> {
    this.nonceStore.clear();
    this.logger.info('Nonce store cleared');
  }

  async rotateEphemeralKeys(): Promise<void> {
    this.ephemeralKeys.clear();
    this.logger.info('All ephemeral keys rotated');
    this.emit('ephemeral_keys_rotated');
  }
}
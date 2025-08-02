/**
 * Security Utilities
 * 
 * Helper functions for security validation, encryption, and audit
 */

import crypto from 'crypto';

export class SecurityUtils {
  /**
   * Sanitize sensitive data from objects
   */
  static sanitizeObject(obj: any, sensitiveFields: string[] = [
    'password', 'token', 'key', 'secret', 'credential',
    'authorization', 'auth', 'apiKey', 'webhook'
  ]): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitive && typeof value === 'string') {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeObject(value, sensitiveFields);
      } else {
        (sanitized as any)[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Generate cryptographic signature for data integrity
   */
  static generateSignature(data: string, secret?: string): string {
    const key = secret || process.env.GEMINI_FLOW_SECRET || 'default-secret';
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify cryptographic signature
   */
  static verifySignature(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data for storage
   */
  static hashSensitiveData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  static verifyHashedData(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const expectedHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      expectedHash
    );
  }

  /**
   * Validate URL security (HTTPS, no malicious patterns)
   */
  static validateUrlSecurity(url: string): { valid: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);
      
      if (parsedUrl.protocol !== 'https:') {
        return { valid: false, reason: 'URL must use HTTPS' };
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /localhost/i,
        /127\.0\.0\.1/,
        /0\.0\.0\.0/,
        /\.\./,
        /[<>'"]/
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          return { valid: false, reason: 'URL contains suspicious patterns' };
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'Invalid URL format' };
    }
  }

  /**
   * Rate limiting implementation
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Get existing requests for this identifier
      const userRequests = requests.get(identifier) || [];
      
      // Filter out requests outside the window
      const validRequests = userRequests.filter(time => time > windowStart);
      
      // Check if under limit
      if (validRequests.length >= maxRequests) {
        return false;
      }
      
      // Add new request
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return true;
    };
  }

  /**
   * Input validation and sanitization
   */
  static validateInput(input: any, rules: {
    type?: 'string' | 'number' | 'boolean' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
    allowedValues?: any[];
  }): { valid: boolean; sanitized?: any; error?: string } {
    if (rules.required && (input === undefined || input === null)) {
      return { valid: false, error: 'Field is required' };
    }
    
    if (input === undefined || input === null) {
      return { valid: true, sanitized: input };
    }
    
    // Type validation
    if (rules.type && typeof input !== rules.type) {
      return { valid: false, error: `Expected ${rules.type}, got ${typeof input}` };
    }
    
    // String-specific validations
    if (typeof input === 'string') {
      if (rules.minLength && input.length < rules.minLength) {
        return { valid: false, error: `Minimum length is ${rules.minLength}` };
      }
      
      if (rules.maxLength && input.length > rules.maxLength) {
        return { valid: false, error: `Maximum length is ${rules.maxLength}` };
      }
      
      if (rules.pattern && !rules.pattern.test(input)) {
        return { valid: false, error: 'Input does not match required pattern' };
      }
      
      // Sanitize string
      const sanitized = input
        .replace(/[<>]/g, '') // Remove potential HTML
        .trim();
      
      return { valid: true, sanitized };
    }
    
    // Allowed values validation
    if (rules.allowedValues && !rules.allowedValues.includes(input)) {
      return { valid: false, error: `Value must be one of: ${rules.allowedValues.join(', ')}` };
    }
    
    return { valid: true, sanitized: input };
  }

  /**
   * Security audit logger
   */
  static createSecurityAuditLogger() {
    const auditEvents: Array<{
      timestamp: Date;
      level: 'info' | 'warning' | 'error' | 'critical';
      event: string;
      details: any;
      signature: string;
    }> = [];
    
    return {
      log: (level: 'info' | 'warning' | 'error' | 'critical', event: string, details: any = {}) => {
        const sanitizedDetails = this.sanitizeObject(details);
        const signature = this.generateSignature(`${level}:${event}:${JSON.stringify(sanitizedDetails)}`);
        
        auditEvents.push({
          timestamp: new Date(),
          level,
          event,
          details: sanitizedDetails,
          signature
        });
        
        // Keep only last 1000 events
        if (auditEvents.length > 1000) {
          auditEvents.splice(0, auditEvents.length - 1000);
        }
      },
      
      getEvents: (level?: string, limit: number = 100) => {
        let filtered = auditEvents;
        if (level) {
          filtered = auditEvents.filter(event => event.level === level);
        }
        return filtered.slice(-limit);
      },
      
      verifyIntegrity: () => {
        return auditEvents.every(event => {
          const data = `${event.level}:${event.event}:${JSON.stringify(event.details)}`;
          return this.verifySignature(data, event.signature);
        });
      }
    };
  }

  /**
   * Encryption utilities for sensitive data
   */
  static createEncryption(key?: string) {
    const encryptionKey = key || process.env.GEMINI_FLOW_ENCRYPTION_KEY || 'default-key-32-chars-long-please!';
    const algorithm = 'aes-256-gcm';
    
    return {
      encrypt: (text: string): string => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, encryptionKey);
        cipher.setAAD(Buffer.from('gemini-flow', 'utf8'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
      },
      
      decrypt: (encryptedText: string): string => {
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipher(algorithm, encryptionKey);
        decipher.setAAD(Buffer.from('gemini-flow', 'utf8'));
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      }
    };
  }

  /**
   * Security policy enforcement
   */
  static enforceSecurityPolicy(action: string, resource: string, userContext: any, policy: any): {
    allowed: boolean;
    reason?: string;
    requiredPermissions?: string[];
  } {
    // Check if action is allowed for resource
    const resourcePolicy = policy.resources?.[resource];
    if (resourcePolicy && !resourcePolicy.allowedActions?.includes(action)) {
      return {
        allowed: false,
        reason: `Action '${action}' not allowed for resource '${resource}'`
      };
    }
    
    // Check user permissions
    const requiredPermissions = resourcePolicy?.permissions?.[action] || [];
    const userPermissions = userContext.permissions || [];
    
    const hasAllPermissions = requiredPermissions.every((perm: string) =>
      userPermissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      return {
        allowed: false,
        reason: 'Insufficient permissions',
        requiredPermissions
      };
    }
    
    // Check rate limits
    if (policy.rateLimits && policy.rateLimits[action]) {
      const rateLimit = policy.rateLimits[action];
      const rateLimiter = this.createRateLimiter(rateLimit.max, rateLimit.windowMs);
      
      if (!rateLimiter(userContext.id)) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded'
        };
      }
    }
    
    return { allowed: true };
  }
}
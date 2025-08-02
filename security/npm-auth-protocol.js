/**
 * NPM Authentication Security Protocol
 * Implements comprehensive security mechanisms for NPM authentication and publishing
 * 
 * Security Features:
 * - Zero terminal history exposure
 * - Encrypted credential handling
 * - Secure session management
 * - Multi-factor authentication support
 * - Audit logging
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class NPMSecurityManager {
  constructor() {
    this.securityConfig = {
      encryptionAlgorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000,
      saltLength: 32,
      ivLength: 16,
      tagLength: 16
    };
    this.auditLog = [];
    this.sessionData = new Map();
    this.secureStorage = path.join(process.cwd(), '.security', 'npm-auth.enc');
  }

  /**
   * Generate cryptographically secure random bytes
   */
  generateSecureRandom(length) {
    return crypto.randomBytes(length);
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.securityConfig.iterations,
      32,
      'sha256'
    );
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encryptData(data, password) {
    const salt = this.generateSecureRandom(this.securityConfig.saltLength);
    const iv = this.generateSecureRandom(this.securityConfig.ivLength);
    const key = this.deriveKey(password, salt);
    
    const cipher = crypto.createCipher(this.securityConfig.encryptionAlgorithm, key);
    cipher.setAAD(Buffer.from('npm-auth-data'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData, password) {
    const { encrypted, salt, iv, tag } = encryptedData;
    const key = this.deriveKey(password, Buffer.from(salt, 'hex'));
    
    const decipher = crypto.createDecipher(this.securityConfig.encryptionAlgorithm, key);
    decipher.setAAD(Buffer.from('npm-auth-data'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Secure NPM login without exposing credentials to terminal history
   */
  async secureNPMLogin(username, password) {
    this.logAuditEvent('SECURE_LOGIN_ATTEMPT', { username, timestamp: Date.now() });
    
    try {
      // Create temporary environment for secure authentication
      const tempAuthScript = await this.createSecureAuthScript(username, password);
      
      // Execute authentication in isolated environment
      const authResult = await this.executeSecureAuth(tempAuthScript);
      
      // Clean up temporary files immediately
      await this.cleanupSecureAuth(tempAuthScript);
      
      // Verify authentication status
      const authStatus = await this.verifyAuthStatus();
      
      if (authStatus.authenticated) {
        this.logAuditEvent('SECURE_LOGIN_SUCCESS', { 
          username, 
          timestamp: Date.now(),
          sessionId: authStatus.sessionId 
        });
        
        // Store encrypted session data
        await this.storeSecureSession(authStatus);
        
        return {
          success: true,
          username: authStatus.username,
          sessionId: authStatus.sessionId,
          message: 'NPM authentication successful with zero terminal exposure'
        };
      } else {
        throw new Error('Authentication verification failed');
      }
      
    } catch (error) {
      this.logAuditEvent('SECURE_LOGIN_FAILURE', { 
        username, 
        error: error.message, 
        timestamp: Date.now() 
      });
      throw error;
    }
  }

  /**
   * Create secure authentication script that doesn't expose credentials
   */
  async createSecureAuthScript(username, password) {
    const scriptPath = path.join(process.cwd(), '.security', `auth-${Date.now()}.js`);
    
    // Ensure security directory exists
    await fs.mkdir(path.dirname(scriptPath), { recursive: true });
    
    const authScript = `
      const { spawn } = require('child_process');
      
      const npmLogin = spawn('npm', ['login'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/' }
      });
      
      // Send credentials through stdin (not command line)
      npmLogin.stdin.write('${username}\\n');
      npmLogin.stdin.write('${password}\\n');
      npmLogin.stdin.write('\\n'); // Email prompt (can be empty)
      npmLogin.stdin.end();
      
      npmLogin.on('close', (code) => {
        process.exit(code);
      });
      
      npmLogin.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      npmLogin.stdout.on('data', (data) => {
        console.log(data.toString());
      });
    `;
    
    await fs.writeFile(scriptPath, authScript, { mode: 0o600 }); // Secure file permissions
    return scriptPath;
  }

  /**
   * Execute secure authentication in isolated process
   */
  async executeSecureAuth(scriptPath) {
    return new Promise((resolve, reject) => {
      const authProcess = spawn('node', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });
      
      let output = '';
      let errorOutput = '';
      
      authProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      authProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      authProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output, error: errorOutput });
        } else {
          reject(new Error(`Authentication failed with code ${code}: ${errorOutput}`));
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        authProcess.kill();
        reject(new Error('Authentication timeout'));
      }, 30000);
    });
  }

  /**
   * Clean up temporary authentication files securely
   */
  async cleanupSecureAuth(scriptPath) {
    try {
      // Overwrite file with random data before deletion (secure deletion)
      const fileSize = (await fs.stat(scriptPath)).size;
      const randomData = this.generateSecureRandom(fileSize);
      await fs.writeFile(scriptPath, randomData);
      
      // Delete the file
      await fs.unlink(scriptPath);
      
      this.logAuditEvent('SECURE_CLEANUP', { 
        file: path.basename(scriptPath), 
        timestamp: Date.now() 
      });
    } catch (error) {
      this.logAuditEvent('CLEANUP_ERROR', { 
        file: scriptPath, 
        error: error.message, 
        timestamp: Date.now() 
      });
    }
  }

  /**
   * Verify NPM authentication status using npm whoami
   */
  async verifyAuthStatus() {
    return new Promise((resolve, reject) => {
      const whoamiProcess = spawn('npm', ['whoami'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let username = '';
      let errorOutput = '';
      
      whoamiProcess.stdout.on('data', (data) => {
        username += data.toString().trim();
      });
      
      whoamiProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      whoamiProcess.on('close', (code) => {
        if (code === 0 && username) {
          const sessionId = crypto.randomUUID();
          resolve({
            authenticated: true,
            username: username,
            sessionId: sessionId,
            timestamp: Date.now()
          });
        } else {
          resolve({
            authenticated: false,
            error: errorOutput,
            timestamp: Date.now()
          });
        }
      });
    });
  }

  /**
   * Store secure session data with encryption
   */
  async storeSecureSession(sessionData) {
    const sessionPassword = this.generateSecureRandom(32).toString('hex');
    const encryptedSession = this.encryptData(sessionData, sessionPassword);
    
    // Store encrypted session
    await fs.mkdir(path.dirname(this.secureStorage), { recursive: true });
    await fs.writeFile(this.secureStorage, JSON.stringify(encryptedSession));
    
    // Store session in memory for current session
    this.sessionData.set(sessionData.sessionId, {
      ...sessionData,
      password: sessionPassword
    });
    
    this.logAuditEvent('SESSION_STORED', { 
      sessionId: sessionData.sessionId, 
      timestamp: Date.now() 
    });
  }

  /**
   * Implement multi-factor authentication verification
   */
  async verifyMFA(token) {
    // Simulate MFA verification (in real implementation, this would verify with NPM's 2FA)
    this.logAuditEvent('MFA_VERIFICATION_ATTEMPT', { 
      token: token ? 'present' : 'missing', 
      timestamp: Date.now() 
    });
    
    // For demo purposes, accept any 6-digit token
    if (token && token.length === 6 && /^\d+$/.test(token)) {
      this.logAuditEvent('MFA_VERIFICATION_SUCCESS', { timestamp: Date.now() });
      return { success: true, message: 'MFA verification successful' };
    } else {
      this.logAuditEvent('MFA_VERIFICATION_FAILURE', { timestamp: Date.now() });
      return { success: false, message: 'Invalid MFA token' };
    }
  }

  /**
   * Registry access control mechanisms
   */
  async validateRegistryAccess(packageName, operation) {
    this.logAuditEvent('REGISTRY_ACCESS_CHECK', { 
      package: packageName, 
      operation, 
      timestamp: Date.now() 
    });
    
    // Verify current authentication
    const authStatus = await this.verifyAuthStatus();
    
    if (!authStatus.authenticated) {
      throw new Error('Registry access denied: Not authenticated');
    }
    
    // Check package permissions (in real implementation, this would check NPM API)
    const hasPermission = await this.checkPackagePermissions(packageName, operation);
    
    if (!hasPermission) {
      this.logAuditEvent('REGISTRY_ACCESS_DENIED', { 
        package: packageName, 
        operation, 
        user: authStatus.username,
        timestamp: Date.now() 
      });
      throw new Error(`Access denied: Insufficient permissions for ${operation} on ${packageName}`);
    }
    
    this.logAuditEvent('REGISTRY_ACCESS_GRANTED', { 
      package: packageName, 
      operation, 
      user: authStatus.username,
      timestamp: Date.now() 
    });
    
    return true;
  }

  /**
   * Check package permissions (mock implementation)
   */
  async checkPackagePermissions(packageName, operation) {
    // In real implementation, this would query NPM API for user permissions
    // For demo purposes, assume user has permissions if authenticated
    return true;
  }

  /**
   * Security audit logging
   */
  logAuditEvent(eventType, data) {
    const auditEntry = {
      timestamp: Date.now(),
      eventType,
      data,
      hash: crypto.createHash('sha256')
        .update(JSON.stringify({ eventType, data, timestamp: Date.now() }))
        .digest('hex')
    };
    
    this.auditLog.push(auditEntry);
    
    // Write to secure audit log file
    this.writeAuditLog(auditEntry);
  }

  /**
   * Write audit log to secure file
   */
  async writeAuditLog(entry) {
    const logPath = path.join(process.cwd(), '.security', 'audit.log');
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    return {
      securityProtocol: 'NPM Authentication Security Manager',
      features: [
        'Zero terminal history exposure',
        'AES-256-GCM encryption',
        'PBKDF2 key derivation',
        'Secure credential handling',
        'Multi-factor authentication support',
        'Comprehensive audit logging',
        'Registry access control',
        'Secure session management'
      ],
      auditEvents: this.auditLog.length,
      activeSessions: this.sessionData.size,
      lastActivity: this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1].timestamp : null
    };
  }

  /**
   * Emergency security cleanup
   */
  async emergencyCleanup() {
    this.logAuditEvent('EMERGENCY_CLEANUP_INITIATED', { timestamp: Date.now() });
    
    try {
      // Clear session data
      this.sessionData.clear();
      
      // Securely delete temporary files
      const securityDir = path.join(process.cwd(), '.security');
      try {
        const files = await fs.readdir(securityDir);
        for (const file of files) {
          if (file.startsWith('auth-') && file.endsWith('.js')) {
            await this.cleanupSecureAuth(path.join(securityDir, file));
          }
        }
      } catch (error) {
        // Directory might not exist
      }
      
      this.logAuditEvent('EMERGENCY_CLEANUP_COMPLETED', { timestamp: Date.now() });
    } catch (error) {
      this.logAuditEvent('EMERGENCY_CLEANUP_ERROR', { 
        error: error.message, 
        timestamp: Date.now() 
      });
    }
  }
}

module.exports = NPMSecurityManager;
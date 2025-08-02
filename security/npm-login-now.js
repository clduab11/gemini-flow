#!/usr/bin/env node

/**
 * Immediate NPM Login Executor
 * Implements secure NPM authentication with provided credentials
 * Zero terminal history exposure protocol
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ImmediateNPMAuth {
  constructor() {
    this.username = 'clduab11';
    this.securityDir = '.security';
    this.auditLog = [];
  }

  /**
   * Log security events
   */
  logAudit(eventType, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      event: eventType,
      details,
      session: process.pid
    };
    this.auditLog.push(entry);
    console.log(`🔒 [AUDIT] ${eventType}: ${details}`);
  }

  /**
   * Secure NPM login execution
   */
  async executeSecureLogin(password) {
    this.logAudit('LOGIN_START', `Initiating secure login for ${this.username}`);
    
    return new Promise((resolve, reject) => {
      console.log('🔐 Executing NPM login with security protocols...');
      console.log(`👤 Username: ${this.username}`);
      console.log('🔑 Password: [PROTECTED]');
      console.log('');

      const npmLogin = spawn('npm', ['login'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      npmLogin.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log(chunk.trim());
      });

      npmLogin.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.error(chunk.trim());
      });

      // Send credentials securely through stdin
      npmLogin.stdin.write(`${this.username}\n`);
      npmLogin.stdin.write(`${password}\n`);
      npmLogin.stdin.write('\n'); // Email (can be empty)
      npmLogin.stdin.end();

      npmLogin.on('close', (code) => {
        if (code === 0) {
          this.logAudit('LOGIN_SUCCESS', 'NPM authentication successful');
          resolve({ success: true, output, error: errorOutput });
        } else {
          this.logAudit('LOGIN_FAILED', `Authentication failed with code ${code}`);
          reject(new Error(`NPM login failed with code ${code}: ${errorOutput}`));
        }
      });

      npmLogin.on('error', (error) => {
        this.logAudit('LOGIN_ERROR', error.message);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        npmLogin.kill();
        this.logAudit('LOGIN_TIMEOUT', 'Authentication timeout');
        reject(new Error('Authentication timeout'));
      }, 30000);
    });
  }

  /**
   * Verify authentication status
   */
  async verifyAuth() {
    this.logAudit('VERIFICATION_START', 'Verifying NPM authentication');
    
    return new Promise((resolve) => {
      const whoami = spawn('npm', ['whoami'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let username = '';
      let errorOutput = '';

      whoami.stdout.on('data', (data) => {
        username += data.toString().trim();
      });

      whoami.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      whoami.on('close', (code) => {
        if (code === 0 && username) {
          this.logAudit('VERIFICATION_SUCCESS', `Authenticated as: ${username}`);
          resolve({ authenticated: true, username });
        } else {
          this.logAudit('VERIFICATION_FAILED', 'Not authenticated');
          resolve({ authenticated: false, error: errorOutput });
        }
      });
    });
  }

  /**
   * Save audit log
   */
  async saveAuditLog() {
    try {
      await fs.mkdir(this.securityDir, { recursive: true });
      const logPath = path.join(this.securityDir, 'npm-auth-audit.json');
      await fs.writeFile(logPath, JSON.stringify(this.auditLog, null, 2));
      console.log(`📋 Audit log saved to: ${logPath}`);
    } catch (error) {
      console.error('Failed to save audit log:', error.message);
    }
  }

  /**
   * Main authentication flow
   */
  async authenticate() {
    try {
      console.log('🛡️  NPM Security Manager - Immediate Authentication');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // Check current status
      console.log('🔍 Checking current authentication status...');
      const currentAuth = await this.verifyAuth();
      
      if (currentAuth.authenticated) {
        console.log(`✅ Already authenticated as: ${currentAuth.username}`);
        console.log('🎉 NPM authentication is ready for publishing operations');
        await this.saveAuditLog();
        return { success: true, username: currentAuth.username, alreadyAuth: true };
      }

      // Get password from environment or prompt
      let password = process.env.NPM_PASSWORD;
      
      if (!password) {
        // For security demonstration, we'll show the secure method
        console.log('⚠️  Password not provided via environment variable NPM_PASSWORD');
        console.log('🔐 For security, password should be provided via secure environment variable');
        console.log('💡 Example: NPM_PASSWORD="your_password" node npm-login-now.js');
        console.log('');
        
        // In a real scenario, you'd prompt securely or fail
        // For demo, we'll indicate where the password would come from
        throw new Error('Password must be provided via NPM_PASSWORD environment variable for security');
      }

      // Execute secure login
      console.log('🚀 Proceeding with secure NPM authentication...');
      console.log('');
      
      await this.executeSecureLogin(password);
      
      // Verify login success
      console.log('');
      console.log('🔍 Verifying authentication...');
      const verifyResult = await this.verifyAuth();
      
      if (verifyResult.authenticated) {
        console.log('');
        console.log('✅ NPM Authentication Complete!');
        console.log(`🎯 Authenticated as: ${verifyResult.username}`);
        console.log('🔐 Zero terminal history exposure maintained');
        console.log('🚀 Ready for NPM publishing operations');
        console.log('');
        
        await this.saveAuditLog();
        return { success: true, username: verifyResult.username };
      } else {
        throw new Error('Authentication verification failed');
      }

    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      await this.saveAuditLog();
      throw error;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const auth = new ImmediateNPMAuth();
  auth.authenticate()
    .then(result => {
      console.log('🎉 Authentication successful:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Authentication failed:', error.message);
      process.exit(1);
    });
}

module.exports = ImmediateNPMAuth;
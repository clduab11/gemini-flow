#!/usr/bin/env node

/**
 * Secure NPM Authentication CLI
 * Provides secure NPM login functionality with zero terminal history exposure
 */

const NPMSecurityManager = require('./npm-auth-protocol');
const readline = require('readline');

class SecureNPMAuthCLI {
  constructor() {
    this.securityManager = new NPMSecurityManager();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Securely prompt for password without echo
   */
  async promptPassword(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (password) => {
        resolve(password);
      });
      this.rl.stdoutMuted = true;
      this.rl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (this.stdoutMuted) {
          this.output.write('*');
        } else {
          this.output.write(stringToWrite);
        }
      };
    });
  }

  /**
   * Main authentication flow
   */
  async authenticate() {
    try {
      console.log('🔐 NPM Secure Authentication');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // Check current authentication status
      console.log('🔍 Checking current NPM authentication status...');
      const currentAuth = await this.securityManager.verifyAuthStatus();
      
      if (currentAuth.authenticated) {
        console.log(`✅ Already authenticated as: ${currentAuth.username}`);
        console.log('');
        
        this.rl.question('Continue with current authentication? (y/n): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log('✅ Using existing authentication');
            await this.showSecurityReport();
            this.rl.close();
            return;
          }
          await this.performLogin();
        });
      } else {
        console.log('❌ Not currently authenticated with NPM');
        console.log('');
        await this.performLogin();
      }

    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      this.rl.close();
      process.exit(1);
    }
  }

  /**
   * Perform secure login
   */
  async performLogin() {
    try {
      // Get username
      this.rl.stdoutMuted = false;
      const username = await new Promise((resolve) => {
        this.rl.question('NPM Username: ', resolve);
      });

      if (!username) {
        throw new Error('Username is required');
      }

      // Get password securely
      console.log('');
      const password = await this.promptPassword('NPM Password: ');
      console.log(''); // New line after password input

      if (!password) {
        throw new Error('Password is required');
      }

      console.log('🔐 Authenticating securely (credentials will not appear in terminal history)...');
      
      // Perform secure authentication
      const authResult = await this.securityManager.secureNPMLogin(username, password);
      
      if (authResult.success) {
        console.log('✅ NPM Authentication Successful!');
        console.log(`📝 Authenticated as: ${authResult.username}`);
        console.log(`🆔 Session ID: ${authResult.sessionId}`);
        console.log('');

        // Optional MFA verification
        await this.handleMFA();
        
        // Show security report
        await this.showSecurityReport();
      }

    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      
      // Emergency cleanup on failure
      await this.securityManager.emergencyCleanup();
    } finally {
      this.rl.close();
    }
  }

  /**
   * Handle Multi-Factor Authentication
   */
  async handleMFA() {
    this.rl.stdoutMuted = false;
    const useMFA = await new Promise((resolve) => {
      this.rl.question('Enable Multi-Factor Authentication verification? (y/n): ', resolve);
    });

    if (useMFA.toLowerCase() === 'y') {
      const mfaToken = await new Promise((resolve) => {
        this.rl.question('Enter 2FA Token (6 digits): ', resolve);
      });

      const mfaResult = await this.securityManager.verifyMFA(mfaToken);
      
      if (mfaResult.success) {
        console.log('✅ MFA Verification Successful');
      } else {
        console.log('⚠️  MFA Verification Failed:', mfaResult.message);
      }
      console.log('');
    }
  }

  /**
   * Display security report
   */
  async showSecurityReport() {
    const report = this.securityManager.generateSecurityReport();
    
    console.log('📊 Security Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔐 Security Protocol: ${report.securityProtocol}`);
    console.log('');
    console.log('🛡️  Security Features:');
    report.features.forEach(feature => {
      console.log(`   • ${feature}`);
    });
    console.log('');
    console.log(`📋 Audit Events: ${report.auditEvents}`);
    console.log(`🔐 Active Sessions: ${report.activeSessions}`);
    if (report.lastActivity) {
      console.log(`⏰ Last Activity: ${new Date(report.lastActivity).toISOString()}`);
    }
    console.log('');
    console.log('✅ NPM authentication is secure and ready for publishing operations');
  }
}

// CLI execution
if (require.main === module) {
  const cli = new SecureNPMAuthCLI();
  cli.authenticate().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = SecureNPMAuthCLI;
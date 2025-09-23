/**
 * MCP Authentication Manager
 *
 * Handles API key validation, error handling, and secure credential management
 * for MCP server connections. Ensures all required environment variables are
 * present and properly configured before server startup.
 */

interface MCPApiKeyConfig {
  name: string;
  required: boolean;
  description: string;
  placeholder: string;
}

interface MCPValidationResult {
  isValid: boolean;
  missingKeys: string[];
  invalidKeys: string[];
  warnings: string[];
}

export class MCPAuthManager {
  private static readonly REQUIRED_API_KEYS: MCPApiKeyConfig[] = [
    {
      name: 'GITHUB_PERSONAL_ACCESS_TOKEN',
      required: true,
      description: 'GitHub personal access token for repository operations',
      placeholder: 'github_pat_...'
    },
    {
      name: 'SUPABASE_ACCESS_TOKEN',
      required: true,
      description: 'Supabase access token for database operations',
      placeholder: 'sbp_...'
    },
    {
      name: 'TAVILY_API_KEY',
      required: true,
      description: 'Tavily API key for web search functionality',
      placeholder: 'tvly-...'
    },
    {
      name: 'PERPLEXITY_API_KEY',
      required: true,
      description: 'Perplexity API key for AI-powered search',
      placeholder: 'pplx-...'
    },
    {
      name: 'KAGI_API_KEY',
      required: true,
      description: 'Kagi API key for premium search services',
      placeholder: 'KAGI_API_KEY'
    },
    {
      name: 'JINA_AI_API_KEY',
      required: true,
      description: 'Jina AI API key for content processing',
      placeholder: 'jina-...'
    },
    {
      name: 'BRAVE_API_KEY',
      required: true,
      description: 'Brave Search API key for web search',
      placeholder: 'BSA-...'
    },
    {
      name: 'FIRECRAWL_API_KEY',
      required: true,
      description: 'Firecrawl API key for web scraping',
      placeholder: 'fc-...'
    }
  ];

  /**
   * Validates all required API keys are present and properly formatted
   */
  public static validateApiKeys(): MCPValidationResult {
    const result: MCPValidationResult = {
      isValid: true,
      missingKeys: [],
      invalidKeys: [],
      warnings: []
    };

    for (const config of this.REQUIRED_API_KEYS) {
      const apiKey = process.env[config.name];

      if (!apiKey || apiKey.trim() === '') {
        result.missingKeys.push(config.name);
        result.isValid = false;
        continue;
      }

      // Validate API key format based on expected patterns
      const isValidFormat = this.validateApiKeyFormat(config.name, apiKey);
      if (!isValidFormat) {
        result.invalidKeys.push(config.name);
        result.isValid = false;
      }

      // Add warnings for placeholder values (likely not real keys)
      if (apiKey.includes('YOUR_') || apiKey.includes('_HERE') || apiKey.includes('...')) {
        result.warnings.push(`${config.name}: Appears to be using placeholder value`);
      }
    }

    return result;
  }

  /**
   * Validates the format of a specific API key
   */
  private static validateApiKeyFormat(keyName: string, apiKey: string): boolean {
    const formats: Record<string, RegExp> = {
      'GITHUB_PERSONAL_ACCESS_TOKEN': /^github_pat_[A-Za-z0-9_]+$/,
      'SUPABASE_ACCESS_TOKEN': /^sbp_[A-Za-z0-9_]+$/,
      'TAVILY_API_KEY': /^tvly-[A-Za-z0-9_]+$/,
      'PERPLEXITY_API_KEY': /^pplx-[A-Za-z0-9_]+$/,
      'KAGI_API_KEY': /^[A-Za-z0-9_]+$/,
      'JINA_AI_API_KEY': /^jina_[A-Za-z0-9_]+$/,
      'BRAVE_API_KEY': /^BSA[A-Za-z0-9_]+$/,
      'FIRECRAWL_API_KEY': /^fc-[A-Za-z0-9_]+$/
    };

    const expectedFormat = formats[keyName];
    return expectedFormat ? expectedFormat.test(apiKey) : apiKey.length > 10;
  }

  /**
   * Gets environment variable configuration for MCP servers
   */
  public static getMcpEnvironmentConfig(): Record<string, string> {
    const config: Record<string, string> = {};

    // Add all required API keys
    for (const apiKey of this.REQUIRED_API_KEYS) {
      const value = process.env[apiKey.name];
      if (value) {
        config[apiKey.name] = value;
      }
    }

    return config;
  }

  /**
   * Creates a secure error message for missing API keys
   */
  public static createSetupInstructions(validationResult: MCPValidationResult): string {
    let instructions = '🔧 MCP Server Setup Required\n\n';
    instructions += 'The following API keys are required but missing or invalid:\n\n';

    if (validationResult.missingKeys.length > 0) {
      instructions += '❌ Missing Keys:\n';
      for (const key of validationResult.missingKeys) {
        const config = this.REQUIRED_API_KEYS.find(k => k.name === key);
        instructions += `   • ${key}: ${config?.description}\n`;
      }
      instructions += '\n';
    }

    if (validationResult.invalidKeys.length > 0) {
      instructions += '⚠️ Invalid Format:\n';
      for (const key of validationResult.invalidKeys) {
        const config = this.REQUIRED_API_KEYS.find(k => k.name === key);
        instructions += `   • ${key}: Expected format - ${config?.placeholder}\n`;
      }
      instructions += '\n';
    }

    instructions += '📝 Setup Instructions:\n';
    instructions += '1. Create a .env file in your project root\n';
    instructions += '2. Add the following environment variables:\n\n';

    for (const config of this.REQUIRED_API_KEYS) {
      instructions += `   ${config.name}=your_${config.name.toLowerCase()}_here\n`;
    }

    instructions += '\n3. Restart your development environment\n';
    instructions += '4. Run MCP server validation to verify setup\n';

    return instructions;
  }

  /**
   * Tests MCP server connectivity with current configuration
   */
  public static async testMcpConnectivity(): Promise<{
    success: boolean;
    results: Record<string, { connected: boolean; error?: string; responseTime?: number }>;
  }> {
    const results: Record<string, { connected: boolean; error?: string; responseTime?: number }> = {};
    let overallSuccess = true;

    // Test each MCP server connection
    for (const config of this.REQUIRED_API_KEYS) {
      const startTime = Date.now();
      try {
        const apiKey = process.env[config.name];
        if (!apiKey) {
          results[config.name] = {
            connected: false,
            error: 'API key not configured'
          };
          overallSuccess = false;
          continue;
        }

        // Perform basic connectivity test based on API key type
        const isConnected = await this.testApiKeyConnectivity(config.name, apiKey);
        const responseTime = Date.now() - startTime;

        results[config.name] = {
          connected: isConnected,
          responseTime
        };

        if (!isConnected) {
          overallSuccess = false;
        }
      } catch (error) {
        results[config.name] = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        overallSuccess = false;
      }
    }

    return {
      success: overallSuccess,
      results
    };
  }

  /**
   * Tests connectivity for a specific API key
   */
  private static async testApiKeyConnectivity(keyName: string, apiKey: string): Promise<boolean> {
    // This is a placeholder for actual connectivity testing
    // In a real implementation, you would make actual API calls to test connectivity

    switch (keyName) {
      case 'GITHUB_PERSONAL_ACCESS_TOKEN':
        return apiKey.startsWith('github_pat_') && apiKey.length > 20;
      case 'SUPABASE_ACCESS_TOKEN':
        return apiKey.startsWith('sbp_') && apiKey.length > 20;
      case 'TAVILY_API_KEY':
        return apiKey.startsWith('tvly-') && apiKey.length > 20;
      case 'PERPLEXITY_API_KEY':
        return apiKey.startsWith('pplx-') && apiKey.length > 20;
      case 'KAGI_API_KEY':
        return apiKey.length > 10 && !apiKey.includes('YOUR');
      case 'JINA_AI_API_KEY':
        return apiKey.startsWith('jina_') && apiKey.length > 20;
      case 'BRAVE_API_KEY':
        return apiKey.startsWith('BSA') && apiKey.length > 20;
      case 'FIRECRAWL_API_KEY':
        return apiKey.startsWith('fc-') && apiKey.length > 20;
      default:
        return false;
    }
  }

  /**
   * Initializes MCP authentication with validation
   */
  public static async initialize(): Promise<void> {
    console.log('🔄 Initializing MCP Authentication Manager...');

    const validation = this.validateApiKeys();

    if (!validation.isValid) {
      const errorMessage = this.createSetupInstructions(validation);
      console.error('❌ MCP Authentication Setup Required:');
      console.error(errorMessage);

      // Throw error to prevent MCP server startup
      throw new Error('MCP authentication setup required. Please configure all required API keys.');
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ MCP Configuration Warnings:');
      for (const warning of validation.warnings) {
        console.warn(`   • ${warning}`);
      }
    }

    console.log('✅ MCP Authentication Manager initialized successfully');
  }
}
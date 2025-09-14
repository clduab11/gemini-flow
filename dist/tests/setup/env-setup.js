/**
 * Environment Setup for Tests
 * Configures environment variables and test-specific settings
 */
// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';
// Test database configuration
process.env.TEST_DB_PATH = './tests/temp/test.db';
process.env.SQLITE_MEMORY_MODE = 'false'; // Use file-based for testing persistence
// Mock API credentials for testing
process.env.TEST_PROJECT_ID = 'gemini-flow-test';
process.env.TEST_REGION = 'us-central1';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.VERTEX_PROJECT_ID = 'test-vertex-project';
process.env.VERTEX_LOCATION = 'us-central1';
// Test server configuration
process.env.TEST_SERVER_PORT = '3001';
process.env.TEST_SERVER_HOST = 'localhost';
// Security test configuration
process.env.TEST_ENCRYPTION_KEY = 'test-encryption-key-32-characters!';
process.env.TEST_JWT_SECRET = 'test-jwt-secret-for-authentication';
// Performance test thresholds
process.env.MAX_RESPONSE_TIME = '100';
process.env.MAX_MEMORY_USAGE = '104857600'; // 100MB
process.env.MAX_CPU_USAGE = '80';
// Hive coordination settings
process.env.HIVE_MEMORY_PATH = './tests/temp/hive-memory.json';
process.env.HIVE_COORDINATION_ENABLED = 'true';
// Logging configuration for tests
process.env.LOG_LEVEL = 'warn'; // Reduce noise during tests
process.env.LOG_FILE = './tests/temp/test.log';
// Disable external service calls in unit tests
process.env.MOCK_EXTERNAL_SERVICES = 'true';
// Test timeouts
process.env.TEST_TIMEOUT_SHORT = '5000';
process.env.TEST_TIMEOUT_MEDIUM = '30000';
process.env.TEST_TIMEOUT_LONG = '120000';
process.env.TEST_TIMEOUT_PERFORMANCE = '300000';
// Validation thresholds
process.env.PERFORMANCE_IMPROVEMENT_TARGET = '12'; // 12x improvement target
process.env.AUTH_RESPONSE_TIME_MAX = '2000';
process.env.MODEL_ROUTING_TIME_MAX = '100';
process.env.SQLITE_QUERY_TIME_MAX = '100';
// Security testing
process.env.SECURITY_AUDIT_ENABLED = 'true';
process.env.VULNERABILITY_SCAN_DEPTH = 'comprehensive';
process.env.PENETRATION_TEST_MODE = 'safe';
// Load testing configuration
process.env.LOAD_TEST_MAX_USERS = '1000';
process.env.LOAD_TEST_DURATION = '300000'; // 5 minutes
process.env.LOAD_TEST_RAMP_UP = '60000'; // 1 minute
// Error simulation settings
process.env.ERROR_SIMULATION_ENABLED = 'true';
process.env.CHAOS_TESTING_ENABLED = 'false'; // Disable by default
// Memory management for tests
process.env.NODE_OPTIONS = '--max-old-space-size=2048'; // 2GB for test processes
// Set up console overrides for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = (...args) => {
    if (process.env.VERBOSE_TESTS === 'true' || args[0]?.includes('✅') || args[0]?.includes('🚀')) {
        originalConsoleLog(...args);
    }
};
console.error = (...args) => {
    if (!args[0]?.includes('Warning:') && !args[0]?.includes('DeprecationWarning')) {
        originalConsoleError(...args);
    }
};
// Graceful shutdown for tests
process.on('SIGTERM', () => {
    console.log('Test process received SIGTERM, cleaning up...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('Test process received SIGINT, cleaning up...');
    process.exit(0);
});
// Handle unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in test environment, just log
});
// Global test configuration object
global.TEST_ENV_CONFIG = {
    isTestEnvironment: true,
    projectId: process.env.TEST_PROJECT_ID,
    region: process.env.TEST_REGION,
    serverPort: parseInt(process.env.TEST_SERVER_PORT),
    serverHost: process.env.TEST_SERVER_HOST,
    dbPath: process.env.TEST_DB_PATH,
    hiveMemoryPath: process.env.HIVE_MEMORY_PATH,
    thresholds: {
        responseTime: parseInt(process.env.MAX_RESPONSE_TIME),
        memoryUsage: parseInt(process.env.MAX_MEMORY_USAGE),
        cpuUsage: parseInt(process.env.MAX_CPU_USAGE),
        performanceImprovement: parseInt(process.env.PERFORMANCE_IMPROVEMENT_TARGET)
    },
    timeouts: {
        short: parseInt(process.env.TEST_TIMEOUT_SHORT),
        medium: parseInt(process.env.TEST_TIMEOUT_MEDIUM),
        long: parseInt(process.env.TEST_TIMEOUT_LONG),
        performance: parseInt(process.env.TEST_TIMEOUT_PERFORMANCE)
    }
};
console.log('🔧 Test environment configured');
console.log(`📊 Performance thresholds: Response time <${process.env.MAX_RESPONSE_TIME}ms, Memory <${Math.floor(parseInt(process.env.MAX_MEMORY_USAGE) / 1024 / 1024)}MB`);
console.log(`⏱️  Test timeouts: Short ${process.env.TEST_TIMEOUT_SHORT}ms, Long ${process.env.TEST_TIMEOUT_LONG}ms, Performance ${process.env.TEST_TIMEOUT_PERFORMANCE}ms`);
export {};
//# sourceMappingURL=env-setup.js.map
// Jest setup file for ES modules
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch globally
global.fetch = jest.fn();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.GOOGLE_AI_API_KEY = 'test-api-key';

// Increase timeout for integration tests
jest.setTimeout(30000);
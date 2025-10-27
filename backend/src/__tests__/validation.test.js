/**
 * Tests for Request Validation Middleware
 */

import { describe, it, expect } from '@jest/globals';
import { getObjectDepth } from '../api/middleware/validation.js';

describe('getObjectDepth', () => {
  it('should return 0 for primitive values', () => {
    expect(getObjectDepth(null)).toBe(0);
    expect(getObjectDepth(undefined)).toBe(0);
    expect(getObjectDepth(42)).toBe(0);
    expect(getObjectDepth('string')).toBe(0);
    expect(getObjectDepth(true)).toBe(0);
  });

  it('should return 0 for empty objects and arrays', () => {
    expect(getObjectDepth({})).toBe(0);
    expect(getObjectDepth([])).toBe(0);
  });

  it('should return 1 for flat objects', () => {
    expect(getObjectDepth({ a: 1, b: 2 })).toBe(1);
    expect(getObjectDepth([1, 2, 3])).toBe(1);
  });

  it('should calculate depth correctly for nested objects', () => {
    expect(getObjectDepth({ a: { b: 1 } })).toBe(2);
    expect(getObjectDepth({ a: { b: { c: 1 } } })).toBe(3);
    expect(getObjectDepth({ a: { b: { c: { d: 1 } } } })).toBe(4);
  });

  it('should calculate depth correctly for nested arrays', () => {
    expect(getObjectDepth([[1]])).toBe(2);
    expect(getObjectDepth([[[1]]])).toBe(3);
    expect(getObjectDepth([[[[1]]]])).toBe(4);
  });

  it('should calculate depth correctly for mixed nested structures', () => {
    expect(getObjectDepth({ a: [{ b: 1 }] })).toBe(3);
    expect(getObjectDepth([{ a: [1] }])).toBe(3);
  });

  it('should handle complex real-world structures', () => {
    const workflow = {
      nodes: [
        {
          id: 'node1',
          data: {
            label: 'Test',
            config: {
              settings: {
                value: 123
              }
            }
          }
        }
      ]
    };
    expect(getObjectDepth(workflow)).toBe(6);
  });

  it('should cut off at safety limit for deeply nested objects', () => {
    // Create a deeply nested object beyond safety cutoff (2x the configured limit)
    let deepObj = { value: 1 };
    for (let i = 0; i < 25; i++) {
      deepObj = { nested: deepObj };
    }
    // Should cut off at depth 21 (returns when depth > SAFETY_CUTOFF where SAFETY_CUTOFF = 20)
    expect(getObjectDepth(deepObj)).toBe(21);
  });
});

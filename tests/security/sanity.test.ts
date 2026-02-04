import { describe, expect, it } from 'bun:test';

describe('Security Sanity Tests', () => {
  it('should have bun test framework available', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should run basic assertions', () => {
    expect(true).toBe(true);
    expect(false).toBe(false);
    expect(1 + 1).toBe(2);
  });
});

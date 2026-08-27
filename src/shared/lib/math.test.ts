import { describe, expect, it } from 'vitest';
import { add } from '@/shared/lib/math';

describe('math', () => {
  it('adds two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
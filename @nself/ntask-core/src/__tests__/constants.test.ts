import { describe, it, expect } from 'vitest';
import { PRIORITY_ORDER, PRIORITY_LABELS_EN, PRIORITY_COLORS, comparePriority } from '../constants/priority.js';
import { MAX_TITLE_LEN, MAX_COMMENT_LEN, MAX_ATTACHMENT_BYTES } from '../constants/limits.js';

describe('PRIORITY_ORDER', () => {
  it('none has lowest weight', () => {
    expect(PRIORITY_ORDER['none']).toBe(0);
  });

  it('urgent has highest weight', () => {
    expect(PRIORITY_ORDER['urgent']).toBe(4);
  });
});

describe('PRIORITY_LABELS_EN', () => {
  it('covers all 5 priorities', () => {
    expect(Object.keys(PRIORITY_LABELS_EN)).toHaveLength(5);
  });
});

describe('PRIORITY_COLORS', () => {
  it('urgent has red bg', () => {
    expect(PRIORITY_COLORS['urgent'].bg).toContain('red');
  });
});

describe('comparePriority', () => {
  it('sorts urgent before high', () => {
    expect(comparePriority('urgent', 'high')).toBeLessThan(0);
  });

  it('sorts none after high', () => {
    expect(comparePriority('none', 'high')).toBeGreaterThan(0);
  });
});

describe('limits', () => {
  it('MAX_TITLE_LEN is 500', () => expect(MAX_TITLE_LEN).toBe(500));
  it('MAX_COMMENT_LEN is 10000', () => expect(MAX_COMMENT_LEN).toBe(10_000));
  it('MAX_ATTACHMENT_BYTES is 104857600', () => expect(MAX_ATTACHMENT_BYTES).toBe(104_857_600));
});

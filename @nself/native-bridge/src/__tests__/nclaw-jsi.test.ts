/**
 * @nself/native-bridge — NcLawJSIStub tests.
 *
 * Purpose: Verify that NcLawJSIStub throws NotImplementedError on every method,
 *          getNcLawJSI() returns the stub by default, and registerNcLawJSI()
 *          replaces the active implementation.
 *
 * QA-A: getNcLawJSI().memorySearch() → throws NotImplementedError.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNcLawJSI,
  NcLawJSIStub,
  NotImplementedError,
  registerNcLawJSI,
  type NcLawJSIInterface,
  type Memory,
  type Topic,
} from '../nclaw-jsi.js';

// Reset the registry to stub state before each test.
// We re-register a fresh stub so tests are isolated.
beforeEach(() => {
  registerNcLawJSI(new NcLawJSIStub());
});

describe('NcLawJSIStub', () => {
  it('memorySearch() throws NotImplementedError', async () => {
    const jsi = getNcLawJSI();
    await expect(jsi.memorySearch('test', 10)).rejects.toThrow(
      NotImplementedError,
    );
  });

  it('memoryInsert() throws NotImplementedError', async () => {
    const jsi = getNcLawJSI();
    await expect(
      jsi.memoryInsert({
        conversationId: 'conv-1',
        role: 'user',
        content: 'hello',
        model: null,
      }),
    ).rejects.toThrow(NotImplementedError);
  });

  it('queryKnowledge() throws NotImplementedError', async () => {
    const jsi = getNcLawJSI();
    await expect(jsi.queryKnowledge('what is X?')).rejects.toThrow(
      NotImplementedError,
    );
  });

  it('invokeTool() throws NotImplementedError', async () => {
    const jsi = getNcLawJSI();
    await expect(jsi.invokeTool('web_search', { q: 'test' })).rejects.toThrow(
      NotImplementedError,
    );
  });

  it('searchMemory() throws NotImplementedError', async () => {
    const jsi = getNcLawJSI();
    await expect(jsi.searchMemory('query', 5)).rejects.toThrow(
      NotImplementedError,
    );
  });

  it('NotImplementedError includes method name in message', async () => {
    const jsi = getNcLawJSI();
    try {
      await jsi.memorySearch('test', 1);
    } catch (e) {
      expect(e).toBeInstanceOf(NotImplementedError);
      expect((e as NotImplementedError).message).toContain('memorySearch');
      expect((e as NotImplementedError).code).toBe('nclaw_jsi_not_implemented');
    }
  });
});

describe('getNcLawJSI()', () => {
  it('returns stub by default', () => {
    const jsi = getNcLawJSI();
    expect(jsi).toBeInstanceOf(NcLawJSIStub);
  });

  it('returns registered impl after registerNcLawJSI()', () => {
    const mockImpl: NcLawJSIInterface = {
      async memorySearch(_q: string, _limit: number): Promise<Memory[]> {
        return [];
      },
      async memoryInsert() {
        return;
      },
      async queryKnowledge(_q: string): Promise<Topic[]> {
        return [];
      },
      async invokeTool(_name: string, _args: unknown): Promise<unknown> {
        return null;
      },
      async searchMemory(_q: string, _limit: number): Promise<Memory[]> {
        return [];
      },
    };

    registerNcLawJSI(mockImpl);
    expect(getNcLawJSI()).toBe(mockImpl);
  });

  it('mock impl resolves without throwing', async () => {
    const mockImpl: NcLawJSIInterface = {
      async memorySearch() {
        return [];
      },
      async memoryInsert() {
        return;
      },
      async queryKnowledge() {
        return [];
      },
      async invokeTool() {
        return null;
      },
      async searchMemory() {
        return [];
      },
    };

    registerNcLawJSI(mockImpl);
    const jsi = getNcLawJSI();
    await expect(jsi.memorySearch('test', 5)).resolves.toEqual([]);
    await expect(
      jsi.memoryInsert({
        conversationId: 'c',
        role: 'user',
        content: 'hi',
        model: null,
      }),
    ).resolves.toBeUndefined();
  });
});

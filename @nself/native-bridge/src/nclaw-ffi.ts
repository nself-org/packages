/**
 * @nself/native-bridge — nclaw Rust FFI re-binding seam (JSI stub).
 *
 * Purpose: Define the NclawFFIInterface TypeScript interface that nclaw/mobile
 *          will implement via JSI bindings when migrating from Flutter's dart:ffi
 *          to React Native's JSI in E3. This stub provides a safe placeholder
 *          that returns Result.err('not-implemented') until JSI is wired up.
 *
 *          WHY this seam exists here: native-bridge is the canonical boundary
 *          between JS code and native modules. The JSI binding is a native module;
 *          ergo its TS contract lives here, not in @nself/auth-core or app code.
 *
 * Inputs:  chat(input) — user message string; loadMemory() — none;
 *          syncMemory(data) — MemoryDump to persist.
 * Outputs: Result<T, AppError> — always Err('not-implemented') until E3 JSI impl lands.
 * Constraints: NclawFFIInterface MUST remain a TypeScript interface (not a class) so
 *              nclaw/mobile can provide its own JSI class as the concrete implementation.
 *              Do NOT add any mutable state or side effects to this module.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/native-bridge (nclaw FFI seam, E3 target)
 */

import { err, type Result, type AppError } from '@nself/errors';

/**
 * MemoryDump — opaque blob produced and consumed by the libnclaw Rust core.
 *
 * Shape is intentionally minimal here; the Rust side owns the canonical schema.
 * nclaw/mobile E3 will replace this with a generated type from the JSI binding.
 */
export interface MemoryDump {
  /** Serialized memory data (JSON or binary base64, determined by Rust core). */
  readonly payload: string;
  /** Unix epoch ms at which this dump was produced. */
  readonly capturedAt: number;
}

/**
 * NclawFFIInterface — the TypeScript surface of the libnclaw Rust core.
 *
 * Implemented by:
 *   - NclawFFIStub (this file) — returns not-implemented for all methods.
 *   - nclaw/mobile JSI binding (E3 ticket T-P3-E2-W5-S02-T01) — real impl.
 *
 * All methods are async to match JSI's promise-based JS bridge.
 */
export interface NclawFFIInterface {
  /**
   * Send a user message to the nclaw Rust inference engine.
   * @param input Raw user message text.
   * @returns Ok(response) — AI response string from libnclaw.
   * TODO_IMPLEMENT_VIA_JSI: nclaw/mobile E3 provides the JSI implementation.
   */
  chat(input: string): Promise<Result<string, AppError>>;

  /**
   * Load the persisted memory state from the Rust core.
   * @returns Ok(MemoryDump) on success.
   * TODO_IMPLEMENT_VIA_JSI: nclaw/mobile E3 provides the JSI implementation.
   */
  loadMemory(): Promise<Result<MemoryDump, AppError>>;

  /**
   * Persist an updated memory dump back into the Rust core's storage.
   * @param data The MemoryDump to persist.
   * @returns Ok(void) on success.
   * TODO_IMPLEMENT_VIA_JSI: nclaw/mobile E3 provides the JSI implementation.
   */
  syncMemory(data: MemoryDump): Promise<Result<void, AppError>>;
}

/**
 * NclawFFIStub — safe placeholder implementation returned by createNclawFFI()
 * until nclaw/mobile E3 wires up the real JSI binding.
 *
 * Returns Result.err('not-implemented') for every method so callers can detect
 * the absence of the native module and degrade gracefully.
 */
class NclawFFIStub implements NclawFFIInterface {
  private readonly _notImplemented: AppError = {
    code: 'internal',
    message:
      'NclawFFI not implemented: JSI binding not yet installed. ' +
      'See T-P3-E2-W5-S02-T01 for the nclaw/mobile E3 implementation.',
    status: 500,
  };

  async chat(_input: string): Promise<Result<string, AppError>> {
    return err(this._notImplemented);
  }

  async loadMemory(): Promise<Result<MemoryDump, AppError>> {
    return err(this._notImplemented);
  }

  async syncMemory(_data: MemoryDump): Promise<Result<void, AppError>> {
    return err(this._notImplemented);
  }
}

/**
 * createNclawFFI — factory that returns the active NclawFFIInterface.
 *
 * When nclaw/mobile E3 installs its JSI module it will replace this factory
 * with one that returns the real binding. Until then, the stub is returned.
 *
 * @returns NclawFFIInterface implementation (stub or JSI binding).
 */
export function createNclawFFI(): NclawFFIInterface {
  return new NclawFFIStub();
}

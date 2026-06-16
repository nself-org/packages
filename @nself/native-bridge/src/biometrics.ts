/**
 * @nself/native-bridge — Biometric authentication provider for React Native.
 *
 * Purpose: Typed interface wrapping expo-local-authentication so apps
 *          can trigger Face ID / fingerprint without direct expo dependency.
 *          Used by nclaw/mobile and nchat/mobile gate-screens.
 * Inputs:  reason (string) — human-readable prompt shown in the OS dialog.
 * Outputs: Result<boolean, AppError> — Ok(true) when authenticated.
 * Constraints: expo-local-authentication is a peer dep — not available in web/desktop;
 *              isAvailable() always returns false in simulators without enrolled biometrics.
 * SPORT: F13-CROSS-REPO-DEPS.md — @nself/native-bridge (biometrics seam)
 */

import { ok, err, type Result, type AppError } from '@nself/errors';

/**
 * BiometricsProvider — canonical contract for local biometric authentication.
 *
 * Implemented by ExpoLocalAuth in this module.
 * Consumed by app-level gate screens in nchat/mobile, nclaw/mobile.
 */
export interface BiometricsProvider {
  /** Returns true if the device has enrolled biometrics available. */
  isAvailable(): Promise<boolean>;
  /**
   * Prompt the user to authenticate using biometrics.
   * @param reason Human-readable string displayed in the OS prompt.
   * @returns Ok(true) on success, Ok(false) if the user cancels, Err on failure.
   */
  authenticate(reason: string): Promise<Result<boolean, AppError>>;
}

/**
 * ExpoLocalAuth — production implementation backed by expo-local-authentication.
 *
 * All expo-local-authentication calls are wrapped in try/catch → AppError{code:'internal'}.
 */
export class ExpoLocalAuth implements BiometricsProvider {
  async isAvailable(): Promise<boolean> {
    try {
      const LocalAuth = await import('expo-local-authentication');
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const isEnrolled = await LocalAuth.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  async authenticate(reason: string): Promise<Result<boolean, AppError>> {
    try {
      const LocalAuth = await import('expo-local-authentication');
      const result = await LocalAuth.authenticateAsync({ promptMessage: reason });
      return ok(result.success);
    } catch (cause) {
      return err({
        code: 'internal',
        message: `Biometric authentication failed: ${String(cause)}`,
        status: 500,
      });
    }
  }
}

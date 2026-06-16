/**
 * @nself/native-bridge — React Native native-module abstraction layer.
 *
 * Purpose: Single typed surface for all native capabilities consumed by nSelf
 *          mobile apps (nchat/mobile, nclaw/mobile, ntask/mobile, ntv/mobile,
 *          nfamily, clawde/mobile). Wraps expo-secure-store, expo-notifications,
 *          expo-local-authentication, and the libnclaw Rust→RN JSI seam.
 *
 * Inputs:  None — packages are consumed as interfaces; implementations are
 *          registered by each app's native-module bootstrap.
 *
 * Outputs: Typed interfaces for every native capability + NcLawJSI seam.
 *
 * Constraints: This package is the SINGLE source of truth for libnclaw types
 *              in the TypeScript world. nclaw/mobile must NOT duplicate types.
 *
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/native-bridge
 */

// SecureStore — encrypted on-device key-value storage for auth tokens
export type { SecureStoreInterface } from './secure-store.js';
export { ExpoSecureStore } from './secure-store.js';

// Push notifications — permission request + Expo push token retrieval
export type { PushTokenProvider } from './push.js';
export { ExpoNotificationsProvider } from './push.js';

// Biometrics — Face ID / fingerprint local authentication
export type { BiometricsProvider } from './biometrics.js';
export { ExpoLocalAuth } from './biometrics.js';

// nclaw Rust FFI seam — simplified Result-typed interface for pre-E3 builds
export type { NclawFFIInterface, MemoryDump } from './nclaw-ffi.js';
export { createNclawFFI } from './nclaw-ffi.js';

// NcLawJSI interface spec — full libnclaw Rust→RN JSI seam (E4 implementation target)
export type {
  // Core nclaw types (1:1 from nclaw/core/src/types.rs)
  Conversation,
  ContentPart,
  Memory,
  MemoryInsertTurn,
  MemorySearchArgs,
  MemoryType,
  Message,
  MessageContent,
  MessageMetadata,
  MessageRole,
  KnowledgeQueryArgs,
  ToolCall,
  ToolCallResult,
  ToolCallStatus,
  ToolInvokeArgs,
  Topic,
  // JSI interface
  NcLawJSIInterface,
  // chatSend return type
  ChatSendResult,
} from './nclaw-jsi.js';

export {
  // Implementation + registry
  NcLawJSIStub,
  NotImplementedError,
  getNcLawJSI,
  registerNcLawJSI,
} from './nclaw-jsi.js';

// NclawModule — full libnclaw FFI JSI bridge via react-native-nitro-modules.
// Covers all FFI audit §5 groups (A: crypto, B: dampers, C: core, D: db/llm/vault/sync).
// Primary entry point for nclaw/mobile:
//   import { NativeNclaw } from '@nself/native-bridge';
//   await NativeNclaw.chatSend('hello');
export type {
  NativeDeviceKeypair,
  NativeSessionCipher,
  NclawCryptoModule,
  NclawDampersModule,
  NclawCoreModule,
  NclawDbModule,
  NclawLlmModule,
  NclawVaultModule,
  NclawSyncModule,
  NclawModule,
} from './NclawModule.nitro.js';

export {
  NclawModuleNotImplementedError,
  NclawModuleStub,
  getNativeNclaw,
  registerNativeNclaw,
  NativeNclaw,
} from './NclawModule.nitro.js';

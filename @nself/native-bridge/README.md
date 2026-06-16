# @nself/native-bridge

React Native native-module abstraction layer for nSelf mobile apps.

Provides typed TypeScript interfaces for SecureStore, push notifications, biometrics, and the libnclaw Rust→RN JSI seam. All nSelf mobile apps (`nchat/mobile`, `nclaw/mobile`, `ntask/mobile`, `ntv/mobile`, `nfamily`, `clawde/mobile`) consume native capabilities exclusively through this package.

---

## Surfaces

| Module | File | What it wraps |
|--------|------|---------------|
| SecureStore | `secure-store.ts` | `expo-secure-store` — encrypted key-value storage |
| Push tokens | `push.ts` | `expo-notifications` — push permission + token retrieval |
| Biometrics | `biometrics.ts` | `expo-local-authentication` — Face ID / fingerprint |
| NclawFFI (legacy) | `nclaw-ffi.ts` | Opaque Rust FFI blob seam (pre-JSI placeholder) |
| **NcLawJSI** | **`nclaw-jsi.ts`** | **Full libnclaw Rust→RN JSI seam (react-native-nitro-modules target)** |

---

## NcLawJSI Seam — libnclaw Rust→RN JSI Surface

The highest-risk dependency in the Flutter→React Native migration is the `nclaw/mobile` app's `dart:ffi` bindings to `libnclaw` (Rust). These bindings exposed four core types (`Message`, `Topic`, `Memory`, `Conversation`) and several operations on them.

`nclaw-jsi.ts` replaces those bindings with a TypeScript-first JSI interface that `nclaw/mobile` will implement via `react-native-nitro-modules` in E4.

### Type Mapping (nclaw/core/src/types.rs → TypeScript)

| Rust struct | TypeScript interface | Notes |
|-------------|---------------------|-------|
| `Message` | `Message` | `tool_calls` → `toolCalls`; `conversation_id` → `conversationId` |
| `Conversation` | `Conversation` | `message_count` → `messageCount`; `is_pinned` → `isPinned` |
| `Memory` | `Memory` | `memory_type` → `memoryType`; `topic_id` → `topicId` |
| `Topic` | `Topic` | `entity_count` → `entityCount`; `conversation_count` → `conversationCount` |
| `MessageRole` | `MessageRole` | Enum → string literal union |
| `MemoryType` | `MemoryType` | Enum → string literal union |
| `ToolCall` | `ToolCall` | `tool_name` → `toolName` |
| `ToolCallStatus` | `ToolCallStatus` | Enum → string literal union |
| `ToolCallResult` | `ToolCallResult` | `is_error` → `isError`; `duration_ms` → `durationMs` |
| `MessageContent` | `MessageContent` | `String` → `string`; `Parts` → `ContentPart[]` |
| `ContentPart` | `ContentPart` | Tagged union; `mime_type` → `mimeType`; `tool_call_id` → `toolCallId` |
| `MessageMetadata` | `MessageMetadata` | All snake_case → camelCase |

Field name mapping rule: Rust `snake_case` → TypeScript `camelCase`. UUIDs (`Uuid`) → `string`. `DateTime<Utc>` → ISO-8601 `string`. `Option<T>` → `T | null`. `Vec<T>` → `T[]`. `serde_json::Value` → `unknown`.

### Cross-Reference Gaps

| Rust type | Notes |
|-----------|-------|
| `Entity` | Defined in `types.rs` but not exposed via JSI — nclaw Rust core handles entity operations internally. Not in `NcLawJSIInterface`. |
| `Plugin` | Server-side only — not part of the client JSI surface. |
| `Document` | Server-side only — not part of the client JSI surface. |
| `UserIdentity` | Auth context is handled by `@nself/auth-core`, not libnclaw JSI. |
| `ServerInfo` | HTTP response type — not part of JSI surface. |
| `f32` confidence in `Memory` | Represented as `number` in TypeScript (JS has no f32 distinction). |

### Interface

```typescript
interface NcLawJSIInterface {
  memorySearch(query: string, limit: number): Promise<Memory[]>;
  memoryInsert(turn: MemoryInsertTurn): Promise<void>;
  queryKnowledge(query: string): Promise<Topic[]>;
  invokeTool(name: string, args: unknown): Promise<unknown>;
  searchMemory(query: string, limit: number): Promise<Memory[]>; // alias for dart:ffi compat
}
```

### Stub + Registry Pattern

Until `nclaw/mobile` implements the native module (E4 scope), `getNcLawJSI()` returns `NcLawJSIStub`. The stub throws `NotImplementedError` on every method call — by design; silent no-ops would mask the missing native module.

```typescript
import { getNcLawJSI, registerNcLawJSI } from '@nself/native-bridge';

// Default: stub (throws NotImplementedError on every call)
const jsi = getNcLawJSI();

// After nclaw/mobile E4 registers the real native module:
registerNcLawJSI(realNativeModule);
const jsi = getNcLawJSI(); // returns the real implementation
```

### E4 Implementation Pattern (react-native-nitro-modules)

In E4 (`T-P3-E4-W2-S3-T03`), `nclaw/mobile` will:

1. Add `react-native-nitro-modules` as a dependency.
2. Generate a Nitro Module spec file that mirrors `NcLawJSIInterface`.
3. Implement the native module in Swift (iOS) and Kotlin (Android), calling into `libnclaw` via FFI.
4. In the module's bootstrap code, call `registerNcLawJSI(nativeModuleInstance)` once.

After registration, all `@nself/native-bridge` consumers automatically use the real JSI implementation without any code changes.

The `NcLawJSIInterface` defined in this package is the **binding contract** between the TypeScript world and the Rust world. The native module must implement every method exactly as typed — no additional methods, no changed signatures.

---

## Usage

```typescript
import {
  // SecureStore
  type SecureStoreInterface,
  ExpoSecureStore,

  // Push
  type PushTokenProvider,
  ExpoNotificationsProvider,

  // Biometrics
  type BiometricsProvider,
  ExpoLocalAuth,

  // NcLawJSI
  type NcLawJSIInterface,
  type Message,
  type Memory,
  type Topic,
  type Conversation,
  NcLawJSIStub,
  getNcLawJSI,
  registerNcLawJSI,
} from '@nself/native-bridge';
```

---

## SPORT

- `F13-CROSS-REPO-DEPS.md`: `nclaw/core types.rs → @nself/native-bridge NcLawJSI`
- `F08-SERVICE-INVENTORY.md`: `@nself/native-bridge` package entry

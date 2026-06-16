/**
 * @nself/native-bridge — NcLawJSI interface spec: libnclaw Rust→RN JSI seam.
 *
 * Purpose: Defines the typed TypeScript interface that nclaw/mobile will implement
 *          via react-native-nitro-modules to expose the libnclaw Rust FFI surface
 *          to React Native JavaScript. This seam replaces nclaw/mobile's dart:ffi
 *          bindings (types.dart) with a JSI-native equivalent.
 *
 * Inputs:  Types 1:1 mapped from nclaw/core/src/types.rs structs (camelCase JS names).
 *          Methods mirror the Rust FFI surface: memory ops, knowledge graph, tool invocation.
 *
 * Outputs: NcLawJSIInterface — the contract nclaw/mobile must fulfil in its native module.
 *          NcLawJSIStub — NOT_IMPLEMENTED stub (present until nclaw/mobile E4 is done).
 *          getNcLawJSI() — runtime seam: returns the registered native impl or the stub.
 *
 * Constraints: This is the ONLY place libnclaw types are defined in TypeScript.
 *              nclaw/mobile MUST import from @nself/native-bridge, never duplicate.
 *              No @nself/errors dependency here — the interface returns raw values so
 *              the native module can return errors via the RN JSI promise rejection path.
 *
 * SPORT: F13-CROSS-REPO-DEPS.md — nclaw/core types.rs → @nself/native-bridge NcLawJSI
 *
 * Cross-ref: nclaw/core/src/types.rs (authoritative Rust types)
 *            T-P3-E2-W3-S03-T02 — this seam definition ticket
 *            T-P3-E4-W2-S3-T03  — nclaw/mobile native module implementation (E4 scope)
 */

// =============================================================================
// Types: 1:1 map from nclaw/core/src/types.rs
// Field names are camelCased (Rust snake_case → JS camelCase).
// UUIDs represented as string; DateTime<Utc> as ISO-8601 string.
// =============================================================================

/**
 * MessageRole — mirrors nclaw/core/src/types.rs MessageRole enum.
 * Serde attribute: rename_all = "lowercase".
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * A single part of a multimodal message.
 * Mirrors nclaw/core/src/types.rs ContentPart enum (tag = "type", rename_all = "snake_case").
 */
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; mimeType: string }
  | { type: 'file'; url: string; name: string; mimeType: string }
  | { type: 'tool_result'; toolCallId: string; content: string; isError: boolean };

/**
 * The content of a message — text or multimodal parts.
 * Mirrors nclaw/core/src/types.rs MessageContent enum (untagged).
 */
export type MessageContent = string | ContentPart[];

/**
 * Metadata attached to a message.
 * Mirrors nclaw/core/src/types.rs MessageMetadata struct.
 */
export interface MessageMetadata {
  inputTokens: number | null;
  outputTokens: number | null;
  firstTokenMs: number | null;
  fromCache: boolean;
}

/**
 * ToolCallStatus — mirrors nclaw/core/src/types.rs ToolCallStatus enum.
 * Serde attribute: rename_all = "snake_case".
 */
export type ToolCallStatus = 'running' | 'success' | 'error';

/**
 * The result of a completed tool call.
 * Mirrors nclaw/core/src/types.rs ToolCallResult struct.
 */
export interface ToolCallResult {
  content: string;
  isError: boolean;
  durationMs: number;
}

/**
 * A tool call made by the AI assistant.
 * Mirrors nclaw/core/src/types.rs ToolCall struct.
 * Note: ToolCall.input is serde_json::Value in Rust → unknown in TS.
 */
export interface ToolCall {
  id: string;
  toolName: string;
  input: unknown;
  status: ToolCallStatus;
  result: ToolCallResult | null;
}

/**
 * A single message in a conversation.
 * Mirrors nclaw/core/src/types.rs Message struct.
 */
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContent;
  createdAt: string;
  model: string | null;
  toolCalls: ToolCall[];
  metadata: MessageMetadata;
}

/**
 * A conversation between a user and an AI assistant.
 * Mirrors nclaw/core/src/types.rs Conversation struct.
 */
export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isPinned: boolean;
  branchParentId: string | null;
}

/**
 * MemoryType — mirrors nclaw/core/src/types.rs MemoryType enum.
 * Serde attribute: rename_all = "snake_case".
 */
export type MemoryType =
  | 'fact'
  | 'preference'
  | 'goal'
  | 'event'
  | 'relationship'
  | 'rule';

/**
 * A persistent memory or fact extracted from conversations.
 * Mirrors nclaw/core/src/types.rs Memory struct.
 */
export interface Memory {
  id: string;
  userId: string;
  topicId: string | null;
  content: string;
  memoryType: MemoryType;
  createdAt: string;
  updatedAt: string;
  confidence: number;
  sources: string[];
}

/**
 * A topic or cluster in the user's knowledge graph.
 * Mirrors nclaw/core/src/types.rs Topic struct.
 */
export interface Topic {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  entityCount: number;
  conversationCount: number;
}

// =============================================================================
// Method argument/return types for the JSI interface
// =============================================================================

/** Arguments for memorySearch / searchMemory operations. */
export interface MemorySearchArgs {
  query: string;
  limit: number;
}

/** A turn to insert into persistent memory. */
export interface MemoryInsertTurn {
  conversationId: string;
  role: MessageRole;
  content: string;
  model: string | null;
}

/** Arguments for knowledge graph queries. */
export interface KnowledgeQueryArgs {
  query: string;
}

/** Arguments for tool invocation via JSI. */
export interface ToolInvokeArgs {
  name: string;
  args: unknown;
}

// =============================================================================
// NcLawJSIInterface — the contract nclaw/mobile must fulfil in its native module
// =============================================================================

/**
 * NcLawJSIInterface — typed TypeScript interface for the libnclaw Rust→RN JSI seam.
 *
 * nclaw/mobile's native module (react-native-nitro-modules implementation) must
 * fulfil this interface exactly. This is the single agreed seam between the
 * TypeScript world and the Rust libnclaw FFI.
 *
 * All methods are async (return Promise) because JSI bridge calls are asynchronous
 * from the JS thread's perspective, even when the Rust side is synchronous.
 */
export interface NcLawJSIInterface {
  /**
   * Search persistent memories by semantic similarity.
   *
   * @param query  — natural-language search string
   * @param limit  — max number of Memory results to return
   * @returns      list of matching Memory objects, ordered by relevance
   */
  memorySearch(query: string, limit: number): Promise<Memory[]>;

  /**
   * Insert a conversation turn into persistent memory.
   * The Rust side extracts facts, preferences, and events from the turn.
   *
   * @param turn  — the message turn to persist
   * @returns     void on success; throws on storage failure
   */
  memoryInsert(turn: MemoryInsertTurn): Promise<void>;

  /**
   * Query the knowledge graph for topics and entities matching a query.
   *
   * @param query  — natural-language question or entity name
   * @returns      matching Topic objects
   */
  queryKnowledge(query: string): Promise<Topic[]>;

  /**
   * Invoke a named nSelf tool via the libnclaw tool-dispatch layer.
   *
   * @param name  — tool identifier (e.g. "web_search", "calendar_read")
   * @param args  — tool-specific argument payload
   * @returns     tool result payload; throws on invocation error
   */
  invokeTool(name: string, args: unknown): Promise<unknown>;

  /**
   * Alias for memorySearch — kept for compatibility with the Flutter
   * lib/src/rust/api/types.dart searchMemory() binding.
   *
   * @param query  — natural-language search string
   * @param limit  — max number of Memory results to return
   * @returns      list of matching Memory objects, ordered by relevance
   */
  searchMemory(query: string, limit: number): Promise<Memory[]>;
}

// =============================================================================
// NotImplementedError — thrown by NcLawJSIStub for every method
// =============================================================================

/**
 * Thrown by NcLawJSIStub when a method is called before the native module
 * is registered by nclaw/mobile (E4 scope).
 */
export class NotImplementedError extends Error {
  readonly code = 'nclaw_jsi_not_implemented' as const;

  constructor(method: string) {
    super(
      `NcLawJSI.${method}() is not implemented. ` +
        'The nclaw/mobile native module (react-native-nitro-modules) has not been registered. ' +
        'This stub is replaced by the real implementation when nclaw/mobile is fully migrated (E4).',
    );
    this.name = 'NotImplementedError';
  }
}

// =============================================================================
// NcLawJSIStub — NOT_IMPLEMENTED placeholder (real impl in nclaw/mobile native module)
// =============================================================================

/**
 * NcLawJSIStub — implements NcLawJSIInterface with NotImplementedError throws.
 *
 * This stub is the default implementation returned by getNcLawJSI() until
 * nclaw/mobile registers the real react-native-nitro-modules implementation
 * in E4. Every method throw is intentional — silent no-ops would mask the
 * missing native module at runtime.
 *
 * Usage: do NOT call methods on this stub in production; register the real
 *        implementation via registerNcLawJSI() before any JSI calls.
 */
export class NcLawJSIStub implements NcLawJSIInterface {
  async memorySearch(_query: string, _limit: number): Promise<Memory[]> {
    throw new NotImplementedError('memorySearch');
  }

  async memoryInsert(_turn: MemoryInsertTurn): Promise<void> {
    throw new NotImplementedError('memoryInsert');
  }

  async queryKnowledge(_query: string): Promise<Topic[]> {
    throw new NotImplementedError('queryKnowledge');
  }

  async invokeTool(_name: string, _args: unknown): Promise<unknown> {
    throw new NotImplementedError('invokeTool');
  }

  async searchMemory(_query: string, _limit: number): Promise<Memory[]> {
    throw new NotImplementedError('searchMemory');
  }
}

// =============================================================================
// Registry — runtime registration/retrieval of the real native implementation
// =============================================================================

/** Module-level registry holding the active NcLawJSI implementation. */
let _registry: NcLawJSIInterface = new NcLawJSIStub();

/**
 * Register the real NcLawJSI implementation.
 *
 * Called once by nclaw/mobile's native module bootstrap (E4 scope).
 * After registration, getNcLawJSI() returns the real implementation.
 *
 * @param impl — the native module instance implementing NcLawJSIInterface
 */
export function registerNcLawJSI(impl: NcLawJSIInterface): void {
  _registry = impl;
}

/**
 * Retrieve the active NcLawJSI implementation.
 *
 * Returns the stub (NcLawJSIStub) until registerNcLawJSI() is called.
 * Returns the real native implementation after E4 registration.
 *
 * Pattern: callers always call getNcLawJSI().memorySearch(...) rather than
 *          holding a reference, so hot-swapping works correctly in tests.
 */
export function getNcLawJSI(): NcLawJSIInterface {
  return _registry;
}

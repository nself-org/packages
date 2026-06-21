/**
 * nclaw-jsi.types.ts — TypeScript mirror types for nclaw/core/src/types.rs.
 *
 * Purpose: Define all TypeScript types that are 1:1 mirrors of the Rust structs
 *          in nclaw/core/src/types.rs. Extracted from nclaw-jsi.ts to keep both
 *          files under the 300-line cap. Consumed by nclaw-jsi.ts (interface spec)
 *          and transitively by nclaw/mobile.
 *
 * Inputs:  (none — pure type definitions)
 * Outputs: MessageRole, ContentPart, MessageContent, MessageMetadata, ToolCallStatus,
 *          ToolCallResult, ToolCall, Message, Conversation, MemoryType, Memory, Topic,
 *          MemorySearchArgs, MemoryInsertTurn, KnowledgeQueryArgs, ToolInvokeArgs.
 * Constraints:
 *   - Field names are camelCased (Rust snake_case → JS camelCase).
 *   - UUIDs represented as string; DateTime<Utc> as ISO-8601 string.
 *   - This is the ONLY place libnclaw types are defined in TypeScript.
 *     nclaw/mobile MUST import from @nself/native-bridge, never duplicate.
 * SPORT: F13-CROSS-REPO-DEPS.md — nclaw/core types.rs → @nself/native-bridge NcLawJSI
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

// @nself/config — shared configuration and security utilities
// TODO: Implement additional shared configuration (T04)

export { sanitize, sanitizeWith } from './security/sanitize';
export type { SanitizeOptions, SanitizeProfile } from './security/sanitize';

// CSP and security headers baseline (T-P3-E1-W3-S5-T09)
export { buildCsp, nselfBaseHeaders } from './security';
export type { CspOptions, SecurityHeader } from './security';

// Auth dual-transport session getters (T-P3-E1-W3-S6-T11)
// ADR: .claude/docs/decisions/auth-transport-security.md
export { getWebSession, getNativeSession, getTauriSession } from './auth/index.js';

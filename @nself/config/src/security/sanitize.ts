/**
 * Purpose: XSS-safe HTML sanitization for all nSelf surfaces.
 * WHY: dangerouslySetInnerHTML and raw HTML rendering in MDX/web are injection vectors.
 *   DOMPurify removes script/event-handler injection. isomorphic-dompurify works in
 *   Node.js (Astro SSR) and in the browser (Vite/RN WebView).
 * Inputs: dirty — untrusted HTML string from user content, CMS, or external APIs.
 * Outputs: sanitized HTML string safe for innerHTML/dangerouslySetInnerHTML.
 * Constraints:
 *   - Conservative allowlist: no script, iframe, form, input, object, embed.
 *   - FORBID_TAGS explicitly blocks script/iframe in addition to the allowlist.
 *   - Apps needing a richer tag set MUST define a named profile and call sanitizeWith().
 *   - CSP headers (T09) are defense-in-depth, NOT a substitute for sanitize().
 * SPORT: F08-SERVICE-INVENTORY — @nself/config security utilities
 */

import DOMPurify from 'isomorphic-dompurify';

/** Conservative tag allowlist. No executable surface. */
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'a',
  'ul', 'ol', 'li',
  'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'hr', 'span',
] as const;

/** Only href/target/rel on anchor; no event handlers, no data-* by default. */
const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel'] as const;

export interface SanitizeOptions {
  /** Override the tag allowlist. Extend conservatively — never add script/iframe. */
  allowedTags?: string[];
  /** Override the attribute allowlist. */
  allowedAttr?: string[];
}

/**
 * Sanitizes raw HTML to prevent XSS.
 * Use before ANY dangerouslySetInnerHTML or raw HTML rendering.
 *
 * @example
 *   // Correct:
 *   <div dangerouslySetInnerHTML={{ __html: sanitize(post.body) }} />
 *
 *   // WRONG — never do this:
 *   <div dangerouslySetInnerHTML={{ __html: post.body }} />
 */
export function sanitize(dirty: string, options?: SanitizeOptions): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags ?? [...DEFAULT_ALLOWED_TAGS],
    ALLOWED_ATTR: options?.allowedAttr ?? [...DEFAULT_ALLOWED_ATTR],
    // Explicit block-list as defense-in-depth (allowlist already excludes these)
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  });
}

/**
 * Sanitize with a named profile for specific surfaces.
 * Use when the default tag set is too restrictive for a known safe context.
 *
 * @example
 *   sanitizeWith('<figure><img src="..."/></figure>', 'blog-content')
 */
export type SanitizeProfile = 'default' | 'blog-content' | 'plain-text-only';

const PROFILE_OPTIONS: Record<SanitizeProfile, SanitizeOptions> = {
  'default': {},
  'blog-content': {
    allowedTags: [
      ...DEFAULT_ALLOWED_TAGS,
      'figure', 'figcaption', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttr: [...DEFAULT_ALLOWED_ATTR, 'src', 'alt', 'width', 'height'],
  },
  'plain-text-only': {
    allowedTags: [],
    allowedAttr: [],
  },
};

/**
 * sanitizeWith — sanitize an HTML string using a named profile.
 *
 * Purpose: Apply a pre-defined allowlist (SanitizeProfile) to untrusted HTML input
 *          before rendering. Prevents XSS by stripping tags/attributes not in the
 *          profile.
 * Inputs:  dirty — raw untrusted HTML string.
 *          profile — named profile key from PROFILE_OPTIONS.
 * Outputs: Sanitized HTML string safe for innerHTML assignment.
 * Constraints: 'plain-text-only' strips ALL tags; use for user-provided text content.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/config security utilities
 */
export function sanitizeWith(dirty: string, profile: SanitizeProfile): string {
  return sanitize(dirty, PROFILE_OPTIONS[profile]);
}

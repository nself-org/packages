/**
 * stylelint-plugin/index.js
 *
 * Stylelint plugin: tailwind-brand/no-hardcoded-colors
 *
 * Enforces brand-token-only color usage in Tailwind arbitrary-value syntax.
 * Integrates as a CI gate for nSelf web/ subapps.
 *
 * Rules:
 *   tailwind-brand/no-hardcoded-colors
 *     - bg-[#...]   → error unless the hex is in the explicit BG_ALLOWLIST
 *     - text-[#...] → error, zero allowlist (no hardcoded text colors permitted)
 *
 * Allowlist:
 *   BG_ALLOWLIST:   ['#0B0B14', '#0b0b14'] (redesign page-bg-dark only)
 *   TEXT_ALLOWLIST: [] (empty — zero hardcoded text colors)
 *
 * Usage in .stylelintrc.json:
 *   {
 *     "plugins": ["./packages/tailwind-brand/stylelint-plugin/index.js"],
 *     "rules": {
 *       "tailwind-brand/no-hardcoded-colors": true
 *     }
 *   }
 */

'use strict'

// ---------------------------------------------------------------------------
// Allowlists
// ---------------------------------------------------------------------------

/**
 * Exact hex literals permitted inside bg-[#...] arbitrary values.
 * Only the A2 redesign page background is allowed.
 *
 * Case-insensitive comparison is applied at check-time.
 */
const BG_ALLOWLIST = new Set([
  '#0B0B14',
  '#0b0b14',
])

/**
 * Permitted hex literals inside text-[#...] arbitrary values.
 * Empty — zero hardcoded text colors allowed.
 */
const TEXT_ALLOWLIST = new Set()

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/**
 * Matches Tailwind arbitrary-value bg-[#RRGGBB] or bg-[#RGB] usage.
 * Captures the hex value (including the leading #).
 *
 * Examples matched:
 *   bg-[#0B0B14]   bg-[#fff]   bg-[#AABBCC]   bg-[#aabbcc99]
 *   dark:bg-[#123]   hover:bg-[#456789]
 */
const BG_HEX_PATTERN = /bg-\[(#[0-9a-fA-F]{3,8})\]/g

/**
 * Matches Tailwind arbitrary-value text-[#RRGGBB] or text-[#RGB] usage.
 * Captures the hex value.
 *
 * Examples matched:
 *   text-[#123456]   text-[#fff]   dark:text-[#aaa]
 */
const TEXT_HEX_PATTERN = /text-\[(#[0-9a-fA-F]{3,8})\]/g

// ---------------------------------------------------------------------------
// Rule messages
// ---------------------------------------------------------------------------

const messages = {
  rejectedBgColor(hex) {
    return (
      `Hardcoded color "bg-[${hex}]" is not in the brand token allowlist. ` +
      `Use a brand utility class (bg-brand-bg, bg-brand-surface, bg-page-dark, etc.) ` +
      `or add the color to @nself/tailwind-brand tokens. ` +
      `Only bg-[#0B0B14] is allowed.`
    )
  },
  rejectedTextColor(hex) {
    return (
      `Hardcoded color "text-[${hex}]" is forbidden. ` +
      `Use a brand utility class (text-brand-primary, text-brand-ink, text-brand-muted, etc.). ` +
      `No hardcoded text hex colors are permitted.`
    )
  },
}

// ---------------------------------------------------------------------------
// Rule meta
// ---------------------------------------------------------------------------

const meta = {
  url: 'https://github.com/nself-org/web/tree/main/packages/tailwind-brand/stylelint-plugin',
}

// ---------------------------------------------------------------------------
// Rule implementation
// ---------------------------------------------------------------------------

/**
 * Stylelint rule: tailwind-brand/no-hardcoded-colors
 *
 * This rule scans the raw source of each declaration for Tailwind
 * arbitrary-value color patterns. It works by inspecting the raw
 * text of nodes so it catches both class-attribute strings in CSS
 * and @apply statements.
 *
 * @param {import('stylelint').RuleContext} primary - boolean (true to enable)
 * @returns {import('stylelint').Rule}
 */
function rule(primary) {
  return (root, result) => {
    // Rule is opt-in — skip if not enabled
    if (!primary) return

    /**
     * Report a violation for a given node.
     *
     * @param {object} node       - PostCSS node
     * @param {string} message    - Human-readable message
     * @param {number} [index]    - Character offset into node value
     * @param {number} [endIndex] - End offset
     */
    function reportProblem(node, message, index, endIndex) {
      result.warn(message, {
        node,
        result,
        ruleName: 'tailwind-brand/no-hardcoded-colors',
        index,
        endIndex,
        severity: 'error',
      })
    }

    /**
     * Scan a raw string for bg-[#...] and text-[#...] violations.
     *
     * @param {object} node   - PostCSS node owning this text
     * @param {string} text   - Raw text to scan
     * @param {number} offset - Character offset of `text` within node's prop+value
     */
    function scanText(node, text, offset) {
      // --- bg-[#...] checks ---
      let match
      const bgPat = new RegExp(BG_HEX_PATTERN.source, 'g')
      while ((match = bgPat.exec(text)) !== null) {
        const hex = match[1]
        if (!BG_ALLOWLIST.has(hex)) {
          reportProblem(
            node,
            messages.rejectedBgColor(hex),
            offset + match.index,
            offset + match.index + match[0].length,
          )
        }
      }

      // --- text-[#...] checks ---
      const textPat = new RegExp(TEXT_HEX_PATTERN.source, 'g')
      while ((match = textPat.exec(text)) !== null) {
        const hex = match[1]
        if (!TEXT_ALLOWLIST.has(hex)) {
          reportProblem(
            node,
            messages.rejectedTextColor(hex),
            offset + match.index,
            offset + match.index + match[0].length,
          )
        }
      }
    }

    // Walk all CSS declarations
    root.walkDecls((decl) => {
      // Check the declaration value (e.g. @apply bg-[#123456])
      if (decl.value) {
        scanText(decl, decl.value, decl.prop ? decl.prop.length + 1 : 0)
      }
    })

    // Walk @apply at-rules (common in Tailwind projects)
    root.walkAtRules('apply', (atRule) => {
      if (atRule.params) {
        scanText(atRule, atRule.params, '@apply '.length)
      }
    })

    // Walk rule selectors (class-in-selector edge cases, e.g. JIT selector hacks)
    root.walkRules((cssRule) => {
      if (cssRule.selector) {
        scanText(cssRule, cssRule.selector, 0)
      }
    })
  }
}

rule.ruleName = 'tailwind-brand/no-hardcoded-colors'
rule.messages = messages
rule.meta = meta

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

/**
 * Stylelint plugin export.
 *
 * Register in .stylelintrc.json:
 *   {
 *     "plugins": ["./packages/tailwind-brand/stylelint-plugin/index.js"],
 *     "rules": { "tailwind-brand/no-hardcoded-colors": true }
 *   }
 */
const plugin = {
  ruleName: rule.ruleName,
  rule,
  meta,
}

module.exports = plugin
module.exports.default = plugin

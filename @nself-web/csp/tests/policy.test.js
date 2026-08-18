import { describe, it, expect } from 'vitest';
import { buildCspHeader, buildCspHeaderObject, buildCspDirectives, serializeCspDirectives, buildReportToHeader, KNOWN_SUBAPPS, CSP_REPORT_TO_GROUP, CSP_REPORT_LOCAL_PATH, } from '../src/index';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Parse a CSP header string into a Record<directive, value[]>.
 */
function parseCspHeader(header) {
    const result = {};
    for (const part of header.split(';')) {
        const trimmed = part.trim();
        if (!trimmed)
            continue;
        const [directive, ...values] = trimmed.split(/\s+/);
        result[directive] = values;
    }
    return result;
}
// ---------------------------------------------------------------------------
// Base policy
// ---------------------------------------------------------------------------
describe('buildCspHeader — base policy', () => {
    it('returns a non-empty string', () => {
        const header = buildCspHeader('docs', { isDev: false });
        expect(typeof header).toBe('string');
        expect(header.length).toBeGreaterThan(0);
    });
    it("includes default-src 'self'", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['default-src']).toContain("'self'");
    });
    it("includes script-src 'self' and 'unsafe-inline' (required for Next.js RSC)", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['script-src']).toContain("'self'");
        expect(directives['script-src']).toContain("'unsafe-inline'");
    });
    it("does NOT include 'unsafe-eval' in any directive (CR-C gate)", () => {
        const header = buildCspHeader('docs', { isDev: false });
        expect(header).not.toContain('unsafe-eval');
    });
    it('does NOT include wildcard * in any directive (CR-C gate)', () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        for (const [directive, values] of Object.entries(directives)) {
            for (const v of values) {
                expect(v, `wildcard found in ${directive}`).not.toBe('*');
            }
        }
    });
    it("includes style-src 'unsafe-inline' (required for Tailwind)", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['style-src']).toContain("'unsafe-inline'");
    });
    it("includes img-src 'self' data: https:", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['img-src']).toContain("'self'");
        expect(directives['img-src']).toContain('data:');
        expect(directives['img-src']).toContain('https:');
    });
    it('includes font-src https://fonts.gstatic.com', () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['font-src']).toContain('https://fonts.gstatic.com');
    });
    it('includes connect-src api.nself.org and ping.nself.org', () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['connect-src']).toContain('https://api.nself.org');
        expect(directives['connect-src']).toContain('https://ping.nself.org');
    });
    it("includes frame-src 'none' for non-Stripe subapps", () => {
        for (const subapp of ['docs', 'ntv', 'ntask', 'nchat', 'nclaw', 'nfamily', 'clawde', 'base', 'install', 'status']) {
            const directives = parseCspHeader(buildCspHeader(subapp, { isDev: false }));
            expect(directives['frame-src'], `frame-src should be 'none' for ${subapp}`).toContain("'none'");
            expect(directives['frame-src'], `Stripe should not be in frame-src for ${subapp}`).not.toContain('https://billing.stripe.com');
        }
    });
    it("includes object-src 'none'", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['object-src']).toContain("'none'");
    });
    it("includes base-uri 'self'", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['base-uri']).toContain("'self'");
    });
    it("includes form-action 'self'", () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['form-action']).toContain("'self'");
    });
    it('includes report-uri stub', () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['report-uri']).toContain('https://csp-report.nself.org/csp-violations');
    });
    it('includes local /api/csp-report in report-uri (A4-T05)', () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['report-uri']).toContain('/api/csp-report');
    });
    it('includes report-to csp-endpoint directive (A4-T05)', () => {
        const directives = parseCspHeader(buildCspHeader('docs', { isDev: false }));
        expect(directives['report-to']).toContain('csp-endpoint');
    });
});
// ---------------------------------------------------------------------------
// Stripe subapp extensions — org
// ---------------------------------------------------------------------------
describe("buildCspHeader('org') — Stripe allowlist", () => {
    it('includes js.stripe.com in script-src', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['script-src']).toContain('https://js.stripe.com');
    });
    it('includes billing.stripe.com in frame-src', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['frame-src']).toContain('https://billing.stripe.com');
    });
    it('includes js.stripe.com in frame-src (for 3DS challenge frames)', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['frame-src']).toContain('https://js.stripe.com');
    });
    it("does NOT include redundant 'none' in frame-src (CSP3: 'none' ignored alongside other sources)", () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        // Per CSP3 spec: when other sources are listed, 'none' is ignored — keep array clean
        expect(directives['frame-src']).toEqual(['https://js.stripe.com', 'https://billing.stripe.com']);
    });
    it('includes hooks.stripe.com in connect-src', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['connect-src']).toContain('https://hooks.stripe.com');
    });
    it('includes api.github.com in connect-src (changelog API)', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['connect-src']).toContain('https://api.github.com');
    });
    it('still includes api.nself.org in connect-src after extension', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['connect-src']).toContain('https://api.nself.org');
    });
});
// ---------------------------------------------------------------------------
// Stripe subapp extensions — cloud
// ---------------------------------------------------------------------------
describe("buildCspHeader('cloud') — Stripe allowlist", () => {
    it('includes billing.stripe.com in frame-src', () => {
        const directives = parseCspHeader(buildCspHeader('cloud', { isDev: false }));
        expect(directives['frame-src']).toContain('https://billing.stripe.com');
    });
    it('includes js.stripe.com in script-src', () => {
        const directives = parseCspHeader(buildCspHeader('cloud', { isDev: false }));
        expect(directives['script-src']).toContain('https://js.stripe.com');
    });
    it("does NOT include redundant 'none' in frame-src (CSP3: 'none' ignored alongside other sources)", () => {
        const directives = parseCspHeader(buildCspHeader('cloud', { isDev: false }));
        // Per CSP3 spec: when other sources are listed, 'none' is ignored — keep array clean
        expect(directives['frame-src']).toEqual(['https://js.stripe.com', 'https://billing.stripe.com']);
    });
    it('includes hooks.stripe.com in connect-src', () => {
        const directives = parseCspHeader(buildCspHeader('cloud', { isDev: false }));
        expect(directives['connect-src']).toContain('https://hooks.stripe.com');
    });
    it('does NOT include api.github.com (cloud has no changelog API)', () => {
        const directives = parseCspHeader(buildCspHeader('cloud', { isDev: false }));
        expect(directives['connect-src']).not.toContain('https://api.github.com');
    });
});
// ---------------------------------------------------------------------------
// Development mode
// ---------------------------------------------------------------------------
describe('buildCspHeader — development mode', () => {
    it('includes ws://localhost:* in connect-src when isDev=true', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: true }));
        expect(directives['connect-src']).toContain('ws://localhost:*');
    });
    it('includes http://localhost:* in connect-src when isDev=true', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: true }));
        expect(directives['connect-src']).toContain('http://localhost:*');
    });
    it('does NOT include ws://localhost:* when isDev=false', () => {
        const directives = parseCspHeader(buildCspHeader('org', { isDev: false }));
        expect(directives['connect-src']).not.toContain('ws://localhost:*');
    });
});
// ---------------------------------------------------------------------------
// buildCspHeaderObject — security header bundle
// ---------------------------------------------------------------------------
describe('buildCspHeaderObject', () => {
    // A4-T01 spec: default mode is report-only
    it('default mode emits Content-Security-Policy-Report-Only (not enforce)', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        expect(headers['Content-Security-Policy-Report-Only']).toBeTruthy();
        expect(typeof headers['Content-Security-Policy-Report-Only']).toBe('string');
        expect(headers['Content-Security-Policy']).toBeUndefined();
    });
    it('mode: enforce emits Content-Security-Policy (not report-only)', () => {
        const headers = buildCspHeaderObject('org', { isDev: false, mode: 'enforce' });
        expect(headers['Content-Security-Policy']).toBeTruthy();
        expect(typeof headers['Content-Security-Policy']).toBe('string');
        expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined();
    });
    it('mode: report-only explicitly also emits Content-Security-Policy-Report-Only', () => {
        const headers = buildCspHeaderObject('org', { isDev: false, mode: 'report-only' });
        expect(headers['Content-Security-Policy-Report-Only']).toBeTruthy();
        expect(headers['Content-Security-Policy']).toBeUndefined();
    });
    it('report-only CSP value contains expected directives', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        const cspValue = headers['Content-Security-Policy-Report-Only'];
        expect(cspValue).toContain("default-src 'self'");
    });
    it('includes Strict-Transport-Security with max-age=31536000', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
        expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
    });
    it('includes X-Content-Type-Options: nosniff', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });
    it('includes X-Frame-Options: DENY', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        expect(headers['X-Frame-Options']).toBe('DENY');
    });
    it('includes Referrer-Policy', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        expect(headers['Referrer-Policy']).toBeTruthy();
    });
    it('includes Permissions-Policy', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        expect(headers['Permissions-Policy']).toBeTruthy();
    });
});
// ---------------------------------------------------------------------------
// serializeCspDirectives round-trip
// ---------------------------------------------------------------------------
describe('serializeCspDirectives', () => {
    it('produces a parseable CSP string', () => {
        const directives = buildCspDirectives('org', { isDev: false });
        const serialized = serializeCspDirectives(directives);
        expect(() => parseCspHeader(serialized)).not.toThrow();
        expect(serialized).toContain("default-src 'self'");
    });
    it('separates directives with semicolons', () => {
        const directives = buildCspDirectives('org', { isDev: false });
        const serialized = serializeCspDirectives(directives);
        expect(serialized).toContain(';');
    });
});
// ---------------------------------------------------------------------------
// KNOWN_SUBAPPS
// ---------------------------------------------------------------------------
describe('KNOWN_SUBAPPS', () => {
    it('includes all 12 subapps', () => {
        const expected = ['org', 'cloud', 'docs', 'install', 'ntask', 'nchat', 'nclaw', 'nfamily', 'ntv', 'clawde', 'base', 'status'];
        for (const subapp of expected) {
            expect(KNOWN_SUBAPPS).toContain(subapp);
        }
    });
    it('has 12 entries', () => {
        expect(KNOWN_SUBAPPS).toHaveLength(12);
    });
});
// ---------------------------------------------------------------------------
// CR-C security gate: no critical bypass patterns
// ---------------------------------------------------------------------------
describe('CR-C security gate', () => {
    it('no subapp has unsafe-eval in script-src', () => {
        for (const subapp of KNOWN_SUBAPPS) {
            const header = buildCspHeader(subapp, { isDev: false });
            expect(header, `unsafe-eval found for ${subapp}`).not.toContain('unsafe-eval');
        }
    });
    it('no subapp has wildcard * in any directive', () => {
        for (const subapp of KNOWN_SUBAPPS) {
            const directives = parseCspHeader(buildCspHeader(subapp, { isDev: false }));
            for (const [directive, values] of Object.entries(directives)) {
                for (const v of values) {
                    expect(v, `wildcard * in ${directive} for ${subapp}`).not.toBe('*');
                }
            }
        }
    });
    it('Stripe domains are scoped to org and cloud only (not ntv, ntask, docs, etc.)', () => {
        const stripeHosts = ['https://js.stripe.com', 'https://billing.stripe.com', 'https://hooks.stripe.com'];
        const noStripeSubapps = ['docs', 'ntv', 'ntask', 'nchat', 'nclaw', 'nfamily', 'clawde', 'base', 'install', 'status'];
        for (const subapp of noStripeSubapps) {
            const header = buildCspHeader(subapp, { isDev: false });
            for (const stripeHost of stripeHosts) {
                expect(header, `Stripe host ${stripeHost} found in ${subapp} CSP`).not.toContain(stripeHost);
            }
        }
    });
    it('frame-src is none for non-Stripe subapps (no iframe injection vector)', () => {
        const noStripeSubapps = ['docs', 'ntv', 'ntask', 'nchat', 'nclaw', 'nfamily', 'clawde', 'install', 'status'];
        for (const subapp of noStripeSubapps) {
            const directives = parseCspHeader(buildCspHeader(subapp, { isDev: false }));
            expect(directives['frame-src'], `frame-src not 'none' for ${subapp}`).toContain("'none'");
            expect(directives['frame-src'], `frame-src should have only 'none' for ${subapp}`).toHaveLength(1);
        }
    });
    it('object-src is none for all subapps (no plugin vectors)', () => {
        for (const subapp of KNOWN_SUBAPPS) {
            const directives = parseCspHeader(buildCspHeader(subapp, { isDev: false }));
            expect(directives['object-src'], `object-src not 'none' for ${subapp}`).toContain("'none'");
        }
    });
});
// ---------------------------------------------------------------------------
// A4-T05 — CSP violation reporting (report-uri + report-to + Report-To header)
// ---------------------------------------------------------------------------
describe('buildReportToHeader (A4-T05)', () => {
    it('returns a single-line JSON string (no newlines)', () => {
        const value = buildReportToHeader();
        expect(typeof value).toBe('string');
        expect(value).not.toContain('\n');
    });
    it('parses to a valid Reporting API group object', () => {
        const value = buildReportToHeader();
        const parsed = JSON.parse(value);
        expect(parsed.group).toBe(CSP_REPORT_TO_GROUP);
        expect(typeof parsed.max_age).toBe('number');
        expect(parsed.max_age).toBeGreaterThan(0);
        expect(Array.isArray(parsed.endpoints)).toBe(true);
        expect(parsed.endpoints[0].url).toBe(CSP_REPORT_LOCAL_PATH);
    });
    it('honours endpoint override', () => {
        const value = buildReportToHeader({ endpoint: 'https://example.com/r' });
        expect(JSON.parse(value).endpoints[0].url).toBe('https://example.com/r');
    });
    it('honours max_age override', () => {
        const value = buildReportToHeader({ maxAgeSeconds: 3600 });
        expect(JSON.parse(value).max_age).toBe(3600);
    });
});
describe('buildCspHeaderObject — Report-To header (A4-T05)', () => {
    it('emits a Report-To header for every subapp', () => {
        for (const subapp of KNOWN_SUBAPPS) {
            const headers = buildCspHeaderObject(subapp, { isDev: false });
            expect(headers['Report-To'], `Report-To missing for ${subapp}`).toBeTruthy();
        }
    });
    it('Report-To group name matches the CSP report-to directive value', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        const reportTo = JSON.parse(headers['Report-To']);
        expect(reportTo.group).toBe(CSP_REPORT_TO_GROUP);
        // CSP report-to directive must reference the same group name
        const csp = headers['Content-Security-Policy-Report-Only'];
        expect(csp).toContain(`report-to ${CSP_REPORT_TO_GROUP}`);
    });
    it('CSP value remains a single-line string (no newlines after Report-To addition)', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        const csp = headers['Content-Security-Policy-Report-Only'];
        expect(csp).not.toContain('\n');
    });
    it('CSP retains existing Stripe + connect directives after report-to addition', () => {
        const headers = buildCspHeaderObject('org', { isDev: false });
        const csp = headers['Content-Security-Policy-Report-Only'];
        expect(csp).toContain('https://js.stripe.com');
        expect(csp).toContain('https://billing.stripe.com');
        expect(csp).toContain('https://api.nself.org');
    });
});

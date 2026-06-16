/**
 * Purpose: Unit tests for sanitize() / sanitizeWith() XSS-safe rendering utilities.
 * QA-A compliance: covers script removal, safe tag preservation, javascript: href removal.
 */

import { sanitize, sanitizeWith } from '../sanitize';

describe('sanitize()', () => {
  it('(QA-A a) removes script tags and their content', () => {
    const result = sanitize('<script>alert(1)</script>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
    // Either empty string or whitespace only
    expect(result.trim()).toBe('');
  });

  it('(QA-A b) preserves safe p + em markup intact', () => {
    const input = '<p>Hello <em>world</em></p>';
    const result = sanitize(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<em>world</em>');
    expect(result).toContain('</p>');
  });

  it('(QA-A c) removes javascript: href', () => {
    const result = sanitize('<a href="javascript:void(0)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('removes iframe tags', () => {
    const result = sanitize('<iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
  });

  it('removes inline event handlers', () => {
    const result = sanitize('<p onclick="evil()">text</p>');
    expect(result).not.toContain('onclick');
  });

  it('removes onerror on img tags (img not in default allowlist)', () => {
    const result = sanitize('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
  });

  it('removes style attributes (potential CSS injection)', () => {
    const result = sanitize('<p style="display:none">hidden</p>');
    expect(result).not.toContain('style=');
  });

  it('preserves allowed heading tags', () => {
    const result = sanitize('<h1>Title</h1><h2>Sub</h2>');
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<h2>Sub</h2>');
  });

  it('preserves code and pre tags', () => {
    const result = sanitize('<pre><code>const x = 1;</code></pre>');
    expect(result).toContain('<pre>');
    expect(result).toContain('<code>');
  });

  it('preserves anchor with safe href', () => {
    const result = sanitize('<a href="https://nself.org" rel="noopener">link</a>');
    expect(result).toContain('href="https://nself.org"');
    expect(result).toContain('rel="noopener"');
  });

  it('removes form and input tags', () => {
    const result = sanitize('<form><input type="text" name="pw"></form>');
    expect(result).not.toContain('<form');
    expect(result).not.toContain('<input');
  });
});

describe('sanitizeWith() profiles', () => {
  it('plain-text-only strips all HTML', () => {
    const result = sanitizeWith('<p><strong>bold</strong></p>', 'plain-text-only');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('bold');
  });

  it('blog-content allows img with src/alt', () => {
    const result = sanitizeWith('<img src="photo.jpg" alt="photo">', 'blog-content');
    expect(result).toContain('src="photo.jpg"');
    expect(result).toContain('alt="photo"');
  });

  it('blog-content still strips script', () => {
    const result = sanitizeWith('<script>evil()</script>', 'blog-content');
    expect(result).not.toContain('<script');
  });
});

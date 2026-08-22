import { describe, it, expect } from 'vitest';
import {
  GET_ATTACHMENTS,
  CREATE_ATTACHMENT,
  DELETE_ATTACHMENT,
} from '../operations/attachments.js';

/**
 * These assert the shape of the attachment operations against the actual
 * np_attachments schema and its Hasura insert permission.
 *
 * Both halves have been wrong in production before:
 *
 *  - The web app carried its own hand-written copy of these queries that asked
 *    for `filename`, `size_bytes` and `user_id`. The real columns are
 *    `file_name`, `file_size_bytes` and `uploader_id`, and Hasura applies no
 *    aliasing, so every attachment query failed validation. Its unit test
 *    passed because the fixtures repeated the same wrong names — the client and
 *    the test agreed with each other and both disagreed with the server.
 *
 *  - `bucket` used to be sent on insert. It is not client-insertable:
 *    getDownloadUrl honours attachment.bucket and then signs the key with the
 *    storage root credentials, so a caller-chosen bucket allowed cross-bucket
 *    traversal.
 *
 * Asserting on the query text is deliberate. Without a live schema in unit
 * tests, the field names are the only thing that can be checked, and they are
 * exactly what drifted.
 */
describe('attachment operations match the np_attachments schema', () => {
  const all = [GET_ATTACHMENTS, CREATE_ATTACHMENT, DELETE_ATTACHMENT];

  it.each([
    ['filename', 'file_name'],
    ['size_bytes', 'file_size_bytes'],
    ['user_id', 'uploader_id'],
  ])('never uses the non-existent column %s (real column: %s)', (wrong, right) => {
    for (const op of all) {
      // Word-boundary match so file_name does not trip the `filename` check and
      // file_size_bytes does not trip `size_bytes`.
      expect(op).not.toMatch(new RegExp(`(?<![a-z_])${wrong}(?![a-z_])`));
    }
    expect(all.some((op) => op.includes(right))).toBe(true);
  });

  it('reads the columns that actually exist', () => {
    for (const field of ['uploader_id', 'storage_key', 'bucket', 'file_name', 'file_size_bytes']) {
      expect(GET_ATTACHMENTS).toContain(field);
    }
  });

  it('does not send bucket on insert — the role cannot set it', () => {
    const objectArg = CREATE_ATTACHMENT.slice(
      CREATE_ATTACHMENT.indexOf('object: {'),
      CREATE_ATTACHMENT.indexOf('}) {'),
    );
    expect(objectArg).not.toContain('bucket');
    expect(CREATE_ATTACHMENT).not.toContain('$bucket');
  });

  it('does not send uploader_id on insert — Hasura presets it to the caller', () => {
    expect(CREATE_ATTACHMENT).not.toContain('uploader_id:');
    expect(CREATE_ATTACHMENT).not.toContain('$uploaderId');
  });

  it('still returns bucket so callers can see what the server chose', () => {
    expect(CREATE_ATTACHMENT.slice(CREATE_ATTACHMENT.indexOf('}) {'))).toContain('bucket');
  });
});

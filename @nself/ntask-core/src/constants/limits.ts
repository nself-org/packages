/**
 * Domain constants matching DB CHECK constraints.
 * Keep in sync with migrations; any change here needs a corresponding migration.
 * SPORT: Part of @nself/ntask-core.
 */

export const MAX_TITLE_LEN = 500;
export const MAX_COMMENT_LEN = 10_000;
export const MAX_LIST_TITLE_LEN = 200;
export const MAX_TAG_NAME_LEN = 50;
export const MAX_SUBTASK_TITLE_LEN = 500;
export const MAX_ATTACHMENT_BYTES = 104_857_600; // 100 MiB per migration 011 CHECK
export const MAX_NOTE_LEN = 10_000;
export const MAX_DESCRIPTION_LEN = 2_000;

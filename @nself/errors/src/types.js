/**
 * AppError — discriminated union for all nSelf application errors.
 *
 * Purpose: Single canonical error type propagated through Result<T, AppError>
 *          across all nSelf surfaces (web, mobile, desktop, CLI SDK).
 * Inputs:  None — pure type definitions.
 * Outputs: AppError union, individual error tag types, and AppErrorCode literal union.
 * Constraints: 8 canonical error codes — do not add new codes here without a PCI;
 *              every code must map to an HTTP status in the `status` field.
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/errors (implementation)
 */
export {};
//# sourceMappingURL=types.js.map
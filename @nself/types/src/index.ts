/**
 * @nself/types — canonical shared TypeScript type definitions for all nSelf surfaces.
 *
 * Purpose: Single source of truth for cross-surface contracts. Every nSelf app,
 *          plugin, and shared package imports from here — never redeclares.
 * Contents:
 *   result   — Result<T,E>, Ok<T>, Err<E>, ok(), err(), isOk(), isErr()
 *   errors   — AppError discriminated union (8 canonical error codes)
 *   auth     — Session, User, UserRole, JWTPayload
 *   multi-tenant — MultiAppIsolation, CloudTenancy, WithIsolation<T>, WithTenancy<T>
 *   bundles  — BundleId, PricingTier, Bundle, BundlePrice, BUNDLE_PRICE
 * SPORT: F13-CROSS-REPO-DEPS.md row @nself/types (implementation)
 */

export type {
  Ok,
  Err,
  Result,
} from './result.js';

export {
  ok,
  err,
  isOk,
  isErr,
} from './result.js';

export type {
  AppErrorCode,
  AppError,
  AuthFailedError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  RateLimitedError,
  InternalError,
  LicenseRequiredError,
  TenantMismatchError,
} from './errors.js';

export type {
  UserRole,
  User,
  Session,
  JWTPayload,
} from './auth.js';

export type {
  MultiAppIsolation,
  CloudTenancy,
  WithIsolation,
  WithTenancy,
  AssertDistinct,
} from './multi-tenant.js';

export type {
  BundleId,
  SubscriptionInterval,
  PricingTier,
  BundlePrice,
  Bundle,
} from './bundles.js';

export {
  BUNDLE_PRICE,
  NSELF_PLUS_PRICE,
} from './bundles.js';

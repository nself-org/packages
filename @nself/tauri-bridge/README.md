# @nself/tauri-bridge

Tauri 2 IPC abstraction layer for nSelf desktop apps. Wraps `@tauri-apps/api` with typed
`Result<T, AppError>` returns and gracefully stubs all calls when running in a browser
(dev mode, SSR, or non-desktop context).

## Overview

| Module | Exports | Purpose |
|--------|---------|---------|
| `bridge.ts` | `isTauri()`, `TauriBridge`, `bridge` | Runtime detection + singleton |
| `ipc.ts` | `invoke<T>()` | Typed Tauri command caller |
| `window.ts` | `WindowManager` | Named window lifecycle |
| `update.ts` | `AutoUpdater`, `UpdateManifest` | Auto-update flow |
| `shell.ts` | `openUrl()` | Allowlist-gated system browser |

## IPC pattern

All nSelf desktop code calls `invoke()` instead of `@tauri-apps/api/core` directly:

```typescript
import { invoke } from '@nself/tauri-bridge';
import { isOk, isErr } from '@nself/errors';

const result = await invoke<{ id: string }>('get_user', { token: myToken });
if (isOk(result)) {
  console.log(result.value.id);
} else {
  console.error(result.error.message);
}
```

## Stub mode (browser dev)

When `window.__TAURI__` is absent (browser, Node, SSR), `isTauri()` returns `false` and
every method returns `Result.err` immediately — no `@tauri-apps/api` import is attempted.
This means desktop apps can be iterated in a browser without the full Tauri runtime.

```typescript
import { isTauri, invoke } from '@nself/tauri-bridge';

if (!isTauri()) {
  // Safe — no Tauri runtime needed.
}

const result = await invoke<string>('ping');
// In browser: result._tag === 'Err', result.error.message contains 'not-tauri'
```

## Allowlist configuration

`openUrl()` validates the target hostname before calling the system opener:

```typescript
import { openUrl } from '@nself/tauri-bridge';
import { isErr } from '@nself/errors';

const ALLOWED = ['nself.org', 'docs.nself.org', 'github.com'];

const result = await openUrl('https://evil.com', ALLOWED);
// result._tag === 'Err', code 'forbidden' — shell.open never called

const ok = await openUrl('https://nself.org/pricing', ALLOWED);
// result._tag === 'Ok' — system browser opens the URL
```

Allowlist entries are **exact hostname matches** (no glob, no wildcards).
An empty allowlist rejects all URLs.

## Window management

```typescript
import { WindowManager } from '@nself/tauri-bridge';

const wm = new WindowManager();

// Create or focus-if-exists:
await wm.create('settings', 'tauri://localhost/settings');

await wm.minimize('settings');
await wm.maximize('settings');
await wm.focus('settings');
await wm.close('settings'); // also removed from internal ref map
```

Closed windows are pruned from the internal map both eagerly (on `close()`) and via the
`tauri://destroyed` event — preventing memory leaks from dangling refs.

## Auto-updater

```typescript
import { AutoUpdater } from '@nself/tauri-bridge';
import { isOk } from '@nself/errors';

const updater = new AutoUpdater();
const check = await updater.check();

if (isOk(check) && check.value !== null) {
  console.log('Update available:', check.value.version);
  await updater.downloadAndInstall();
  // App will restart automatically.
}
```

The updater requires `tauri-plugin-updater` to be enabled in each app's `tauri.conf.json`.
This package only provides the typed wrapper — server configuration lives in `src-tauri/`.

## SPORT

Row: `F13-CROSS-REPO-DEPS.md` — `@nself/tauri-bridge` (wraps `@tauri-apps/api`; stub mode for browser dev).

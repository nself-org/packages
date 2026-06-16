# @nself/push-client

Unified push notification client for nSelf — web (Web Push API + service worker) and React Native (Expo Notifications) with GraphQL backend token registration.

## Overview

All nSelf apps call `createPushClient()` — no platform-specific push code lives in app repositories.

```ts
import { createPushClient, PushPermission } from '@nself/push-client';
```

## Platform Setup

### Web — Service Worker

The web client registers `/sw.js` by default. Your app must serve a service worker at that path.

```ts
// public/sw.js — minimal push service worker
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Notification', {
      body: data.body,
    })
  );
});
```

Custom path:

```ts
const client = createPushClient('web', {
  gqlClient,
  swPath: '/push-sw.js',
});
```

### React Native — Expo Configuration

Add `expo-notifications` to your Expo app config:

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
    ]
  }
}
```

## Usage

### Web

```ts
import { createPushClient, PushPermission, isOk } from '@nself/push-client';
import { NselfGraphqlClient } from '@nself/graphql-client';

const gqlClient = NselfGraphqlClient({ url: 'https://api.nself.org/v1/graphql' });
const client = createPushClient('web', { gqlClient });

// Request permission
const permResult = await client.requestPermission();
if (permResult._tag === 'Err') {
  // Already denied — do not prompt again
  return;
}

if (permResult.value === PushPermission.GRANTED) {
  // Register token with nSelf backend (idempotent)
  await client.registerWithBackend();
}
```

### React Native

```ts
import { createPushClient, PushPermission } from '@nself/push-client';
import { ExpoNotificationsProvider } from '@nself/native-bridge';
import { NselfGraphqlClient } from '@nself/graphql-client';

const gqlClient = NselfGraphqlClient({ url: 'https://api.nself.org/v1/graphql' });
const client = createPushClient('native', {
  gqlClient,
  pushTokenProvider: new ExpoNotificationsProvider(),
});

const perm = await client.requestPermission();
if (perm._tag === 'Ok' && perm.value === PushPermission.GRANTED) {
  await client.registerWithBackend();
}
```

## Registration Flow

1. `requestPermission()` — checks/requests OS permission; returns `PushPermission`.
2. `getToken()` — retrieves the push token (web: PushSubscription endpoint; native: Expo token).
3. `registerWithBackend()` — upserts the token into `np_device_tokens` via GraphQL mutation.

`registerWithBackend()` calls `getToken()` internally — no need to call `getToken()` separately.

## API Reference

### `createPushClient(platform, deps)`

Factory function — the only public instantiation path.

| Parameter | Type | Description |
|-----------|------|-------------|
| `platform` | `'web' \| 'native'` | Target platform |
| `deps.gqlClient` | `GqlClientDeps` | GraphQL executor (urql Client compatible) |
| `deps.swPath` | `string` (web only) | Service worker path; default `/sw.js` |
| `deps.pushTokenProvider` | `PushTokenProvider` (native only) | From `@nself/native-bridge` |

### `PushPermission`

| Value | Meaning |
|-------|---------|
| `GRANTED` | OS permission granted |
| `DENIED` | OS permission denied; no prompt will be shown |
| `NOT_ASKED` | Permission has not been requested |

### `PushClient` interface

```ts
interface PushClient {
  requestPermission(): Promise<Result<PushPermission, AppError>>;
  getToken(): Promise<Result<DeviceToken, AppError>>;
  registerWithBackend(): Promise<Result<void, AppError>>;
}
```

## Backend Schema

The `registerWithBackend()` call upserts into `np_device_tokens`:

| Column | Type | Notes |
|--------|------|-------|
| `device_id` | TEXT | Stable per-install identifier |
| `token` | TEXT | Push endpoint or Expo token |
| `platform` | TEXT | `'web'` or `'native'` |

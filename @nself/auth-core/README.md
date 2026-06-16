# @nself/auth-core

Dual-transport authentication layer for all nSelf surfaces. Handles httpOnly cookie sessions (web) and Bearer token + SecureStore (React Native / Tauri desktop), with automatic JWT refresh and a urql authExchange.

## Transports

### Web — httpOnly Cookie

The browser never sees the access token in JavaScript. Auth state is read from `/api/auth/me`, which the server resolves via its httpOnly session cookie.

- `getAccessToken()` returns `null` — the cookie is sent by the browser automatically
- Never calls `localStorage`, `sessionStorage`, or `document.cookie`
- Hasura receives the JWT via the server-side session, not a JS-injected header

### Native — Bearer + SecureStore

For React Native (Expo SecureStore) and Tauri desktop (keytar via tauri-bridge). The `SecureStoreInterface` abstraction is implemented by `@nself/native-bridge` and `@nself/tauri-bridge`.

- `getAccessToken()` returns the current JWT — authExchange injects `Authorization: Bearer <token>`
- TokenPair stored in platform secure storage under `@nself/auth-core/*` keys
- Automatic proactive refresh at `expiresAt - 60s`

## SecureStoreInterface

```ts
interface SecureStoreInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}
```

Provide an implementation from `@nself/native-bridge` (Expo) or `@nself/tauri-bridge` (desktop).

## nHost Integration

JWT refresh calls nHost's `/token/refresh` endpoint. On 401, the strategy emits `unauthenticated` — no retry loop. On success, the new `TokenPair` is stored in SecureStore and the refresh loop is rescheduled.

## Usage

### Web App (React + Vite)

```tsx
import { createWebAuthStrategy, NselfAuthProvider, useAuth } from '@nself/auth-core';
import { NselfGraphqlClient } from '@nself/graphql-client';
import { createAuthExchange } from '@nself/auth-core';

const strategy = createWebAuthStrategy({ authBaseUrl: 'https://api.nself.org/v1/auth' });
const client = NselfGraphqlClient({ authExchangeFn: createAuthExchange(strategy) });

function App() {
  return (
    <NselfAuthProvider strategy={strategy}>
      <UrqlProvider value={client}>
        <YourApp />
      </UrqlProvider>
    </NselfAuthProvider>
  );
}

function ProfileButton() {
  const auth = useAuth();
  if (auth.status === 'loading') return <Spinner />;
  if (auth.status !== 'authenticated') return <SignInButton />;
  return <span>{auth.user.displayName}</span>;
}
```

### React Native (Expo)

```tsx
import { createNativeAuthStrategy, NselfAuthProvider } from '@nself/auth-core';
import * as SecureStore from 'expo-secure-store';

// SecureStoreInterface adapter for Expo
const secureStore = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};

const strategy = createNativeAuthStrategy(secureStore);

function App() {
  return (
    <NselfAuthProvider strategy={strategy}>
      <YourApp />
    </NselfAuthProvider>
  );
}
```

## AuthState

```ts
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: UserProfile; jwt: string }
  | { status: 'error'; error: AppError };
```

Always switch on `status`. Only `authenticated` carries `user` and `jwt`. Never pass `jwt` to any logger.

## Security

- Web: no token in JS — httpOnly cookie only
- Native: JWT in SecureStore, injected per-request as Bearer header
- `console.log/info/warn` count in src/: 0
- Refresh 401 → immediate unauthenticated, no retry loop
- authExchange replay: single refresh attempt per auth error, no infinite loop

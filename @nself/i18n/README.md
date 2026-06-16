# @nself/i18n

Shared internationalization layer for nSelf products. Provides locale strings, typed translation keys, RTL utilities, and React context integration.

## Features

- **Typed Translation Keys** — `TranslationKey` union type ensures all `t()` calls are type-checked at compile time.
- **Multiple Locales** — English (en) base + Arabic (ar) for RTL validation. Extensible for future locales.
- **RTL Utilities** — `isRTL()`, `getTextAlign()`, `getFlexDirection()` for directional layout support.
- **React Integration** — `NselfI18nProvider` context + `useNselfTranslation` hook for accessing translations.
- **i18next Powered** — Built on i18next and react-i18next for production-grade i18n.

## Installation

```bash
pnpm add @nself/i18n i18next react-i18next
```

## Usage

### Setup Provider

Wrap your app with the `NselfI18nProvider`:

```tsx
import { NselfI18nProvider } from '@nself/i18n'

export default function App() {
  return (
    <NselfI18nProvider locale="en">
      <YourApp />
    </NselfI18nProvider>
  )
}
```

### Use Translations

Use the typed `useNselfTranslation` hook:

```tsx
import { useNselfTranslation } from '@nself/i18n'

export function LoginForm() {
  const { t, locale } = useNselfTranslation()

  return (
    <form>
      <label>{t('auth.email')}</label>
      <input type="email" />
      <button>{t('auth.login')}</button>
    </form>
  )
}
```

**Note:** TypeScript will error if you use an invalid key like `t('typo.key')`.

### RTL Support

Use RTL helpers for directional layouts:

```tsx
import { useNselfTranslation, isRTL, getTextAlign, getFlexDirection } from '@nself/i18n'

export function Header() {
  const { locale } = useNselfTranslation()

  const textAlign = getTextAlign(locale) // 'right' | 'left'
  const flexDir = getFlexDirection(locale) // 'row-reverse' | 'row'

  return (
    <div style={{ textAlign, flexDirection: flexDir }}>
      ...
    </div>
  )
}
```

## Locale Extension Guide

### Adding a New Locale

1. Create a locale file: `src/locales/{locale}.json`
2. Match the structure of `en.json` (all namespaces and keys must match)
3. Update the `Locale` type in `types.ts`:
   ```ts
   export type Locale = 'en' | 'ar' | 'de'
   ```
4. Import and register the locale in `provider.tsx`:
   ```tsx
   import deMessages from './locales/de.json'
   // In initializeI18next():
   resources: {
     en: { translation: enMessages },
     ar: { translation: arMessages },
     de: { translation: deMessages }
   }
   ```
5. Add tests in `src/__tests__/i18n.test.ts`

### RTL Locales

To add a right-to-left locale, update `RTL_LOCALES` in both `types.ts` and `rtl.ts`:

```ts
// rtl.ts
const RTL_LOCALES_SET = new Set(['ar', 'he', 'fa', 'ur'])
```

## API Reference

### `useNselfTranslation()`

Returns a typed translation hook.

```ts
const { t, i18n, locale } = useNselfTranslation()
```

- `t(key: TranslationKey)` — Translate a key
- `i18n` — i18next instance for advanced operations
- `locale` — Current locale (Locale type)

### RTL Utilities

- `isRTL(locale: string): boolean`
- `getTextAlign(locale: string): 'left' | 'right'`
- `getFlexDirection(locale: string): 'row' | 'row-reverse'`
- `getInsetDirection(locale: string, position: 'start' | 'end'): 'left' | 'right'`
- `getMarginDirection(locale: string, side: 'start' | 'end'): 'left' | 'right'`

### `NselfI18nProvider`

React context provider that initializes i18next.

```tsx
<NselfI18nProvider locale="en">
  {children}
</NselfI18nProvider>
```

Props:
- `locale` — Locale to initialize (default: 'en')
- `children` — Child components

## Testing

```bash
pnpm --filter @nself/i18n test
pnpm --filter @nself/i18n test -- --coverage
```

## Type Checking

```bash
pnpm --filter @nself/i18n typecheck
```

Invalid translation keys will cause TypeScript errors:

```ts
// ✓ Valid
t('common.submit')
t('auth.login')

// ✗ Invalid — TypeScript error
t('typo.key') // Error: Argument of type '"typo.key"' is not assignable to type 'TranslationKey'
```

## Constraints

- **Locales must match** — All locale files (en.json, ar.json, etc.) must have identical key structures.
- **Keys are immutable** — Adding/removing keys requires coordinating across all locale files.
- **i18next is peer dependency** — Your app must install `i18next` and `react-i18next`.
- **React 18+** — Requires React 18 or later for hooks and context.

## Future Work

- RTL migration for full Tailwind logical properties support (P95+)
- Additional locales (de, es, fr at v1.1.0; pt-BR, it, ja, pl at v1.2.0)
- Translation management via Crowdin (v1.2.0)
- Per-app locale extension mechanism

/**
 * nSelf i18n Provider — React Context & i18next Integration
 *
 * Purpose: Wrap React apps with locale context and i18next initialization.
 * Provides the NselfI18nProvider component and useNselfTranslation hook.
 *
 * Inputs: locale prop (string), children (React nodes)
 * Outputs: Initialized i18next instance, useNselfTranslation hook with typed keys
 * Constraints: i18next and react-i18next are peer dependencies
 */

import React, { ReactNode } from 'react'
import i18next from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import type { TranslationKey, Locale } from './types'
import enMessages from './locales/en.json'
import arMessages from './locales/ar.json'

/**
 * Initialize i18next with locale resources.
 * This is done once at module load, but can be re-called with a new locale.
 * @param locale — Locale identifier
 */
const initializeI18next = (locale: Locale = 'en'): void => {
  if (i18next.isInitialized) {
    i18next.changeLanguage(locale)
    return
  }

  i18next
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enMessages },
        ar: { translation: arMessages }
      },
      lng: locale,
      fallbackLng: 'en',
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false // React already escapes values
      },
      react: {
        useSuspense: false // Disable Suspense for now; can be enabled per-use
      }
    })
}

/**
 * Typed useTranslation hook.
 * Returns the i18next useTranslation hook with TranslationKey type inference.
 * @returns useTranslation hook result with typed t() function
 */
export const useNselfTranslation = () => {
  const { t, i18n } = useTranslation()

  return {
    t: (key: TranslationKey) => t(key),
    i18n,
    locale: i18n.language as Locale
  }
}

/**
 * NselfI18nProvider component.
 * Initializes i18next and provides locale context to child components.
 *
 * @param props.locale — Locale to initialize (default: 'en')
 * @param props.children — Child components
 */
export interface NselfI18nProviderProps {
  locale?: Locale
  children: ReactNode
}

export const NselfI18nProvider: React.FC<NselfI18nProviderProps> = ({
  locale = 'en',
  children
}) => {
  // Initialize i18next when provider mounts or locale changes
  React.useEffect(() => {
    initializeI18next(locale)
  }, [locale])

  return <>{children}</>
}

/**
 * Export the initialization function for server-side use or pre-initialization.
 */
export { initializeI18next }

/**
 * Translation Key Type — Strongly typed translation keys
 *
 * Purpose: Ensure all t() calls use valid keys from the English locale.
 * Flattened keys are generated from locales/en.json namespace structure.
 * This prevents runtime errors from typos and provides IDE autocompletion.
 *
 * Constraints:
 * - Keys must exist in locales/en.json
 * - Paths are flattened: 'common.submit', 'auth.login', 'errors.required'
 * - Type is exhaustive — any missing key causes a TS error
 */

/**
 * TranslationKey union — all valid t() call keys.
 * Includes all keys from the English locale structure.
 * Flat keys from the nclaw mobile app translations.
 *
 * Examples: 'appTitle', 'loading', 'settings', etc.
 */
export type TranslationKey =
  | 'appTitle'
  | 'loading'
  | 'error'
  | 'retry'
  | 'cancel'
  | 'save'
  | 'done'
  | 'delete'
  | 'signIn'
  | 'signOut'
  | 'email'
  | 'password'
  | 'serverUrl'
  | 'connectToServer'
  | 'scanQr'
  | 'enterCode'
  | 'directUrl'
  | 'pointCameraAtQr'
  | 'codeScanned'
  | 'connectionFailed'
  | 'signInFailed'
  | 'enterServerCredentials'
  | 'serverName'
  | 'serverNameHint'
  | 'pairingCode'
  | 'enterPairingCode'
  | 'codeVerified'
  | 'topics'
  | 'memories'
  | 'chat'
  | 'settings'
  | 'newConversation'
  | 'searchMemories'
  | 'noMemories'
  | 'noTopics'
  | 'addServer'
  | 'manageApiKeys'
  | 'voiceConversation'
  | 'quickCapture'
  | 'feedback'
  | 'usage'
  | 'ntvTitle'
  | 'channels'
  | 'channelList'
  | 'guide'
  | 'epgGrid'
  | 'search'
  | 'searchChannels'
  | 'favorites'
  | 'favoriteChannels'
  | 'quality'
  | 'auto'
  | 'streamUnavailable'
  | 'unableToLoadStream'
  | 'noConnection'
  | 'checkInternet'
  | 'play'
  | 'pause'
  | 'seek'
  | 'volume'
  | 'fullscreen'
  | 'exitFullscreen'
  | 'pipMode'
  | 'cast'
  | 'closePlayer'
  | 'channel'
  | 'playbackWired'
  | 'iptv'
  | 'notConfigured'
  | 'account'
  | 'notSignedIn'
  | 'stop'
  | 'close'
  | 'audioStream'
  | 'remove'
  | 'iptv.sources'
  | 'm3u.playlists'
  | 'm3u.placeholder'
  | 'm3u.add'
  | 'm3u.none'
  | 'm3u.removeLabel'
  | 'xtream.sources'
  | 'xtream.server'
  | 'xtream.serverPlaceholder'
  | 'xtream.username'
  | 'xtream.usernamePlaceholder'
  | 'xtream.password'
  | 'xtream.passwordPlaceholder'
  | 'xtream.add'
  | 'xtream.none'
  | 'xtream.validation'
  | 'language.label'
  | 'language.hint'
  | 'player.bufferLabel'
  | 'player.qualityLabel'
  | 'notifications.label'
  | 'notifications.schedule'
  | 'notifications.new'
  | 'about.version'
  | 'about.license'
  | 'about.openSource'
  // ── Desktop: nclaw ──────────────────────────────────────────────────────────
  | 'desktop.nclaw.title'
  | 'desktop.nclaw.version'
  | 'desktop.nclaw.loading'
  | 'desktop.nclaw.signInPrompt'
  | 'desktop.nclaw.searchTopics'
  | 'desktop.nclaw.clearSearch'
  | 'desktop.nclaw.expandSidebar'
  | 'desktop.nclaw.collapseSidebar'
  | 'desktop.nclaw.emptyTopics'
  | 'desktop.nclaw.messagePlaceholder'
  | 'desktop.nclaw.sendMessage'
  | 'desktop.nclaw.newSubtopic'
  | 'desktop.nclaw.rename'
  | 'desktop.nclaw.archive'
  | 'desktop.nclaw.export'
  | 'desktop.nclaw.themeSection'
  | 'desktop.nclaw.accentSection'
  | 'desktop.nclaw.themeSystem'
  | 'desktop.nclaw.invalidHex'
  | 'desktop.nclaw.customHexApply'
  | 'desktop.nclaw.customHexReset'
  | 'desktop.nclaw.syncLicense'
  | 'desktop.nclaw.nSelfServerUrl'
  | 'desktop.nclaw.connectionSuccessful'
  | 'desktop.nclaw.connectionFailed'
  | 'desktop.nclaw.saved'
  | 'desktop.nclaw.testConnection'
  | 'desktop.nclaw.advancedSection'
  | 'desktop.nclaw.telemetryLabel'
  | 'desktop.nclaw.telemetryDesc'
  | 'desktop.nclaw.updatesLabel'
  | 'desktop.nclaw.updatesDesc'
  | 'desktop.nclaw.aiProvider'
  | 'desktop.nclaw.providerLabel'
  | 'desktop.nclaw.vaultKeychain'
  | 'desktop.nclaw.notPaired'
  | 'desktop.nclaw.vaultPairedDesc'
  | 'desktop.nclaw.vaultUnpairedDesc'
  | 'desktop.nclaw.deviceRePaired'
  | 'desktop.nclaw.confirmRepair'
  | 'desktop.nclaw.shortcuts'
  // ── Desktop: nchat ──────────────────────────────────────────────────────────
  | 'desktop.nchat.title'
  | 'desktop.nchat.selectChannel'
  | 'desktop.nchat.loading'
  // ── Desktop: clawde ─────────────────────────────────────────────────────────
  | 'desktop.clawde.title'
  | 'desktop.clawde.somethingWrong'
  | 'desktop.clawde.tryAgain'
  | 'desktop.clawde.disconnected'
  | 'desktop.clawde.starting'
  | 'desktop.clawde.connected'
  | 'desktop.clawde.chat'
  | 'desktop.clawde.sessions'
  | 'desktop.clawde.files'
  | 'desktop.clawde.git'
  | 'desktop.clawde.dashboard'
  | 'desktop.clawde.search'
  | 'desktop.clawde.packs'
  | 'desktop.clawde.doctor'
  | 'desktop.clawde.instructions'
  | 'desktop.clawde.oauth'
  | 'desktop.clawde.settings'

/**
 * Supported locale identifiers (8 locales).
 * en (English), fr (Français), ar (العربية), es (Español),
 * zh (中文), ja (日本語), de (Deutsch), pt (Português)
 */
export type Locale = 'en' | 'fr' | 'ar' | 'es' | 'zh' | 'ja' | 'de' | 'pt'

/**
 * RTL (right-to-left) locales.
 * Used for directional layout and text alignment decisions.
 * Locales: ar (Arabic), he (Hebrew), fa (Farsi), ur (Urdu)
 */
export const RTL_LOCALES: readonly Locale[] = ['ar']

/**
 * Check if a locale uses right-to-left text direction.
 * @param locale — Locale string (any value, will be checked against RTL_LOCALES)
 * @returns true if locale is RTL; false otherwise
 */
export const isRTL = (locale: string): boolean => {
  return RTL_LOCALES.includes(locale as Locale)
}

/**
 * Get text alignment direction for a locale.
 * @param locale — Locale string
 * @returns 'right' for RTL locales, 'left' for LTR
 */
export const getTextAlign = (locale: string): 'left' | 'right' => {
  return isRTL(locale) ? 'right' : 'left'
}

/**
 * Get flex direction for a locale.
 * @param locale — Locale string
 * @returns 'row-reverse' for RTL locales, 'row' for LTR
 */
export const getFlexDirection = (
  locale: string
): 'row' | 'row-reverse' => {
  return isRTL(locale) ? 'row-reverse' : 'row'
}

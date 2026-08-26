/**
 * Theme controller. Writes `data-theme` on <html>; every colour in the design
 * system is a token that swaps on that attribute, so nothing else needs to know
 * which theme is active.
 *
 * A matching pre-paint snippet is inlined in each HTML entry (see
 * THEME_BOOTSTRAP_SNIPPET) so the attribute is set before first paint and a dark
 * user never sees a white flash.
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'prize_vault_theme'

/** Fired on window whenever the theme changes, so headers can re-render. */
export const THEME_CHANGE_EVENT = 'prize_vault_theme_changed'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/** The user's explicit choice, or null if they have never chosen. */
export function getStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(raw) ? raw : null
  } catch {
    return null
  }
}

export function getSystemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Stored choice wins; otherwise follow the OS. */
export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function getActiveTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  const attr = document.documentElement.getAttribute('data-theme')
  return isTheme(attr) ? attr : resolveTheme()
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

export function setTheme(theme: Theme): void {
  applyTheme(theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private-mode / quota failures must not break theming.
  }
  try {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }))
  } catch {
    // ignore
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getActiveTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

/**
 * Applies the resolved theme and keeps following the OS until the user makes an
 * explicit choice. Returns an unsubscribe function.
 */
export function initTheme(): () => void {
  applyTheme(resolveTheme())

  if (typeof window === 'undefined' || !window.matchMedia) return () => {}

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (e: MediaQueryListEvent) => {
    // An explicit choice pins the theme; only unpinned users track the OS.
    if (getStoredTheme() !== null) return
    applyTheme(e.matches ? 'dark' : 'light')
  }

  // Safari <14 only supports the deprecated listener API.
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }
  mq.addListener(onSystemChange)
  return () => mq.removeListener(onSystemChange)
}

/**
 * Inline this in <head> of every HTML entry, before the stylesheet, to set the
 * theme pre-paint. Kept as an exported constant so the snippet and the module
 * can never drift apart.
 */
export const THEME_BOOTSTRAP_SNIPPET = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}})();`

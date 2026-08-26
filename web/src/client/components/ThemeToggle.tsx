import { useEffect, useState } from 'react'
import Icon from './Icon'
import { THEME_CHANGE_EVENT, getActiveTheme, initTheme, toggleTheme } from '../utils/theme'

export interface ThemeToggleProps {
  className?: string
}

/**
 * Light/dark switch. The theme attribute is already set pre-paint by the inline
 * snippet in each HTML entry; this only keeps React in sync and owns the click.
 */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [theme, setThemeState] = useState(() => getActiveTheme())

  useEffect(() => {
    const stopFollowingSystem = initTheme()
    setThemeState(getActiveTheme())

    const sync = () => setThemeState(getActiveTheme())
    window.addEventListener(THEME_CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync)
      stopFollowingSystem()
    }
  }, [])

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      className={`pv-theme-toggle ${className}`.trim()}
      onClick={() => setThemeState(toggleTheme())}
      aria-label={label}
      title={label}
    >
      <Icon name={isDark ? 'sun' : 'moon'} />
    </button>
  )
}

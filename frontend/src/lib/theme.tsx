import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

type Ctx = {
  theme: Theme
  resolvedTheme: Resolved
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<Ctx | null>(null)

const storageKey = 'docmanager:theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const v = localStorage.getItem(storageKey)
    return (v as Theme) || 'system'
  })

  const systemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedTheme: Resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(storageKey, theme)
    const el = document.documentElement
    if (resolvedTheme === 'dark') el.classList.add('dark')
    else el.classList.remove('dark')
  }, [theme, resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const el = document.documentElement
      if (mq.matches) el.classList.add('dark')
      else el.classList.remove('dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState(resolvedTheme === 'dark' ? 'light' : 'dark')

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, toggleTheme }), [theme, resolvedTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}


import { describe, it, expect, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './theme'

describe('theme', () => {
  beforeAll(() => {
    // @ts-expect-error
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
  })
  it('toggles between light and dark', () => {
    const wrapper = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>
    const { result } = renderHook(() => useTheme(), { wrapper })
    const initial = result.current.resolvedTheme
    act(() => result.current.toggleTheme())
    expect(result.current.resolvedTheme).not.toEqual(initial)
  })
})

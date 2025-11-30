import { describe, it, expect } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  it('sets and clears auth', () => {
    const user = { id: '1', name: 'A', email: 'a@example.com', role: 'user' }
    useAuthStore.getState().setAuth({ user, token: 't', persist: false })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('t')
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})


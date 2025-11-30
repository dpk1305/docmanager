import { create } from 'zustand'

type User = { id: string; name: string; email: string; role: string }

type State = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (payload: { user: User; token: string; persist?: boolean }) => void
  clearAuth: () => void
}

export const useAuthStore = create<State>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: ({ user, token, persist }) => {
    if (persist) localStorage.setItem('docmanager:accessToken', token)
    set({ user, token, isAuthenticated: true })
  },
  clearAuth: () => {
    localStorage.removeItem('docmanager:accessToken')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))


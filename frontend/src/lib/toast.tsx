import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string }

const ToastContext = createContext<{ show: (type: Toast['type'], message: string) => void; success: (m: string) => void; error: (m: string) => void; info: (m: string) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((type: Toast['type'], message: string) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), type, message }])
  }, [])
  const success = useCallback((m: string) => show('success', m), [show])
  const error = useCallback((m: string) => show('error', m), [show])
  const info = useCallback((m: string) => show('info', m), [show])

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => {
      setToasts((prev) => prev.filter((p) => p.id !== t.id))
    }, 3000))
    return () => timers.forEach((tm) => clearTimeout(tm))
  }, [toasts])

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded shadow text-white ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-700'}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) || !!localStorage.getItem('docmanager:accessToken')
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return children
}


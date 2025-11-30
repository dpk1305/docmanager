import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import { Search } from 'lucide-react'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PrivateRoute from './routes/PrivateRoute'
import { useAuthStore } from './stores/authStore'
import AppShell from './components/AppShell'
import Dashboard from './pages/dashboard/Dashboard'
import Drive from './pages/drive/Drive'
import SearchPage from './pages/search/Search'
import { apiClient } from './lib/api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

type User = { id: string; name: string; email: string; role: string }
type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

function RootApp() {
  const storeUser = useAuthStore((s) => s.user)
  const [docs, setDocs] = useState<Document[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')

  const api = useMemo(() => axios.create({ baseURL: API_BASE }), [])

  const refreshDocs = async () => {
    const { data } = await apiClient.get('/search', { params: { q: search } })
    setDocs(data)
  }

  const upload = async (f?: File) => {
    const selected = f || file
    if (!selected) return
    const create = await apiClient.post(
      '/documents',
      { name: selected.name, mime_type: selected.type || 'application/octet-stream', size: selected.size },
    )
    const { document, uploadUrl } = create.data
    await fetch(uploadUrl, { method: 'PUT', body: selected, headers: { 'Content-Type': selected.type || 'application/octet-stream' } })
    await apiClient.put(`/documents/${document.id}/complete`, { checksum: '', comment: 'ui upload' })
    return document as Document
  }

  const preview = async (id: string) => {
    const { data } = await apiClient.get(`/documents/${id}/preview`)
    window.open(data.url, '_blank')
  }

  const download = async (id: string) => {
    const { data } = await apiClient.get(`/documents/${id}/download`)
    window.open(data.url, '_blank')
  }

  const logout = () => {
    useAuthStore.getState().clearAuth()
    setDocs([])
    window.location.assign('/auth/login')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        <Route element={<AppShell user={storeUser} onLogout={logout} />}>
          <Route path="/dashboard" element={<PrivateRoute><Dashboard onUpload={(f) => upload(f)} /></PrivateRoute>} />
          <Route path="/drive" element={<PrivateRoute><Drive /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><div>Admin</div></PrivateRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <RootApp />
    </ThemeProvider>
  )
}

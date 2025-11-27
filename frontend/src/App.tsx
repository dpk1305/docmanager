import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './lib/theme'
import { Sun, Moon, Upload, Search } from 'lucide-react'
import AuthPages from './pages/Auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

type User = { id: string; name: string; email: string; role: string }
type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

function AppShell({ children, user, onLogout, onUpload }: { children: React.ReactNode; user: any; onLogout: () => void; onUpload: (f: File) => void }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const [file, setFile] = useState<File | null>(null)
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-3 bg-surface shadow">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold">DocManager</Link>
          <Link to="/drive" className="text-sm">Drive</Link>
          <Link to="/search" className="text-sm">Search</Link>
          <Link to="/admin" className="text-sm">Admin</Link>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle color theme" className="btn" onClick={toggleTheme}>{resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button className="btn" onClick={() => file && onUpload(file)}><Upload size={18} /></button>
          {user ? <button className="btn" onClick={onLogout}>Logout</button> : <Link className="btn" to="/auth/login">Login</Link>}
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}

function RootApp() {
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('secret')
  const [name, setName] = useState('Alice')
  const [access, setAccess] = useState<string | null>(() => localStorage.getItem('accessToken'))
  const [user, setUser] = useState<User | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')

  const api = useMemo(() => axios.create({ baseURL: API_BASE }), [])

  useEffect(() => {
    if (access) localStorage.setItem('accessToken', access)
  }, [access])

  const authHeaders = access ? { Authorization: `Bearer ${access}` } : undefined

  const register = async () => {
    await api.post('/auth/register', { name, email, password })
    await login()
  }

  const login = async () => {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    setAccess(data.accessToken)
    await refreshDocs()
  }

  const refreshDocs = async () => {
    if (!authHeaders) return
    const { data } = await api.get('/search', { headers: authHeaders, params: { q: search } })
    setDocs(data)
  }

  const upload = async (f?: File) => {
    const selected = f || file
    if (!selected || !authHeaders) return
    const create = await api.post(
      '/documents',
      { name: selected.name, mime_type: selected.type || 'application/octet-stream', size: selected.size },
      { headers: authHeaders }
    )
    const { document, uploadUrl } = create.data
    await fetch(uploadUrl, { method: 'PUT', body: selected, headers: { 'Content-Type': selected.type || 'application/octet-stream' } })
    await api.put(`/documents/${document.id}/complete`, { checksum: '', comment: 'ui upload' }, { headers: authHeaders })
    await refreshDocs()
  }

  const preview = async (id: string) => {
    if (!authHeaders) return
    const { data } = await api.get(`/documents/${id}/preview`, { headers: authHeaders })
    window.open(data.url, '_blank')
  }

  const download = async (id: string) => {
    if (!authHeaders) return
    const { data } = await api.get(`/documents/${id}/download`, { headers: authHeaders })
    window.open(data.url, '_blank')
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setAccess(null)
    setUser(null)
    setDocs([])
  }

  return (
    <BrowserRouter>
      <AppShell user={user} onLogout={logout} onUpload={(f) => upload(f)}>
        {!access ? (
          <div className="max-w-md grid gap-3">
            <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn" onClick={register}>Register</button>
              <button className="btn" onClick={login}>Login</button>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={
              <div>
                <div className="flex gap-2 items-center">
                  <input className="input" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
                  <button className="btn" onClick={refreshDocs}><Search size={18} /></button>
                </div>
                <ul className="mt-4 divide-y">
                  {docs.map(d => (
                    <li key={d.id} className="flex justify-between items-center py-2">
                      <div>
                        <div>{d.name}</div>
                        <div className="text-sm text-muted">{d.mime_type} • {(d.size || 0)} bytes • {new Date(d.updated_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn" onClick={() => preview(d.id)}>Preview</button>
                        <button className="btn" onClick={() => download(d.id)}>Download</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            } />
            <Route path="/drive" element={<div>Drive</div>} />
            <Route path="/search" element={<div>Search</div>} />
            <Route path="/admin" element={<div>Admin</div>} />
            <Route path="/auth/login" element={<AuthPages />} />
            <Route path="/auth/register" element={<AuthPages />} />
            <Route path="/auth/2fa" element={<AuthPages />} />
          </Routes>
        )}
      </AppShell>
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

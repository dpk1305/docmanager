import { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export default function AuthPages() {
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('secret')
  const [name, setName] = useState('Alice')
  const [code, setCode] = useState('')
  const api = axios.create({ baseURL: API_BASE, withCredentials: true })
  const register = async () => { await api.post('/auth/register', { name, email, password }) }
  const login = async () => { await api.post('/auth/login', { email, password, code }) }
  return (
    <div className="grid gap-3 max-w-sm">
      <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <input className="input" placeholder="2FA code (if enabled)" value={code} onChange={e => setCode(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn" onClick={register}>Register</button>
        <button className="btn" onClick={login}>Login</button>
      </div>
    </div>
  )
}


import { NavLink } from 'react-router-dom'

export default function LeftNav({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <div className="text-lg font-semibold">{user?.name || 'Guest'}</div>
        <div className="text-sm text-muted">{user?.email || ''}</div>
      </div>
      <nav className="grid gap-2">
        <NavLink className={({ isActive }) => `px-3 py-2 rounded ${isActive ? 'bg-accent text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} to="/dashboard">Dashboard</NavLink>
        <NavLink className={({ isActive }) => `px-3 py-2 rounded ${isActive ? 'bg-accent text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} to="/drive">Drive</NavLink>
        <NavLink className={({ isActive }) => `px-3 py-2 rounded ${isActive ? 'bg-accent text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} to="/search">Search</NavLink>
        <button className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left" onClick={onLogout}>Logout</button>
      </nav>
    </div>
  )
}


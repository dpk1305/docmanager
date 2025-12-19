import { NavLink } from 'react-router-dom'
import { LayoutDashboard, HardDrive, Search, LogOut } from 'lucide-react'

export default function LeftNav({ user, onLogout, onNavigate }: { user: any; onLogout: () => void; onNavigate?: () => void }) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <div className="text-lg font-semibold">{user?.name || 'Guest'}</div>
        <div className="text-sm text-muted">{user?.email || ''}</div>
      </div>
      <nav className="grid gap-2">
        <NavLink onClick={onNavigate} className={({ isActive }) => `px-3 py-2 rounded flex items-center gap-2 ${isActive ? 'bg-accent text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} to="/dashboard"><LayoutDashboard size={16} /> Dashboard</NavLink>
        <NavLink onClick={onNavigate} className={({ isActive }) => `px-3 py-2 rounded flex items-center gap-2 ${isActive ? 'bg-accent text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} to="/drive"><HardDrive size={16} /> Drive</NavLink>
        <NavLink onClick={onNavigate} className={({ isActive }) => `px-3 py-2 rounded flex items-center gap-2 ${isActive ? 'bg-accent text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`} to="/search"><Search size={16} /> Search</NavLink>
        <button className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-left flex items-center gap-2" onClick={() => { onNavigate?.(); onLogout(); }}><LogOut size={16} /> Logout</button>
      </nav>
    </div>
  )
}

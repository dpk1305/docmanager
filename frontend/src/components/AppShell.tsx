import { ReactNode, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import LeftNav from './LeftNav'

export default function AppShell({ children, user, onLogout }: { children?: ReactNode; user: any; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 hidden md:block border-r border-gray-200 dark:border-gray-800 bg-surface">
        <LeftNav user={user} onLogout={onLogout} />
      </aside>
      <div className="flex-1">
        <Topbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4">{children ?? <Outlet />}</main>
      </div>
      <div className={`md:hidden fixed inset-0 ${mobileOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <div className={`absolute inset-y-0 left-0 w-64 bg-surface border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <LeftNav user={user} onLogout={onLogout} onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>
    </div>
  )
}

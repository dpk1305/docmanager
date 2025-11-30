import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import LeftNav from './LeftNav'

export default function AppShell({ children, user, onLogout }: { children?: ReactNode; user: any; onLogout: () => void }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 hidden md:block border-r border-gray-200 dark:border-gray-800 bg-surface">
        <LeftNav user={user} onLogout={onLogout} />
      </aside>
      <div className="flex-1">
        <Topbar user={user} />
        <main className="p-4">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}

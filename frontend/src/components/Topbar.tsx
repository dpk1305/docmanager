import { Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '../lib/theme'
import Button from './ui/Button'

export default function Topbar({ user, onMenuClick }: { user: any; onMenuClick?: () => void }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  return (
    <header className="flex items-center justify-between p-4 bg-gradient-header text-white shadow">
      <div className="flex items-center gap-2">
        <Button aria-label="Open navigation" className="md:hidden bg-white/10 hover:bg-white/20 text-white" onClick={onMenuClick}><Menu size={18} /></Button>
        <div className="font-semibold">DocManager</div>
      </div>
      <div className="flex items-center gap-3">
        <Button aria-label="Toggle color theme" className="bg-white/10 hover:bg-white/20 text-white" onClick={toggleTheme}>{resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</Button>
        <div className="flex items-center gap-2">
          <div className="text-sm leading-tight text-white/90">
            <div className="font-semibold">{user?.name || 'Guest'}</div>
            <div className="text-white/70 text-xs">{user?.email || ''}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold">
            {(user?.name || 'G').slice(0,1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

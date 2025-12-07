import { Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '../lib/theme'
import Button from './ui/Button'

export default function Topbar({ user, onMenuClick }: { user: any; onMenuClick?: () => void }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  return (
    <header className="flex items-center justify-between p-3 bg-surface shadow">
      <div className="flex items-center gap-2">
        <Button aria-label="Open navigation" className="md:hidden" onClick={onMenuClick}><Menu size={18} /></Button>
        <div className="font-semibold">DocManager</div>
      </div>
      <div className="flex items-center gap-2">
        <Button aria-label="Toggle color theme" onClick={toggleTheme}>{resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</Button>
      </div>
    </header>
  )
}

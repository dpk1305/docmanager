import { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api'
import StatsCard from '../../components/StatsCard'
import QuickUpload from '../../components/QuickUpload'
import FileList from '../../components/FileList'
import { FolderOpen, UploadCloud, Database } from 'lucide-react'
import { useMemo } from 'react'

type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function Dashboard({ onUpload }: { onUpload: (file: File) => Promise<any> }) {
  const [files, setFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [dragId, setDragId] = useState<string>('')
  const [order, setOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard:order')
    return saved ? JSON.parse(saved) : ['stats', 'upload', 'recent']
  })
  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiClient.get('/documents', { params: { limit: 6, sort: 'recent' } }).then(r => {
      if (mounted) setFiles(r.data || [])
    }).finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const preview = async (id: string) => {
    const r = await apiClient.get(`/documents/${id}/preview`)
    window.open(r.data.url, '_blank')
  }
  const download = async (id: string) => {
    const r = await apiClient.get(`/documents/${id}/download`)
    window.open(r.data.url, '_blank')
  }
  const refreshRecent = async () => {
    const r = await apiClient.get('/documents', { params: { limit: 6, sort: 'recent' } })
    setFiles(r.data || [])
  }
  const handleUpload = async (file: File) => {
    await onUpload(file)
    await refreshRecent()
  }

  const onDragStart = (id: string) => setDragId(id)
  const onDrop = (id: string) => {
    if (!dragId || dragId === id) return
    const next = [...order]
    const from = next.indexOf(dragId)
    const to = next.indexOf(id)
    if (from === -1 || to === -1) return
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    setOrder(next)
    localStorage.setItem('dashboard:order', JSON.stringify(next))
    setDragId('')
  }
  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const totalBytes = useMemo(() => files.reduce((a, b) => a + Number(b.size || 0), 0), [files])
  const widgets: Record<string, JSX.Element> = {
    stats: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total files" value={files.length} icon={<FolderOpen size={18} />} />
        <StatsCard title="Recent uploads" value={files.length} icon={<UploadCloud size={18} />} />
        <StatsCard title="Storage used" value={formatGB(totalBytes)} icon={<Database size={18} />} />
      </div>
    ),
    upload: (<QuickUpload onComplete={handleUpload} />),
    recent: (loading ? <div>Loading...</div> : <FileList files={files} onPreview={preview} onDownload={download} />),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Welcome</div>
        <div className="text-sm text-muted">Tip: drag widgets to reorder</div>
      </div>
      {order.map((id) => (
        <div key={id} draggable onDragStart={() => onDragStart(id)} onDragOver={onDragOver} onDrop={() => onDrop(id)} className="rounded-md">
          {widgets[id]}
        </div>
      ))}
    </div>
  )
}

function formatGB(bytes: number) {
  const gb = bytes / (1024 ** 3)
  if (gb < 0.01) return '< 0.01 GB'
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(gb)} GB`
}

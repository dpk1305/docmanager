import { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api'
import StatsCard from '../../components/StatsCard'
import QuickUpload from '../../components/QuickUpload'
import FileList from '../../components/FileList'

type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function Dashboard({ onUpload }: { onUpload: (file: File) => Promise<any> }) {
  const [files, setFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
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
    setStatus('Document uploaded successfully')
    setTimeout(() => setStatus(''), 2000)
  }

  return (  
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Welcome</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total files" value={files.length} />
        <StatsCard title="Recent uploads" value={files.length} />
        <StatsCard title="Storage used" value={files.reduce((a, b) => a + (b.size || 0), 0)} />
      </div>
      {status ? <div className="p-3 rounded bg-green-600 text-white">{status}</div> : null}
      <QuickUpload onComplete={handleUpload} />
      {loading ? <div>Loading...</div> : <FileList files={files} onPreview={preview} onDownload={download} />}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api'
import FileList from '../../components/FileList'

type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [files, setFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const onSearch = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get('/search', { params: { q } })
      setFiles(r.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { setFiles([]) }, [q])
  const preview = async (id: string) => {
    const r = await apiClient.get(`/documents/${id}/preview`)
    window.open(r.data.url, '_blank')
  }
  const download = async (id: string) => {
    const r = await apiClient.get(`/documents/${id}/download`)
    window.open(r.data.url, '_blank')
  }
  const remove = async (id: string) => {
    await apiClient.delete(`/documents/${id}`)
    await onSearch()
  }
  return (
    <div>
      <h1 className="text-xl mb-4">Search</h1>
      <div className="flex gap-2 items-center">
        <input className="input" placeholder="Search files" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn" onClick={onSearch}>Search</button>
      </div>
      {loading ? <div className="mt-4">Searching...</div> : <FileList files={files} onPreview={preview} onDownload={download} onDelete={remove} />}
    </div>
  )
}

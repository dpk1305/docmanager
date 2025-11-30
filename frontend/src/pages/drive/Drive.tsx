import { useEffect, useState } from 'react'
import { apiClient } from '../../lib/api'
import FileList from '../../components/FileList'

type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function Drive() {
  const [files, setFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    apiClient.get('/documents').then(r => setFiles(r.data || [])).finally(() => setLoading(false))
  }, [])
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
    const r = await apiClient.get('/documents')
    setFiles(r.data || [])
  }
  return (
    <div>
      <h1 className="text-xl mb-4">Drive</h1>
      {loading ? <div>Loading...</div> : <FileList files={files} onPreview={preview} onDownload={download} onDelete={remove} />}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../../lib/api'
import FileList from '../../components/FileList'

type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function Drive() {
  const [files, setFiles] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState<'name' | 'date' | 'size'>('date')
  const [page, setPage] = useState(1)
  const pageSize = 10
  useEffect(() => {
    setLoading(true)
    apiClient.get('/documents', { params: { limit: 100, sort: 'recent' } }).then(r => setFiles(r.data || [])).finally(() => setLoading(false))
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
  const filtered = useMemo(() => {
    let list = files
    if (q) list = list.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))
    if (type !== 'all') list = list.filter((d) => d.mime_type.startsWith(type))
    if (sort === 'name') list = [...list].sort((a,b) => a.name.localeCompare(b.name))
    else if (sort === 'size') list = [...list].sort((a,b) => (a.size||0) - (b.size||0))
    else list = [...list].sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    return list
  }, [files, q, type, sort])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize)
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [totalPages])
  return (
    <div>
      <h1 className="text-xl mb-4">Drive</h1>
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input aria-label="Search documents" className="input" placeholder="Search by name" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        <select aria-label="Filter by type" className="input" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
          <option value="all">All types</option>
          <option value="image/">Images</option>
          <option value="application/">Documents</option>
          <option value="text/">Text</option>
        </select>
        <select aria-label="Sort documents" className="input" value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="date">Newest</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>
      </div>
      {loading ? <div>Loading...</div> : <FileList files={pageItems} onPreview={preview} onDownload={download} onDelete={remove} />}
      <div className="flex items-center gap-2 mt-4">
        <button className="btn" aria-label="Previous page" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}>Prev</button>
        <div className="text-sm">Page {page} of {totalPages}</div>
        <button className="btn" aria-label="Next page" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</button>
      </div>
    </div>
  )
}

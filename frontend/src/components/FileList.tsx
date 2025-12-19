import { useEffect, useRef, useState } from 'react'
import { apiClient } from '../lib/api'
import { FileText, Image as ImageIcon } from 'lucide-react'
import { pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function FileList({ files, onPreview, onDownload, onDelete }: { files: Document[]; onPreview: (id: string) => void; onDownload: (id: string) => void; onDelete?: (id: string) => void }) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [thumbWidth, setThumbWidth] = useState<number>(320)
  const [active, setActive] = useState<Document | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string>('')

  const openPreview = async (d: Document) => {
    try {
      setActive(d)
      setViewerUrl('')
      const r = await apiClient.get(`/documents/${d.id}/preview`, { params: { proxy: true }, responseType: 'blob' })
      const ct = (r.headers['content-type'] || '') as string
      if (ct.includes('application/json')) {
        const text = await (r.data as Blob).text()
        try {
          const j = JSON.parse(text)
          if (j && typeof j.url === 'string') {
            setViewerUrl(j.url)
            return
          }
        } catch {}
        setViewerUrl('')
        return
      }
      const url = URL.createObjectURL(r.data as Blob)
      setViewerUrl(url)
    } catch {
      setViewerUrl(generatePlaceholderThumbnail(d.name))
    }
  }

  const closePreview = () => {
    setActive(null)
    if (viewerUrl.startsWith('blob:')) URL.revokeObjectURL(viewerUrl)
    setViewerUrl('')
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth
      setThumbWidth(Math.max(240, Math.floor(w)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let mounted = true
    const blobsToRevoke: string[] = []
    const run = async () => {
      const entries: Array<[string, string]> = []
      for (const f of files) {
        try {
          if (f.mime_type.startsWith('image/')) {
            const r = await apiClient.get(`/documents/${f.id}/preview`, { params: { proxy: true }, responseType: 'blob' })
            const blobUrl = URL.createObjectURL(r.data as Blob)
            blobsToRevoke.push(blobUrl)
            entries.push([f.id, blobUrl])
          } else if (f.mime_type === 'application/pdf') {
            const r = await apiClient.get(`/documents/${f.id}/preview`, { params: { proxy: true }, responseType: 'arraybuffer' })
            const dataUrl = await renderPdfBufferToDataUrl(r.data as ArrayBuffer, thumbWidth)
            entries.push([f.id, dataUrl])
          } else {
            entries.push([f.id, generatePlaceholderThumbnail(f.name)])
          }
        } catch {
          entries.push([f.id, generatePlaceholderThumbnail(f.name)])
        }
      }
      if (mounted) setThumbs(Object.fromEntries(entries))
    }
    run()
    return () => {
      mounted = false
      blobsToRevoke.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files, thumbWidth])

  return (
    <div ref={containerRef} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((d) => (
        <div key={d.id} className="card overflow-hidden">
          <div className="bg-page w-full aspect-video flex items-center justify-center">
            {thumbs[d.id] ? (
              <img src={thumbs[d.id]} alt={d.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-muted">
                {d.mime_type.startsWith('image/') ? <ImageIcon /> : <FileText />}
              </div>
            )}
          </div>
          <div className="p-4 space-y-1">
            <div className="font-medium truncate" title={d.name}>{d.name}</div>
            <div className="text-sm text-muted">{d.mime_type} • {formatBytes(d.size || 0)} • {new Date(d.updated_at).toLocaleString()}</div>
            <div className="flex gap-2 pt-2">
              <button className="btn" onClick={() => openPreview(d)}>Preview</button>
              <button className="btn" onClick={() => onDownload(d.id)}>Download</button>
              {onDelete ? <button className="danger" onClick={() => { if (confirm('Delete this document?')) onDelete(d.id) }}>Delete</button> : null}
            </div>
          </div>
        </div>
      ))}
      {active ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closePreview} />
          <div className="absolute inset-6 md:inset-12 bg-surface rounded-lg shadow-lg overflow-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold truncate" title={active.name}>{active.name}</div>
              <button className="btn" onClick={closePreview}>Close</button>
            </div>
            {viewerUrl ? (
              <div className="max-h-[70vh] overflow-auto">
                <PreviewContent url={viewerUrl} mime={active.mime_type} />
              </div>
            ) : (
              <div className="text-sm text-muted">Loading preview…</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatBytes(n: number) {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v)} ${units[i]}`
}

async function renderPdfBufferToDataUrl(buf: ArrayBuffer, width: number): Promise<string> {
  try {
    const loadingTask = pdfjs.getDocument({ data: buf })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const scale = width / viewport.width
    const scaled = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = Math.floor(scaled.width)
    canvas.height = Math.floor(scaled.height)
    await page.render({ canvasContext: ctx, viewport: scaled }).promise
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl
  } catch {
    return ''
  }
}

function PreviewContent({ url, mime }: { url: string; mime: string }) {
  if (mime === 'application/pdf') {
    // react-pdf can consume blob URLs via DocumentPreview component, but
    // for simplicity we use an <iframe> for full document viewing here.
    return <iframe src={url} className="w-full h-[70vh]" />
  }
  if (mime.startsWith('image/')) {
    return <img src={url} className="max-w-full max-h-[70vh]" />
  }
  return <a href={url} target="_blank">Open</a>
}

function generatePlaceholderThumbnail(name: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 640, 360)
  grad.addColorStop(0, '#0B1736')
  grad.addColorStop(1, '#13224E')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 640, 360)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 28px Inter, Arial, sans-serif'
  const text = (name || '').slice(0, 40)
  ctx.textAlign = 'center'
  ctx.fillText(text, 320, 196)
  return canvas.toDataURL('image/png')
}

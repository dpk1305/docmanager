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
    const run = async () => {
      const entries: Array<[string, string]> = []
      for (const f of files) {
        try {
          const r = await apiClient.get(`/documents/${f.id}/preview`)
          const url = r.data.url as string
          if (f.mime_type.startsWith('image/')) {
            entries.push([f.id, url])
          } else if (f.mime_type === 'application/pdf') {
            const dataUrl = await renderPdfToDataUrl(url, thumbWidth)
            entries.push([f.id, dataUrl])
          } else {
            entries.push([f.id, ''])
          }
        } catch {
          entries.push([f.id, ''])
        }
      }
      if (mounted) setThumbs(Object.fromEntries(entries))
    }
    run()
    return () => { mounted = false }
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
              <button className="btn" onClick={() => onPreview(d.id)}>Preview</button>
              <button className="btn" onClick={() => onDownload(d.id)}>Download</button>
              {onDelete ? <button className="danger" onClick={() => { if (confirm('Delete this document?')) onDelete(d.id) }}>Delete</button> : null}
            </div>
          </div>
        </div>
      ))}
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

async function renderPdfToDataUrl(url: string, width: number): Promise<string> {
  try {
    const loadingTask = pdfjs.getDocument(url)
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

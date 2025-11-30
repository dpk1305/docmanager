type Document = { id: string; name: string; mime_type: string; size: number; updated_at: string }

export default function FileList({ files, onPreview, onDownload, onDelete }: { files: Document[]; onPreview: (id: string) => void; onDownload: (id: string) => void; onDelete?: (id: string) => void }) {
  return (
    <ul className="mt-4 divide-y">
      {files.map(d => (
        <li key={d.id} className="flex justify-between  bg-neutral-primary-soft p-6 m-2 border border-default rounded-xl shadow-xs hover:bg-neutral-secondary-medium">
          <div>
            <div>{d.name}</div> 
            <div className="text-sm text-muted">{d.mime_type} • {(d.size || 0)} bytes • {new Date(d.updated_at).toLocaleString()}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => onPreview(d.id)}>Preview</button>
            <button className="btn" onClick={() => onDownload(d.id)}>Download</button>
            {onDelete ? <button className="danger" onClick={() => { if (confirm('Delete this document?')) onDelete(d.id) }}>Delete</button> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

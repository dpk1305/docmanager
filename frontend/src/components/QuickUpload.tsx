import { useState } from 'react'
import Uploader from './Uploader'
import Button from './ui/Button'

export default function QuickUpload({ onComplete }: { onComplete: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const handleUpload = () => { if (file) onComplete(file) }
  return (
    <div className="p-4 bg-surface rounded-md shadow">
      <div className="mb-2 font-semibold">Quick Upload</div>
      <div className="flex items-center gap-2 mb-3">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <Button onClick={handleUpload} disabled={!file}>Upload</Button>
      </div>
      <Uploader onComplete={(f) => { setFile(f); onComplete(f) }} />
    </div>
  )
}

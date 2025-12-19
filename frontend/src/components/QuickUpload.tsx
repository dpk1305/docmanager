import { useState } from 'react'
import Uploader from './Uploader'
import Button from './ui/Button'
import axios from 'axios'
import { apiClient } from '../lib/api'
import { useToast } from '../lib/toast'

export default function QuickUpload({ onComplete }: { onComplete: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const toast = useToast()
  const handleUpload = async () => {
    if (!file) return
    setError('')
    setUploading(true)
    setProgress(0)
    try {
      const create = await apiClient.post('/documents', { name: file.name, mime_type: file.type || 'application/octet-stream', size: file.size })
      const { document, uploadUrl } = (create as any).data
      await axios.put(uploadUrl, file, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      await apiClient.put(`/documents/${document.id}/complete`, { checksum: '', comment: 'ui upload' })
      toast.success('File uploaded successfully')
      onComplete(file)
      setFile(null)
      setProgress(0)
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className="p-4 bg-surface rounded-md shadow">
      <div className="mb-2 font-semibold">Quick Upload</div>
      <div className="flex items-center gap-2 mb-3">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <Button onClick={handleUpload} disabled={!file || uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
      </div>
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded mb-3">
          <div className="bg-accent h-2 rounded" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <div className="text-danger text-sm mb-2">{error}</div>}
      <Uploader onComplete={(f) => { setFile(f); onComplete(f) }} />
    </div>
  )
}

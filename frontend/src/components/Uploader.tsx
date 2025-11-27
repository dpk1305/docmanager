import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function Uploader({ onComplete }: { onComplete: (file: File) => void }) {
  const [error, setError] = useState('')
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    onComplete(f)
  }, [onComplete])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  return (
    <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-md ${isDragActive ? 'border-accent' : 'border-gray-300'}`}>
      <input {...getInputProps()} />
      <div>Drag and drop files here, or click to select</div>
      {error && <div className="text-danger text-sm mt-2">{error}</div>}
    </div>
  )
}


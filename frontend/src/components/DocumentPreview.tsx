import { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function DocumentPreview({ url, mimeType }: { url: string; mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <div className="max-w-3xl">
        <Document file={url}><Page pageNumber={1} /></Document>
      </div>
    )
  }
  if (mimeType.startsWith('image/')) {
    return <img src={url} alt="preview" className="max-w-full" />
  }
  return <a href={url} target="_blank">Open</a>
}


'use client'

import { useRef, useState } from 'react'

interface Props {
  tripId: string
  onUploaded: (photo: { id: string; storage_path: string; caption: string | null; uploaded_by: string; created_at: string }) => void
}

export default function PhotoUploadForm({ tripId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('photo', selectedFile)
      if (caption.trim()) form.append('caption', caption.trim())
      const res = await fetch(`/api/trips/${tripId}/photos`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
        return
      }
      onUploaded(data.photo)
      setSelectedFile(null)
      setPreview(null)
      setCaption('')
      if (inputRef.current) inputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
          <button
            onClick={() => { setPreview(null); setSelectedFile(null); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-400 transition-colors bg-gray-50">
          <span className="text-2xl mb-1">📷</span>
          <span className="text-xs text-gray-400">Tap to add a photo</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {selectedFile && (
        <>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import PhotoUploadForm from './PhotoUploadForm'

interface Photo {
  id: string
  storage_path: string
  caption: string | null
  uploaded_by: string
  created_at: string
}

interface Props {
  tripId: string
}

export default function PhotoUploadClient({ tripId }: Props) {
  const [uploaded, setUploaded] = useState<Photo[]>([])

  function handleUploaded(photo: Photo) {
    setUploaded((prev) => [photo, ...prev])
  }

  return (
    <div className="space-y-4">
      <PhotoUploadForm tripId={tripId} onUploaded={handleUploaded} />
      {uploaded.length > 0 && (
        <p className="text-xs text-emerald-600 font-medium text-center">
          ✓ {uploaded.length} photo{uploaded.length !== 1 ? 's' : ''} uploaded this session — refresh to see them in the gallery.
        </p>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface Photo {
  id: string
  storage_path: string
  caption: string | null
  uploaded_by: string
  created_at: string
}

interface Props {
  tripId: string
  photos: Photo[]
  currentUserEmail: string
  isOrganiser: boolean
}

function PhotoTile({
  photo,
  tripId,
  currentUserEmail,
  isOrganiser,
  onDeleted,
}: {
  photo: Photo
  tripId: string
  currentUserEmail: string
  isOrganiser: boolean
  onDeleted: (id: string) => void
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/trips/${tripId}/photos/${photo.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.signedUrl) setSignedUrl(d.signedUrl) })
  }, [photo.id, tripId])

  async function handleDelete() {
    if (!confirm('Remove this photo?')) return
    setDeleting(true)
    await fetch(`/api/trips/${tripId}/photos/${photo.id}`, { method: 'DELETE' })
    onDeleted(photo.id)
  }

  const canDelete = photo.uploaded_by === currentUserEmail || isOrganiser

  return (
    <>
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer group"
        onClick={() => setExpanded(true)}
      >
        {signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signedUrl} alt={photo.caption || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl animate-pulse">
            🖼️
          </div>
        )}
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            disabled={deleting}
            className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 text-xs items-center justify-center hidden group-hover:flex transition-colors hover:bg-red-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lightbox */}
      {expanded && signedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signedUrl} alt={photo.caption || ''} className="w-full rounded-xl max-h-[70vh] object-contain" />
            {photo.caption && (
              <p className="text-white/80 text-sm mt-3 text-center">{photo.caption}</p>
            )}
            <p className="text-white/40 text-xs mt-1 text-center">{photo.uploaded_by}</p>
            <button
              onClick={() => setExpanded(false)}
              className="mt-4 w-full text-white/60 hover:text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function PhotoGrid({ tripId, photos: initialPhotos, currentUserEmail, isOrganiser }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  function handleDeleted(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No photos yet. Be the first to add one!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          tripId={tripId}
          currentUserEmail={currentUserEmail}
          isOrganiser={isOrganiser}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  )
}

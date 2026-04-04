'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tripId: string
  vendorId: string
}

export default function DeleteVendorButton({ tripId, vendorId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Remove this contact?')) return
    setLoading(true)
    await fetch(`/api/trips/${tripId}/vendors/${vendorId}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-300 hover:text-red-400 transition-colors text-sm shrink-0 disabled:opacity-50"
      aria-label="Delete contact"
    >
      ✕
    </button>
  )
}

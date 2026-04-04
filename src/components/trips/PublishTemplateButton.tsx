'use client'

import { useState } from 'react'

interface Props {
  tripId: string
}

export default function PublishTemplateButton({ tripId }: Props) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: tripId, description: description.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Publish failed')
        return
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-3">
        <p className="text-emerald-600 text-sm font-semibold">✓ Published to community templates!</p>
        <a href="/templates" className="text-xs text-gray-400 hover:text-gray-600 mt-1 block">
          Browse templates →
        </a>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm font-semibold text-violet-700 border border-violet-200 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
      >
        🗺️ Publish as template
      </button>
    )
  }

  return (
    <form onSubmit={handlePublish} className="space-y-3">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Tell others about this itinerary (optional)"
        rows={2}
        className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 text-sm text-gray-500 border border-gray-200 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  )
}

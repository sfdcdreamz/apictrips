'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tripId: string
  hasItems: boolean
}

export default function GenerateItineraryButton({ tripId, hasItems }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setShowConfirm(false)

    const res = await fetch(`/api/trips/${tripId}/itinerary/generate`, {
      method: 'POST',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setError(data.error || 'Generation failed. Check ANTHROPIC_API_KEY is set.')
      setLoading(false)
      return
    }

    const data = await res.json() as { count?: number }
    setLoading(false)
    router.refresh()
    // Brief success message via window title trick (no state needed)
    console.log(`Generated ${data.count} itinerary items`)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 text-xs">Add AI items to existing itinerary?</span>
        <button
          onClick={handleGenerate}
          className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors"
        >
          Yes, generate
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => hasItems ? setShowConfirm(true) : handleGenerate()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Generating…
          </>
        ) : (
          <>✨ Generate with AI</>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

'use client'

import { useState } from 'react'

interface AISuggestion {
  dimension: string
  suggestion: string
}

interface Props {
  tripId: string
  hasConflicts: boolean
}

export default function AIConflictSuggestions({ tripId, hasConflicts }: Props) {
  const [suggestions, setSuggestions] = useState<AISuggestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!hasConflicts) return null

  async function handleGetSuggestions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/conflicts/resolve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get suggestions')
      }
      const data = await res.json()
      setSuggestions(data.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (suggestions && suggestions.length > 0) {
    return (
      <div className="mt-3 pt-3 border-t border-stone-100">
        <p className="text-xs font-semibold text-purple-700 mb-2">✨ AI Suggestions</p>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div key={s.dimension} className="bg-purple-50 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-purple-800 capitalize mb-0.5">{s.dimension}</p>
              <p className="text-xs text-purple-700">{s.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-stone-100">
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <button
        onClick={handleGetSuggestions}
        disabled={loading}
        className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Getting AI suggestions…
          </>
        ) : (
          '✨ Get AI suggestions'
        )}
      </button>
    </div>
  )
}

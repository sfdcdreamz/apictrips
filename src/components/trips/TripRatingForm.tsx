'use client'

import { useState } from 'react'

interface Props {
  tripId: string
  existingRating?: {
    overall: number
    planning: number | null
    value: number | null
    would_go_again: boolean | null
    comment: string | null
  } | null
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="text-2xl leading-none transition-transform hover:scale-110"
          >
            <span className={(hovered || value) >= star ? 'text-amber-400' : 'text-gray-200'}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TripRatingForm({ tripId, existingRating }: Props) {
  const [overall, setOverall] = useState(existingRating?.overall || 0)
  const [planning, setPlanning] = useState(existingRating?.planning || 0)
  const [value, setValue] = useState(existingRating?.value || 0)
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean | null>(existingRating?.would_go_again ?? null)
  const [comment, setComment] = useState(existingRating?.comment || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingRating)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!overall) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall,
          planning: planning || null,
          value: value || null,
          would_go_again: wouldGoAgain,
          comment: comment.trim() || null,
        }),
      })
      if (res.ok) setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted && !existingRating) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-2">🙏</p>
        <p className="text-sm font-semibold text-gray-700">Thanks for rating!</p>
        <p className="text-xs text-gray-400 mt-1">Your feedback helps the organiser.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StarRow label="Overall experience" value={overall} onChange={setOverall} />
      <StarRow label="Trip planning" value={planning} onChange={setPlanning} />
      <StarRow label="Value for money" value={value} onChange={setValue} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Would go again?</span>
        <div className="flex gap-2">
          {([true, false] as const).map((opt) => (
            <button
              key={String(opt)}
              type="button"
              onClick={() => setWouldGoAgain(opt)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                wouldGoAgain === opt
                  ? opt ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt ? 'Yes!' : 'Maybe not'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any thoughts? (optional)"
          rows={2}
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!overall || submitting}
        className="w-full bg-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40"
      >
        {submitting ? 'Saving…' : existingRating ? 'Update rating' : 'Submit rating'}
      </button>

      {!overall && (
        <p className="text-xs text-center text-gray-400">Select at least an overall star rating</p>
      )}
    </form>
  )
}

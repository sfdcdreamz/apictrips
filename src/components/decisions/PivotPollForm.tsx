'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tripId: string
}

const DURATION_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '4 hours', hours: 4 },
  { label: '6 hours', hours: 6 },
]

export default function PivotPollForm({ tripId }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [durationHours, setDurationHours] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function addOption() {
    if (options.length < 4) setOptions([...options, ''])
  }

  function removeOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i))
  }

  function updateOption(i: number, val: string) {
    const next = [...options]
    next[i] = val
    setOptions(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const deadline = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()

    const res = await fetch(`/api/trips/${tripId}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options, deadline }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    setQuestion('')
    setOptions(['', ''])
    setDurationHours(2)
    setShowForm(false)
    router.refresh()
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-2.5 border-2 border-dashed border-red-200 rounded-xl text-sm text-red-500 hover:border-red-400 hover:text-red-600 transition-colors"
      >
        + Create pivot poll
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-red-50 rounded-xl p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
        <input
          type="text"
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Change of plans — beach or city?"
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">Options</label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              required
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="px-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {options.length < 4 && (
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            + Add option
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Voting window</label>
        <select
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.hours} value={opt.hours}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-100 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Launching…' : 'Launch pivot poll'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

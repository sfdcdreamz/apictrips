'use client'

import { useState } from 'react'

const BUDGET_RANGES = [
  { value: 'under-5k', label: 'Under ₹5k' },
  { value: '5k-10k', label: '₹5k – ₹10k' },
  { value: '10k-20k', label: '₹10k – ₹20k' },
  { value: '20k-50k', label: '₹20k – ₹50k' },
  { value: 'over-50k', label: 'Over ₹50k' },
]

interface Props {
  tripId: string
  alreadySubmitted?: boolean
}

export default function BudgetDisclosureCard({ tripId, alreadySubmitted = false }: Props) {
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!selected) return
    setSaving(true)
    setError('')

    const res = await fetch(`/api/trips/${tripId}/budget-disclosure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget_range: selected }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to submit')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <p className="text-sm font-medium text-emerald-800">Budget submitted ✓</p>
        <p className="text-xs text-emerald-600 mt-1">
          Your budget is private — the organiser only sees anonymised distribution, not individual responses.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">What&apos;s your real budget?</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Anonymous — the organiser only sees how many people fall in each range, not who said what.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {BUDGET_RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setSelected(r.value)}
            className={`px-4 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
              selected === r.value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-100 text-gray-700 hover:border-gray-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        disabled={!selected || saving}
        onClick={handleSubmit}
        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Submitting…' : 'Submit anonymously'}
      </button>
    </div>
  )
}

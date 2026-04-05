'use client'

import { useState } from 'react'

interface BudgetBreakdown {
  category: string
  amount: number
}

interface BudgetEstimate {
  min: number
  max: number
  currency: string
  breakdown: BudgetBreakdown[]
}

interface Props {
  tripId: string
}

export default function AIBudgetEstimator({ tripId }: Props) {
  const [estimate, setEstimate] = useState<BudgetEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEstimate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/estimate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get estimate')
      }
      const data = await res.json()
      setEstimate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (estimate) {
    const symbol = estimate.currency === 'INR' ? '₹' : estimate.currency
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">✨ AI Budget Estimate</span>
        </div>
        <p className="text-2xl font-bold text-emerald-600 mb-1">
          {symbol}{estimate.min.toLocaleString('en-IN')} – {symbol}{estimate.max.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-gray-400 mb-4">per person</p>
        <div className="space-y-2">
          {estimate.breakdown.map((item) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{item.category}</span>
              <span className="font-medium text-gray-800">
                {symbol}{item.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-stone-100">
          AI estimate based on group vibe and destination · Amounts in {estimate.currency} per person
        </p>
        <button
          onClick={() => setEstimate(null)}
          className="text-xs text-gray-400 hover:text-gray-600 mt-2"
        >
          Recalculate
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-2">AI Budget Estimator</p>
      <p className="text-xs text-gray-400 mb-3">
        Get a per-person budget estimate based on your destination, group vibe, and duration.
      </p>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <button
        onClick={handleEstimate}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Estimating…
          </>
        ) : (
          '✨ Estimate budget with AI'
        )}
      </button>
    </div>
  )
}

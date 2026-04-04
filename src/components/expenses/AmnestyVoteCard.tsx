'use client'

import { useState, useEffect } from 'react'

interface Props {
  tripId: string
  currentUserEmail: string
  pendingSettlementsCount: number
  pendingAmount: number
  currency: string
}

interface AmnestyState {
  votes: string[]
  memberCount: number
  threshold: number
  passed: boolean
}

export default function AmnestyVoteCard({
  tripId,
  currentUserEmail,
  pendingSettlementsCount,
  pendingAmount,
  currency,
}: Props) {
  const [state, setState] = useState<AmnestyState | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/trips/${tripId}/amnesty`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setState(data)
      })
      .catch(() => {})
  }, [tripId])

  const currencySymbol = currency === 'INR' ? '₹' : currency

  if (pendingSettlementsCount === 0) return null
  if (!state) return null

  const { votes, memberCount, threshold, passed } = state
  const hasVoted = votes.includes(currentUserEmail)

  async function handleVote() {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/amnesty`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setState(data)
        if (data.passed) window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-2xl border p-5 ${
      passed
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            🤝 Debt Amnesty Vote
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Vote to forgive all {pendingSettlementsCount} unsettled balance
            {pendingSettlementsCount !== 1 ? 's' : ''} ({currencySymbol}{pendingAmount.toLocaleString()} total).
          </p>
        </div>
        {passed ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            Granted!
          </span>
        ) : (
          <button
            onClick={handleVote}
            disabled={loading}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${
              hasVoted
                ? 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {loading ? '...' : hasVoted ? 'Withdraw vote' : 'Vote yes'}
          </button>
        )}
      </div>

      {/* Vote progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{votes.length} of {memberCount} members voted</span>
          <span>Need {threshold} to pass</span>
        </div>
        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${memberCount > 0 ? Math.min(100, Math.round((votes.length / threshold) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {passed && (
        <p className="mt-3 text-xs text-emerald-700 font-medium">
          Majority voted yes — all pending balances have been forgiven.
        </p>
      )}
    </div>
  )
}

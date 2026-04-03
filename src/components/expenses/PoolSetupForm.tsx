'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tripId: string
}

export default function PoolSetupForm({ tripId }: Props) {
  const router = useRouter()
  const [totalAmount, setTotalAmount] = useState('')
  const [perMember, setPerMember] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/trips/${tripId}/pool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total_amount: parseFloat(totalAmount),
        per_member_contribution: parseFloat(perMember),
        currency,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    router.refresh()
  }

  return (
    <div className="text-center space-y-4">
      <div className="text-3xl">💰</div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Set up expense pool</h3>
        <p className="text-xs text-gray-400 mt-1">Define the group budget to start tracking expenses</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Total pool amount</label>
            <input
              type="number"
              required
              min="1"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="60000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option>INR</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Per-member contribution</label>
          <input
            type="number"
            required
            min="1"
            value={perMember}
            onChange={(e) => setPerMember(e.target.value)}
            placeholder="10000"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Setting up…' : 'Set up pool'}
        </button>
      </form>
    </div>
  )
}

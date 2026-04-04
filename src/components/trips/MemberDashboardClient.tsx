'use client'

import { useState } from 'react'
import type { MemberStatus } from '@/types'

interface Props {
  tripId: string
  initialStatus: MemberStatus
  initialUpiId: string
  memberName: string
}

export default function MemberDashboardClient({ tripId, initialStatus, initialUpiId, memberName }: Props) {
  const [status, setStatus] = useState<MemberStatus>(initialStatus)
  const [upiId, setUpiId] = useState(initialUpiId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save(newStatus: MemberStatus, newUpi: string) {
    setSaving(true)
    setSaved(false)
    setError('')

    const res = await fetch(`/api/trips/${tripId}/members/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, upi_id: newUpi }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to save')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleStatusChange(s: MemberStatus) {
    setStatus(s)
    save(s, upiId)
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">My Details — {memberName}</h2>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {saved && <span className="text-xs text-emerald-600 font-medium">Saved ✓</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      {/* RSVP */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">RSVP</label>
        <div className="flex gap-2">
          {(['in', 'tentative', 'out'] as MemberStatus[]).map((s) => (
            <button
              key={s}
              disabled={saving}
              onClick={() => handleStatusChange(s)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all capitalize disabled:opacity-60 ${
                status === s
                  ? s === 'in'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : s === 'tentative'
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}
            >
              {s === 'in' ? "I'm in" : s === 'tentative' ? 'Maybe' : "Can't go"}
            </button>
          ))}
        </div>
      </div>

      {/* UPI ID */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">UPI ID (for expense settlements)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            disabled={saving}
            onClick={() => save(status, upiId)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

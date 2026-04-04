'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  templateId: string
  templateName: string
  destination: string
  durationDays: number
}

export default function CloneTemplateForm({ templateId, templateName, destination, durationDays }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(`${templateName} (my trip)`)
  const [startDate, setStartDate] = useState('')
  const [groupSize, setGroupSize] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function computeEndDate(start: string) {
    if (!start) return ''
    const d = new Date(start)
    d.setDate(d.getDate() + durationDays - 1)
    return d.toISOString().split('T')[0]
  }

  async function handleClone(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startDate) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/templates/${templateId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          start_date: startDate,
          end_date: computeEndDate(startDate),
          group_size: groupSize,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Clone failed')
        return
      }
      router.push(`/trips/${data.trip.id}`)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
      >
        Use this template
      </button>
    )
  }

  return (
    <form onSubmit={handleClone} className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Trip name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
            className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">End date</label>
          <input
            type="date"
            value={computeEndDate(startDate)}
            readOnly
            className="w-full text-sm rounded-xl border border-gray-100 px-3 py-2 bg-gray-50 text-gray-400"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Group size</label>
        <input
          type="number"
          value={groupSize}
          onChange={(e) => setGroupSize(Number(e.target.value))}
          min={1}
          max={50}
          required
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <p className="text-xs text-gray-400">
        Destination: {destination} · {durationDays} days
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 text-sm text-gray-500 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim() || !startDate}
          className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create trip'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VibeBudget, VibePace, VibeStyle, VibeAccommodation } from '@/types'
import { buildInviteUrl } from '@/lib/utils'

const BUDGET_OPTIONS: { value: VibeBudget; label: string; desc: string }[] = [
  { value: 'budget', label: 'Budget', desc: 'Keep it lean' },
  { value: 'mid-range', label: 'Mid-range', desc: 'Comfort without excess' },
  { value: 'luxury', label: 'Luxury', desc: 'Best experience' },
]

const PACE_OPTIONS: { value: VibePace; label: string; desc: string }[] = [
  { value: 'relaxed', label: 'Relaxed', desc: '1–2 activities/day' },
  { value: 'moderate', label: 'Moderate', desc: '3–4 activities/day' },
  { value: 'packed', label: 'Packed', desc: 'Max every day' },
]

const STYLE_OPTIONS: { value: VibeStyle; label: string; desc: string }[] = [
  { value: 'beach', label: 'Beach', desc: 'Sun, sand, water' },
  { value: 'adventure', label: 'Adventure', desc: 'Hikes, thrills' },
  { value: 'culture', label: 'Culture', desc: 'History, food, art' },
  { value: 'city', label: 'City', desc: 'Urban exploration' },
  { value: 'mixed', label: 'Mixed', desc: 'A bit of everything' },
]

const ACCOMMODATION_OPTIONS: { value: VibeAccommodation; label: string; desc: string }[] = [
  { value: 'hostel', label: 'Hostel', desc: 'Social, budget' },
  { value: 'airbnb', label: 'Airbnb', desc: 'Home away from home' },
  { value: 'hotel', label: 'Hotel', desc: 'Classic comfort' },
  { value: 'luxury', label: 'Luxury stay', desc: 'Resort / 5-star' },
]

function VibeCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: { value: T; label: string; desc: string }
  selected: boolean
  onSelect: (v: T) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`p-3 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-gray-100 hover:border-gray-200 bg-white'
      }`}
    >
      <div className={`text-sm font-medium ${selected ? 'text-emerald-700' : 'text-gray-800'}`}>
        {option.label}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{option.desc}</div>
    </button>
  )
}

export default function TripCreateForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [tripName, setTripName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [groupSize, setGroupSize] = useState(4)

  // Step 2
  const [budget, setBudget] = useState<VibeBudget | ''>('')
  const [pace, setPace] = useState<VibePace | ''>('')
  const [style, setStyle] = useState<VibeStyle | ''>('')
  const [accommodation, setAccommodation] = useState<VibeAccommodation | ''>('')

  // Step 3
  const [inviteUrl, setInviteUrl] = useState('')
  const [tripId, setTripId] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setError('')
    setLoading(true)

    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tripName,
        destination,
        start_date: startDate,
        end_date: endDate,
        group_size: groupSize,
        vibe_budget: budget || null,
        vibe_pace: pace || null,
        vibe_style: style || null,
        vibe_accommodation: accommodation || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    setInviteUrl(buildInviteUrl(data.trip.invite_code))
    setTripId(data.trip.id)
    setStep(3)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the input
      const input = document.getElementById('invite-url-input') as HTMLInputElement
      input?.select()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-lg">
      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                  step >= s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-8 ${step > s ? 'bg-emerald-600' : 'bg-gray-100'}`} />}
            </div>
          ))}
          <span className="text-sm text-gray-400 ml-2">
            {step === 1 ? 'Trip details' : 'Your vibe'}
          </span>
        </div>
      )}

      {/* Step 1 — Trip Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Plan a new trip</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip name</label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g. Goa June 2026"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Goa, India"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group size <span className="text-gray-400 font-normal">({groupSize} people)</span>
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2</span><span>20</span>
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!tripName || !destination || !startDate || !endDate}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2 — Vibe Check */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your travel vibe</h2>
            <p className="text-sm text-gray-400 mt-1">
              We&apos;ll flag conflicts when group members have very different preferences.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget preference</label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGET_OPTIONS.map((o) => (
                <VibeCard key={o.value} option={o} selected={budget === o.value} onSelect={setBudget} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel pace</label>
            <div className="grid grid-cols-3 gap-2">
              {PACE_OPTIONS.map((o) => (
                <VibeCard key={o.value} option={o} selected={pace === o.value} onSelect={setPace} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((o) => (
                <VibeCard key={o.value} option={o} selected={style === o.value} onSelect={setStyle} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOMMODATION_OPTIONS.map((o) => (
                <VibeCard key={o.value} option={o} selected={accommodation === o.value} onSelect={setAccommodation} />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating…' : 'Create trip'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Invite link */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h2 className="text-lg font-semibold text-gray-900">Your trip is live!</h2>
            <p className="text-sm text-gray-400 mt-1">Share this link — no account needed to join.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invite link</label>
            <div className="flex gap-2">
              <input
                id="invite-url-input"
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 min-w-0"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}`)}
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go to trip dashboard →
          </button>
        </div>
      )}
    </div>
  )
}

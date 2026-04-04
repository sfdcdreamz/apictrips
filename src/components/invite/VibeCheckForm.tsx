'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { VibeBudget, VibePace, VibeStyle, VibeAccommodation, MemberStatus, Member } from '@/types'
import { computeVibeScore } from '@/lib/vibe-score'

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

type VibeSnapshot = Pick<Member, 'vibe_budget' | 'vibe_pace' | 'vibe_style' | 'vibe_accommodation' | 'vibe_completed'>

interface Props {
  inviteCode: string
  tripName: string
  existingVibeMembers?: VibeSnapshot[]
}

export default function VibeCheckForm({ inviteCode, tripName, existingVibeMembers = [] }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<MemberStatus>('in')
  const [budget, setBudget] = useState<VibeBudget | ''>('')
  const [pace, setPace] = useState<VibePace | ''>('')
  const [style, setStyle] = useState<VibeStyle | ''>('')
  const [accommodation, setAccommodation] = useState<VibeAccommodation | ''>('')
  const [upiId, setUpiId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const vibeSelectedCount = [budget, pace, style, accommodation].filter(Boolean).length

  const vibeImpact = useMemo(() => {
    const completed = existingVibeMembers.filter((m) => m.vibe_completed)
    if (completed.length < 1 || vibeSelectedCount < 2) return null

    const baseScore = completed.length >= 2 ? computeVibeScore(completed as Member[]).score : null

    const hypothetical = [
      ...completed,
      {
        vibe_budget: budget || null,
        vibe_pace: pace || null,
        vibe_style: style || null,
        vibe_accommodation: accommodation || null,
        vibe_completed: true,
      },
    ]
    const { score, label } = computeVibeScore(hypothetical as Member[])

    return { baseScore, projectedScore: score, label }
  }, [budget, pace, style, accommodation, existingVibeMembers, vibeSelectedCount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/invite/${inviteCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        status,
        vibe_budget: budget || null,
        vibe_pace: pace || null,
        vibe_style: style || null,
        vibe_accommodation: accommodation || null,
        upi_id: upiId.trim() || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }

    const tripId = data.trip_id
    setStep('done')
    router.push(`/auth/signup?email=${encodeURIComponent(email)}&next=/trips/${tripId}/member`)
  }

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re in!</h2>
        <p className="text-gray-500 text-sm">Setting up your account…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your details</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID <span className="text-gray-400 font-normal">(optional — for expense settlements)</span></label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Are you going?</label>
          <div className="flex gap-2">
            {(['in', 'tentative', 'out'] as MemberStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all capitalize ${
                  status === s
                    ? s === 'in'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : s === 'tentative'
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                      : 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                {s === 'in' ? "I'm in" : s === 'tentative' ? 'Maybe' : "Can't make it"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vibe Check */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your travel vibe</h3>
        <p className="text-xs text-gray-400">Helps flag any preference conflicts before planning begins.</p>

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
      </div>

      {/* Vibe Impact preview */}
      {vibeImpact && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vibe Impact</p>
          {vibeImpact.baseScore !== null && (
            <p className="text-xs text-gray-500">
              Current group score: <span className="font-semibold text-gray-700">{vibeImpact.baseScore}%</span>
            </p>
          )}
          <p className="text-xs text-gray-500">
            With you:{' '}
            <span className={`font-semibold ${
              vibeImpact.projectedScore >= 80 ? 'text-emerald-600' :
              vibeImpact.projectedScore >= 60 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {vibeImpact.projectedScore}% — {vibeImpact.label}
            </span>{' '}
            {vibeImpact.baseScore !== null && (
              <span className="text-gray-400">
                ({vibeImpact.projectedScore > vibeImpact.baseScore ? '↑ improving' :
                  vibeImpact.projectedScore < vibeImpact.baseScore ? '↓ lowering' : '→ neutral'})
              </span>
            )}
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Joining…' : 'Join trip'}
      </button>
    </form>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

interface Props {
  pollId: string
  question: string
  options: string[]
  deadline: string
  initialEmail?: string
  redirectTo?: string
}

export default function VoteForm({ pollId, question, options, deadline, initialEmail = '', redirectTo }: Props) {
  const [step, setStep] = useState<'form' | 'submitting' | 'success' | 'error'>('form')
  const [email, setEmail] = useState(initialEmail)
  const [chosen, setChosen] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (step === 'success' && redirectTo) {
      const t = setTimeout(() => { window.location.href = redirectTo }, 1500)
      return () => clearTimeout(t)
    }
  }, [step, redirectTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!chosen) {
      setErrorMsg('Please select an option')
      return
    }
    setErrorMsg('')
    setStep('submitting')

    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), option_chosen: chosen }),
    })

    const data = await res.json()

    if (!res.ok) {
      setStep('form')
      setErrorMsg(data.error || 'Something went wrong')
      if (res.status === 409) setStep('error')
      return
    }

    setStep('success')
  }

  const loading = step === 'submitting'

  if (step === 'success') {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-semibold text-gray-900">Your vote is in!</h2>
        <p className="text-gray-500 text-sm">Thanks for voting on <strong>{question}</strong>.</p>
        {redirectTo && (
          <a
            href={redirectTo}
            className="inline-block mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            ← Back to your trip
          </a>
        )}
        {redirectTo && (
          <p className="text-xs text-gray-400">Redirecting automatically…</p>
        )}
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900">Already voted</h2>
        <p className="text-gray-500 text-sm">{errorMsg}</p>
        {redirectTo && (
          <a href={redirectTo} className="inline-block mt-2 text-sm text-emerald-600 font-medium hover:underline">
            ← Back to your trip
          </a>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-xs text-gray-400">Voting closes {formatDate(deadline)}</p>

      <div>
        {initialEmail ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-gray-400">🔒</span>
            <span>Voting as <strong>{initialEmail}</strong></span>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your email (used when you joined the trip)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Choose an option</label>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setChosen(opt)}
            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
              chosen === opt
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-100 hover:border-gray-200 bg-white'
            }`}
          >
            <span className={`text-sm font-medium ${chosen === opt ? 'text-emerald-700' : 'text-gray-800'}`}>
              {opt}
            </span>
          </button>
        ))}
      </div>

      {errorMsg && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting…' : 'Submit vote'}
      </button>
    </form>
  )
}

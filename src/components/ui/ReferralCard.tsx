'use client'

import { useState } from 'react'

interface Props {
  userId: string
  referralCount: number
}

export default function ReferralCard({ userId, referralCount }: Props) {
  const [copied, setCopied] = useState(false)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${appUrl}/r/${userId}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback — select the input
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">🎁 Refer a friend</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Share your link — they get a head start, you get credit.
          </p>
        </div>
        {referralCount > 0 && (
          <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            {referralCount} referred
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={link}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 truncate focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          onClick={copy}
          className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

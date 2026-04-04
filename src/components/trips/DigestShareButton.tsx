'use client'

import { useState } from 'react'

interface Props {
  tripId: string
  existingToken: string | null
  publicUrl: string | null
}

export default function DigestShareButton({ tripId, existingToken, publicUrl }: Props) {
  const [token, setToken] = useState(existingToken)
  const [url, setUrl] = useState(publicUrl)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generateLink() {
    setLoading(true)
    const res = await fetch(`/api/trips/${tripId}/digest-token`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (data.digest_token) {
      setToken(data.digest_token)
      const newUrl = `${window.location.origin}/digest/${data.digest_token}`
      setUrl(newUrl)
    }
  }

  async function copyLink() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!token || !url) {
    return (
      <button
        onClick={generateLink}
        disabled={loading}
        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating…' : 'Generate share link'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 bg-gray-50"
        />
        <button
          onClick={copyLink}
          className="shrink-0 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-gray-400">Anyone with this link can view the digest — no sign-in required.</p>
    </div>
  )
}

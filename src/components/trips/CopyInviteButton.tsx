'use client'

import { useState } from 'react'

export default function CopyInviteButton({
  inviteUrl,
  label = 'Copy',
}: {
  inviteUrl: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.querySelector('input[readonly]') as HTMLInputElement
      input?.select()
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

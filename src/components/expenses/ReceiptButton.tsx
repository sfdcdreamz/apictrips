'use client'

import { useState } from 'react'

interface Props {
  tripId: string
  expenseId: string
}

export default function ReceiptButton({ tripId, expenseId }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch(`/api/trips/${tripId}/pool/expenses/${expenseId}/receipt`)
    setLoading(false)
    if (!res.ok) return
    const { signedUrl } = await res.json()
    window.open(signedUrl, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="View receipt"
      className="text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-50 text-sm shrink-0"
    >
      {loading ? '…' : '📎'}
    </button>
  )
}

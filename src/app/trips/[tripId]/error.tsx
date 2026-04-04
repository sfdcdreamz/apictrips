'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <h2 className="text-base font-semibold text-gray-800 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-5">
        {error.message || 'Failed to load this page.'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

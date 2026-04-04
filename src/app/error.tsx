'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center max-w-sm w-full">
        <div className="text-3xl mb-3">⚠️</div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-5">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

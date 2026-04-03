import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-4xl font-bold text-gray-900 mb-3">APIcTrips</div>
        <p className="text-gray-500 mb-2">
          Group travel coordination — one hub for decisions, expenses, and the plan.
        </p>
        <p className="text-sm text-emerald-600 font-medium mb-8">
          Decisions that stick.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signup"
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Plan a trip
          </Link>
          <Link
            href="/auth/login"
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

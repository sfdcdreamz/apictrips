import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import AgreementTimeline from '@/components/decisions/AgreementTimeline'
import type { Expense, PollWithVotes } from '@/types'

async function getTimelineData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const [{ data: polls }, { data: pool }] = await Promise.all([
    serviceSupabase.from('polls').select('*').eq('trip_id', tripId).eq('status', 'locked').order('created_at'),
    serviceSupabase.from('pools').select('*, expenses(*)').eq('trip_id', tripId).single(),
  ])

  return {
    polls: (polls || []) as PollWithVotes[],
    expenses: ((pool as { expenses: Expense[] } | null)?.expenses || []) as Expense[],
    currency: pool?.currency || 'INR',
  }
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getTimelineData(tripId)
  if (!data) notFound()

  const { polls, expenses, currency } = data
  const currencySymbol = currency === 'INR' ? '₹' : currency
  const hasContent = polls.length > 0 || expenses.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">What We Agreed</h1>
        <p className="text-emerald-100 text-sm mt-1">
          Immutable log of every group decision and expense.
        </p>
      </div>

      {hasContent ? (
        <AgreementTimeline polls={polls} expenses={expenses} currencySymbol={currencySymbol} />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">No decisions logged yet.</p>
          <p className="text-gray-400 text-xs mt-1">Lock a poll or log an expense to see the timeline.</p>
        </div>
      )}
    </div>
  )
}

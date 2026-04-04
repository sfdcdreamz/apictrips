import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { formatDateRange } from '@/lib/utils'
import type { Poll, Expense, ItineraryItem } from '@/types'

async function getPublicDigest(digestToken: string) {
  const supabase = createServiceRoleClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('digest_token', digestToken)
    .single()

  if (!trip) return null

  const [{ data: polls }, { data: pool }, { data: itinerary }, { data: members }] = await Promise.all([
    supabase.from('polls').select('*').eq('trip_id', trip.id).eq('status', 'locked').order('created_at'),
    supabase.from('pools').select('*, expenses(*)').eq('trip_id', trip.id).single(),
    supabase.from('itinerary_items').select('*').eq('trip_id', trip.id).order('day_number').order('time'),
    supabase.from('members').select('name, status').eq('trip_id', trip.id),
  ])

  return { trip, polls: polls || [], pool, itinerary: itinerary || [], members: members || [] }
}

export default async function PublicDigestPage({
  params,
}: {
  params: Promise<{ digestToken: string }>
}) {
  const { digestToken } = await params
  const data = await getPublicDigest(digestToken)
  if (!data) notFound()

  const { trip, polls, pool, itinerary, members } = data
  const expenses: Expense[] = (pool as { expenses: Expense[] } | null)?.expenses || []
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currencySymbol = pool?.currency === 'INR' ? '₹' : (pool?.currency || '')

  const byDay = new Map<number, ItineraryItem[]>()
  for (const item of itinerary as ItineraryItem[]) {
    if (!byDay.has(item.day_number)) byDay.set(item.day_number, [])
    byDay.get(item.day_number)!.push(item)
  }

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
          <div className="text-xs font-medium text-emerald-200 mb-1">Decisions Digest · Shared Link</div>
          <h1 className="text-2xl font-bold">{trip.name}</h1>
          <p className="text-emerald-100 text-sm mt-1">
            📍 {trip.destination} · 📅 {formatDateRange(trip.start_date, trip.end_date)}
          </p>
          <p className="text-emerald-200 text-xs mt-2">{members.length} members</p>
        </div>

        {/* Locked decisions */}
        {polls.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">What We Decided ({polls.length})</h2>
            <div className="space-y-3">
              {(polls as Poll[]).map((p) => (
                <div key={p.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.question}</p>
                    <p className="text-sm text-emerald-700">→ {p.winning_option}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itinerary */}
        {byDay.size > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Itinerary</h2>
            <div className="space-y-4">
              {Array.from(byDay.entries()).map(([day, items]) => (
                <div key={day}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Day {day}</p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-xs text-gray-300">·</span>
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        {pool && (
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Budget</h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-gray-800">{currencySymbol}{pool.total_amount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">total pool</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{currencySymbol}{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-gray-400">spent so far</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Shared via APIcTrips · Plan your group trip at apictrips.vercel.app
        </p>
      </div>
    </div>
  )
}

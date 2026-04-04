import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { formatDateRange } from '@/lib/utils'
import type { Poll, Expense, ItineraryItem } from '@/types'
import DigestShareButton from '@/components/trips/DigestShareButton'

async function getDigestData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return null

  const serviceSupabase = createServiceRoleClient()
  const [{ data: polls }, { data: pool }, { data: itinerary }, { data: members }] = await Promise.all([
    serviceSupabase.from('polls').select('*').eq('trip_id', tripId).eq('status', 'locked').order('created_at'),
    serviceSupabase.from('pools').select('*, expenses(*)').eq('trip_id', tripId).single(),
    serviceSupabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number').order('time'),
    serviceSupabase.from('members').select('name, status').eq('trip_id', tripId),
  ])

  return { trip, polls: polls || [], pool, itinerary: itinerary || [], members: members || [] }
}

export default async function DigestPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getDigestData(tripId)
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

  const publicUrl = trip.digest_token
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/digest/${trip.digest_token}`
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Decisions Digest</h1>
        <p className="text-emerald-100 text-sm mt-1">
          {trip.name} · {formatDateRange(trip.start_date, trip.end_date)}
        </p>
      </div>

      {/* Share controls */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Share this digest</h2>
        <DigestShareButton tripId={tripId} existingToken={trip.digest_token} publicUrl={publicUrl} />
      </div>

      {/* Locked decisions */}
      {polls.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Locked Decisions ({polls.length})</h2>
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

      {/* Itinerary highlights */}
      {byDay.size > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Itinerary ({itinerary.length} items)</h2>
          <div className="space-y-4">
            {Array.from(byDay.entries()).map(([day, items]) => (
              <div key={day}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Day {day}</p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-xs">{item.status === 'done' ? '✓' : '·'}</span>
                      <span>{item.title}</span>
                      {item.cost > 0 && <span className="text-xs text-gray-400">{currencySymbol}{item.cost.toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget summary */}
      {pool && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Budget Summary</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800">{currencySymbol}{pool.total_amount.toLocaleString()}</p>
              <p className="text-xs text-gray-400">total pool</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{currencySymbol}{totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-400">spent</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${pool.total_amount - totalSpent < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {currencySymbol}{Math.abs(pool.total_amount - totalSpent).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{pool.total_amount - totalSpent < 0 ? 'over' : 'remaining'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Group ({members.length})</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((m, i) => (
            <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${
              m.status === 'in' ? 'bg-emerald-100 text-emerald-700' :
              m.status === 'out' ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

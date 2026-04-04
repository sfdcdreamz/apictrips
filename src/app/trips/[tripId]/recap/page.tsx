import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import TripRatingForm from '@/components/trips/TripRatingForm'
import PublishTemplateButton from '@/components/trips/PublishTemplateButton'
import { formatDateRange, formatDate } from '@/lib/utils'
import type { Poll, Expense, ItineraryItem, Member, ExpenseCategory } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Flights: '✈️',
  Stay: '🏨',
  Food: '🍽️',
  Transport: '🚌',
  Experiences: '🎯',
  Misc: '📦',
}

async function getRecapData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  // Check membership
  const [{ data: trip }, { data: membership }] = await Promise.all([
    serviceSupabase.from('trips').select('*').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return null

  const isOrganiser = trip.organiser_id === user.id
  const isMember = !!membership || isOrganiser
  if (!isMember) return null

  const [
    { data: polls },
    { data: pool },
    { data: itinerary },
    { data: members },
    { data: settlements },
    { data: ratings },
    imageUrl,
  ] = await Promise.all([
    serviceSupabase.from('polls').select('*').eq('trip_id', tripId).order('created_at'),
    serviceSupabase.from('pools').select('*, expenses(*)').eq('trip_id', tripId).single(),
    serviceSupabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number').order('time'),
    serviceSupabase.from('members').select('name, email, status, vibe_completed').eq('trip_id', tripId),
    serviceSupabase.from('settlements').select('*').eq('trip_id', tripId),
    serviceSupabase.from('trip_ratings').select('*').eq('trip_id', tripId),
    getDestinationImage(trip.destination),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myRating = (ratings || []).find((r: any) => r.member_email === user.email) || null

  return {
    trip,
    polls: (polls || []) as Poll[],
    pool,
    itinerary: (itinerary || []) as ItineraryItem[],
    members: (members || []) as Pick<Member, 'name' | 'email' | 'status' | 'vibe_completed'>[],
    settlements: settlements || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ratings: (ratings || []) as any[],
    myRating,
    imageUrl: imageUrl || '',
    isOrganiser,
    currentUserEmail: user.email || '',
  }
}

export default async function RecapPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getRecapData(tripId)
  if (!data) notFound()

  const { trip, polls, pool, itinerary, members, settlements, ratings, myRating, imageUrl, isOrganiser } = data

  const isPostTrip = new Date() > new Date(trip.end_date)
  const tripDays = Math.max(1, differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1)
  const expenses: Expense[] = (pool as { expenses: Expense[] } | null)?.expenses || []
  const currencySymbol = pool?.currency === 'INR' ? '₹' : (pool?.currency || '₹')

  // Stats
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const lockedPolls = polls.filter((p) => p.status === 'locked')
  const doneItems = itinerary.filter((i) => i.status === 'done')
  const confirmedMembers = members.filter((m) => m.status === 'in')
  const confirmedSettlements = settlements.filter((s: { status: string }) => s.status === 'confirmed')

  // Category breakdown — top category
  const categories: ExpenseCategory[] = ['Flights', 'Stay', 'Food', 'Transport', 'Experiences', 'Misc']
  const categorySpend = categories
    .map((cat) => ({
      cat,
      amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  // Most expensive single expense
  const topExpense = [...expenses].sort((a, b) => b.amount - a.amount)[0]

  // First locked decision
  const firstDecision = lockedPolls[0]

  // Itinerary completion rate
  const completionRate = itinerary.length > 0
    ? Math.round((doneItems.length / itinerary.length) * 100)
    : 0

  // Engagement score (simple composite)
  const vibeCount = members.filter((m) => m.vibe_completed).length
  const engagementScore = members.length > 0
    ? Math.round(((confirmedMembers.length * 2 + lockedPolls.length + vibeCount) /
        (members.length * 2 + polls.length + members.length)) * 100)
    : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden">
        <DestinationHero imageUrl={imageUrl} destination={trip.destination} height="sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/80 to-pink-500/60 flex flex-col justify-end p-6">
          <p className="text-white/70 text-sm mb-1">📍 {trip.destination}</p>
          <h1 className="text-2xl font-bold text-white">
            {isPostTrip ? '🎉 Trip Recap' : '📋 Trip Preview'}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            {trip.name} · {formatDateRange(trip.start_date, trip.end_date)}
          </p>
        </div>
      </div>

      {!isPostTrip ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="text-gray-700 font-medium">Recap unlocks after the trip ends</p>
          <p className="text-sm text-gray-400 mt-1">
            Come back on {formatDate(trip.end_date)} for the full summary.
          </p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Days', value: tripDays, icon: '📅' },
              { label: 'Members', value: `${confirmedMembers.length}/${members.length}`, icon: '👥' },
              { label: 'Activities', value: `${doneItems.length}/${itinerary.length}`, icon: '✅' },
              { label: 'Decisions', value: lockedPolls.length, icon: '🔒' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Budget snapshot */}
          {pool && totalSpent > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">💰 Money</h2>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {currencySymbol}{totalSpent.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    total spent · {currencySymbol}{Math.round(totalSpent / Math.max(1, confirmedMembers.length)).toLocaleString()} per person
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${pool.total_amount - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pool.total_amount - totalSpent >= 0 ? '↓' : '↑'}{' '}
                    {currencySymbol}{Math.abs(pool.total_amount - totalSpent).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {pool.total_amount - totalSpent >= 0 ? 'under budget' : 'over budget'}
                  </p>
                </div>
              </div>

              {/* Category bars */}
              {categorySpend.length > 0 && (
                <div className="space-y-2 mt-4">
                  {categorySpend.map(({ cat, amount }) => {
                    const pct = Math.round((amount / totalSpent) * 100)
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="w-6 text-base shrink-0 text-center">{CATEGORY_ICONS[cat]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">{cat}</span>
                            <span className="text-gray-500">{currencySymbol}{amount.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Highlights */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">✨ Highlights</h2>
            <div className="space-y-3">
              {firstDecision && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg shrink-0">🔒</span>
                  <div>
                    <p className="text-xs text-gray-400">First decision locked</p>
                    <p className="text-sm text-gray-700 font-medium">{firstDecision.winning_option}</p>
                    <p className="text-xs text-gray-400">— {firstDecision.question}</p>
                  </div>
                </div>
              )}
              {topExpense && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg shrink-0">💸</span>
                  <div>
                    <p className="text-xs text-gray-400">Biggest expense</p>
                    <p className="text-sm text-gray-700 font-medium">{topExpense.description}</p>
                    <p className="text-xs text-gray-400">{currencySymbol}{topExpense.amount.toLocaleString()} · {topExpense.category}</p>
                  </div>
                </div>
              )}
              {itinerary.length > 0 && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg shrink-0">✅</span>
                  <div>
                    <p className="text-xs text-gray-400">Itinerary completion</p>
                    <p className="text-sm text-gray-700 font-medium">{completionRate}% done</p>
                    <p className="text-xs text-gray-400">{doneItems.length} of {itinerary.length} activities completed</p>
                  </div>
                </div>
              )}
              {confirmedSettlements.length > 0 && (
                <div className="flex gap-3 items-start">
                  <span className="text-lg shrink-0">🤝</span>
                  <div>
                    <p className="text-xs text-gray-400">Settlements confirmed</p>
                    <p className="text-sm text-gray-700 font-medium">{confirmedSettlements.length} of {settlements.length} transactions</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">👥 Your Group</h2>
            <div className="flex flex-wrap gap-2">
              {members.map((m, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${
                  m.status === 'in' ? 'bg-emerald-100 text-emerald-700' :
                  m.status === 'out' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {m.name}
                  {m.status === 'out' && ' (dropped)'}
                </span>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-700">Group Engagement</h2>
              <span className="text-sm font-bold text-violet-600">{Math.min(100, engagementScore)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, engagementScore)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Based on RSVPs, vibe check participation, and poll engagement.
            </p>
          </div>

          {/* Trip ratings */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">⭐ Rate this trip</h2>
              {ratings.length > 0 && (
                <span className="text-xs text-gray-400">
                  {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
                  {' · '}avg {(ratings.reduce((s: number, r: { overall: number }) => s + r.overall, 0) / ratings.length).toFixed(1)}★
                </span>
              )}
            </div>
            <TripRatingForm tripId={tripId} existingRating={myRating} />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/trips/${tripId}/digest`}
              className="bg-emerald-600 text-white rounded-2xl p-4 text-center hover:bg-emerald-700 transition-colors"
            >
              <p className="text-lg mb-1">📄</p>
              <p className="text-sm font-semibold">Share Digest</p>
            </Link>
            {isOrganiser && (
              <a
                href={`/api/trips/${tripId}/export/expenses`}
                download
                className="bg-white border border-stone-200 text-gray-700 rounded-2xl p-4 text-center hover:bg-gray-50 transition-colors"
              >
                <p className="text-lg mb-1">📊</p>
                <p className="text-sm font-semibold">Download CSV</p>
              </a>
            )}
            <Link
              href="/trips/new"
              className="bg-violet-600 text-white rounded-2xl p-4 text-center hover:bg-violet-700 transition-colors col-span-2 sm:col-span-1"
            >
              <p className="text-lg mb-1">✈️</p>
              <p className="text-sm font-semibold">Plan Next Trip</p>
            </Link>
          </div>

          {/* Publish as template */}
          {isOrganiser && itinerary.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Share your itinerary</h2>
              <p className="text-xs text-gray-400 mb-3">
                Publish your {itinerary.length}-item itinerary so others can clone it for their own trips.
              </p>
              <PublishTemplateButton tripId={tripId} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

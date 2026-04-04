import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { detectConflicts } from '@/lib/conflict-detector'
import { computeVibeScore } from '@/lib/vibe-score'
import { computeTripHealth } from '@/lib/trip-health'
import { formatDateRange, buildInviteUrl, getInitials, getAvatarColor } from '@/lib/utils'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import CopyInviteButton from '@/components/trips/CopyInviteButton'
import EditTripForm from '@/components/trips/EditTripForm'
import BudgetDistributionCard from '@/components/budget/BudgetDistributionCard'
import type { Member, PollWithVotes, Pool, Expense } from '@/types'

async function getTripData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()
  if (!trip) return null

  // Non-organisers get redirected to the member view
  if (trip.organiser_id !== user.id) return { redirect: true as const, tripId }

  const [
    { data: members },
    { data: polls },
    { data: pool },
    { data: iItems },
    imageUrl,
    { data: budgetData },
  ] = await Promise.all([
    serviceSupabase.from('members').select('*').eq('trip_id', tripId).order('joined_at', { ascending: true }),
    serviceSupabase.from('polls').select('*, votes(*)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    serviceSupabase.from('pools').select('*, expenses(*)').eq('trip_id', tripId).single(),
    serviceSupabase.from('itinerary_items').select('day_number').eq('trip_id', tripId),
    getDestinationImage(trip.destination),
    serviceSupabase.from('budget_disclosures').select('budget_range').eq('trip_id', tripId),
  ])

  const RANGES = ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k']
  const budgetCounts: Record<string, number> = {}
  for (const r of RANGES) budgetCounts[r] = 0
  for (const d of (budgetData || [])) budgetCounts[d.budget_range] = (budgetCounts[d.budget_range] || 0) + 1

  return {
    trip,
    members: (members || []) as Member[],
    polls: (polls || []) as PollWithVotes[],
    pool: (pool || null) as (Pool & { expenses: Expense[] }) | null,
    itineraryDays: new Set((iItems || []).map((i: { day_number: number }) => i.day_number)).size,
    imageUrl,
    budgetCounts,
    budgetTotal: (budgetData || []).length,
  }
}

function tripDuration(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const result = await getTripData(tripId)
  if (!result) notFound()
  if ('redirect' in result) redirect(`/trips/${tripId}/member`)

  const { trip, members, polls, pool, itineraryDays, imageUrl, budgetCounts, budgetTotal } = result
  const conflicts = detectConflicts(members)
  const vibeScore = computeVibeScore(members)
  const tripHealth = computeTripHealth(members, polls)
  const inviteUrl = buildInviteUrl(trip.invite_code)

  const daysUntilTrip = Math.ceil(
    (new Date(trip.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const confirmedCount = members.filter((m) => m.status === 'in').length
  const tentativeCount = members.filter((m) => m.status === 'tentative').length
  const openPolls = polls.filter((p) => p.status === 'open')
  const lockedPolls = polls.filter((p) => p.status === 'locked')

  const expenses: Expense[] = pool?.expenses || []
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = (pool?.total_amount || 0) - totalSpent
  const currencySymbol = pool?.currency === 'INR' ? '₹' : (pool?.currency || '')
  const totalDays = tripDuration(trip.start_date, trip.end_date)

  type ActivityItem = {
    id: string; label: string; sub: string; time: string; type: 'poll' | 'expense'
  }
  const activity: ActivityItem[] = [
    ...lockedPolls.slice(0, 3).map((p) => ({
      id: p.id,
      label: `Poll locked: ${p.question}`,
      sub: `→ ${p.winning_option}`,
      time: p.created_at,
      type: 'poll' as const,
    })),
    ...openPolls.slice(0, 2).map((p) => ({
      id: `open-${p.id}`,
      label: `Poll open: ${p.question}`,
      sub: `Deadline: ${new Date(p.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      time: p.created_at,
      type: 'poll' as const,
    })),
    ...expenses.slice(0, 3).map((e) => ({
      id: e.id,
      label: e.description,
      sub: `${e.logged_by} · ${e.category}`,
      time: e.created_at,
      type: 'expense' as const,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Hero */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="relative">
          <DestinationHero imageUrl={imageUrl} destination={trip.destination} height="md" />
          <div className="absolute top-3 right-3">
            <a
              href="/dashboard"
              className="text-xs bg-white/80 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full font-medium hover:bg-white transition-colors"
            >
              ← All trips
            </a>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4">
            <h1 className="text-2xl font-bold text-white">{trip.name}</h1>
            <p className="text-white/80 text-sm mt-0.5">
              📍 {trip.destination} · 📅 {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Edit trip details (organiser only) */}
      <div className="flex justify-end px-1">
        <EditTripForm
          tripId={tripId}
          initialName={trip.name}
          initialDestination={trip.destination}
          initialStartDate={trip.start_date}
          initialEndDate={trip.end_date}
        />
      </div>

      {/* Members row */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m, i) => (
              <div
                key={m.id}
                title={m.name}
                className={`w-9 h-9 rounded-full ${getAvatarColor(i)} text-white text-sm flex items-center justify-center font-medium ring-2 ring-white`}
              >
                {getInitials(m.name)}
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {confirmedCount} confirmed · {tentativeCount} tentative
            </p>
            <p className="text-xs text-gray-400">{members.length} of {trip.group_size} joined</p>
          </div>
        </div>
        <CopyInviteButton inviteUrl={inviteUrl} label="Invite" />
      </div>

      {/* Alert: open polls */}
      {openPolls.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-medium">
            {openPolls.length} poll{openPolls.length > 1 ? 's' : ''} need{openPolls.length === 1 ? 's' : ''} your vote
          </p>
          <Link href={`/trips/${tripId}/polls`} className="text-sm text-amber-700 font-semibold hover:underline shrink-0">
            Vote now →
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Decisions</p>
          <p className="text-2xl font-bold text-gray-800">{lockedPolls.length}</p>
          <p className="text-xs text-gray-400 mt-1">{openPolls.length} pending</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Budget</p>
          {pool ? (
            <>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {currencySymbol}{Math.abs(remaining).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {remaining < 0 ? 'over' : 'left'} of {currencySymbol}{pool.total_amount.toLocaleString()}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-300">—</p>
              <p className="text-xs text-gray-400 mt-1">no pool set</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Itinerary</p>
          <p className="text-2xl font-bold text-gray-800">{itineraryDays}</p>
          <p className="text-xs text-gray-400 mt-1">of {totalDays} days planned</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Vibe</p>
          {vibeScore.score > 0 ? (
            <>
              <p className={`text-2xl font-bold ${
                vibeScore.score >= 80 ? 'text-emerald-600' :
                vibeScore.score >= 60 ? 'text-amber-500' : 'text-red-500'
              }`}>{vibeScore.score}%</p>
              <p className="text-xs text-gray-400 mt-1">{vibeScore.label}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-300">—</p>
              <p className="text-xs text-gray-400 mt-1">no vibes yet</p>
            </>
          )}
        </div>
      </div>

      {/* Trip Health + countdown */}
      <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
        tripHealth.status === 'healthy' ? 'bg-emerald-50 border-emerald-200' :
        tripHealth.status === 'at-risk' ? 'bg-amber-50 border-amber-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div>
          <p className={`text-sm font-semibold ${
            tripHealth.status === 'healthy' ? 'text-emerald-800' :
            tripHealth.status === 'at-risk' ? 'text-amber-800' :
            'text-gray-600'
          }`}>
            {tripHealth.status === 'healthy' ? '✓' : tripHealth.status === 'at-risk' ? '⚠' : '○'} Trip Health: {tripHealth.label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{tripHealth.reason}</p>
        </div>
        {daysUntilTrip > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-gray-800">{daysUntilTrip}</p>
            <p className="text-xs text-gray-400">days to go</p>
          </div>
        )}
        {daysUntilTrip <= 0 && (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-emerald-700">In progress</p>
          </div>
        )}
      </div>

      {/* Vibe conflicts detail */}
      {conflicts.has_conflict && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Vibe Conflicts</h2>
          <div className="space-y-3">
            {conflicts.conflicts.map((c) => (
              <div key={c.dimension} className="border-l-2 border-amber-400 pl-3">
                <p className="text-sm text-gray-700">{c.message}</p>
                {c.suggestion && <p className="text-xs text-gray-400 mt-0.5">Suggestion: {c.suggestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget distribution (anonymous member submissions) */}
      <BudgetDistributionCard counts={budgetCounts} total={budgetTotal} />

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/trips/${tripId}/polls`}
          className="bg-white border border-stone-100 rounded-xl p-4 text-center hover:border-emerald-200 transition-colors"
        >
          <div className="text-2xl mb-1.5">🗳️</div>
          <div className="text-sm font-medium text-gray-700">Polls</div>
        </Link>
        <Link
          href={`/trips/${tripId}/expenses`}
          className="bg-white border border-stone-100 rounded-xl p-4 text-center hover:border-emerald-200 transition-colors"
        >
          <div className="text-2xl mb-1.5">💰</div>
          <div className="text-sm font-medium text-gray-700">Expenses</div>
        </Link>
        <Link
          href={`/trips/${tripId}/itinerary`}
          className="bg-white border border-stone-100 rounded-xl p-4 text-center hover:border-emerald-200 transition-colors"
        >
          <div className="text-2xl mb-1.5">📅</div>
          <div className="text-sm font-medium text-gray-700">Itinerary</div>
        </Link>
      </div>

      {/* Recent activity */}
      {activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  item.type === 'poll' ? 'bg-emerald-100' : 'bg-orange-100'
                }`}>
                  {item.type === 'poll' ? '🗳️' : '💰'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { detectConflicts } from '@/lib/conflict-detector'
import { computeVibeScore } from '@/lib/vibe-score'
import { computeTripHealth } from '@/lib/trip-health'
import { detectGhostMembers } from '@/lib/ghost-detector'
import { computeMomentum } from '@/lib/momentum'
import { calculateDropoutRipple } from '@/lib/dropout-calculator'
import { formatDateRange, buildInviteUrl, getInitials, getAvatarColor } from '@/lib/utils'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import { CardSkeleton } from '@/components/ui/Skeleton'
import ShareButton from '@/components/ui/ShareButton'
import EditTripForm from '@/components/trips/EditTripForm'
import BudgetDistributionCard from '@/components/budget/BudgetDistributionCard'
import AffiliateBookingLinks from '@/components/trips/AffiliateBookingLinks'
import type { Member, PollWithVotes, Pool, Expense } from '@/types'

// ─── Fast fetcher (no Unsplash, no budget_disclosures) ────────────────────────

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

  if (trip.organiser_id !== user.id) return { redirect: true as const, tripId }

  const [
    { data: members },
    { data: polls },
    { data: pool },
    { data: iItems },
  ] = await Promise.all([
    serviceSupabase.from('members').select('*').eq('trip_id', tripId).order('joined_at', { ascending: true }),
    serviceSupabase.from('polls').select('*, votes(*)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    serviceSupabase.from('pools').select('*, expenses(*)').eq('trip_id', tripId).single(),
    serviceSupabase.from('itinerary_items').select('day_number').eq('trip_id', tripId),
  ])

  return {
    trip,
    members: (members || []) as Member[],
    polls: (polls || []) as PollWithVotes[],
    pool: (pool || null) as (Pool & { expenses: Expense[] }) | null,
    itineraryDays: new Set((iItems || []).map((i: { day_number: number }) => i.day_number)).size,
  }
}

// ─── Region 2: Destination image (async, ~1–3s) ───────────────────────────────

async function DestinationImageLoader({ destination }: { destination: string }) {
  const imageUrl = await getDestinationImage(destination)
  return <DestinationHero imageUrl={imageUrl} destination={destination} height="md" />
}

// ─── Region 3: Insights (async, ~500ms–1s) ────────────────────────────────────

async function DashboardInsights({
  tripId,
  members,
  polls,
  startDate,
  endDate,
}: {
  tripId: string
  members: Member[]
  polls: PollWithVotes[]
  startDate: string
  endDate: string
}) {
  const serviceSupabase = createServiceRoleClient()
  const { data: budgetData } = await serviceSupabase
    .from('budget_disclosures')
    .select('budget_range')
    .eq('trip_id', tripId)

  const RANGES = ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k']
  const budgetCounts: Record<string, number> = {}
  for (const r of RANGES) budgetCounts[r] = 0
  for (const d of (budgetData || [])) budgetCounts[d.budget_range] = (budgetCounts[d.budget_range] || 0) + 1
  const budgetTotal = (budgetData || []).length

  const conflicts = detectConflicts(members)
  const tripHealth = computeTripHealth(members, polls)

  const today = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  const isLive = today >= start && today <= end
  const daysUntilTrip = Math.ceil(
    (start.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <>
      {/* Live mode banner */}
      {isLive && (
        <div className="bg-green-500 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-white animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Trip is LIVE</p>
            <p className="text-xs text-green-100">You&apos;re currently on this trip. Have fun!</p>
          </div>
        </div>
      )}

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
        {!isLive && daysUntilTrip > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-gray-800">{daysUntilTrip}</p>
            <p className="text-xs text-gray-400">days to go</p>
          </div>
        )}
        {!isLive && daysUntilTrip <= 0 && (
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
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tripDuration(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const result = await getTripData(tripId)
  if (!result) notFound()
  if ('redirect' in result) redirect(`/trips/${tripId}/member`)

  const { trip, members, polls, pool, itineraryDays } = result
  const vibeScore = computeVibeScore(members)
  const inviteUrl = buildInviteUrl(trip.invite_code)

  const confirmedCount = members.filter((m) => m.status === 'in').length
  const tentativeCount = members.filter((m) => m.status === 'tentative').length
  const openPolls = polls.filter((p) => p.status === 'open')
  const lockedPolls = polls.filter((p) => p.status === 'locked')

  const expenses: Expense[] = pool?.expenses || []
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = (pool?.total_amount || 0) - totalSpent
  const currencySymbol = pool?.currency === 'INR' ? '₹' : (pool?.currency || '')
  const totalDays = tripDuration(trip.start_date, trip.end_date)

  // Tier 6 intelligence
  const ghostAlerts = detectGhostMembers(members, polls)
  const momentum = computeMomentum(members, polls, expenses)
  const tentativeMembers = members.filter((m) => m.status === 'tentative' && !m.is_organiser)
  const dropoutRipples = tentativeMembers.map((m) => calculateDropoutRipple(m, members, pool))

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
      {/* Hero — text renders immediately; image streams in */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="relative">
          <Suspense fallback={<DestinationHero imageUrl="" destination={trip.destination} height="md" />}>
            <DestinationImageLoader destination={trip.destination} />
          </Suspense>
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
        <ShareButton
          url={inviteUrl}
          title="Join our trip on APIcTrips"
          text={`You're invited to join the trip to ${trip.destination}! Join here:`}
          label="Invite"
          className="py-1.5 px-3 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        />
      </div>

      {/* Ghost member alert */}
      {ghostAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-orange-800 mb-1">
            👻 {ghostAlerts.length} ghost member{ghostAlerts.length > 1 ? 's' : ''} detected
          </p>
          <div className="space-y-0.5">
            {ghostAlerts.map((g) => (
              <p key={g.member.id} className="text-xs text-orange-700">
                <span className="font-medium">{g.member.name}</span> — {g.reason} · joined {g.daysSinceJoined}d ago
              </p>
            ))}
          </div>
          <p className="text-xs text-orange-500 mt-1.5">Send them a nudge to re-engage</p>
        </div>
      )}

      {/* Dropout ripple — for tentative members */}
      {dropoutRipples.length > 0 && dropoutRipples.some((r) => r.financial) && (
        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Dropout Ripple Effect</h2>
          <div className="space-y-2">
            {dropoutRipples.filter((r) => r.financial).map((r) => (
              <div key={r.member.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">If <span className="font-medium">{r.member.name}</span> drops out</span>
                <span className="text-amber-700 font-semibold text-xs">
                  +{r.financial!.currency === 'INR' ? '₹' : r.financial!.currency}{r.financial!.extraPerPerson.toLocaleString()} per person
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Based on remaining unspent budget split across confirmed members</p>
        </div>
      )}

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" id="stats-grid">
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

      {/* Momentum score */}
      <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
        momentum.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
        momentum.color === 'amber' ? 'bg-amber-50 border-amber-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div>
          <p className={`text-sm font-semibold ${
            momentum.color === 'emerald' ? 'text-emerald-800' :
            momentum.color === 'amber' ? 'text-amber-800' :
            'text-red-800'
          }`}>
            Trip Momentum: {momentum.label}
          </p>
          {momentum.nudge && <p className="text-xs text-gray-500 mt-0.5">{momentum.nudge}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className={`text-2xl font-bold ${
            momentum.color === 'emerald' ? 'text-emerald-700' :
            momentum.color === 'amber' ? 'text-amber-700' :
            'text-red-700'
          }`}>{momentum.score}</p>
          <p className="text-xs text-gray-400">/100</p>
        </div>
      </div>

      {/* Insights (health, conflicts, budget) — streams in */}
      <Suspense fallback={<><CardSkeleton /><CardSkeleton /><CardSkeleton /></>}>
        <DashboardInsights
          tripId={tripId}
          members={members}
          polls={polls}
          startDate={trip.start_date}
          endDate={trip.end_date}
        />
      </Suspense>

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

      {/* Booking links */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <AffiliateBookingLinks
          destination={trip.destination}
          checkIn={trip.start_date}
          checkOut={trip.end_date}
        />
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

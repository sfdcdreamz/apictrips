import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import MemberDashboardClient from '@/components/trips/MemberDashboardClient'
import BudgetDisclosureCard from '@/components/budget/BudgetDisclosureCard'
import type { Member, PollWithVotes, ItineraryItem } from '@/types'

async function getMemberData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: member }] = await Promise.all([
    serviceSupabase.from('trips').select('id, name, destination, start_date, end_date').eq('id', tripId).single(),
    serviceSupabase.from('members').select('*').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return null
  if (!member) return null

  const [{ data: polls }, { data: iItems }, { data: disclosure }] = await Promise.all([
    serviceSupabase.from('polls').select('*, votes(*)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    serviceSupabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number').order('time'),
    serviceSupabase.from('budget_disclosures').select('id').eq('trip_id', tripId).eq('member_email', user.email!).single(),
  ])

  return {
    trip,
    member: member as Member,
    polls: (polls || []) as PollWithVotes[],
    itinerary: (iItems || []) as ItineraryItem[],
    alreadyDisclosed: !!disclosure,
  }
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getMemberData(tripId)
  if (!data) notFound()

  const { trip, member, polls, itinerary, alreadyDisclosed } = data
  const lockedPolls = polls.filter((p) => p.status === 'locked')
  const openPolls = polls.filter((p) => p.status === 'open')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Hero */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          📍 {trip.destination} · 📅 {new Date(trip.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(trip.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Anonymous budget disclosure */}
      <BudgetDisclosureCard tripId={tripId} alreadySubmitted={alreadyDisclosed} />

      {/* My RSVP + UPI — client interactive */}
      <MemberDashboardClient
        tripId={tripId}
        initialStatus={member.status}
        initialUpiId={member.upi_id || ''}
        memberName={member.name}
      />

      {/* Open polls */}
      {openPolls.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Polls awaiting your vote</h2>
          <div className="space-y-2">
            {openPolls.map((p) => (
              <a
                key={p.id}
                href={`/vote/${p.id}`}
                className="block bg-white border border-amber-100 rounded-xl px-4 py-3 hover:border-amber-300 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800">{p.question}</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Deadline: {new Date(p.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Locked decisions */}
      {lockedPolls.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Decisions</h2>
          <div className="space-y-2">
            {lockedPolls.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-600">{p.question}</p>
                <span className="text-sm font-semibold text-emerald-700 shrink-0">{p.winning_option}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary read-only */}
      {itinerary.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Itinerary</h2>
          <div className="space-y-3">
            {Array.from(new Set(itinerary.map((i) => i.day_number))).map((day) => (
              <div key={day}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Day {day}</p>
                <div className="space-y-1.5 pl-2">
                  {itinerary.filter((i) => i.day_number === day).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.status === 'done' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      <p className={`text-sm ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.title}
                        {item.time && <span className="text-xs text-gray-400 ml-1">· {item.time}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

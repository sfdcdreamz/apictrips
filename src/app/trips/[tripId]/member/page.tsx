import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import MemberDashboardClient from '@/components/trips/MemberDashboardClient'
import BudgetDisclosureCard from '@/components/budget/BudgetDisclosureCard'
import type { Member } from '@/types'

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

  const [
    { data: openPolls },
    { data: iItems },
    { data: disclosure },
    { data: vendors },
    { data: pool },
  ] = await Promise.all([
    serviceSupabase.from('polls').select('id').eq('trip_id', tripId).eq('status', 'open'),
    serviceSupabase.from('itinerary_items').select('id').eq('trip_id', tripId),
    serviceSupabase.from('budget_disclosures').select('id').eq('trip_id', tripId).eq('member_email', user.email!).single(),
    serviceSupabase.from('vendor_contacts').select('id').eq('trip_id', tripId),
    serviceSupabase.from('pools').select('id, total_amount, currency').eq('trip_id', tripId).single(),
  ])

  return {
    trip,
    member: member as Member,
    openPollCount: openPolls?.length ?? 0,
    itineraryCount: iItems?.length ?? 0,
    vendorCount: vendors?.length ?? 0,
    pool: pool ?? null,
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

  const { trip, member, openPollCount, itineraryCount, vendorCount, pool, alreadyDisclosed } = data

  const today = new Date()
  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isLive = today >= startDate && today <= endDate

  const startFormatted = startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  const endFormatted = endDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
  const currencySymbol = pool?.currency === 'INR' ? '₹' : (pool?.currency || '')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{trip.name}</h1>
            <p className="text-sky-100 text-sm mt-1.5">
              📍 {trip.destination} · {startFormatted} – {endFormatted}
            </p>
          </div>
          {isLive ? (
            <span className="shrink-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              LIVE
            </span>
          ) : daysUntil > 0 ? (
            <span className="shrink-0 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {daysUntil}d away
            </span>
          ) : null}
        </div>
        <p className="text-sky-100 text-sm mt-2">
          Hi {member.name.split(' ')[0]} 👋 · Status:{' '}
          <span className={`font-semibold ${member.status === 'in' ? 'text-emerald-300' : member.status === 'out' ? 'text-red-300' : 'text-amber-300'}`}>
            {member.status === 'in' ? "I'm in" : member.status === 'out' ? "I'm out" : 'Tentative'}
          </span>
        </p>
      </div>

      {/* Quick-action grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/trips/${tripId}/polls`}
          className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-1 hover:border-emerald-300 transition-colors"
        >
          <span className="text-2xl">🗳️</span>
          <p className="text-base font-semibold text-gray-800">Polls</p>
          <p className="text-xs text-gray-500">
            {openPollCount > 0 ? (
              <span className="text-amber-600 font-medium">{openPollCount} awaiting vote</span>
            ) : (
              'No open polls'
            )}
          </p>
        </Link>

        <Link
          href={`/trips/${tripId}/itinerary`}
          className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-1 hover:border-blue-300 transition-colors"
        >
          <span className="text-2xl">📋</span>
          <p className="text-base font-semibold text-gray-800">Itinerary</p>
          <p className="text-xs text-gray-500">
            {itineraryCount > 0 ? `${itineraryCount} item${itineraryCount !== 1 ? 's' : ''}` : 'Not planned yet'}
          </p>
        </Link>

        <Link
          href={`/trips/${tripId}/expenses`}
          className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-1 hover:border-orange-300 transition-colors"
        >
          <span className="text-2xl">💸</span>
          <p className="text-base font-semibold text-gray-800">Expenses</p>
          <p className="text-xs text-gray-500">
            {pool ? `${currencySymbol}${pool.total_amount.toLocaleString()} pool` : 'Pool not set up'}
          </p>
        </Link>

        <Link
          href={`/trips/${tripId}/vendors`}
          className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-1 hover:border-teal-300 transition-colors"
        >
          <span className="text-2xl">📞</span>
          <p className="text-base font-semibold text-gray-800">Vendors</p>
          <p className="text-xs text-gray-500">
            {vendorCount > 0 ? `${vendorCount} contact${vendorCount !== 1 ? 's' : ''}` : 'No contacts yet'}
          </p>
        </Link>
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
    </div>
  )
}

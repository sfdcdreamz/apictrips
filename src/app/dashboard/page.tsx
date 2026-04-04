import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateRange } from '@/lib/utils'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import type { Trip } from '@/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: trips }, { data: memberRows }] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .eq('organiser_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('members')
      .select('trip_id, is_organiser, trips(*)')
      .eq('email', user.email!)
      .eq('is_organiser', false),
  ])

  const organiserTripList = (trips || []) as Trip[]
  const joinedTripList = ((memberRows || [])
    .map((row) => (row as unknown as { trips: Trip | null }).trips)
    .filter(Boolean)) as Trip[]

  const allTrips = [...organiserTripList, ...joinedTripList]
  const imageUrls = await Promise.all(allTrips.map((t) => getDestinationImage(t.destination)))
  const organiserImages = imageUrls.slice(0, organiserTripList.length)
  const joinedImages = imageUrls.slice(organiserTripList.length)

  const bothEmpty = organiserTripList.length === 0 && joinedTripList.length === 0

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <nav className="bg-white border-b border-stone-100 px-4 py-3">
        <div className="max-w-2xl mx-auto grid grid-cols-3 items-center">
          <span />
          <span className="text-lg font-bold text-gray-900 text-center">APIcTrips</span>
          <div className="flex justify-end">
            <Link
              href="/trips/new"
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + New trip
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error === 'no-access' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
            You don&apos;t have access to that trip. Check you&apos;re signed in with the right account.
          </div>
        )}

        <h1 className="text-xl font-bold text-gray-900 mb-4">
          {joinedTripList.length > 0 ? 'Trips you\'re organising' : 'Your trips'}
        </h1>

        {bothEmpty ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
            <div className="text-3xl mb-3">✈️</div>
            <p className="text-gray-500 text-sm mb-4">No trips yet. Plan your first group trip.</p>
            <Link
              href="/trips/new"
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors inline-block"
            >
              Plan a trip
            </Link>
          </div>
        ) : (
          <>
            {organiserTripList.length > 0 && (
              <div className="space-y-3 mb-6">
                {organiserTripList.map((trip, i) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="block bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-emerald-200 transition-colors"
                  >
                    <div className="relative">
                      <DestinationHero imageUrl={organiserImages[i]} destination={trip.destination} height="sm" />
                      <div className="absolute bottom-3 left-3 text-sm font-medium text-white drop-shadow">
                        📍 {trip.destination}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-gray-900">{trip.name}</div>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3">
                        <span>📅 {formatDateRange(trip.start_date, trip.end_date)}</span>
                        <span>👥 up to {trip.group_size}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {joinedTripList.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Trips I&apos;m joining</h2>
                <div className="space-y-3">
                  {joinedTripList.map((trip, i) => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}/member`}
                      className="block bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-emerald-200 transition-colors"
                    >
                      <div className="relative">
                        <DestinationHero imageUrl={joinedImages[i]} destination={trip.destination} height="sm" />
                        <div className="absolute bottom-3 left-3 text-sm font-medium text-white drop-shadow">
                          📍 {trip.destination}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="font-semibold text-gray-900">{trip.name}</div>
                        <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3">
                          <span>📅 {formatDateRange(trip.start_date, trip.end_date)}</span>
                          <span>👥 up to {trip.group_size}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

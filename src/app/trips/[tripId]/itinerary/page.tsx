import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import ItineraryClient from '@/components/itinerary/ItineraryClient'
import type { ItineraryItem } from '@/types'

function getDaysBetween(start: string, end: string): { dayNumber: number; date: Date }[] {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const days: { dayNumber: number; date: Date }[] = []
  const current = new Date(startDate)
  let dayNum = 1
  while (current <= endDate && dayNum <= 60) {
    days.push({ dayNumber: dayNum, date: new Date(current) })
    current.setDate(current.getDate() + 1)
    dayNum++
  }
  return days
}

async function getItineraryData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('id, name, start_date, end_date, organiser_id, destination')
    .eq('id', tripId)
    .single()
  if (!trip) return null

  const isOrganiser = trip.organiser_id === user.id

  if (!isOrganiser) {
    const { data: member } = await serviceSupabase
      .from('members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('email', user.email!)
      .single()
    if (!member) return null
  }
  const [{ data: items }, imageUrl] = await Promise.all([
    serviceSupabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number', { ascending: true }).order('time', { ascending: true }),
    getDestinationImage(trip.destination),
  ])

  return {
    trip,
    items: (items || []) as ItineraryItem[],
    isOrganiser,
    imageUrl: imageUrl || '',
  }
}

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getItineraryData(tripId)
  if (!data) notFound()

  const { trip, items, isOrganiser, imageUrl } = data
  const days = getDaysBetween(trip.start_date, trip.end_date)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <DestinationHero imageUrl={imageUrl} destination={trip.destination} height="sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-cyan-500/60 flex flex-col justify-end p-6">
          <p className="text-white/70 text-sm mb-1">📍 {trip.destination}</p>
          <h1 className="text-2xl font-bold text-white">🗺 Itinerary</h1>
          <p className="text-white/80 text-sm mt-1">Day-by-day plan · Tap activities to mark done or swap.</p>
        </div>
      </div>

      <ItineraryClient tripId={tripId} days={days} items={items} isOrganiser={isOrganiser} />
    </div>
  )
}

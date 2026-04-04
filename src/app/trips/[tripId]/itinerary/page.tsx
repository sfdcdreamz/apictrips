import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
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

  const { data: trip } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date, organiser_id')
    .eq('id', tripId)
    .single()
  if (!trip) return null

  const isOrganiser = trip.organiser_id === user.id

  if (!isOrganiser) {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('email', user.email!)
      .single()
    if (!member) return null
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: items } = await serviceSupabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .order('time', { ascending: true })

  return {
    trip,
    items: (items || []) as ItineraryItem[],
    isOrganiser,
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

  const { trip, items, isOrganiser } = data
  const days = getDaysBetween(trip.start_date, trip.end_date)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Itinerary</h1>
        <p className="text-blue-100 text-sm mt-1">Day-by-day plan · Tap activities to mark done or swap.</p>
      </div>

      <ItineraryClient tripId={tripId} days={days} items={items} isOrganiser={isOrganiser} />
    </div>
  )
}

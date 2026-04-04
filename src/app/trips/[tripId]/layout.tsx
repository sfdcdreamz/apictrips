import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import TripNav from '@/components/trips/TripNav'
import TripRoleProvider from '@/components/trips/TripRoleContext'
import ActivityToast from '@/components/ui/ActivityToast'
import TripPresence from '@/components/trips/TripPresence'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const serviceSupabase = createServiceRoleClient()

  // Fetch trip and members in parallel
  const [{ data: trip }, { data: members }] = await Promise.all([
    serviceSupabase.from('trips').select('name, organiser_id, start_date, end_date').eq('id', tripId).single(),
    serviceSupabase.from('members').select('name, email').eq('trip_id', tripId),
  ])

  if (!trip) notFound()

  const isOrganiser = trip.organiser_id === user.id

  // Non-organisers must be a member of the trip (matched by auth email)
  if (!isOrganiser) {
    const isMember = (members || []).some((m) => m.email === user.email)
    if (!isMember) redirect('/dashboard?error=no-access')
  }

  const today = new Date()
  const isLive = today >= new Date(trip.start_date) && today <= new Date(trip.end_date)

  return (
    <TripRoleProvider tripId={tripId} isOrganiser={isOrganiser}>
      <div className="min-h-screen bg-[#faf8f4]">
        <TripNav
          tripId={tripId}
          tripName={trip.name}
          isLive={isLive}
          members={(members || []).map((m) => ({ name: m.name }))}
        />
        {children}
        <ActivityToast tripId={tripId} />
        <TripPresence tripId={tripId} userId={user.id} />
      </div>
    </TripRoleProvider>
  )
}

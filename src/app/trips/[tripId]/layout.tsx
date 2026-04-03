import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import TripNav from '@/components/trips/TripNav'

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

  const { data: trip } = await supabase
    .from('trips')
    .select('name')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()

  if (!trip) notFound()

  const serviceSupabase = createServiceRoleClient()
  const { data: members } = await serviceSupabase
    .from('members')
    .select('name')
    .eq('trip_id', tripId)

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <TripNav
        tripId={tripId}
        tripName={trip.name}
        members={(members || []).map((m) => ({ name: m.name }))}
      />
      {children}
    </div>
  )
}

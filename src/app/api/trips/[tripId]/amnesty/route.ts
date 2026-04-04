import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const [{ data: trip }, { data: members }] = await Promise.all([
    serviceSupabase.from('trips').select('end_date, amnesty_votes').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId),
  ])

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const votes: string[] = trip.amnesty_votes || []
  const memberCount = members?.length || 0
  const threshold = Math.ceil(memberCount / 2)
  const passed = votes.length >= threshold && memberCount > 0

  return NextResponse.json({ votes, memberCount, threshold, passed })
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: member }, { data: members }] = await Promise.all([
    serviceSupabase.from('trips').select('organiser_id, end_date, amnesty_votes').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId),
  ])

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMember = !!member || trip.organiser_id === user.id
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const currentVotes: string[] = trip.amnesty_votes || []
  const email = user.email!

  // Toggle vote
  const newVotes = currentVotes.includes(email)
    ? currentVotes.filter((e) => e !== email)
    : [...currentVotes, email]

  await serviceSupabase
    .from('trips')
    .update({ amnesty_votes: newVotes })
    .eq('id', tripId)

  const memberCount = members?.length || 0
  const threshold = Math.ceil(memberCount / 2)
  const passed = newVotes.length >= threshold && memberCount > 0

  // If threshold met, confirm all pending settlements
  if (passed) {
    await serviceSupabase
      .from('settlements')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('trip_id', tripId)
      .eq('status', 'pending')
  }

  return NextResponse.json({ votes: newVotes, memberCount, threshold, passed })
}

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

  // Verify membership
  const [{ data: trip }, { data: member }] = await Promise.all([
    serviceSupabase.from('trips').select('organiser_id').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = trip.organiser_id === user.id || !!member
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: ratings } = await serviceSupabase
    .from('trip_ratings')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ ratings: ratings || [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { overall, planning, value, would_go_again, comment } = body

  if (!overall || overall < 1 || overall > 5) {
    return NextResponse.json({ error: 'overall must be 1–5' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()

  // Verify membership
  const [{ data: trip }, { data: member }] = await Promise.all([
    serviceSupabase.from('trips').select('organiser_id, end_date').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = trip.organiser_id === user.id || !!member
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Upsert — one rating per member per trip
  const { data: rating, error } = await serviceSupabase
    .from('trip_ratings')
    .upsert(
      {
        trip_id: tripId,
        member_email: user.email!,
        overall: Number(overall),
        planning: planning ? Number(planning) : null,
        value: value ? Number(value) : null,
        would_go_again: would_go_again ?? null,
        comment: comment || null,
      },
      { onConflict: 'trip_id,member_email' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rating }, { status: 201 })
}

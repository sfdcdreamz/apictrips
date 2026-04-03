import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    name, destination, start_date, end_date, group_size,
    vibe_budget, vibe_pace, vibe_style, vibe_accommodation,
    organiser_name, organiser_email,
  } = body

  if (!name || !destination || !start_date || !end_date || !group_size) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const invite_code = nanoid(8)

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      name,
      destination,
      start_date,
      end_date,
      group_size,
      organiser_id: user.id,
      invite_code,
    })
    .select()
    .single()

  if (tripError) {
    return NextResponse.json({ error: tripError.message }, { status: 500 })
  }

  const vibeCompleted = !!(vibe_budget && vibe_pace && vibe_style && vibe_accommodation)

  const { error: memberError } = await supabase
    .from('members')
    .insert({
      trip_id: trip.id,
      name: organiser_name || user.user_metadata?.full_name || 'Organiser',
      email: organiser_email || user.email,
      status: 'in',
      is_organiser: true,
      vibe_budget: vibe_budget || null,
      vibe_pace: vibe_pace || null,
      vibe_style: vibe_style || null,
      vibe_accommodation: vibe_accommodation || null,
      vibe_completed: vibeCompleted,
    })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({ trip }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('organiser_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trips })
}

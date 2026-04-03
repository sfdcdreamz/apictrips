import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params
  const supabase = createServiceRoleClient()

  // Resolve invite code to trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 })
  }

  const body = await request.json()
  const { name, email, status, vibe_budget, vibe_pace, vibe_style, vibe_accommodation } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const vibeCompleted = !!(vibe_budget && vibe_pace && vibe_style && vibe_accommodation)

  const { data: member, error: insertError } = await supabase
    .from('members')
    .insert({
      trip_id: trip.id,
      name,
      email,
      status: status || 'tentative',
      is_organiser: false,
      vibe_budget: vibe_budget || null,
      vibe_pace: vibe_pace || null,
      vibe_style: vibe_style || null,
      vibe_accommodation: vibe_accommodation || null,
      vibe_completed: vibeCompleted,
    })
    .select()
    .single()

  if (insertError) {
    // Duplicate email (unique constraint violation)
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: "You've already joined this trip" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ member, trip_id: trip.id }, { status: 201 })
}

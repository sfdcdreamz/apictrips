import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params

  // Optionally get the current auth user to link user_id
  let authUserId: string | null = null
  let authUserEmail: string | null = null
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (user) {
      authUserId = user.id
      authUserEmail = user.email ?? null
    }
  } catch {
    // Not authenticated — fine, proceed as guest
  }

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
  const { name, email, status, vibe_budget, vibe_pace, vibe_style, vibe_accommodation, upi_id } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const vibeCompleted = !!(vibe_budget && vibe_pace && vibe_style && vibe_accommodation)

  const resolvedEmail = email || authUserEmail || ''
  if (!resolvedEmail) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { data: member, error: insertError } = await supabase
    .from('members')
    .insert({
      trip_id: trip.id,
      name,
      email: resolvedEmail,
      status: status || 'tentative',
      is_organiser: false,
      vibe_budget: vibe_budget || null,
      vibe_pace: vibe_pace || null,
      vibe_style: vibe_style || null,
      vibe_accommodation: vibe_accommodation || null,
      vibe_completed: vibeCompleted,
      user_id: authUserId || null,
      upi_id: upi_id || null,
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

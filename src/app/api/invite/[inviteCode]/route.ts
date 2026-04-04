import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params
  const supabase = createServiceRoleClient()

  const { data: trip, error } = await supabase
    .from('trips')
    .select('id, name, destination, start_date, end_date, group_size')
    .eq('invite_code', inviteCode)
    .single()

  if (error || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const [{ count }, { data: vibeMembers }] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
    supabase.from('members').select('vibe_budget, vibe_pace, vibe_style, vibe_accommodation, vibe_completed').eq('trip_id', trip.id),
  ])

  return NextResponse.json({
    trip: { ...trip, member_count: count ?? 0 },
    existingVibeMembers: vibeMembers ?? [],
  })
}

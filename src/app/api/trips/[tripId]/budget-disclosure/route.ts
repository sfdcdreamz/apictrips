import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// POST — member submits their budget range (anonymous to other members)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  // Verify user is a member of this trip
  const { data: member } = await serviceSupabase
    .from('members')
    .select('id, email')
    .eq('trip_id', tripId)
    .eq('email', user.email!)
    .single()

  if (!member) return NextResponse.json({ error: 'Not a member of this trip' }, { status: 403 })

  const body = await request.json()
  const { budget_range } = body

  const VALID_RANGES = ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k']
  if (!budget_range || !VALID_RANGES.includes(budget_range)) {
    return NextResponse.json({ error: 'Invalid budget range' }, { status: 400 })
  }

  // Upsert — one submission per member per trip
  const { data, error } = await serviceSupabase
    .from('budget_disclosures')
    .upsert(
      { trip_id: tripId, member_email: member.email, budget_range },
      { onConflict: 'trip_id,member_email' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ disclosure: data }, { status: 201 })
}

// GET — organiser gets aggregated results (counts per range, no names exposed)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  // Only organisers see the aggregated results
  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('organiser_id')
    .eq('id', tripId)
    .single()

  if (!trip || trip.organiser_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: disclosures, error } = await serviceSupabase
    .from('budget_disclosures')
    .select('budget_range')
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const RANGES = ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k']
  const counts: Record<string, number> = {}
  for (const r of RANGES) counts[r] = 0
  for (const d of disclosures || []) counts[d.budget_range] = (counts[d.budget_range] || 0) + 1

  return NextResponse.json({ counts, total: disclosures?.length || 0 })
}

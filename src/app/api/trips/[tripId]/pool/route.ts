import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const serviceSupabase = createServiceRoleClient()
  const { data: pool } = await serviceSupabase
    .from('pools')
    .select('*, expenses(*)')
    .eq('trip_id', tripId)
    .single()

  return NextResponse.json({ pool: pool || null })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { total_amount, per_member_contribution, currency } = body

  if (!total_amount || total_amount <= 0) {
    return NextResponse.json({ error: 'Total amount must be positive' }, { status: 400 })
  }
  if (!per_member_contribution || per_member_contribution <= 0) {
    return NextResponse.json({ error: 'Per-member contribution must be positive' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: pool, error } = await serviceSupabase
    .from('pools')
    .insert({
      trip_id: tripId,
      total_amount,
      per_member_contribution,
      currency: currency || 'INR',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Pool already exists for this trip' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pool }, { status: 201 })
}

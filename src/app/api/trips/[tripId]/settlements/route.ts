import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const { data: settlements, error } = await serviceSupabase
    .from('settlements')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settlements: settlements || [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { from_email, to_email, amount, currency } = body

  if (!from_email || !to_email || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid settlement data' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: settlement, error } = await serviceSupabase
    .from('settlements')
    .insert({
      trip_id: tripId,
      from_email,
      to_email,
      amount,
      currency: currency || 'INR',
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settlement }, { status: 201 })
}

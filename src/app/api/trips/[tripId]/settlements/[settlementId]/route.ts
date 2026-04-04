import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string; settlementId: string }> }
) {
  const { tripId, settlementId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Only organiser can confirm settlements
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()

  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { status, upi_ref } = body

  if (!['pending', 'confirmed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: settlement, error } = await serviceSupabase
    .from('settlements')
    .update({
      status,
      upi_ref: upi_ref || null,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
    })
    .eq('id', settlementId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settlement })
}

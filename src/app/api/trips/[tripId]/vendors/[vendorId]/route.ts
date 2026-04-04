import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; vendorId: string }> }
) {
  const { tripId, vendorId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceSupabase = createServiceRoleClient()
  const { error } = await serviceSupabase
    .from('vendor_contacts')
    .delete()
    .eq('id', vendorId)
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

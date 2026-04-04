import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Find this member by email
  const serviceSupabase = createServiceRoleClient()
  const { data: member } = await serviceSupabase
    .from('members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('email', user.email!)
    .single()

  if (!member) return NextResponse.json({ error: 'Not a member of this trip' }, { status: 403 })

  const body = await request.json()
  const { status, upi_id } = body

  const patch: Record<string, unknown> = {}
  if (status && ['in', 'tentative', 'out'].includes(status)) patch.status = status
  if (upi_id !== undefined) patch.upi_id = upi_id || null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: updated, error } = await serviceSupabase
    .from('members')
    .update(patch)
    .eq('id', member.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: updated })
}

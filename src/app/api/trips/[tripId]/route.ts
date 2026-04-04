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

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()

  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, destination, start_date, end_date } = body

  const patch: Record<string, string> = {}
  if (name?.trim()) patch.name = name.trim()
  if (destination?.trim()) patch.destination = destination.trim()
  if (start_date) patch.start_date = start_date
  if (end_date) patch.end_date = end_date

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: updated, error } = await serviceSupabase
    .from('trips')
    .update(patch)
    .eq('id', tripId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ trip: updated })
}

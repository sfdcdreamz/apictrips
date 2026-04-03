import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  const { data: item } = await serviceSupabase
    .from('itinerary_items')
    .select('id, trip_id, status')
    .eq('id', itemId)
    .single()
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', item.trip_id)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const newStatus = item.status === 'done' ? 'pending' : 'done'

  const { data: updated, error } = await serviceSupabase
    .from('itinerary_items')
    .update({ status: newStatus })
    .eq('id', itemId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  const { data: item } = await serviceSupabase
    .from('itinerary_items')
    .select('id, trip_id')
    .eq('id', itemId)
    .single()
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', item.trip_id)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await serviceSupabase
    .from('itinerary_items')
    .delete()
    .eq('id', itemId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}

import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const VALID_ITEM_TYPES = ['activity', 'meal', 'transport', 'stay'] as const

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
  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, day_number, item_type = 'activity', cost = 0, day_date, time, description } = body

  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!day_number || !Number.isInteger(day_number) || day_number < 1) {
    return NextResponse.json({ error: 'day_number must be a positive integer' }, { status: 400 })
  }
  if (!VALID_ITEM_TYPES.includes(item_type)) {
    return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
  }
  if (typeof cost !== 'number' || cost < 0) {
    return NextResponse.json({ error: 'cost must be a non-negative number' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()

  const { data: item, error } = await serviceSupabase
    .from('itinerary_items')
    .insert({
      trip_id: tripId,
      title: title.trim(),
      day_number,
      item_type,
      cost,
      ...(day_date && { day_date }),
      ...(time && { time }),
      ...(description && { description: description.trim() }),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ item }, { status: 201 })
}

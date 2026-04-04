import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET /api/templates — list public templates
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const { data: templates } = await serviceSupabase
    .from('trip_templates')
    .select('*, template_items(*)')
    .eq('is_public', true)
    .order('cloned_count', { ascending: false })

  return NextResponse.json({ templates: templates || [] })
}

// POST /api/templates — publish a trip as a template
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { trip_id, description } = body

  if (!trip_id) return NextResponse.json({ error: 'trip_id required' }, { status: 400 })

  const serviceSupabase = createServiceRoleClient()

  // Verify organiser
  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('name, destination, start_date, end_date, organiser_id')
    .eq('id', trip_id)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  if (trip.organiser_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Compute duration in days
  const start = new Date(trip.start_date)
  const end = new Date(trip.end_date)
  const duration_days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  // Get itinerary items
  const { data: items } = await serviceSupabase
    .from('itinerary_items')
    .select('day_number, title, item_type, description, cost')
    .eq('trip_id', trip_id)
    .order('day_number')

  // Create template
  const { data: template, error: tmplError } = await serviceSupabase
    .from('trip_templates')
    .insert({
      created_by: user.id,
      name: trip.name,
      destination: trip.destination,
      duration_days,
      description: description?.trim() || null,
      is_public: true,
      cloned_count: 0,
    })
    .select()
    .single()

  if (tmplError) return NextResponse.json({ error: tmplError.message }, { status: 500 })

  // Copy itinerary items
  if (items && items.length > 0) {
    await serviceSupabase.from('template_items').insert(
      items.map((item) => ({
        template_id: template.id,
        day_number: item.day_number,
        title: item.title,
        item_type: item.item_type,
        description: item.description,
        cost: item.cost,
      }))
    )
  }

  return NextResponse.json({ template }, { status: 201 })
}

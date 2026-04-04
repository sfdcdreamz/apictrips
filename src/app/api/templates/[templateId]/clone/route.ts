import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, start_date, end_date, group_size, organiser_name, organiser_email } = body

  if (!name || !start_date || !end_date || !group_size) {
    return NextResponse.json({ error: 'name, start_date, end_date, group_size required' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()

  const { data: template } = await serviceSupabase
    .from('trip_templates')
    .select('*, template_items(*)')
    .eq('id', templateId)
    .single()

  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const invite_code = nanoid(8)

  // Create trip
  const { data: trip, error: tripError } = await serviceSupabase
    .from('trips')
    .insert({
      name,
      destination: template.destination,
      start_date,
      end_date,
      group_size: Number(group_size),
      organiser_id: user.id,
      invite_code,
    })
    .select()
    .single()

  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 })

  // Add organiser as member
  await serviceSupabase.from('members').insert({
    trip_id: trip.id,
    name: organiser_name || user.user_metadata?.full_name || 'Organiser',
    email: organiser_email || user.email,
    status: 'in',
    is_organiser: true,
    vibe_completed: false,
  })

  // Copy itinerary items from template
  const items = template.template_items || []
  if (items.length > 0) {
    await serviceSupabase.from('itinerary_items').insert(
      items.map((item: { day_number: number; title: string; item_type: string; description: string | null; cost: number }) => ({
        trip_id: trip.id,
        day_number: item.day_number,
        title: item.title,
        item_type: item.item_type,
        description: item.description || null,
        cost: item.cost || 0,
        status: 'pending',
      }))
    )
  }

  // Increment clone count
  await serviceSupabase
    .from('trip_templates')
    .update({ cloned_count: (template.cloned_count || 0) + 1 })
    .eq('id', templateId)

  return NextResponse.json({ trip }, { status: 201 })
}

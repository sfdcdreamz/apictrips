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

  // Verify user is organiser or member
  const serviceSupabase = createServiceRoleClient()
  const { data: trip } = await supabase.from('trips').select('id, organiser_id').eq('id', tripId).single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (trip.organiser_id !== user.id) {
    const { data: member } = await serviceSupabase
      .from('members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('email', user.email!)
      .single()
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: vendors, error } = await serviceSupabase
    .from('vendor_contacts')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendors: vendors || [] })
}

export async function POST(
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
  const { name, role, phone, notes } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!role?.trim()) return NextResponse.json({ error: 'Role is required' }, { status: 400 })

  const serviceSupabase = createServiceRoleClient()
  const { data: vendor, error } = await serviceSupabase
    .from('vendor_contacts')
    .insert({
      trip_id: tripId,
      name: name.trim(),
      role: role.trim(),
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
      added_by: user.email!,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vendor }, { status: 201 })
}

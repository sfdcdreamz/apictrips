import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/types'

const VALID_CATEGORIES: ExpenseCategory[] = ['Flights', 'Stay', 'Food', 'Transport', 'Experiences', 'Misc']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify user is organiser or member of the trip
  const { data: trip } = await supabase
    .from('trips')
    .select('id, organiser_id')
    .eq('id', tripId)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const isOrganiser = trip.organiser_id === user.id
  if (!isOrganiser) {
    // Check if the user is a member by email
    const serviceCheck = createServiceRoleClient()
    const { data: member } = await serviceCheck
      .from('members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('email', user.email!)
      .single()
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { amount, category, description, logged_by, expense_date, paid_by, split_between } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  if (!logged_by || !logged_by.trim()) {
    return NextResponse.json({ error: 'Logged by is required' }, { status: 400 })
  }
  if (!expense_date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()

  const { data: pool } = await serviceSupabase
    .from('pools')
    .select('id')
    .eq('trip_id', tripId)
    .single()

  if (!pool) {
    return NextResponse.json({ error: 'No pool set up for this trip' }, { status: 404 })
  }

  const { data: expense, error } = await serviceSupabase
    .from('expenses')
    .insert({
      pool_id: pool.id,
      amount,
      category,
      description: description.trim(),
      logged_by: logged_by.trim(),
      expense_date,
      paid_by: paid_by || null,
      split_between: split_between || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ expense }, { status: 201 })
}

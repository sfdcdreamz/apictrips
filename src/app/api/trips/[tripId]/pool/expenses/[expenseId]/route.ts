import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/types'

const VALID_CATEGORIES: ExpenseCategory[] = ['Flights', 'Stay', 'Food', 'Transport', 'Experiences', 'Misc']

async function verifyOrganiser(tripId: string, userId: string) {
  const supabase = await createClient()
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', userId)
    .single()
  return !!trip
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  const { tripId, expenseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const isOrganiser = await verifyOrganiser(tripId, user.id)
  if (!isOrganiser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { amount, category, description, expense_date, paid_by, split_between } = body

  const patch: Record<string, unknown> = {}
  if (amount !== undefined) {
    if (amount <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    patch.amount = amount
  }
  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    patch.category = category
  }
  if (description !== undefined) patch.description = description.trim()
  if (expense_date !== undefined) patch.expense_date = expense_date
  if (paid_by !== undefined) patch.paid_by = paid_by
  if (split_between !== undefined) patch.split_between = split_between

  const serviceSupabase = createServiceRoleClient()
  const { data: expense, error } = await serviceSupabase
    .from('expenses')
    .update(patch)
    .eq('id', expenseId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expense })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  const { tripId, expenseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const isOrganiser = await verifyOrganiser(tripId, user.id)
  if (!isOrganiser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceSupabase = createServiceRoleClient()
  const { error } = await serviceSupabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

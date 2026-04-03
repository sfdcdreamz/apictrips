import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/types'

const VALID_CATEGORIES: ExpenseCategory[] = ['Flights', 'Stay', 'Food', 'Transport', 'Experiences', 'Misc']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const serviceSupabase = createServiceRoleClient()

  const body = await request.json()
  const { amount, category, description, logged_by, expense_date } = body

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
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ expense }, { status: 201 })
}

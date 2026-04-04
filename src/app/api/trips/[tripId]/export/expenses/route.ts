import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('id, organiser_id, name')
    .eq('id', tripId)
    .single()

  if (!trip || trip.organiser_id !== user.id) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: pool } = await serviceSupabase
    .from('pools')
    .select('id, currency')
    .eq('trip_id', tripId)
    .single()

  if (!pool) {
    const csv = 'Date,Description,Category,Amount,Currency,Paid By,Logged By\n'
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${tripId}.csv"`,
      },
    })
  }

  const { data: expenses } = await serviceSupabase
    .from('expenses')
    .select('*')
    .eq('pool_id', pool.id)
    .order('expense_date', { ascending: true })

  const rows = (expenses || []).map((e) => {
    const date = e.expense_date || e.created_at?.slice(0, 10) || ''
    const description = `"${(e.description || '').replace(/"/g, '""')}"`
    const category = e.category || ''
    const amount = e.amount ?? ''
    const currency = pool.currency || 'INR'
    const paidBy = `"${(e.paid_by || '').replace(/"/g, '""')}"`
    const loggedBy = `"${(e.logged_by || '').replace(/"/g, '""')}"`
    return `${date},${description},${category},${amount},${currency},${paidBy},${loggedBy}`
  })

  const csv = [
    'Date,Description,Category,Amount,Currency,Paid By,Logged By',
    ...rows,
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="expenses-${tripId}.csv"`,
    },
  })
}

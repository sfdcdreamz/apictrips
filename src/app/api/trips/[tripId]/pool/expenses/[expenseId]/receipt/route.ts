import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  const { tripId, expenseId } = await params
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

  const formData = await request.formData()
  const file = formData.get('receipt') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const path = `${tripId}/${expenseId}/${Date.now()}`

  const { error: uploadError } = await serviceSupabase.storage
    .from('receipts')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { error: updateError } = await serviceSupabase
    .from('expenses')
    .update({ receipt_url: path })
    .eq('id', expenseId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ receipt_url: path })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; expenseId: string }> }
) {
  const { expenseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const { data: expense } = await serviceSupabase
    .from('expenses')
    .select('receipt_url')
    .eq('id', expenseId)
    .single()

  if (!expense?.receipt_url) {
    return NextResponse.json({ error: 'No receipt found' }, { status: 404 })
  }

  const { data: signed, error } = await serviceSupabase.storage
    .from('receipts')
    .createSignedUrl(expense.receipt_url, 3600)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signedUrl: signed.signedUrl })
}

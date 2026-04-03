import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

async function autoLockOverduePolls(tripId: string) {
  const serviceSupabase = createServiceRoleClient()
  const now = new Date().toISOString()

  const { data: openPolls } = await serviceSupabase
    .from('polls')
    .select('id, options')
    .eq('trip_id', tripId)
    .eq('status', 'open')
    .lt('deadline', now)

  if (!openPolls || openPolls.length === 0) return

  for (const poll of openPolls) {
    const { data: votes } = await serviceSupabase
      .from('votes')
      .select('option_chosen')
      .eq('poll_id', poll.id)

    const tally: Record<string, number> = {}
    for (const opt of (poll.options as string[])) tally[opt] = 0
    for (const v of (votes || [])) tally[v.option_chosen] = (tally[v.option_chosen] || 0) + 1

    const winning_option = Object.entries(tally)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]

    await serviceSupabase
      .from('polls')
      .update({ status: 'locked', winning_option })
      .eq('id', poll.id)
  }
}

export async function GET(
  _req: Request,
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
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await autoLockOverduePolls(tripId)

  const serviceSupabase = createServiceRoleClient()
  const { data: polls } = await serviceSupabase
    .from('polls')
    .select('*, votes(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ polls: polls || [] })
}

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
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { question, options, deadline } = body

  if (!question || !question.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }
  if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
    return NextResponse.json({ error: 'Provide 2–4 options' }, { status: 400 })
  }
  const cleanOptions = (options as string[]).map((o) => o.trim()).filter(Boolean)
  if (cleanOptions.length < 2) {
    return NextResponse.json({ error: 'Provide at least 2 non-empty options' }, { status: 400 })
  }
  if (!deadline) {
    return NextResponse.json({ error: 'Deadline is required' }, { status: 400 })
  }

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      trip_id: tripId,
      question: question.trim(),
      options: cleanOptions,
      deadline,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ poll }, { status: 201 })
}

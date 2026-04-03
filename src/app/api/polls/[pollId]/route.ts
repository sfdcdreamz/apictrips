import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  // Verify organiser owns the trip this poll belongs to
  const { data: poll } = await serviceSupabase
    .from('polls')
    .select('id, trip_id, options, status')
    .eq('id', pollId)
    .single()
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', poll.trip_id)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { action } = body

  if (action === 'lock') {
    const { data: votes } = await serviceSupabase
      .from('votes')
      .select('option_chosen')
      .eq('poll_id', pollId)

    const tally: Record<string, number> = {}
    for (const opt of (poll.options as string[])) tally[opt] = 0
    for (const v of (votes || [])) tally[v.option_chosen] = (tally[v.option_chosen] || 0) + 1

    const winning_option = Object.entries(tally)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]

    const { data: updated, error } = await serviceSupabase
      .from('polls')
      .update({ status: 'locked', winning_option })
      .eq('id', pollId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ poll: updated })
  }

  if (action === 'reopen') {
    const { data: updated, error } = await serviceSupabase
      .from('polls')
      .update({ status: 'open', winning_option: null })
      .eq('id', pollId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ poll: updated })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

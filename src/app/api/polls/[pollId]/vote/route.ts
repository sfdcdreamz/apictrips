import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params
  const serviceSupabase = createServiceRoleClient()

  const { data: poll } = await serviceSupabase
    .from('polls')
    .select('*, votes(*)')
    .eq('id', pollId)
    .single()

  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

  // Auto-lock if deadline passed
  if (poll.status === 'open' && new Date(poll.deadline) < new Date()) {
    const tally: Record<string, number> = {}
    for (const opt of (poll.options as string[])) tally[opt] = 0
    for (const v of ((poll.votes || []) as { option_chosen: string }[])) {
      tally[v.option_chosen] = (tally[v.option_chosen] || 0) + 1
    }
    const winning_option = Object.entries(tally)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]

    await serviceSupabase
      .from('polls')
      .update({ status: 'locked', winning_option })
      .eq('id', pollId)

    poll.status = 'locked'
    poll.winning_option = winning_option
  }

  return NextResponse.json({ poll })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params
  const serviceSupabase = createServiceRoleClient()

  const { data: poll } = await serviceSupabase
    .from('polls')
    .select('*, trip_id')
    .eq('id', pollId)
    .single()

  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

  if (poll.status === 'locked') {
    return NextResponse.json({ error: 'This poll is locked' }, { status: 400 })
  }

  if (new Date(poll.deadline) < new Date()) {
    return NextResponse.json({ error: 'Voting deadline has passed' }, { status: 400 })
  }

  const body = await request.json()
  const { email, option_chosen } = body

  if (!email || !option_chosen) {
    return NextResponse.json({ error: 'Email and option are required' }, { status: 400 })
  }

  if (!(poll.options as string[]).includes(option_chosen)) {
    return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Validate email is a member of the trip
  const { data: member } = await serviceSupabase
    .from('members')
    .select('id')
    .eq('trip_id', poll.trip_id)
    .eq('email', normalizedEmail)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'This email is not a member of the trip' }, { status: 403 })
  }

  const { data: vote, error } = await serviceSupabase
    .from('votes')
    .insert({
      poll_id: pollId,
      member_email: normalizedEmail,
      option_chosen,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "You've already voted on this poll" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vote }, { status: 201 })
}

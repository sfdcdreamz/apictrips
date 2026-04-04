import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import PollsRealtimeWrapper from '@/components/decisions/PollsRealtimeWrapper'
import CreatePollForm from '@/components/decisions/CreatePollForm'
import type { Member, PollWithVotes } from '@/types'

async function getPollsData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return null

  const serviceSupabase = createServiceRoleClient()

  // Auto-lock overdue polls
  const now = new Date().toISOString()
  const { data: openOverdue } = await serviceSupabase
    .from('polls')
    .select('id, options')
    .eq('trip_id', tripId)
    .eq('status', 'open')
    .lt('deadline', now)

  if (openOverdue && openOverdue.length > 0) {
    const overdueIds = openOverdue.map((p) => p.id)
    const { data: allVotes } = await serviceSupabase
      .from('votes')
      .select('poll_id, option_chosen')
      .in('poll_id', overdueIds)

    const votesByPoll = new Map<string, { option_chosen: string }[]>()
    for (const v of allVotes || []) {
      if (!votesByPoll.has(v.poll_id)) votesByPoll.set(v.poll_id, [])
      votesByPoll.get(v.poll_id)!.push(v)
    }

    await Promise.all(openOverdue.map((poll) => {
      const votes = votesByPoll.get(poll.id) || []
      const tally: Record<string, number> = {}
      for (const opt of (poll.options as string[])) tally[opt] = 0
      for (const v of votes) tally[v.option_chosen] = (tally[v.option_chosen] || 0) + 1
      const winning_option = Object.entries(tally)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
      return serviceSupabase
        .from('polls')
        .update({ status: 'locked', winning_option })
        .eq('id', poll.id)
    }))
  }

  const { data: polls } = await serviceSupabase
    .from('polls')
    .select('*, votes(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  const { data: members } = await supabase
    .from('members')
    .select('name, email')
    .eq('trip_id', tripId)

  return {
    polls: (polls || []) as PollWithVotes[],
    members: (members || []) as Pick<Member, 'name' | 'email'>[],
  }
}

export default async function PollsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getPollsData(tripId)
  if (!data) notFound()

  const { polls, members } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header band */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Decision Engine</h1>
        <p className="text-emerald-100 text-sm mt-1">Vote on open polls — majority wins, decisions lock.</p>
      </div>

      {/* Create poll */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Create a poll</h2>
        <CreatePollForm tripId={tripId} />
      </div>

      {/* Polls list — with Supabase Realtime vote counts */}
      <PollsRealtimeWrapper
        initialPolls={polls}
        tripId={tripId}
        members={members}
      />
    </div>
  )
}

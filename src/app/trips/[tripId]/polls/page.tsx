import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import PollsRealtimeWrapper from '@/components/decisions/PollsRealtimeWrapper'
import CreatePollForm from '@/components/decisions/CreatePollForm'
import PivotPollForm from '@/components/decisions/PivotPollForm'
import type { Member, PollWithVotes } from '@/types'

async function getPollsData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('id, start_date, end_date, organiser_id')
    .eq('id', tripId)
    .single()
  if (!trip) return null

  const isOrganiser = trip.organiser_id === user.id

  if (!isOrganiser) {
    const { data: member } = await serviceSupabase
      .from('members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('email', user.email!)
      .single()
    if (!member) return null
  }

  const today = new Date().toISOString().split('T')[0]
  const isLive = !!(trip.start_date && trip.end_date && today >= trip.start_date && today <= trip.end_date)

  // Auto-lock overdue polls (organiser only)
  if (isOrganiser) {
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
  }

  const { data: polls } = await serviceSupabase
    .from('polls')
    .select('*, votes(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  const { data: members } = await serviceSupabase
    .from('members')
    .select('name, email')
    .eq('trip_id', tripId)

  return {
    polls: (polls || []) as PollWithVotes[],
    members: (members || []) as Pick<Member, 'name' | 'email'>[],
    isLive,
    isOrganiser,
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

  const { polls, members, isLive, isOrganiser } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header band */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Decision Engine</h1>
        <p className="text-emerald-100 text-sm mt-1">Vote on open polls — majority wins, decisions lock.</p>
      </div>

      {/* Pivot poll — organiser only, during LIVE mode */}
      {isOrganiser && isLive && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-5">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">
            🔴 Trip is LIVE — Pivot Poll
          </p>
          <PivotPollForm tripId={tripId} />
        </div>
      )}

      {/* Create poll — organiser and members */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Create a poll</h2>
        <CreatePollForm tripId={tripId} />
      </div>

      {/* Polls list — with Supabase Realtime vote counts */}
      <PollsRealtimeWrapper
        initialPolls={polls}
        tripId={tripId}
        members={members}
        isOrganiser={isOrganiser}
      />
    </div>
  )
}

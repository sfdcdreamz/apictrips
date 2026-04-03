import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import PollCard from '@/components/decisions/PollCard'
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
    for (const poll of openOverdue) {
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
  const openPolls = polls.filter((p) => p.status === 'open')
  const lockedPolls = polls.filter((p) => p.status === 'locked')

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

      {/* Active polls */}
      {openPolls.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Active Polls</h2>
          {openPolls.map((poll) => {
            const voterEmails = poll.votes.map((v) => v.member_email)
            const waitingFor = members
              .filter((m) => !voterEmails.includes(m.email))
              .map((m) => m.name)
            return (
              <PollCard key={poll.id} poll={poll} tripId={tripId} waitingFor={waitingFor} />
            )
          })}
        </div>
      )}

      {/* Decision log */}
      {lockedPolls.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Decision Log</h2>
          <div className="space-y-2">
            {lockedPolls.map((p) => (
              <div key={p.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.question}</p>
                  <p className="text-sm text-emerald-700">→ {p.winning_option}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {polls.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
          <div className="text-3xl mb-3">🗳️</div>
          <p className="text-gray-500 text-sm">No polls yet. Create the first decision above.</p>
        </div>
      )}
    </div>
  )
}

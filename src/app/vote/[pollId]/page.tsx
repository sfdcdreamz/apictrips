import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import VoteForm from '@/components/vote/VoteForm'
import type { PollWithVotes } from '@/types'

async function getPollForVoting(pollId: string): Promise<PollWithVotes | null> {
  const serviceSupabase = createServiceRoleClient()

  const { data: poll } = await serviceSupabase
    .from('polls')
    .select('*, votes(*)')
    .eq('id', pollId)
    .single()

  if (!poll) return null

  // Auto-lock if deadline passed
  if (poll.status === 'open' && new Date(poll.deadline) < new Date()) {
    const tally: Record<string, number> = {}
    for (const opt of (poll.options as string[])) tally[opt] = 0
    for (const v of (poll.votes || [])) {
      tally[v.option_chosen] = (tally[v.option_chosen] || 0) + 1
    }
    const winning_option = Object.entries(tally)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]

    await serviceSupabase
      .from('polls')
      .update({ status: 'locked', winning_option })
      .eq('id', poll.id)

    poll.status = 'locked'
    poll.winning_option = winning_option
  }

  return poll as PollWithVotes
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ pollId: string }>
}) {
  const { pollId } = await params
  const poll = await getPollForVoting(pollId)

  if (!poll) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto">
          <span className="text-lg font-bold text-gray-900">APIcTrips</span>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Group Poll</span>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{poll.question}</h1>
          </div>

          {poll.status === 'locked' ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Decision locked</p>
                <p className="text-lg font-bold text-emerald-800">{poll.winning_option}</p>
              </div>
              <div className="space-y-2">
                {(poll.options as string[]).map((opt) => {
                  const count = poll.votes.filter((v) => v.option_chosen === opt).length
                  const total = poll.votes.length
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={opt === poll.winning_option ? 'font-semibold text-emerald-700' : 'text-gray-600'}>{opt}</span>
                        <span className="text-gray-400">{count} vote{count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${opt === poll.winning_option ? 'bg-emerald-500' : 'bg-gray-300'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <VoteForm
              pollId={poll.id}
              question={poll.question}
              options={poll.options as string[]}
              deadline={poll.deadline}
            />
          )}
        </div>
      </div>
    </div>
  )
}

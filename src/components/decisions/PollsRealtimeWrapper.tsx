'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PollCard from './PollCard'
import type { PollWithVotes, Vote } from '@/types'

interface Props {
  initialPolls: PollWithVotes[]
  tripId: string
  members: { name: string; email: string }[]
}

export default function PollsRealtimeWrapper({ initialPolls, tripId, members }: Props) {
  const [polls, setPolls] = useState<PollWithVotes[]>(initialPolls)

  useEffect(() => {
    setPolls(initialPolls)
  }, [initialPolls])

  useEffect(() => {
    const supabase = createClient()
    const pollIds = new Set(initialPolls.map((p) => p.id))

    const channel = supabase
      .channel(`polls-votes-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          const newVote = payload.new as Vote
          if (!pollIds.has(newVote.poll_id)) return

          setPolls((prev) =>
            prev.map((poll) =>
              poll.id === newVote.poll_id
                ? {
                    ...poll,
                    votes: poll.votes.some((v) => v.id === newVote.id)
                      ? poll.votes
                      : [...poll.votes, newVote],
                  }
                : poll
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const openPolls = polls.filter((p) => p.status === 'open')
  const lockedPolls = polls.filter((p) => p.status === 'locked')

  return (
    <>
      {openPolls.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            Active Polls
            <span className="ml-2 text-emerald-600 font-normal normal-case">● live</span>
          </h2>
          {openPolls.map((poll) => {
            const voterEmails = poll.votes.map((v) => v.member_email)
            const waitingFor = members
              .filter((m) => !voterEmails.includes(m.email))
              .map((m) => m.name)
            return <PollCard key={poll.id} poll={poll} tripId={tripId} waitingFor={waitingFor} />
          })}
        </div>
      )}

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
    </>
  )
}

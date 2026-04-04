'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate, buildVoteUrl } from '@/lib/utils'
import type { PollWithVotes } from '@/types'
import ShareButton from '@/components/ui/ShareButton'

interface Props {
  poll: PollWithVotes
  tripId: string
  waitingFor?: string[]
  isOrganiser?: boolean
}

function timeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

export default function PollCard({ poll, tripId, waitingFor, isOrganiser = true }: Props) {
  const router = useRouter()
  const totalVotes = poll.votes.length
  const isLocked = poll.status === 'locked'
  const countdown = isLocked ? '' : timeRemaining(poll.deadline)

  async function handleAction(action: 'lock' | 'reopen') {
    const res = await fetch(`/api/polls/${poll.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="border border-stone-100 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">{poll.question}</p>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
          isLocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isLocked ? 'Locked' : 'Open'}
        </span>
      </div>

      {!isLocked && countdown && (
        <p className="text-xs text-amber-600 font-medium">⏱ {countdown}</p>
      )}

      {isLocked && poll.winning_option && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Winner</p>
          <p className="text-sm font-bold text-emerald-800">{poll.winning_option}</p>
        </div>
      )}

      <div className="space-y-2">
        {(poll.options as string[]).map((opt) => {
          const count = poll.votes.filter((v) => v.option_chosen === opt).length
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          return (
            <div key={opt} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span className={opt === poll.winning_option ? 'font-semibold' : ''}>{opt}</span>
                <span className="text-gray-400">{count} vote{count !== 1 ? 's' : ''} · {pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${opt === poll.winning_option ? 'bg-emerald-500' : 'bg-emerald-300'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {!isLocked && waitingFor && waitingFor.length > 0 && (
        <p className="text-xs text-gray-400">
          Waiting: {waitingFor.slice(0, 3).join(', ')}{waitingFor.length > 3 ? ` +${waitingFor.length - 3} more` : ''}
        </p>
      )}

      <p className="text-xs text-gray-400">Deadline: {formatDate(poll.deadline)}</p>

      <div className="flex flex-col gap-2 pt-1">
        {isOrganiser && !isLocked && (
          <>
            <Link
              href={`/vote/${poll.id}`}
              className="w-full py-1.5 text-xs text-center border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Cast your vote →
            </Link>
            <div className="flex gap-2">
              <ShareButton
                url={buildVoteUrl(poll.id)}
                title={poll.question}
                text={`Vote on our trip poll: "${poll.question}"`}
                label="Share"
                className="flex-1 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              />
              <button
                onClick={() => handleAction('lock')}
                className="flex-1 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Lock now
              </button>
            </div>
          </>
        )}
        {isOrganiser && isLocked && (
          <button
            onClick={() => handleAction('reopen')}
            className="py-1.5 px-3 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Re-vote
          </button>
        )}
        {!isOrganiser && !isLocked && (
          <Link
            href={`/vote/${poll.id}`}
            className="flex-1 py-1.5 text-xs text-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Cast your vote →
          </Link>
        )}
      </div>
    </div>
  )
}

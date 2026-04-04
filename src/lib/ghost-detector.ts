import type { Member, PollWithVotes } from '@/types'

export interface GhostAlert {
  member: Member
  reason: string
  daysSinceJoined: number
}

const GHOST_THRESHOLD_DAYS = 3

export function detectGhostMembers(
  members: Member[],
  polls: PollWithVotes[]
): GhostAlert[] {
  const now = Date.now()

  const voterEmails = new Set<string>()
  for (const poll of polls) {
    for (const vote of poll.votes) {
      voterEmails.add(vote.member_email)
    }
  }

  const alerts: GhostAlert[] = []

  for (const member of members) {
    if (member.is_organiser) continue
    if (member.status === 'out') continue

    const daysSinceJoined = Math.floor(
      (now - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceJoined < GHOST_THRESHOLD_DAYS) continue

    const hasVoted = voterEmails.has(member.email)
    const hasCompletedVibe = member.vibe_completed
    const isConfirmed = member.status === 'in'

    const inactiveSignals = [
      !hasCompletedVibe,
      !hasVoted && polls.length > 0,
      !isConfirmed,
    ].filter(Boolean).length

    if (inactiveSignals >= 2) {
      const reasons: string[] = []
      if (!hasCompletedVibe) reasons.push('no vibe check')
      if (!hasVoted && polls.length > 0) reasons.push('never voted')
      if (!isConfirmed) reasons.push('not confirmed')
      alerts.push({ member, reason: reasons.join(' · '), daysSinceJoined })
    }
  }

  return alerts
}

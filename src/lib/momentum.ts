import type { Member, PollWithVotes, Expense } from '@/types'

export interface MomentumScore {
  score: number
  label: 'High' | 'Medium' | 'Low'
  color: 'emerald' | 'amber' | 'red'
  factors: {
    vibeCompletion: number
    rsvpRate: number
    pollParticipation: number
    recentActivity: number
  }
  nudge?: string
}

export function computeMomentum(
  members: Member[],
  polls: PollWithVotes[],
  expenses: Expense[]
): MomentumScore {
  const nonOrganisers = members.filter((m) => !m.is_organiser)
  const total = nonOrganisers.length

  if (total === 0) {
    return {
      score: 0,
      label: 'Low',
      color: 'red',
      factors: { vibeCompletion: 0, rsvpRate: 0, pollParticipation: 0, recentActivity: 0 },
      nudge: 'Invite members to get started',
    }
  }

  const vibeCompleted = nonOrganisers.filter((m) => m.vibe_completed).length
  const vibeCompletion = Math.round((vibeCompleted / total) * 100)

  const rsvpd = nonOrganisers.filter((m) => m.status === 'in' || m.status === 'tentative').length
  const rsvpRate = Math.round((rsvpd / total) * 100)

  let pollParticipation = 100
  if (polls.length > 0) {
    const voterEmails = new Set<string>()
    for (const p of polls) {
      for (const v of p.votes) voterEmails.add(v.member_email)
    }
    pollParticipation = Math.min(100, Math.round((voterEmails.size / total) * 100))
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentExpenses = expenses.filter(
    (e) => new Date(e.created_at).getTime() > sevenDaysAgo
  ).length
  const recentActivity = Math.min(100, recentExpenses * 20)

  const score = Math.round(
    vibeCompletion * 0.30 +
    rsvpRate * 0.35 +
    pollParticipation * 0.25 +
    recentActivity * 0.10
  )

  const label: MomentumScore['label'] = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'
  const color: MomentumScore['color'] = score >= 70 ? 'emerald' : score >= 40 ? 'amber' : 'red'

  let nudge: string | undefined
  if (vibeCompletion < 50) {
    nudge = `${total - vibeCompleted} member${total - vibeCompleted > 1 ? 's' : ''} haven't done vibe check`
  } else if (rsvpRate < 70) {
    nudge = `${total - rsvpd} member${total - rsvpd > 1 ? 's' : ''} haven't confirmed attendance`
  } else if (polls.length === 0) {
    nudge = 'Create a poll to drive group engagement'
  } else if (pollParticipation < 60) {
    nudge = "Some members haven't voted on open polls yet"
  }

  return {
    score,
    label,
    color,
    factors: { vibeCompletion, rsvpRate, pollParticipation, recentActivity },
    nudge,
  }
}

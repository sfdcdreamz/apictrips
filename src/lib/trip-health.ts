import type { Member, Poll, TripHealth } from '@/types'

export function computeTripHealth(members: Member[], polls: Poll[]): TripHealth {
  if (polls.length === 0) {
    return { status: 'not-started', label: 'Not Started', reason: 'No decisions created yet' }
  }

  const confirmed = members.filter((m) => m.status === 'in').length
  const confirmedPct = members.length > 0 ? confirmed / members.length : 0
  const lockedPolls = polls.filter((p) => p.status === 'locked').length
  const oldestOpenPoll = polls
    .filter((p) => p.status === 'open')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]

  const openPollTooOld =
    oldestOpenPoll &&
    Date.now() - new Date(oldestOpenPoll.created_at).getTime() > 48 * 60 * 60 * 1000

  if (confirmedPct < 0.5 || (polls.length > 0 && lockedPolls === 0 && openPollTooOld)) {
    const reasons: string[] = []
    if (confirmedPct < 0.5) reasons.push(`${confirmed}/${members.length} confirmed`)
    if (polls.length > 0 && lockedPolls === 0 && openPollTooOld) reasons.push('0 decisions locked')
    return { status: 'at-risk', label: 'At Risk', reason: reasons.join(' · ') }
  }

  if (confirmedPct >= 0.7 && lockedPolls >= 1) {
    return {
      status: 'healthy',
      label: 'Healthy',
      reason: `${confirmed}/${members.length} confirmed · ${lockedPolls} decision${lockedPolls > 1 ? 's' : ''} locked`,
    }
  }

  return {
    status: 'at-risk',
    label: 'At Risk',
    reason: `${confirmed}/${members.length} confirmed · ${lockedPolls} decisions locked`,
  }
}

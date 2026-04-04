import type { Member, Pool, Expense } from '@/types'

export interface DropoutRipple {
  member: Member
  financial: {
    currentPerPerson: number
    newPerPerson: number
    extraPerPerson: number
    currency: string
  } | null
}

export function calculateDropoutRipple(
  member: Member,
  allMembers: Member[],
  pool: (Pool & { expenses: Expense[] }) | null
): DropoutRipple {
  const confirmedMembers = allMembers.filter((m) => m.status === 'in')
  const confirmedCount = confirmedMembers.length

  let financial: DropoutRipple['financial'] = null

  if (pool && confirmedCount >= 2) {
    const totalSpent = pool.expenses.reduce((sum, e) => sum + e.amount, 0)
    const remaining = pool.total_amount - totalSpent
    if (remaining > 0) {
      const afterDropout = confirmedCount - 1
      const currentPerPerson = remaining / confirmedCount
      const newPerPerson = remaining / afterDropout
      financial = {
        currentPerPerson: Math.round(currentPerPerson),
        newPerPerson: Math.round(newPerPerson),
        extraPerPerson: Math.round(newPerPerson - currentPerPerson),
        currency: pool.currency,
      }
    }
  }

  return { member, financial }
}

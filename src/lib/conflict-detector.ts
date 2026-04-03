import type { Member, ConflictResult, ConflictDetail } from '@/types'

const BUDGET_TIERS: Record<string, number> = {
  budget: 0,
  'mid-range': 1,
  luxury: 2,
}

const PACE_TIERS: Record<string, number> = {
  relaxed: 0,
  moderate: 1,
  packed: 2,
}

export function detectConflicts(members: Member[]): ConflictResult {
  const completed = members.filter((m) => m.vibe_completed)

  if (completed.length < 2) {
    return { has_conflict: false, conflicts: [] }
  }

  const conflicts: ConflictDetail[] = []

  // Budget conflict check
  const budgetValues = completed
    .map((m) => m.vibe_budget)
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (budgetValues.length >= 2) {
    const tiers = budgetValues.map((v) => BUDGET_TIERS[v as string] ?? 0)
    const min = Math.min(...tiers)
    const max = Math.max(...tiers)
    if (max - min > 1) {
      const counts: Record<string, number> = {}
      budgetValues.forEach((v) => { counts[v as string] = (counts[v as string] || 0) + 1 })
      const summary = Object.entries(counts)
        .map(([k, n]) => `${n} ${k}`)
        .join(', ')
      conflicts.push({
        dimension: 'budget',
        values: budgetValues as string[],
        message: `Budget preferences vary widely (${summary}). Align this before planning accommodation.`,
      })
    }
  }

  // Pace conflict check
  const paceValues = completed
    .map((m) => m.vibe_pace)
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (paceValues.length >= 2) {
    const tiers = paceValues.map((v) => PACE_TIERS[v as string] ?? 0)
    const min = Math.min(...tiers)
    const max = Math.max(...tiers)
    if (max - min > 1) {
      const counts: Record<string, number> = {}
      paceValues.forEach((v) => { counts[v as string] = (counts[v as string] || 0) + 1 })
      const summary = Object.entries(counts)
        .map(([k, n]) => `${n} ${k}`)
        .join(', ')
      conflicts.push({
        dimension: 'pace',
        values: paceValues as string[],
        message: `Travel pace preferences vary widely (${summary}). Discuss this before building the itinerary.`,
      })
    }
  }

  return {
    has_conflict: conflicts.length > 0,
    conflicts,
  }
}

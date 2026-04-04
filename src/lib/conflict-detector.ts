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

const ACCOMMODATION_TIERS: Record<string, number> = {
  hostel: 0,
  airbnb: 1,
  hotel: 2,
  luxury: 3,
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
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')
      conflicts.push({
        dimension: 'budget',
        values: budgetValues as string[],
        message: `Budget preferences vary widely (${summary}). Align this before planning accommodation.`,
        suggestion: 'Consider a mid-range option everyone can afford, or split stays (e.g. shared Airbnb vs individual hotel rooms).',
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
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')
      conflicts.push({
        dimension: 'pace',
        values: paceValues as string[],
        message: `Travel pace preferences vary widely (${summary}). Discuss this before building the itinerary.`,
        suggestion: 'Build a moderate-pace itinerary with optional activities for the high-energy members.',
      })
    }
  }

  // Style conflict check
  const styleValues = completed
    .map((m) => m.vibe_style)
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (styleValues.length >= 2) {
    const unique = new Set(styleValues as string[])
    // Conflict if no single style has majority AND more than 2 distinct preferences
    const counts: Record<string, number> = {}
    styleValues.forEach((v) => { counts[v as string] = (counts[v as string] || 0) + 1 })
    const topCount = Math.max(...Object.values(counts))
    const majority = topCount / styleValues.length
    if (unique.size >= 3 && majority < 0.5) {
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')
      conflicts.push({
        dimension: 'style',
        values: styleValues as string[],
        message: `Travel style preferences are split (${summary}).`,
        suggestion: 'Pick a destination that blends styles (e.g. a beach city offers both beach and culture).',
      })
    }
  }

  // Accommodation conflict check
  const accomValues = completed
    .map((m) => m.vibe_accommodation)
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (accomValues.length >= 2) {
    const tiers = accomValues.map((v) => ACCOMMODATION_TIERS[v as string] ?? 0)
    const min = Math.min(...tiers)
    const max = Math.max(...tiers)
    if (max - min > 2) {
      const counts: Record<string, number> = {}
      accomValues.forEach((v) => { counts[v as string] = (counts[v as string] || 0) + 1 })
      const summary = Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')
      conflicts.push({
        dimension: 'accommodation',
        values: accomValues as string[],
        message: `Accommodation preferences vary widely (${summary}).`,
        suggestion: 'Consider a mid-tier Airbnb or hotel that works for the whole group.',
      })
    }
  }

  return {
    has_conflict: conflicts.length > 0,
    conflicts,
  }
}

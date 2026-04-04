import type { Member } from '@/types'

// Weights reflecting real-world trip-ruining impact
const WEIGHTS = { budget: 0.35, pace: 0.25, style: 0.20, accommodation: 0.20 }

const BUDGET_TIERS: Record<string, number> = { budget: 0, 'mid-range': 1, luxury: 2 }
const PACE_TIERS: Record<string, number> = { relaxed: 0, moderate: 1, packed: 2 }
const ACCOMMODATION_TIERS: Record<string, number> = { hostel: 0, airbnb: 1, hotel: 2, luxury: 3 }

function tierSpread(tiers: number[], maxSpread: number): number {
  if (tiers.length < 2) return 1
  const spread = Math.max(...tiers) - Math.min(...tiers)
  return Math.max(0, 1 - spread / maxSpread)
}

function categoricalAgreement(values: string[]): number {
  if (values.length < 2) return 1
  const counts: Record<string, number> = {}
  values.forEach((v) => { counts[v] = (counts[v] || 0) + 1 })
  const topCount = Math.max(...Object.values(counts))
  return topCount / values.length
}

export function computeVibeScore(members: Member[]): {
  score: number
  label: 'Perfect Match' | 'Mostly Aligned' | 'Some Tension' | 'Needs Discussion'
  dimensionScores: Record<'budget' | 'pace' | 'style' | 'accommodation', number>
} {
  const completed = members.filter((m) => m.vibe_completed)

  if (completed.length < 2) {
    return {
      score: 0,
      label: 'Needs Discussion',
      dimensionScores: { budget: 0, pace: 0, style: 0, accommodation: 0 },
    }
  }

  const budgetValues = completed.map((m) => m.vibe_budget).filter((v): v is NonNullable<typeof v> => v !== null) as string[]
  const paceValues = completed.map((m) => m.vibe_pace).filter((v): v is NonNullable<typeof v> => v !== null) as string[]
  const styleValues = completed.map((m) => m.vibe_style).filter((v): v is NonNullable<typeof v> => v !== null) as string[]
  const accomValues = completed.map((m) => m.vibe_accommodation).filter((v): v is NonNullable<typeof v> => v !== null) as string[]

  const budgetScore = budgetValues.length >= 2
    ? tierSpread(budgetValues.map((v) => BUDGET_TIERS[v] ?? 0), 2)
    : 1
  const paceScore = paceValues.length >= 2
    ? tierSpread(paceValues.map((v) => PACE_TIERS[v] ?? 0), 2)
    : 1
  const styleScore = styleValues.length >= 2 ? categoricalAgreement(styleValues) : 1
  const accomScore = accomValues.length >= 2
    ? tierSpread(accomValues.map((v) => ACCOMMODATION_TIERS[v] ?? 0), 3)
    : 1

  const weighted =
    budgetScore * WEIGHTS.budget +
    paceScore * WEIGHTS.pace +
    styleScore * WEIGHTS.style +
    accomScore * WEIGHTS.accommodation

  const score = Math.round(weighted * 100)

  const label =
    score >= 80 ? 'Perfect Match' :
    score >= 60 ? 'Mostly Aligned' :
    score >= 40 ? 'Some Tension' :
    'Needs Discussion'

  return {
    score,
    label,
    dimensionScores: {
      budget: Math.round(budgetScore * 100),
      pace: Math.round(paceScore * 100),
      style: Math.round(styleScore * 100),
      accommodation: Math.round(accomScore * 100),
    },
  }
}

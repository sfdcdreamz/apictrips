import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

interface BudgetBreakdown {
  category: string
  amount: number
}

interface BudgetEstimate {
  min: number
  max: number
  currency: string
  breakdown: BudgetBreakdown[]
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id, destination, group_size, start_date, end_date')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return new NextResponse('Forbidden', { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const serviceSupabase = createServiceRoleClient()

  const [{ data: disclosures }, { data: members }] = await Promise.all([
    serviceSupabase
      .from('budget_disclosures')
      .select('budget_range')
      .eq('trip_id', tripId),
    serviceSupabase
      .from('members')
      .select('vibe_budget, vibe_style, vibe_pace')
      .eq('trip_id', tripId),
  ])

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Find dominant budget range from disclosures
  const rangeCounts: Record<string, number> = {}
  for (const d of (disclosures || [])) {
    rangeCounts[d.budget_range] = (rangeCounts[d.budget_range] || 0) + 1
  }
  const dominantRange = Object.entries(rangeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Find dominant vibe style from members
  const styleCounts: Record<string, number> = {}
  for (const m of (members || [])) {
    if (m.vibe_style) styleCounts[m.vibe_style] = (styleCounts[m.vibe_style] || 0) + 1
  }
  const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed'

  const budgetContext = dominantRange
    ? `The group's most common budget preference is "${dominantRange}".`
    : 'No budget preferences submitted yet — assume mid-range.'

  const prompt = `You are a travel budget expert for India-focused trips. Estimate the per-person budget for this trip.

Trip details:
- Destination: ${trip.destination}
- Duration: ${durationDays} days
- Group size: ${trip.group_size} people
- Travel style: ${dominantStyle}
- ${budgetContext}

Provide a realistic per-person budget estimate in INR with a breakdown across 5 categories: Flights, Stay, Food, Transport, Experiences.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "min": 15000,
  "max": 25000,
  "currency": "INR",
  "breakdown": [
    { "category": "Flights", "amount": 8000 },
    { "category": "Stay", "amount": 6000 },
    { "category": "Food", "amount": 4000 },
    { "category": "Transport", "amount": 3000 },
    { "category": "Experiences", "amount": 2000 }
  ]
}

The breakdown amounts should sum to roughly the midpoint of min and max. All amounts in INR per person.`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    console.error('Anthropic API error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
  }

  const anthropicData = await anthropicRes.json() as {
    content: Array<{ type: string; text: string }>
  }
  const text = anthropicData.content?.[0]?.text || ''

  let estimate: BudgetEstimate
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    estimate = JSON.parse(cleaned)
    if (typeof estimate.min !== 'number' || typeof estimate.max !== 'number') {
      throw new Error('Invalid shape')
    }
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 })
  }

  return NextResponse.json(estimate)
}

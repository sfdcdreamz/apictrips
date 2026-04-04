import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

interface GeneratedItem {
  day_number: number
  time: string | null
  title: string
  description: string | null
  item_type: 'activity' | 'meal' | 'transport' | 'stay'
  cost: number
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return new NextResponse('Forbidden', { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 }
    )
  }

  const serviceSupabase = createServiceRoleClient()

  // Fetch members for vibe context
  const { data: members } = await serviceSupabase
    .from('members')
    .select('vibe_budget, vibe_pace, vibe_style, vibe_accommodation, vibe_completed')
    .eq('trip_id', tripId)

  const completedVibes = (members || []).filter((m) => m.vibe_completed)

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Build vibe summary for prompt
  const budgetCounts = countValues(completedVibes.map((m) => m.vibe_budget).filter(Boolean))
  const paceCounts = countValues(completedVibes.map((m) => m.vibe_pace).filter(Boolean))
  const styleCounts = countValues(completedVibes.map((m) => m.vibe_style).filter(Boolean))

  const dominantBudget = topKey(budgetCounts) || 'mid-range'
  const dominantPace = topKey(paceCounts) || 'moderate'
  const dominantStyle = topKey(styleCounts) || 'mixed'

  const prompt = `You are a travel planner creating a day-by-day itinerary for a group trip.

Trip details:
- Destination: ${trip.destination}
- Duration: ${totalDays} days (${trip.start_date} to ${trip.end_date})
- Group size: ${trip.group_size} people
- Budget preference: ${dominantBudget}
- Travel pace: ${dominantPace}
- Style preference: ${dominantStyle}

Create a realistic itinerary for all ${totalDays} days. Include a good mix of activities, meals, and transport. Keep costs realistic for the destination in INR.

Respond ONLY with a valid JSON array of items (no markdown, no explanation):
[
  {
    "day_number": 1,
    "time": "09:00",
    "title": "Activity name",
    "description": "Brief description",
    "item_type": "activity",
    "cost": 500
  }
]

item_type must be one of: activity, meal, transport, stay
Include 3-5 items per day. time can be null for items without a specific time.
Cost should be in INR per person. Use 0 for free activities.`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
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

  let items: GeneratedItem[]
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    items = JSON.parse(cleaned)
    if (!Array.isArray(items)) throw new Error('Not an array')
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 })
  }

  // Validate and clamp day numbers
  const validItems = items
    .filter((item) => item.day_number >= 1 && item.day_number <= totalDays)
    .map((item) => ({
      trip_id: tripId,
      day_number: item.day_number,
      day_date: null,
      time: item.time || null,
      title: String(item.title).slice(0, 200),
      description: item.description ? String(item.description).slice(0, 500) : null,
      item_type: ['activity', 'meal', 'transport', 'stay'].includes(item.item_type)
        ? item.item_type
        : 'activity',
      cost: Math.max(0, Number(item.cost) || 0),
      status: 'pending',
    }))

  if (validItems.length === 0) {
    return NextResponse.json({ error: 'No valid items generated' }, { status: 502 })
  }

  const { error: insertError } = await serviceSupabase
    .from('itinerary_items')
    .insert(validItems)

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save itinerary' }, { status: 500 })
  }

  return NextResponse.json({ count: validItems.length })
}

function countValues(values: (string | null)[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const v of values) {
    if (v) counts[v] = (counts[v] || 0) + 1
  }
  return counts
}

function topKey(counts: Record<string, number>): string | null {
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

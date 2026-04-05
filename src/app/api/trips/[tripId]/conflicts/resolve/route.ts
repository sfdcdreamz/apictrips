import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { detectConflicts } from '@/lib/conflict-detector'
import type { Member } from '@/types'

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
    .select('id, destination, group_size')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return new NextResponse('Forbidden', { status: 403 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const serviceSupabase = createServiceRoleClient()
  const { data: members } = await serviceSupabase
    .from('members')
    .select('vibe_budget, vibe_pace, vibe_style, vibe_accommodation, vibe_completed, name')
    .eq('trip_id', tripId)

  const conflicts = detectConflicts((members || []) as Member[])

  if (!conflicts.has_conflict) {
    return NextResponse.json({ suggestions: [] })
  }

  const conflictDescriptions = conflicts.conflicts.map((c) =>
    `Dimension: ${c.dimension} | Values: ${c.values.join(', ')} | Issue: ${c.message}`
  ).join('\n')

  const prompt = `You are a travel group mediator. A group of ${trip.group_size} people planning a trip to ${trip.destination} have the following preference conflicts:

${conflictDescriptions}

For each conflict dimension, provide a specific, actionable compromise suggestion tailored to this destination and group size. Be practical and friendly.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "suggestions": [
    { "dimension": "budget", "suggestion": "specific compromise suggestion" },
    { "dimension": "pace", "suggestion": "specific compromise suggestion" }
  ]
}

Only include dimensions that have conflicts listed above.`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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

  let parsed: { suggestions: Array<{ dimension: string; suggestion: string }> }
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed.suggestions)) throw new Error('Invalid shape')
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 })
  }

  return NextResponse.json({ suggestions: parsed.suggestions })
}

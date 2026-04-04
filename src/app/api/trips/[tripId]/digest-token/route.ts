import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()

  if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const digestToken = randomBytes(16).toString('hex')

  const serviceSupabase = createServiceRoleClient()
  const { error } = await serviceSupabase
    .from('trips')
    .update({ digest_token: digestToken })
    .eq('id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ digest_token: digestToken })
}

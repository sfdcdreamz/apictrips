import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const { data: referrals, count } = await serviceSupabase
    .from('referrals')
    .select('referred_email, created_at', { count: 'exact' })
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ referrals: referrals || [], count: count || 0 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { referrer_id } = body

  if (!referrer_id || referrer_id === user.id) {
    return NextResponse.json({ error: 'Invalid referral' }, { status: 400 })
  }

  const serviceSupabase = createServiceRoleClient()

  // Idempotent — ignore if already tracked
  const { data: existing } = await serviceSupabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', referrer_id)
    .eq('referred_email', user.email!)
    .single()

  if (existing) return NextResponse.json({ message: 'Already tracked' })

  const { data: referral, error } = await serviceSupabase
    .from('referrals')
    .insert({ referrer_id, referred_email: user.email! })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ referral }, { status: 201 })
}

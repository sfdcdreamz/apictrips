import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/trips/new'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Backfill user_id on member rows created before auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const serviceSupabase = createServiceRoleClient()
        await serviceSupabase
          .from('members')
          .update({ user_id: user.id })
          .eq('email', user.email)
          .is('user_id', null)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}

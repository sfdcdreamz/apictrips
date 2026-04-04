import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/trips/new'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const serviceSupabase = createServiceRoleClient()

        // Backfill user_id on member rows created before auth
        await serviceSupabase
          .from('members')
          .update({ user_id: user.id })
          .eq('email', user.email)
          .is('user_id', null)

        // Track referral if _ref cookie is present
        const cookieStore = await cookies()
        const refCode = cookieStore.get('_ref')?.value
        if (refCode && refCode !== user.id) {
          const { data: existing } = await serviceSupabase
            .from('referrals')
            .select('id')
            .eq('referrer_id', refCode)
            .eq('referred_email', user.email)
            .single()

          if (!existing) {
            await serviceSupabase
              .from('referrals')
              .insert({ referrer_id: refCode, referred_email: user.email })
          }
        }
      }

      const response = NextResponse.redirect(`${origin}${next}`)
      // Clear the ref cookie after use
      response.cookies.delete('_ref')
      return response
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}

import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const response = NextResponse.redirect(
    new URL('/auth/signup', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  )

  // Store referral code in cookie for 24h — captured in auth callback after signup
  response.cookies.set('_ref', code, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}

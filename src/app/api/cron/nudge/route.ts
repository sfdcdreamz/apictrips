import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://apictrips.vercel.app'

  const now = new Date()
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  // Find open polls closing in the next 30 min–2 hrs window
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('id, trip_id, question, deadline')
    .eq('status', 'open')
    .gte('deadline', now.toISOString())
    .lte('deadline', twoHoursFromNow.toISOString())

  if (pollsError) {
    console.error('nudge: polls query error', pollsError)
    return NextResponse.json({ error: pollsError.message }, { status: 500 })
  }

  if (!polls || polls.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const poll of polls) {
    const [{ data: members }, { data: votes }] = await Promise.all([
      supabase
        .from('members')
        .select('email, name')
        .eq('trip_id', poll.trip_id)
        .eq('status', 'in'),
      supabase
        .from('votes')
        .select('member_email')
        .eq('poll_id', poll.id),
    ])

    if (!members || members.length === 0) continue

    const votedEmails = new Set((votes ?? []).map((v) => v.member_email))
    const nonVoters = members.filter((m) => !votedEmails.has(m.email))

    const deadline = new Date(poll.deadline)
    const minutesLeft = Math.round((deadline.getTime() - now.getTime()) / 60000)
    const timeLabel = minutesLeft >= 60
      ? `${Math.round(minutesLeft / 60)} hour${Math.round(minutesLeft / 60) !== 1 ? 's' : ''}`
      : `${minutesLeft} minutes`

    for (const member of nonVoters) {
      const voteLink = `${appUrl}/vote/${poll.id}`
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:18px;font-weight:bold">⏳ Vote closes in ${timeLabel}</p>
  <p>Hey ${member.name ?? 'there'},</p>
  <p>The group is waiting on your vote for:</p>
  <blockquote style="border-left:4px solid #6366f1;margin:16px 0;padding:8px 16px;background:#f5f5ff;border-radius:4px">
    <strong>${poll.question}</strong>
  </blockquote>
  <a href="${voteLink}"
     style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
    Cast Your Vote →
  </a>
  <p style="margin-top:24px;font-size:12px;color:#888">
    You're receiving this because you're a member of this trip on APIcTrips.
  </p>
</body>
</html>
`
      try {
        await sendEmail({
          to: member.email,
          subject: `⏳ Vote closes soon — ${poll.question}`,
          html,
        })
        sent++
      } catch (err) {
        console.error(`nudge: failed to email ${member.email}`, err)
      }
    }
  }

  return NextResponse.json({ sent })
}

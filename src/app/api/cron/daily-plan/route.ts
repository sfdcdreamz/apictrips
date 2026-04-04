import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Find LIVE trips (start_date <= today <= end_date)
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, name, destination, start_date, end_date')
    .lte('start_date', today)
    .gte('end_date', today)

  if (tripsError) {
    console.error('daily-plan: trips query error', tripsError)
    return NextResponse.json({ error: tripsError.message }, { status: 500 })
  }

  if (!trips || trips.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const trip of trips) {
    const startDate = new Date(trip.start_date)
    const tripDay = Math.floor(
      (new Date(today).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1 // day 1-indexed

    const [{ data: items }, { data: members }] = await Promise.all([
      supabase
        .from('itinerary_items')
        .select('title, item_type, cost')
        .eq('trip_id', trip.id)
        .eq('day_number', tripDay)
        .order('created_at', { ascending: true }),
      supabase
        .from('members')
        .select('email, name')
        .eq('trip_id', trip.id)
        .eq('status', 'in'),
    ])

    if (!members || members.length === 0) continue

    const itemsList = items && items.length > 0
      ? items
          .map(
            (item) =>
              `<li style="padding:6px 0;border-bottom:1px solid #f0f0f0">
                <strong>${item.title}</strong>
                ${item.item_type !== 'activity' ? ` <span style="color:#888;font-size:12px">(${item.item_type})</span>` : ''}
                ${item.cost > 0 ? ` — <span style="color:#6366f1">₹${Number(item.cost).toLocaleString('en-IN')}</span>` : ''}
              </li>`
          )
          .join('')
      : '<li style="padding:6px 0;color:#888">No activities planned for today</li>'

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:18px;font-weight:bold">📍 Day ${tripDay} Plan — ${trip.name}</p>
  <p style="color:#555">${trip.destination} · ${today}</p>
  <ul style="padding-left:0;list-style:none;margin:16px 0;border:1px solid #e5e5e5;border-radius:8px;padding:8px 16px">
    ${itemsList}
  </ul>
  <p style="font-size:12px;color:#888;margin-top:24px">
    Have a great day! View the full itinerary on <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://apictrips.vercel.app'}">APIcTrips</a>.
  </p>
</body>
</html>
`

    for (const member of members) {
      try {
        await sendEmail({
          to: member.email,
          subject: `📍 Day ${tripDay} Plan — ${trip.name}`,
          html,
        })
        sent++
      } catch (err) {
        console.error(`daily-plan: failed to email ${member.email}`, err)
      }
    }
  }

  return NextResponse.json({ sent })
}

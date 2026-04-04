import { Resend } from 'resend'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'APIcTrips <noreply@apictrips.in>',
    to,
    subject,
    html,
  })
  if (error) {
    console.error('sendEmail error:', error)
    throw new Error(error.message)
  }
}

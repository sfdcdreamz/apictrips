import { notFound } from 'next/navigation'
import { formatDateRange } from '@/lib/utils'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import VibeCheckForm from '@/components/invite/VibeCheckForm'

async function getTripData(inviteCode: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/invite/${inviteCode}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>
}) {
  const { inviteCode } = await params
  const data = await getTripData(inviteCode)

  if (!data) notFound()
  const { trip, existingVibeMembers } = data

  const imageUrl = await getDestinationImage(trip.destination)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero image */}
      <DestinationHero imageUrl={imageUrl} destination={trip.destination} height="lg" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-gray-900">APIcTrips</div>
          <div className="text-sm text-gray-400 mt-1">Group travel, decisions that stick</div>
        </div>

        {/* Trip preview card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-2">
            You&apos;re invited
          </div>
          <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📍</span>
              <span>{trip.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📅</span>
              <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>👥</span>
              <span>
                {trip.member_count} of {trip.group_size} joined
              </span>
            </div>
          </div>
        </div>

        {/* Vibe check form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Join & share your travel vibe</h2>
          <VibeCheckForm inviteCode={inviteCode} tripName={trip.name} existingVibeMembers={existingVibeMembers} />
        </div>
      </div>
    </div>
  )
}

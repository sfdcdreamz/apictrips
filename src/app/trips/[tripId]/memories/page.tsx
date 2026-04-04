import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'
import PhotoGrid from '@/components/photos/PhotoGrid'
import PhotoUploadClient from '@/components/photos/PhotoUploadClient'

async function getMemoriesData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: member }] = await Promise.all([
    serviceSupabase.from('trips').select('id, name, destination, organiser_id').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return null
  const isOrganiser = trip.organiser_id === user.id
  if (!isOrganiser && !member) return null

  const [{ data: photos }, imageUrl] = await Promise.all([
    serviceSupabase.from('trip_photos').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    getDestinationImage(trip.destination),
  ])

  return {
    trip,
    photos: photos || [],
    imageUrl: imageUrl || '',
    isOrganiser,
    currentUserEmail: user.email || '',
  }
}

export default async function MemoriesPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getMemoriesData(tripId)
  if (!data) notFound()

  const { trip, photos, imageUrl, isOrganiser, currentUserEmail } = data

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden">
        <DestinationHero imageUrl={imageUrl} destination={trip.destination} height="sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/80 to-rose-400/60 flex flex-col justify-end p-6">
          <p className="text-white/70 text-sm mb-1">📍 {trip.destination}</p>
          <h1 className="text-2xl font-bold text-white">📸 Memories</h1>
          <p className="text-white/80 text-sm mt-1">{trip.name} · {photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add a photo</h2>
        <PhotoUploadClient tripId={tripId} />
      </div>

      {/* Gallery */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Gallery {photos.length > 0 && `(${photos.length})`}
        </h2>
        <PhotoGrid
          tripId={tripId}
          photos={photos}
          currentUserEmail={currentUserEmail}
          isOrganiser={isOrganiser}
        />
      </div>
    </div>
  )
}

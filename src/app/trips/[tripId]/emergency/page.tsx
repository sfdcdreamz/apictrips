import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getDestinationImage } from '@/lib/destination-image'
import DestinationHero from '@/components/ui/DestinationHero'

const EMERGENCY_NUMBERS = [
  { label: 'Police', number: '100' },
  { label: 'Ambulance', number: '102' },
  { label: 'Fire', number: '101' },
  { label: 'Tourist Helpline', number: '1800-11-1363' },
]

export default async function EmergencyPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: members }] = await Promise.all([
    serviceSupabase.from('trips').select('name, destination').eq('id', tripId).single(),
    serviceSupabase.from('members').select('name, email, is_organiser').eq('trip_id', tripId).order('is_organiser', { ascending: false }),
  ])

  if (!trip) notFound()

  const imageUrl = await getDestinationImage(trip.destination)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <DestinationHero imageUrl={imageUrl} destination={trip.destination} height="sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/80 to-rose-500/60 flex flex-col justify-end p-6">
          <p className="text-white/70 text-sm mb-1">📍 {trip.destination}</p>
          <h1 className="text-2xl font-bold text-white">🚨 Emergency Card</h1>
          <p className="text-white/80 text-sm mt-1">{trip.name} · Emergency numbers &amp; member contacts.</p>
        </div>
      </div>

      {/* Emergency numbers */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Emergency Numbers (India)</h2>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_NUMBERS.map((item) => (
            <a
              key={item.label}
              href={`tel:${item.number}`}
              className="flex flex-col gap-0.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors"
            >
              <span className="text-xs text-red-500 font-medium">{item.label}</span>
              <span className="text-xl font-bold text-red-700">{item.number}</span>
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Default India numbers. Verify local numbers at your destination.</p>
      </div>

      {/* Trip members */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Trip Members</h2>
        <div className="space-y-3">
          {(members || []).map((m) => (
            <div key={m.email} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  {m.is_organiser && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                      Organiser
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{m.email}</p>
              </div>
              <a
                href={`mailto:${m.email}`}
                className="text-xs text-emerald-600 font-medium hover:underline shrink-0"
              >
                Email
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { detectConflicts } from '@/lib/conflict-detector'
import { getInitials, getAvatarColor } from '@/lib/utils'
import type { Member } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  in: "I'm in",
  tentative: 'Maybe',
  out: "Can't make it",
}

const STATUS_COLORS: Record<string, string> = {
  in: 'bg-emerald-100 text-emerald-700',
  tentative: 'bg-yellow-100 text-yellow-700',
  out: 'bg-red-100 text-red-700',
}

async function getVibeData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organiser_id', user.id)
    .single()
  if (!trip) return null

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true })

  return { members: (members || []) as Member[] }
}

export default async function VibeCheckPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getVibeData(tripId)
  if (!data) notFound()

  const { members } = data
  const conflicts = detectConflicts(members)
  const vibeComplete = members.filter((m) => m.vibe_completed)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Vibe Check</h1>
        <p className="text-purple-100 text-sm mt-1">Group preference alignment — spot conflicts before planning starts.</p>
      </div>

      {/* Conflict cards */}
      {conflicts.has_conflict && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Conflicts Detected</h2>
          {conflicts.conflicts.map((c, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 capitalize">{c.dimension} conflict</p>
                <p className="text-sm text-amber-700 mt-1">{c.message}</p>
                <span className="inline-block mt-2 text-xs bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full font-medium">
                  {c.dimension === 'budget' ? 'Align budget before booking' : 'Discuss itinerary pace'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!conflicts.has_conflict && vibeComplete.length >= 2 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">No conflicts detected</p>
            <p className="text-sm text-emerald-700 mt-1">Group preferences are aligned. Planning can begin!</p>
          </div>
        </div>
      )}

      {/* Member preferences */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">Member Preferences</h2>
        {members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
            <div className="text-3xl mb-3">👥</div>
            <p className="text-gray-500 text-sm">No members yet. Share the invite link from the Dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((m, i) => (
              <div key={m.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(i)} text-white text-sm flex items-center justify-center font-semibold shrink-0`}>
                    {getInitials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                </div>
                {m.vibe_completed ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.vibe_budget && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{m.vibe_budget}</span>
                    )}
                    {m.vibe_pace && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">{m.vibe_pace}</span>
                    )}
                    {m.vibe_style && (
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full capitalize">{m.vibe_style}</span>
                    )}
                    {m.vibe_accommodation && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full capitalize">{m.vibe_accommodation}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Vibe not submitted yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

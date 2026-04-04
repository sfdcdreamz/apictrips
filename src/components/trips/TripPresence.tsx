'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TripPresence({ tripId, userId }: { tripId: string; userId: string }) {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const channel = supabase.channel(`presence-trip-${tripId}`)
    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId })
        }
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId, userId])

  if (count <= 1) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-stone-200 shadow-md rounded-full px-3 py-1.5 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      <span className="text-xs text-green-600 font-medium">{count} viewing</span>
    </div>
  )
}

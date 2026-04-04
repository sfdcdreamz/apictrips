'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Toast {
  id: string
  message: string
  icon: string
}

interface Props {
  tripId: string
}

export default function ActivityToast({ tripId }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((icon: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev.slice(-3), { id, icon, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`activity-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        () => { addToast('🗳️', 'Someone just voted on a poll') }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const row = payload.new as { description?: string; amount?: number }
          const desc = row.description ? `"${row.description}"` : 'an expense'
          addToast('💰', `New expense logged: ${desc}`)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'members',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as { name?: string; status?: string }
          if (row.status === 'in') {
            addToast('✅', `${row.name ?? 'Someone'} confirmed attendance`)
          } else if (row.status === 'out') {
            addToast('👋', `${row.name ?? 'Someone'} has dropped out`)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId, addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span>{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}

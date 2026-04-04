'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AddActivityForm from './AddActivityForm'
import type { ItineraryItem } from '@/types'

const TYPE_ICONS: Record<string, string> = {
  activity: '🎯',
  meal: '🍽️',
  transport: '🚌',
  stay: '🏨',
}

interface Day {
  dayNumber: number
  date: Date
}

interface Props {
  tripId: string
  days: Day[]
  items: ItineraryItem[]
}

export default function ItineraryClient({ tripId, days, items }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDay, setSelectedDay] = useState(days[0]?.dayNumber || 1)
  const [showAddForm, setShowAddForm] = useState(false)

  const [optimisticItems, updateOptimistic] = useOptimistic(
    items,
    (state: ItineraryItem[], { id, status }: { id: string; status: 'pending' | 'done' }) =>
      state.map((i) => (i.id === id ? { ...i, status } : i))
  )

  const dayItems = optimisticItems
    .filter((i) => i.day_number === selectedDay)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const daySpend = dayItems.reduce((s, i) => s + i.cost, 0)
  const completedCount = dayItems.filter((i) => i.status === 'done').length

  function toggleStatus(item: ItineraryItem) {
    const newStatus = item.status === 'done' ? 'pending' : 'done'
    startTransition(async () => {
      updateOptimistic({ id: item.id, status: newStatus })
      await fetch(`/api/itinerary/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    })
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/itinerary/${itemId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (days.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
        <div className="text-3xl mb-3">📅</div>
        <p className="text-gray-500 text-sm">Trip dates not set.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d.dayNumber}
            onClick={() => { setSelectedDay(d.dayNumber); setShowAddForm(false) }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
              selectedDay === d.dayNumber
                ? 'bg-emerald-600 text-white font-medium'
                : 'bg-white text-gray-600 border border-stone-200 hover:border-emerald-300'
            }`}
          >
            <span className="block font-medium">Day {d.dayNumber}</span>
            <span className="block text-xs opacity-75">
              {d.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {dayItems.length === 0 && !showAddForm && (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-gray-400 text-sm">No activities for Day {selectedDay} yet.</p>
          </div>
        )}

        {dayItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4 transition-all ${
              item.status === 'done' ? 'border-emerald-100 opacity-70' : 'border-stone-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5 shrink-0">{TYPE_ICONS[item.item_type] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.time && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.time}</span>
                    )}
                    {item.cost > 0 && (
                      <span className="text-xs text-gray-500 font-medium">₹{item.cost.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => toggleStatus(item)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      item.status === 'done'
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {item.status === 'done' ? 'Mark pending' : 'Mark done'}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add form or button */}
      {showAddForm ? (
        <AddActivityForm
          tripId={tripId}
          dayNumber={selectedDay}
          onDone={() => { setShowAddForm(false); router.refresh() }}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-white border border-dashed border-emerald-300 rounded-xl p-3 text-sm text-emerald-600 font-medium hover:bg-emerald-50 transition-colors"
        >
          + Add activity for Day {selectedDay}
        </button>
      )}

      {/* Day summary */}
      {dayItems.length > 0 && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 flex items-center justify-between">
          <span className="text-sm text-emerald-700">
            {completedCount}/{dayItems.length} activities completed
          </span>
          {daySpend > 0 && (
            <span className="text-sm font-semibold text-emerald-800">Day spend ₹{daySpend.toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface Props {
  tripId: string
  tripName: string
  members: { name: string }[]
}

export default function TripNav({ tripId, tripName: _tripName, members }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Dashboard', href: `/trips/${tripId}` },
    { label: 'Polls', href: `/trips/${tripId}/polls` },
    { label: 'Expenses', href: `/trips/${tripId}/expenses` },
    { label: 'Vibe Check', href: `/trips/${tripId}/vibe-check` },
    { label: 'Itinerary', href: `/trips/${tripId}/itinerary` },
  ]

  function isActive(href: string) {
    if (href === `/trips/${tripId}`) {
      return pathname === `/trips/${tripId}`
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white border-b border-stone-100 px-4">
      <div className="max-w-5xl mx-auto flex items-center gap-0.5 overflow-x-auto">
        <Link
          href="/dashboard"
          className="text-base font-bold text-gray-900 mr-4 py-4 shrink-0"
        >
          APIcTrips
        </Link>

        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive(tab.href)
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-2 py-3 pl-4 shrink-0">
          <div className="flex -space-x-1.5">
            {members.slice(0, 4).map((m, i) => (
              <div
                key={i}
                title={m.name}
                className={`w-7 h-7 rounded-full ${getAvatarColor(i)} text-white text-xs flex items-center justify-center font-medium ring-2 ring-white`}
              >
                {getInitials(m.name)}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{members.length} members</span>
        </div>
      </div>
    </nav>
  )
}

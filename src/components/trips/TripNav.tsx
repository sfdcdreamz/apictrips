'use client'

import { useState, useEffect } from 'react'
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
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  const tabs = [
    { label: 'Dashboard', href: `/trips/${tripId}` },
    { label: 'Polls', href: `/trips/${tripId}/polls` },
    { label: 'Expenses', href: `/trips/${tripId}/expenses` },
    { label: 'Vibe Check', href: `/trips/${tripId}/vibe-check` },
    { label: 'Itinerary', href: `/trips/${tripId}/itinerary` },
    { label: 'Digest', href: `/trips/${tripId}/digest` },
  ]

  function isActive(href: string) {
    if (href === `/trips/${tripId}`) {
      return pathname === `/trips/${tripId}`
    }
    return pathname.startsWith(href)
  }

  const avatars = (
    <div className="flex items-center gap-2">
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
  )

  return (
    <nav className="bg-white border-b border-stone-100 px-4">
      {/* Mobile header */}
      <div className="md:hidden grid grid-cols-3 items-center py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="text-gray-600 hover:text-gray-900 justify-self-start"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="19" y2="6" />
            <line x1="3" y1="11" x2="19" y2="11" />
            <line x1="3" y1="16" x2="19" y2="16" />
          </svg>
        </button>
        <Link href="/dashboard" className="text-base font-bold text-gray-900 text-center">
          APIcTrips
        </Link>
        <div className="justify-self-end">{avatars}</div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-stone-100 pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className={`block px-2 py-3 text-sm font-medium border-l-2 transition-colors ${
                isActive(tab.href)
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      {/* Desktop layout — unchanged */}
      <div className="hidden md:flex max-w-5xl mx-auto items-center gap-0.5 overflow-x-auto">
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
            prefetch={true}
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
          {avatars}
        </div>
      </div>
    </nav>
  )
}

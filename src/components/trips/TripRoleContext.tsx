'use client'

import { createContext, useContext } from 'react'

interface TripRoleContextValue {
  tripId: string
  isOrganiser: boolean
}

const TripRoleContext = createContext<TripRoleContextValue>({
  tripId: '',
  isOrganiser: false,
})

export function useTripRole() {
  return useContext(TripRoleContext)
}

export default function TripRoleProvider({
  children,
  tripId,
  isOrganiser,
}: {
  children: React.ReactNode
  tripId: string
  isOrganiser: boolean
}) {
  return (
    <TripRoleContext.Provider value={{ tripId, isOrganiser }}>
      {children}
    </TripRoleContext.Provider>
  )
}

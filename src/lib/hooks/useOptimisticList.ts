'use client'

import { useOptimistic, useCallback } from 'react'

type Action<T> =
  | { type: 'add'; item: T }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; patch: Partial<T> }

function reducer<T extends { id: string }>(state: T[], action: Action<T>): T[] {
  switch (action.type) {
    case 'add':
      return [...state, action.item]
    case 'remove':
      return state.filter((item) => item.id !== action.id)
    case 'update':
      return state.map((item) =>
        item.id === action.id ? { ...item, ...action.patch } : item
      )
  }
}

export function useOptimisticList<T extends { id: string }>(initial: T[]) {
  const [optimistic, dispatch] = useOptimistic(initial, reducer<T>)

  const addItem = useCallback((item: T) => dispatch({ type: 'add', item }), [dispatch])
  const removeItem = useCallback((id: string) => dispatch({ type: 'remove', id }), [dispatch])
  const updateItem = useCallback(
    (id: string, patch: Partial<T>) => dispatch({ type: 'update', id, patch }),
    [dispatch]
  )

  return { items: optimistic, addItem, removeItem, updateItem }
}

'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ExpenseCategory, Member, Expense } from '@/types'

const CATEGORIES: ExpenseCategory[] = ['Flights', 'Stay', 'Food', 'Transport', 'Experiences', 'Misc']

interface Props {
  tripId: string
  members?: Pick<Member, 'email' | 'name'>[]
}

export default function LogExpenseForm({ tripId, members = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Misc')
  const [description, setDescription] = useState('')
  const [loggedBy, setLoggedBy] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  // Receipt upload step
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done'>('idle')

  // Optimistic pending rows shown while the API call is in flight
  const [optimisticRows, addOptimisticRow] = useOptimistic(
    [] as Expense[],
    (state: Expense[], row: Expense) => [...state, row]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const optimistic: Expense = {
      id: `temp-${Date.now()}`,
      pool_id: '',
      amount: parseFloat(amount),
      category,
      description,
      logged_by: loggedBy,
      expense_date: date,
      created_at: new Date().toISOString(),
      paid_by: paidBy || null,
    }

    startTransition(async () => {
      addOptimisticRow(optimistic)

      const res = await fetch(`/api/trips/${tripId}/pool/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description,
          logged_by: loggedBy,
          expense_date: date,
          paid_by: paidBy || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      const data = await res.json()
      setCreatedExpenseId(data.expense?.id || null)
      setAmount('')
      setDescription('')
      setLoggedBy('')
      setPaidBy('')
      setDate(new Date().toISOString().split('T')[0])
      setShowForm(false)
      // Don't refresh yet — show receipt upload step if we have an expense id
    })
  }

  function finishAndRefresh() {
    setCreatedExpenseId(null)
    setUploadState('idle')
    router.refresh()
  }

  async function handleReceiptUpload(file: File) {
    if (!createdExpenseId) return
    setUploadState('uploading')
    const formData = new FormData()
    formData.append('receipt', file)
    await fetch(`/api/trips/${tripId}/pool/expenses/${createdExpenseId}/receipt`, {
      method: 'POST',
      body: formData,
    })
    setUploadState('done')
    setTimeout(finishAndRefresh, 800)
  }

  const loading = isPending

  // Receipt upload step — shown after expense is created
  if (createdExpenseId) {
    return (
      <div className="bg-violet-50 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Add a receipt? (optional)</h3>
        {uploadState === 'uploading' && (
          <p className="text-sm text-violet-600">Uploading…</p>
        )}
        {uploadState === 'done' && (
          <p className="text-sm text-emerald-600">Receipt saved ✓</p>
        )}
        {uploadState === 'idle' && (
          <>
            <label className="block w-full cursor-pointer border-2 border-dashed border-violet-200 rounded-xl text-center py-4 text-sm text-violet-600 hover:border-violet-400 transition-colors">
              <span>📷 Tap to attach receipt photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleReceiptUpload(file)
                }}
              />
            </label>
            <button
              type="button"
              onClick={finishAndRefresh}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              Skip
            </button>
          </>
        )}
      </div>
    )
  }

  if (!showForm) {
    return (
      <div className="space-y-2">
        {optimisticRows.map((row) => (
          <div key={row.id} className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 opacity-70">
            <div>
              <p className="text-sm font-medium text-gray-700">{row.description}</p>
              <p className="text-xs text-gray-400">{row.logged_by} · {row.category}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">₹{row.amount.toLocaleString()}</p>
              <p className="text-xs text-violet-500">Saving…</p>
            </div>
          </div>
        ))}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-violet-300 hover:text-violet-600 transition-colors"
        >
          + Log expense
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Log expense</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="8500"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Mumbai → Goa flights"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Logged by</label>
          <input
            type="text"
            required
            value={loggedBy}
            onChange={(e) => setLoggedBy(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {members.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Paid by (for settlement)</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">— optional —</option>
            {members.map((m) => (
              <option key={m.email} value={m.email}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging…' : 'Log expense'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

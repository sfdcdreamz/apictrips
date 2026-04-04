'use client'

import { useState } from 'react'
import { buildUpiLink } from '@/lib/upi'
import { computeNetBalances, computeSettlements } from '@/lib/settlement-calculator'
import type { Expense, Member, Settlement } from '@/types'

interface Props {
  expenses: Expense[]
  members: Pick<Member, 'email' | 'name' | 'upi_id'>[]
  existingSettlements: Settlement[]
  currency: string
  tripId: string
  isOrganiser: boolean
}

export default function SettlementLedger({
  expenses,
  members,
  existingSettlements,
  currency,
  tripId,
  isOrganiser,
}: Props) {
  const [confirming, setConfirming] = useState<string | null>(null)
  const currencySymbol = currency === 'INR' ? '₹' : currency

  const expensesWithPayer = expenses.filter((e) => e.paid_by)
  const balances = computeNetBalances(expensesWithPayer, members)
  const transactions = computeSettlements(expensesWithPayer, members)

  const confirmedIds = new Set(
    existingSettlements.filter((s) => s.status === 'confirmed').map((s) => s.id)
  )

  async function handleConfirm(settlementId: string) {
    setConfirming(settlementId)
    await fetch(`/api/trips/${tripId}/settlements/${settlementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    setConfirming(null)
    window.location.reload()
  }

  if (expensesWithPayer.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Add a "paid by" to expenses to see settlement suggestions.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Net balances */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Net Balances</h3>
        <div className="space-y-2">
          {balances.map((b) => (
            <div key={b.email} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{b.name}</span>
              <span className={`text-sm font-semibold ${
                b.net > 0 ? 'text-emerald-600' : b.net < 0 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {b.net > 0 ? `+${currencySymbol}${b.net.toLocaleString()}` :
                 b.net < 0 ? `-${currencySymbol}${Math.abs(b.net).toLocaleString()}` :
                 'settled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Suggested Settlements</h3>
          <div className="space-y-2">
            {transactions.map((t, i) => {
              const payee = members.find((m) => m.email === t.to_email)
              const upiLink = payee?.upi_id
                ? buildUpiLink({ pa: payee.upi_id, pn: t.to_name, am: t.amount, tn: 'Trip settlement' })
                : null

              // Find matching confirmed settlement
              const matched = existingSettlements.find(
                (s) => s.from_email === t.from_email && s.to_email === t.to_email && s.status === 'confirmed'
              )

              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  matched ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{t.from_name}</span>
                      {' → '}
                      <span className="font-medium">{t.to_name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currencySymbol}{t.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {matched ? (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Confirmed</span>
                    ) : (
                      <>
                        {upiLink && (
                          <a
                            href={upiLink}
                            className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Pay via UPI
                          </a>
                        )}
                        {isOrganiser && (
                          <button
                            onClick={async () => {
                              // Create pending settlement then confirm
                              const res = await fetch(`/api/trips/${tripId}/settlements`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  from_email: t.from_email,
                                  to_email: t.to_email,
                                  amount: t.amount,
                                  currency,
                                }),
                              })
                              const data = await res.json()
                              if (data.settlement) await handleConfirm(data.settlement.id)
                            }}
                            disabled={confirming !== null}
                            className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            Mark paid
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <p className="text-sm text-emerald-600 font-medium text-center py-2">All settled up!</p>
      )}
    </div>
  )
}

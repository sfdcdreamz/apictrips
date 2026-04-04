import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import PoolSetupForm from '@/components/expenses/PoolSetupForm'
import LogExpenseForm from '@/components/expenses/LogExpenseForm'
import ExpenseList from '@/components/expenses/ExpenseList'
import BudgetAlert from '@/components/expenses/BudgetAlert'
import SettlementLedger from '@/components/expenses/SettlementLedger'
import type { Pool, Expense, ExpenseCategory, Member, Settlement } from '@/types'

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Flights: '✈️',
  Stay: '🏨',
  Food: '🍽️',
  Transport: '🚌',
  Experiences: '🎯',
  Misc: '📦',
}

async function getExpensesData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: trip } = await supabase
    .from('trips')
    .select('id, group_size, organiser_id')
    .eq('id', tripId)
    .single()
  if (!trip) return null

  // Allow organisers and members (non-organisers checked via layout)
  const serviceSupabase = createServiceRoleClient()

  const [{ data: pool }, { data: members }, { data: settlements }] = await Promise.all([
    serviceSupabase.from('pools').select('*, expenses(*)').eq('trip_id', tripId).single(),
    serviceSupabase.from('members').select('id, name, email, upi_id').eq('trip_id', tripId),
    serviceSupabase.from('settlements').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
  ])

  return {
    pool: pool as (Pool & { expenses: Expense[] }) | null,
    memberCount: members?.length || 0,
    members: (members || []) as Pick<Member, 'id' | 'name' | 'email' | 'upi_id'>[],
    settlements: (settlements || []) as Settlement[],
    isOrganiser: trip.organiser_id === user.id,
  }
}

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getExpensesData(tripId)
  if (!data) notFound()

  const { pool, memberCount, members, settlements, isOrganiser } = data
  const expenses: Expense[] = pool?.expenses || []
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = (pool?.total_amount || 0) - totalSpent
  const currencySymbol = pool?.currency === 'INR' ? '₹' : (pool?.currency || '')
  const spendPct = pool?.total_amount ? Math.min(100, Math.round((totalSpent / pool.total_amount) * 100)) : 0
  const perMember = pool && memberCount > 0 ? Math.round(pool.per_member_contribution) : 0

  const categories: ExpenseCategory[] = ['Flights', 'Stay', 'Food', 'Transport', 'Experiences', 'Misc']
  const categorySpend = categories.map((cat) => ({
    name: cat,
    spent: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  }))

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expense Pool</h1>
            {pool && (
              <p className="text-orange-100 text-sm mt-1">
                {currencySymbol}{perMember.toLocaleString()} per member · {memberCount} members
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {pool && (
              <div className="bg-white/20 rounded-xl px-4 py-2 text-right">
                <div className="text-xl font-bold">{currencySymbol}{Math.abs(remaining).toLocaleString()}</div>
                <div className="text-xs text-orange-100">{remaining < 0 ? 'over budget' : 'remaining'}</div>
              </div>
            )}
            {isOrganiser && pool && (
              <a
                href={`/api/trips/${tripId}/export/expenses`}
                download
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Download CSV
              </a>
            )}
          </div>
        </div>
      </div>

      {!pool ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <PoolSetupForm tripId={tripId} />
        </div>
      ) : (
        <>
          {/* Budget alert */}
          <BudgetAlert
            spendPct={spendPct}
            currencySymbol={currencySymbol}
            totalSpent={totalSpent}
            totalAmount={pool.total_amount}
          />

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Total Pool</span>
              <span className="font-semibold text-gray-800">{currencySymbol}{pool.total_amount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${spendPct >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${spendPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{currencySymbol}{totalSpent.toLocaleString()} spent</span>
              <span>{spendPct}% used</span>
            </div>
          </div>

          {/* Category breakdown */}
          {totalSpent > 0 && (
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">By Category</h2>
              <div className="space-y-3">
                {categorySpend.filter((c) => c.spent > 0).map((cat) => {
                  const pct = totalSpent > 0 ? Math.round((cat.spent / totalSpent) * 100) : 0
                  const barWidth = pool.total_amount > 0
                    ? Math.min(100, Math.round((cat.spent / pool.total_amount) * 100))
                    : 0
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center shrink-0">
                        {CATEGORY_ICONS[cat.name as ExpenseCategory]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{cat.name}</span>
                          <span className="text-gray-500">{currencySymbol}{cat.spent.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 w-9 text-right shrink-0">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Log expense */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Log an expense</h2>
            <LogExpenseForm tripId={tripId} members={members} />
          </div>

          {/* Recent */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Expenses</h2>
            <ExpenseList expenses={recentExpenses} currency={pool.currency} tripId={tripId} />
          </div>

          {/* Settlement ledger */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Settlement</h2>
            <SettlementLedger
              expenses={expenses}
              members={members}
              existingSettlements={settlements}
              currency={pool.currency}
              tripId={tripId}
              isOrganiser={isOrganiser}
            />
          </div>
        </>
      )}
    </div>
  )
}

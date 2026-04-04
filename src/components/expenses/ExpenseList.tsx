import type { Expense, ExpenseCategory } from '@/types'
import { formatDate } from '@/lib/utils'
import ReceiptButton from './ReceiptButton'

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Flights: 'bg-blue-100 text-blue-700',
  Stay: 'bg-purple-100 text-purple-700',
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-cyan-100 text-cyan-700',
  Experiences: 'bg-emerald-100 text-emerald-700',
  Misc: 'bg-gray-100 text-gray-600',
}

interface Props {
  expenses: Expense[]
  currency: string
  tripId?: string
}

export default function ExpenseList({ expenses, currency, tripId }: Props) {
  if (expenses.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No expenses logged yet.</p>
  }

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
  )

  return (
    <div className="space-y-2">
      {sorted.map((expense) => (
        <div key={expense.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLORS[expense.category]}`}>
            {expense.category}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">{expense.description}</p>
            <p className="text-xs text-gray-400">{expense.logged_by} · {formatDate(expense.expense_date)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-bold text-gray-900">
              {currency === 'INR' ? '₹' : currency}{expense.amount.toLocaleString()}
            </span>
            {tripId && expense.receipt_url && (
              <ReceiptButton tripId={tripId} expenseId={expense.id} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface Props {
  spendPct: number
  currencySymbol: string
  totalSpent: number
  totalAmount: number
}

export default function BudgetAlert({ spendPct, currencySymbol, totalSpent, totalAmount }: Props) {
  if (spendPct < 80) return null

  const isOver = totalSpent > totalAmount

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
      isOver ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <span className="text-lg">{isOver ? '🚨' : '⚠️'}</span>
      <p className={`text-sm font-medium ${isOver ? 'text-red-800' : 'text-amber-800'}`}>
        {isOver
          ? `Over budget by ${currencySymbol}${(totalSpent - totalAmount).toLocaleString()}`
          : `${spendPct}% of budget used — ${currencySymbol}${(totalAmount - totalSpent).toLocaleString()} remaining`}
      </p>
    </div>
  )
}

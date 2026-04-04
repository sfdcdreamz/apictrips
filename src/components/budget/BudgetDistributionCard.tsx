interface Props {
  counts: Record<string, number>
  total: number
}

const RANGE_LABELS: Record<string, string> = {
  'under-5k': 'Under ₹5k',
  '5k-10k': '₹5k – ₹10k',
  '10k-20k': '₹10k – ₹20k',
  '20k-50k': '₹20k – ₹50k',
  'over-50k': 'Over ₹50k',
}

const RANGE_ORDER = ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k']

export default function BudgetDistributionCard({ counts, total }: Props) {
  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Budget Distribution</h2>
        <p className="text-sm text-gray-400">No members have submitted their budget yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Budget Distribution</h2>
        <span className="text-xs text-gray-400">{total} response{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-3">
        {RANGE_ORDER.map((range) => {
          const count = counts[range] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={range}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">{RANGE_LABELS[range]}</span>
                <span className="text-gray-400">{count} · {pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">Individual responses are anonymous.</p>
    </div>
  )
}

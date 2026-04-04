import type { Poll, Expense } from '@/types'

interface TimelineEvent {
  id: string
  timestamp: string
  icon: string
  label: string
  detail: string
  type: 'decision' | 'expense'
}

interface Props {
  polls: Poll[]
  expenses: Expense[]
  currencySymbol: string
}

export default function AgreementTimeline({ polls, expenses, currencySymbol }: Props) {
  const lockedPolls = polls.filter((p) => p.status === 'locked')

  const events: TimelineEvent[] = [
    ...lockedPolls.map((p) => ({
      id: `poll-${p.id}`,
      timestamp: p.created_at,
      icon: '✓',
      label: p.question,
      detail: `→ ${p.winning_option}`,
      type: 'decision' as const,
    })),
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      timestamp: e.created_at,
      icon: '₹',
      label: e.description,
      detail: `${currencySymbol}${e.amount.toLocaleString()} · ${e.category}`,
      type: 'expense' as const,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center">
        <p className="text-gray-400 text-sm">No decisions or expenses yet.</p>
      </div>
    )
  }

  function formatEventDate(ts: string): string {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Group by date
  const byDate = new Map<string, TimelineEvent[]>()
  for (const event of events) {
    const dateKey = formatEventDate(event.timestamp)
    if (!byDate.has(dateKey)) byDate.set(dateKey, [])
    byDate.get(dateKey)!.push(event)
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-5">What We Agreed</h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />

        <div className="space-y-6">
          {Array.from(byDate.entries()).map(([date, dayEvents]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 pl-12">{date}</p>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                      event.type === 'decision'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {event.icon}
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-sm font-medium text-gray-800 leading-snug">{event.label}</p>
                      <p className={`text-xs mt-0.5 ${
                        event.type === 'decision' ? 'text-emerald-600' : 'text-gray-500'
                      }`}>
                        {event.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

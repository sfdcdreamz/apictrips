type Tab = 'group' | 'decisions' | 'expenses'

interface Props {
  activeTab: Tab
  tripId: string
}

export default function TabNav({ activeTab, tripId }: Props) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'group', label: 'Group' },
    { id: 'decisions', label: 'Decisions' },
    { id: 'expenses', label: 'Expenses' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`/trips/${tripId}?tab=${tab.id}`}
            className={`flex-1 text-center py-3 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-violet-600 text-violet-700 font-semibold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  )
}

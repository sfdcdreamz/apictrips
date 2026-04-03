import type { ConflictResult } from '@/types'

export default function ConflictCard({ conflicts }: { conflicts: ConflictResult }) {
  if (!conflicts.has_conflict) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 mt-0.5">⚠️</span>
        <div>
          <div className="text-sm font-semibold text-amber-800 mb-2">Vibe conflicts detected</div>
          <ul className="space-y-1">
            {conflicts.conflicts.map((c, i) => (
              <li key={i} className="text-sm text-amber-700">
                {c.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

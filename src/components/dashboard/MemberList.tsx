import type { Member } from '@/types'
import { getInitials, getAvatarColor } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  in: 'bg-emerald-100 text-emerald-700',
  tentative: 'bg-yellow-100 text-yellow-700',
  out: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  in: "In",
  tentative: "Maybe",
  out: "Out",
}

export default function MemberList({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No members yet. Share the invite link to get started.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member, idx) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${getAvatarColor(idx)}`}
          >
            {getInitials(member.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
              {member.is_organiser && (
                <span className="text-xs text-violet-600 font-medium">Organiser</span>
              )}
            </div>
            <div className="text-xs text-gray-400 truncate">{member.email}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {member.vibe_completed ? (
              <span className="text-xs text-emerald-600">Vibe ✓</span>
            ) : (
              <span className="text-xs text-gray-300">Vibe pending</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[member.status]}`}>
              {STATUS_LABELS[member.status]}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

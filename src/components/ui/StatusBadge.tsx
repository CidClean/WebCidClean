// Cid Clean's status-color system, ported from cidclean-portal: slate for
// early/neutral states, gold for waiting/in-progress, the teal brand accent
// for positive/active states, warm orange for "needs a response", rose for
// negative/terminal states, and plain neutral for archived/superseded.
const SLATE = 'bg-[#dde4ec] text-[#3a4a5c]'
const GOLD = 'bg-[#f5ecd4] text-[#b58a2c]'
const WARM = 'bg-[#fae5d8] text-[#c8541f]'
const ROSE = 'bg-[#f5dde3] text-[#b03a5b]'
const ACCENT = 'bg-blue-100 text-blue-800'
const NEUTRAL = 'bg-gray-200 text-gray-500'
const OVERDUE = 'bg-red-100 text-red-800'

const COLORS: Record<string, string> = {
  prospect: SLATE,
  contacted: GOLD,
  in_process: ACCENT,
  quoted: WARM,
  pending: GOLD,
  active: ACCENT,
  archived: NEUTRAL,
  new: SLATE,
  approved: ACCENT,
  draft: SLATE,
  sent: GOLD,
  changes_requested: WARM,
  declined: ROSE,
  superseded: NEUTRAL,
  paused: GOLD,
  paid: ACCENT,
  void: ROSE,
}

/**
 * `overdue` (finding #16) overrides the normal status color/label with a
 * distinct red-tinted treatment — for a `sent` invoice past its due_date,
 * so it doesn't look identical to a non-overdue "sent" everywhere the
 * status is shown.
 */
export function StatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  const classes = overdue ? OVERDUE : COLORS[status] ?? SLATE
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {overdue ? 'overdue' : status.replace(/_/g, ' ')}
    </span>
  )
}

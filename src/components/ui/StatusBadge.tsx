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

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? SLATE
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

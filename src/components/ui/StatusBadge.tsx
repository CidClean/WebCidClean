const COLORS: Record<string, string> = {
  prospect: 'bg-gray-100 text-gray-700',
  contacted: 'bg-yellow-100 text-yellow-800',
  in_process: 'bg-blue-100 text-blue-800',
  quoted: 'bg-purple-100 text-purple-800',
  pending: 'bg-orange-100 text-orange-800',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-200 text-gray-500',
  new: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  changes_requested: 'bg-yellow-100 text-yellow-800',
  declined: 'bg-red-100 text-red-800',
  superseded: 'bg-gray-200 text-gray-500',
  paused: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  void: 'bg-gray-200 text-gray-500',
}

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

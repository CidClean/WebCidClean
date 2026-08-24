import type { ReactNode } from 'react'

export function ArchivedSection({
  count,
  label = 'Archived',
  children,
}: {
  count: number
  label?: string
  children: ReactNode
}) {
  if (count === 0) return null
  return (
    <details className="bg-white rounded-lg border border-gray-200">
      <summary className="p-4 text-sm font-medium text-gray-600 cursor-pointer select-none">
        {label} ({count})
      </summary>
      <div className="divide-y divide-gray-100 border-t border-gray-200">{children}</div>
    </details>
  )
}

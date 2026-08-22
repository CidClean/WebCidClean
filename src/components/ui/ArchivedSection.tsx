import type { ReactNode } from 'react'

export function ArchivedSection({ count, children }: { count: number; children: ReactNode }) {
  if (count === 0) return null
  return (
    <details className="bg-white rounded border border-gray-200">
      <summary className="p-4 text-sm font-medium text-gray-600 cursor-pointer select-none">
        Archived ({count})
      </summary>
      <div className="divide-y divide-gray-100 border-t border-gray-200">{children}</div>
    </details>
  )
}

import type { ReactNode } from 'react'

function initialsOf(title: string): string {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export function SummaryCard({
  title,
  subtitle,
  status,
  stats,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  status?: ReactNode
  stats?: { label: string; value: string }[]
  actions?: ReactNode
}) {
  return (
    <div className="w-full sm:w-52 shrink-0 bg-white rounded border border-gray-200 p-4 text-center space-y-3">
      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 font-semibold flex items-center justify-center mx-auto text-sm">
        {initialsOf(title)}
      </div>
      <div>
        <div className="font-medium text-gray-900 break-words">{title}</div>
        {subtitle && <div className="text-sm text-gray-500 break-words">{subtitle}</div>}
      </div>
      {status && <div className="flex justify-center">{status}</div>}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-semibold text-gray-900 text-sm">{s.value}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {actions && <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">{actions}</div>}
    </div>
  )
}

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
    <div className="w-full sm:w-56 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-blue-700 to-blue-600 px-4 pt-5 pb-6 text-center text-white">
        <div className="w-12 h-12 rounded-full bg-white/15 ring-1 ring-white/30 font-semibold flex items-center justify-center mx-auto text-sm">
          {initialsOf(title)}
        </div>
        <div className="mt-2.5">
          <div className="font-serif italic text-lg break-words leading-tight">{title}</div>
          {subtitle && <div className="text-xs text-white/80 break-words mt-0.5">{subtitle}</div>}
        </div>
        {status && <div className="flex justify-center mt-2.5">{status}</div>}
      </div>
      <div className="p-4 text-center space-y-3">
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-semibold text-gray-900 text-sm">{s.value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {actions && (
          <div className={`flex flex-col gap-2 ${stats && stats.length > 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'

export function HeroCard({
  label,
  title,
  subtitle,
  action,
}: {
  label: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl p-5 text-white mb-4 bg-gradient-to-br from-blue-700 to-blue-600">
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</div>
      <div className="font-serif italic text-2xl mt-0.5">{title}</div>
      {subtitle && <div className="text-sm opacity-90 mt-0.5">{subtitle}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

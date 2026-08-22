import type { ReactNode } from 'react'

export function ListToolbar({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-gray-900">
        {title} {typeof count === 'number' && <span className="text-gray-400 font-normal">· {count}</span>}
      </h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

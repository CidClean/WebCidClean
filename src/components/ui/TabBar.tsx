import { TabIcon, type TabIconName } from '../layout/TabIcons'

export interface TabDef<T extends string> {
  value: T
  label: string
  icon: TabIconName
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[]
  active: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors [&>svg]:w-4 [&>svg]:h-4 ${
            active === t.value
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TabIcon name={t.icon} />
          {t.label}
        </button>
      ))}
    </div>
  )
}

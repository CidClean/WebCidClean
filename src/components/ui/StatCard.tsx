export function StatCard({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="bg-white rounded border border-gray-200 p-4">
      <div className={`text-2xl font-semibold ${warn ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  )
}

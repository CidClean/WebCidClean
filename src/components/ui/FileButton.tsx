import type { ChangeEvent, ReactNode } from 'react'

export function FileButton({
  onChange,
  disabled,
  accept,
  multiple,
  resetKey,
  children,
}: {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  accept?: string
  multiple?: boolean
  resetKey?: number
  children: ReactNode
}) {
  return (
    <label
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
      <input
        key={resetKey}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  )
}

import type { ReactNode } from 'react'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(23,161,147,0.10),transparent)]"
      />
      <div className="w-full max-w-sm">
        <img src="/images/logo.png" alt="Cid Clean" className="h-16 w-auto mx-auto mb-6" />
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-4">{children}</div>
      </div>
    </div>
  )
}

import { useLocation, useNavigate } from 'react-router-dom'

/**
 * A "back" link that follows how the user actually got here (via SPA
 * in-app history) instead of a hardcoded parent route. Falls back to `to`
 * only when there's no in-app history to go back to (e.g. the page was
 * opened directly via URL or reloaded) — `location.key` is 'default' only
 * on that initial entry.
 */
export function BackLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'

  return (
    <button
      type="button"
      onClick={() => (canGoBack ? navigate(-1) : navigate(to))}
      className="text-sm text-blue-600 hover:underline"
    >
      &larr; {label}
    </button>
  )
}

import { supabase } from './supabase'

// Temporary diagnostic instrumentation for the "reload bounces to /login,
// then Dashboard" bug — three prior fixes targeted plausible mechanisms
// (auth event race, getSession/onAuthStateChange ordering) but Supabase's
// own request logs showed no auth network activity during a reproduced
// bounce, ruling both out. This records the exact in-app state at the
// moment a redirect decision fires, so the next reproduction gives a
// direct answer instead of another guess. Safe to remove once root-caused.
export function logDebugEvent(event: string, detail: Record<string, unknown> = {}): void {
  void supabase
    .from('debug_events')
    .insert({
      event,
      detail: { ...detail, path: window.location.pathname, href: window.location.href, ts: new Date().toISOString() },
    })
    .then(() => {})
}

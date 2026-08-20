/**
 * Rounds a dollar amount down to the nearest cent. Used for even-split
 * suggestions so the sum of N shares can never exceed the total being split —
 * rounding up (the default with toFixed) can push the sum a cent over,
 * which then gets rejected by the exact budget check server-side.
 */
export function floorToCents(value: number): number {
  return Math.floor(value * 100 + 1e-9) / 100
}

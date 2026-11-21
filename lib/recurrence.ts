import type { RecurringFrequency } from '@/types/app'

/** Upper bound on occurrences per plan (e.g. a daily plan of ~2.7 years). */
export const MAX_OCCURRENCES = 1000

type Ymd = { y: number; m: number; d: number } // m is 0-based

function parse(date: string): Ymd {
  const [y, m, d] = date.split('-').map(Number)
  return { y, m: m - 1, d }
}

function format({ y, m, d }: Ymd): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
}

function addDays(start: Ymd, days: number): Ymd {
  const t = new Date(Date.UTC(start.y, start.m, start.d + days))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() }
}

function addMonths(start: Ymd, months: number): Ymd {
  const total = start.m + months
  const y = start.y + Math.floor(total / 12)
  const m = ((total % 12) + 12) % 12
  // Clamp to the month's last day so Jan 31 → Feb 28 → Mar 31 (no drift).
  return { y, m, d: Math.min(start.d, daysInMonth(y, m)) }
}

/**
 * Date (YYYY-MM-DD) of the 1-based occurrence `n` of a schedule starting at `start`.
 * Always computed from the start date, never from the previous occurrence.
 */
export function occurrenceDate(start: string, frequency: RecurringFrequency, n: number): string {
  const s = parse(start)
  const i = n - 1
  switch (frequency) {
    case 'daily':    return format(addDays(s, i))
    case 'weekly':   return format(addDays(s, i * 7))
    case 'biweekly': return format(addDays(s, i * 14))
    case 'monthly':  return format(addMonths(s, i))
    case 'yearly':   return format(addMonths(s, i * 12))
  }
}

/**
 * Number of occurrences between start and end (inclusive).
 * Stops counting once `limit` is exceeded, so callers can detect oversized plans cheaply.
 */
export function occurrenceCount(
  start: string,
  end: string,
  frequency: RecurringFrequency,
  limit = MAX_OCCURRENCES,
): number {
  if (end < start) return 0
  let n = 0
  while (n <= limit && occurrenceDate(start, frequency, n + 1) <= end) n++
  return n
}

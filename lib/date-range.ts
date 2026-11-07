export type DateRange = { fromDate: string; toDate: string }
export type DateDraft = { startDate?: Date; endDate?: Date }

export type DateRangePreset = 'this_month' | 'last_month' | 'last_30_days' | 'this_year'

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_year', label: 'This year' },
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Formats a Date as a local `YYYY-MM-DD` string (no UTC shift). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parses a `YYYY-MM-DD` string as a local date (`new Date('YYYY-MM-DD')` would be UTC). */
export function fromISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function presetRange(preset: DateRangePreset, today: Date = new Date()): DateRange {
  const y = today.getFullYear()
  const m = today.getMonth()
  switch (preset) {
    case 'this_month':
      return { fromDate: toISODate(new Date(y, m, 1)), toDate: toISODate(new Date(y, m + 1, 0)) }
    case 'last_month':
      return { fromDate: toISODate(new Date(y, m - 1, 1)), toDate: toISODate(new Date(y, m, 0)) }
    case 'last_30_days':
      return { fromDate: toISODate(new Date(y, m, today.getDate() - 29)), toDate: toISODate(today) }
    case 'this_year':
      return { fromDate: `${y}-01-01`, toDate: `${y}-12-31` }
  }
}

export function matchPreset(range: DateRange, today: Date = new Date()): DateRangePreset | null {
  const match = DATE_RANGE_PRESETS.find(({ value }) => {
    const candidate = presetRange(value, today)
    return candidate.fromDate === range.fromDate && candidate.toDate === range.toDate
  })
  return match?.value ?? null
}

export function formatRangeLabel(range: DateRange, today: Date = new Date()): string {
  const preset = matchPreset(range, today)
  if (preset) return DATE_RANGE_PRESETS.find((p) => p.value === preset)!.label

  const from = fromISODate(range.fromDate)
  const to = fromISODate(range.toDate)
  const sameYear = from.getFullYear() === to.getFullYear()
  const short = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const long = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (range.fromDate === range.toDate) return long.format(from)
  return `${sameYear ? short.format(from) : long.format(from)} – ${long.format(to)}`
}

import {
  addMonths as dateFnsAddMonths,
  differenceInCalendarMonths,
  format,
  parseISO,
} from 'date-fns'

export type MonthString = string // "YYYY-MM"

export function currentMonth(date: Date = new Date()): MonthString {
  return format(date, 'yyyy-MM')
}

function parseMonth(month: MonthString): Date {
  return parseISO(`${month}-01`)
}

export function addMonths(month: MonthString, delta: number): MonthString {
  return format(dateFnsAddMonths(parseMonth(month), delta), 'yyyy-MM')
}

export function compareMonths(a: MonthString, b: MonthString): number {
  return a.localeCompare(b)
}

/** Contiguous ascending list of month strings from startMonth to endMonth, inclusive. */
export function enumerateMonths(startMonth: MonthString, endMonth: MonthString): MonthString[] {
  if (compareMonths(startMonth, endMonth) > 0) return []
  const months: MonthString[] = []
  let cursor = startMonth
  while (compareMonths(cursor, endMonth) <= 0) {
    months.push(cursor)
    cursor = addMonths(cursor, 1)
  }
  return months
}

/** Calendar months between two ISO dates (toDate - fromDate). Can be 0 or negative. */
export function monthsBetween(fromDateIso: string, toDateIso: string): number {
  return differenceInCalendarMonths(parseISO(toDateIso), parseISO(fromDateIso))
}

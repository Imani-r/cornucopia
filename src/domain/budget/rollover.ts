import { compareMonths, type MonthString } from '../shared/month'

export interface BudgetOverride {
  effectiveMonth: MonthString
  amount: number
}

export interface LedgerEntry {
  month: MonthString
  baseBudget: number
  rolloverIn: number
  effectiveBudget: number
  actualSpend: number
  rolloverOut: number
  /** false when no transaction row exists for this month at all (distinct from a logged $0). */
  logged: boolean
}

/** The base budget in effect for `month`: the most recent override at or before it, else 0. */
export function getEffectiveBaseBudget(overrides: BudgetOverride[], month: MonthString): number {
  let result = 0
  for (const override of overrides) {
    if (compareMonths(override.effectiveMonth, month) <= 0) {
      result = override.amount
    } else {
      break
    }
  }
  return result
}

/**
 * Computes, per month, the effective budget (base + rollover-in), actual spend, and
 * rollover-out to the next month. `months` must be contiguous and ascending, starting
 * at the category's first tracked month (so rollover-in implicitly starts at 0).
 *
 * Deficits and surpluses compound unclamped across consecutive months by design —
 * an overspent month reduces the following month's effective budget, with no floor.
 */
export function computeBudgetLedger(
  months: MonthString[],
  overrides: BudgetOverride[],
  actualsByMonth: Record<MonthString, number | undefined>,
  resetMonths: ReadonlySet<MonthString> = new Set(),
): LedgerEntry[] {
  const sortedOverrides = [...overrides].sort((a, b) => compareMonths(a.effectiveMonth, b.effectiveMonth))

  let rolloverIn = 0
  const ledger: LedgerEntry[] = []

  for (const month of months) {
    if (resetMonths.has(month)) {
      rolloverIn = 0
    }

    const baseBudget = getEffectiveBaseBudget(sortedOverrides, month)
    const effectiveBudget = baseBudget + rolloverIn
    const logged = actualsByMonth[month] !== undefined
    const actualSpend = actualsByMonth[month] ?? 0
    const rolloverOut = effectiveBudget - actualSpend

    ledger.push({ month, baseBudget, rolloverIn, effectiveBudget, actualSpend, rolloverOut, logged })
    rolloverIn = rolloverOut
  }

  return ledger
}

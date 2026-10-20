import { useLiveQuery } from 'dexie-react-hooks'
import { listBudgetOverrides } from '../db/repositories/budgetOverrideRepo'
import { listTransactionsForCategory, sumActualsByMonth } from '../db/repositories/transactionRepo'
import { compareMonths, currentMonth, enumerateMonths } from '../domain/shared/month'
import { computeBudgetLedger, type LedgerEntry } from '../domain/budget/rollover'

/** Full month-by-month ledger for one category, from its first tracked month through the current month. */
export function useBudgetLedger(categoryId: string | undefined): LedgerEntry[] | undefined {
  return useLiveQuery(async () => {
    if (!categoryId) return []

    const [transactions, overrides] = await Promise.all([
      listTransactionsForCategory(categoryId),
      listBudgetOverrides(categoryId),
    ])

    // Rollover starts in the first month that has a budget. Spending logged before that has no
    // budget to measure against, so it must not create a deficit that carries forward.
    if (overrides.length === 0) return []

    const actualsByMonth = sumActualsByMonth(transactions)
    const candidateMonths = [...overrides.map((o) => o.effectiveMonth), ...Object.keys(actualsByMonth)]

    const firstMonth = overrides.map((o) => o.effectiveMonth).reduce((min, m) => (compareMonths(m, min) < 0 ? m : min))
    const lastCandidateMonth = candidateMonths.reduce((max, m) => (compareMonths(m, max) > 0 ? m : max))
    const now = currentMonth()
    const endMonth = compareMonths(now, lastCandidateMonth) > 0 ? now : lastCandidateMonth

    const months = enumerateMonths(firstMonth, endMonth)
    return computeBudgetLedger(months, overrides, actualsByMonth)
  }, [categoryId])
}

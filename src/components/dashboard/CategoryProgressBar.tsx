import type { Category } from '../../db/schema'
import { currentMonth } from '../../domain/shared/month'
import { formatCurrency } from '../../domain/shared/money'
import { useBudgetLedger } from '../../hooks/useBudgetLedger'

export function CategoryProgressBar({ category }: { category: Category }) {
  const ledger = useBudgetLedger(category.id)

  if (!ledger) return <div className="h-16 rounded-lg border border-slate-200 bg-white" />

  const entry = ledger.find((e) => e.month === currentMonth())
  if (!entry) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
        <span className="font-medium text-slate-900">{category.name}</span>
        <span className="text-sm text-slate-400">No budget set</span>
      </div>
    )
  }

  // A negative effective budget (deficit carried in exceeds this month's budget) is over budget
  // before any spending, so it gets a full bar rather than an empty one.
  const overBudget = entry.actualSpend > entry.effectiveBudget
  const pctRaw = entry.effectiveBudget > 0 ? (entry.actualSpend / entry.effectiveBudget) * 100 : overBudget ? 100 : 0
  const pct = Math.min(Math.max(pctRaw, 0), 100)
  const barColorClass = overBudget ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="font-medium text-slate-900">{category.name}</span>
        <span className="text-sm text-slate-500">
          {formatCurrency(entry.actualSpend)} / {formatCurrency(entry.effectiveBudget)}
          {entry.rolloverIn !== 0 && (
            <span className={entry.rolloverIn > 0 ? 'ml-1 text-emerald-600' : 'ml-1 text-red-600'}>
              ({entry.rolloverIn > 0 ? '+' : ''}
              {formatCurrency(entry.rolloverIn)} rollover)
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${barColorClass}`} style={{ width: `${pct}%` }} />
      </div>
      {!entry.logged && <p className="mt-1 text-xs text-amber-600">Not logged yet this month</p>}
    </div>
  )
}

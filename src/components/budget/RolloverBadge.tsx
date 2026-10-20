import { formatCurrency } from '../../domain/shared/money'

/** Escalating visual weight for overspend, per the plan's "no silent floor at zero" rule. */
export function RolloverBadge({ amount }: { amount: number }) {
  if (amount === 0) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        {formatCurrency(0)}
      </span>
    )
  }

  if (amount > 0) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        +{formatCurrency(amount)}
      </span>
    )
  }

  const magnitude = Math.abs(amount)
  const severityClass =
    magnitude > 500 ? 'bg-red-200 text-red-800' : magnitude > 100 ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClass}`}>{formatCurrency(amount)}</span>
  )
}

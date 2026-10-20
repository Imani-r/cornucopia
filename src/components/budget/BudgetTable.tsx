import { useBudgetLedger } from '../../hooks/useBudgetLedger'
import { formatCurrency } from '../../domain/shared/money'
import { RolloverBadge } from './RolloverBadge'

export function BudgetTable({ categoryId }: { categoryId: string }) {
  const ledger = useBudgetLedger(categoryId)

  if (!ledger) return <p className="text-sm text-slate-400">Loading…</p>
  if (ledger.length === 0) return <p className="text-sm text-slate-400">No months logged yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-400 uppercase">
            <th className="py-1.5 pr-2">Month</th>
            <th className="py-1.5 pr-2">Base</th>
            <th className="py-1.5 pr-2">Rollover in</th>
            <th className="py-1.5 pr-2">Effective budget</th>
            <th className="py-1.5 pr-2">Actual</th>
            <th className="py-1.5 pr-2">Rollover out</th>
          </tr>
        </thead>
        <tbody>
          {[...ledger].reverse().map((entry) => (
            <tr key={entry.month} className="border-b border-slate-100">
              <td className="py-1.5 pr-2 font-medium">{entry.month}</td>
              <td className="py-1.5 pr-2 text-slate-500">{formatCurrency(entry.baseBudget)}</td>
              <td className="py-1.5 pr-2 text-slate-500">{formatCurrency(entry.rolloverIn)}</td>
              <td className="py-1.5 pr-2">{formatCurrency(entry.effectiveBudget)}</td>
              <td className="py-1.5 pr-2">
                {entry.logged ? formatCurrency(entry.actualSpend) : <span className="text-amber-600 italic">not logged</span>}
              </td>
              <td className="py-1.5 pr-2">
                <RolloverBadge amount={entry.rolloverOut} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { CategoryProgressBar } from '../components/dashboard/CategoryProgressBar'
import { useCategories } from '../hooks/useCategories'

export function DashboardPage() {
  const categories = useCategories()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">This month</h2>
        <Link to="/budget" className="text-sm text-slate-500 underline">
          Full ledger &amp; monthly entry →
        </Link>
      </div>

      {categories === undefined && <p className="text-sm text-slate-400">Loading…</p>}
      {categories?.length === 0 && (
        <p className="text-sm text-slate-400">
          No categories yet — head to{' '}
          <Link to="/import" className="underline">
            Import
          </Link>{' '}
          or the{' '}
          <Link to="/budget" className="underline">
            Budget
          </Link>{' '}
          page to add one.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {categories?.map((category) => <CategoryProgressBar key={category.id} category={category} />)}
      </div>
    </div>
  )
}

import type { Category } from '../../db/schema'
import { BudgetTable } from './BudgetTable'
import { MonthlyEntryForm } from './MonthlyEntryForm'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-slate-900">{category.name}</h3>
      <MonthlyEntryForm categoryId={category.id} />
      <div className="mt-4">
        <BudgetTable categoryId={category.id} />
      </div>
    </div>
  )
}

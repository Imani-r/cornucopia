import { CategoryCard } from '../components/budget/CategoryCard'
import { CategoryForm } from '../components/budget/CategoryForm'
import { useCategories } from '../hooks/useCategories'

export function BudgetPage() {
  const categories = useCategories()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Budget vs Actual</h2>
      <CategoryForm />

      {categories === undefined && <p className="text-sm text-slate-400">Loading…</p>}
      {categories?.length === 0 && (
        <p className="text-sm text-slate-400">No categories yet — add one above to get started.</p>
      )}

      <div className="flex flex-col gap-4">
        {categories?.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}

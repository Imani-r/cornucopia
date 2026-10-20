import { useState, type FormEvent } from 'react'
import { createCategory } from '../../db/repositories/categoryRepo'
import { setBudgetOverride } from '../../db/repositories/budgetOverrideRepo'
import { currentMonth } from '../../domain/shared/month'

export function CategoryForm() {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (!name.trim() || Number.isNaN(parsedAmount)) return

    setSubmitting(true)
    try {
      const category = await createCategory({ name: name.trim() })
      await setBudgetOverride({ categoryId: category.id, effectiveMonth: currentMonth(), amount: parsedAmount })
      setName('')
      setAmount('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500" htmlFor="category-name">
          Category name
        </label>
        <input
          id="category-name"
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Shopping"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500" htmlFor="category-budget">
          Monthly budget
        </label>
        <input
          id="category-budget"
          type="number"
          step="0.01"
          className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Add category
      </button>
    </form>
  )
}

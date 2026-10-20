import { useState, type FormEvent } from 'react'
import { setMonthlyLumpSum } from '../../db/repositories/transactionRepo'
import { currentMonth } from '../../domain/shared/month'

export function MonthlyEntryForm({ categoryId }: { categoryId: string }) {
  const [month, setMonth] = useState(currentMonth())
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount)) return

    setSubmitting(true)
    try {
      await setMonthlyLumpSum({ categoryId, month, amount: parsedAmount })
      setAmount('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500" htmlFor={`month-${categoryId}`}>
          Month
        </label>
        <input
          id={`month-${categoryId}`}
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500" htmlFor={`amount-${categoryId}`}>
          Actual spend
        </label>
        <input
          id={`amount-${categoryId}`}
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
          placeholder="0.00"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        Log month
      </button>
    </form>
  )
}

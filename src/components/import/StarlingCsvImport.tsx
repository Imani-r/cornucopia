import Papa from 'papaparse'
import { useMemo, useState, type ChangeEvent } from 'react'
import { getCategoryMappings, saveCategoryMappings } from '../../db/repositories/categoryMappingRepo'
import { findExistingImportKeys, importItemizedTransactions } from '../../db/repositories/transactionRepo'
import { SKIP_MAPPING } from '../../db/schema'
import {
  matchCategory,
  toStarlingTransactions,
  type ParsedStarlingTransaction,
  type StarlingCsvRow,
} from '../../domain/importers/starlingCsv'
import { formatCurrency } from '../../domain/shared/money'
import { useCategories } from '../../hooks/useCategories'

interface CategorySummary {
  spendingCategory: string
  count: number
  total: number
}

type ImportResult = { added: number; budgeted: number; alreadyImported: number }

export function StarlingCsvImport() {
  const categories = useCategories()
  const [transactions, setTransactions] = useState<ParsedStarlingTransaction[]>([])
  const [alreadyImported, setAlreadyImported] = useState<Set<string>>(new Set())
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [unsavedCategories, setUnsavedCategories] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'importing' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Rows already stored from an earlier, overlapping export are left out entirely.
  const newTransactions = useMemo(
    () => transactions.filter((t) => !alreadyImported.has(t.importKey)),
    [transactions, alreadyImported],
  )
  // Only spending needs a budget category; money in is stored as-is.
  const newSpending = useMemo(() => newTransactions.filter((t) => t.direction === 'out'), [newTransactions])

  const summaries: CategorySummary[] = useMemo(() => {
    const byCategory = new Map<string, CategorySummary>()
    for (const t of newSpending) {
      const existing = byCategory.get(t.spendingCategory)
      if (existing) {
        existing.count += 1
        existing.total += t.amount
      } else {
        byCategory.set(t.spendingCategory, { spendingCategory: t.spendingCategory, count: 1, total: t.amount })
      }
    }
    return [...byCategory.values()].sort((a, b) => b.total - a.total)
  }, [newSpending])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setStatus('idle')
    setError(null)
    setResult(null)

    const parsed = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: true })
    if (parsed.errors.length > 0) {
      setError(`Couldn't parse CSV: ${parsed.errors[0].message}`)
      return
    }

    const rows: StarlingCsvRow[] = parsed.data
      .map((r) => ({
        date: r['Date'],
        counterParty: r['Counter Party'],
        reference: r['Reference'],
        amount: Number(r['Amount (GBP)']),
        balance: r['Balance (GBP)'],
        spendingCategory: r['Spending Category'],
      }))
      .filter((r) => r.date && r.counterParty && !Number.isNaN(r.amount))

    if (rows.length === 0) {
      setError("No usable rows found — expected Starling's CSV export columns (Date, Counter Party, Amount (GBP), Spending Category).")
      return
    }

    const parsedTransactions = toStarlingTransactions(rows)
    const [existingKeys, saved] = await Promise.all([
      findExistingImportKeys(parsedTransactions.map((t) => t.importKey)),
      getCategoryMappings(),
    ])

    // A saved choice wins over the automatic guess, as long as it still points at a real category.
    const categoryIds = new Set((categories ?? []).map((c) => c.id))
    const appCategoryNames = (categories ?? []).map((c) => c.name)
    const initialMapping: Record<string, string> = {}
    const unsaved = new Set<string>()
    for (const t of parsedTransactions) {
      if (t.direction !== 'out' || t.spendingCategory in initialMapping) continue
      const savedTarget = saved[t.spendingCategory]
      if (savedTarget === SKIP_MAPPING || (savedTarget && categoryIds.has(savedTarget))) {
        initialMapping[t.spendingCategory] = savedTarget
        continue
      }
      const matchedName = matchCategory(t.spendingCategory, appCategoryNames)
      initialMapping[t.spendingCategory] = categories?.find((c) => c.name === matchedName)?.id ?? SKIP_MAPPING
      unsaved.add(t.spendingCategory)
    }

    setTransactions(parsedTransactions)
    setAlreadyImported(existingKeys)
    setMapping(initialMapping)
    setUnsavedCategories(unsaved)
  }

  function updateMapping(spendingCategory: string, target: string) {
    setMapping((prev) => ({ ...prev, [spendingCategory]: target }))
  }

  function budgetCategoryFor(t: ParsedStarlingTransaction): string | undefined {
    if (t.direction !== 'out') return undefined
    const target = mapping[t.spendingCategory]
    return target && target !== SKIP_MAPPING ? target : undefined
  }

  async function handleImport() {
    setStatus('importing')
    await saveCategoryMappings(mapping)

    const { added } = await importItemizedTransactions(
      newTransactions.map((t) => ({
        categoryId: budgetCategoryFor(t),
        date: t.date,
        amount: t.amount,
        direction: t.direction,
        merchant: t.merchant,
        bankCategory: t.spendingCategory,
        importKey: t.importKey,
      })),
    )

    setResult({
      added,
      budgeted: newTransactions.filter((t) => budgetCategoryFor(t) !== undefined).length,
      alreadyImported: alreadyImported.size,
    })
    setUnsavedCategories(new Set())
    setStatus('done')
  }

  const moneyInCount = newTransactions.length - newSpending.length

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-base font-semibold text-slate-900">Import Starling transactions (CSV)</h3>
      <p className="mb-3 text-sm text-slate-500">
        Overlapping exports are fine: transactions you've already imported are skipped. Your category choices are
        remembered for next time.
      </p>

      <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {transactions.length > 0 && status !== 'done' && (
        <p className="mt-3 text-sm text-slate-600">
          {newTransactions.length === 0 ? (
            <>Nothing new: all {transactions.length} transactions in this file were already imported.</>
          ) : (
            <>
              {newTransactions.length} new: {newSpending.length} spending, {moneyInCount} money in
              {alreadyImported.size > 0 && <>. {alreadyImported.size} already imported</>}.
            </>
          )}
        </p>
      )}

      {newTransactions.length > 0 && status !== 'done' && (
        <>
          {summaries.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <p className="mb-1 text-xs text-slate-500">Which budget does each kind of spending count against?</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-400 uppercase">
                    <th className="py-1.5 pr-2">Starling category</th>
                    <th className="py-1.5">Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.spendingCategory} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2">
                        <span className="font-medium">{s.spendingCategory}</span>
                        {unsavedCategories.has(s.spendingCategory) && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1 text-xs text-amber-700">check</span>
                        )}
                        <div className="text-xs text-slate-400">
                          {s.count} {s.count === 1 ? 'transaction' : 'transactions'} · {formatCurrency(s.total)}
                        </div>
                      </td>
                      <td className="py-1.5">
                        <select
                          value={mapping[s.spendingCategory] ?? SKIP_MAPPING}
                          onChange={(e) => updateMapping(s.spendingCategory, e.target.value)}
                          className="w-full max-w-44 rounded border border-slate-300 px-1 py-0.5"
                        >
                          <option value={SKIP_MAPPING}>No budget</option>
                          {categories?.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={status === 'importing'}
            className="mt-4 rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === 'importing' ? 'Importing…' : `Import ${newTransactions.length} transactions`}
          </button>
        </>
      )}

      {result && (
        <p className="mt-3 text-sm text-emerald-600">
          Added {result.added} transactions, {result.budgeted} of them counted against a budget.
          {result.alreadyImported > 0 && <> {result.alreadyImported} were already imported.</>}
        </p>
      )}
    </div>
  )
}

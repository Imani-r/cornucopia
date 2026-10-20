import { useState, type ChangeEvent } from 'react'
import { setBudgetOverride } from '../../db/repositories/budgetOverrideRepo'
import { createCategory } from '../../db/repositories/categoryRepo'
import { currentMonth } from '../../domain/shared/month'
import { formatCurrency } from '../../domain/shared/money'
import { extractCategoryBudgets, type CategoryBudgetRow } from '../../domain/importers/excelCategoryImport'
import { useCategories } from '../../hooks/useCategories'

export function ExcelCategoryImport() {
  const existingCategories = useCategories()
  // Each sheet as rows of cell values, keyed by sheet name (in workbook order).
  const [sheets, setSheets] = useState<Record<string, unknown[][]> | null>(null)
  const [sheetName, setSheetName] = useState<string>('')
  const [rows, setRows] = useState<CategoryBudgetRow[]>([])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'importing' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [effectiveMonth, setEffectiveMonth] = useState(currentMonth())

  function loadSheet(allSheets: Record<string, unknown[][]>, name: string) {
    const found = extractCategoryBudgets(allSheets[name] ?? [])
    setSheetName(name)
    setRows(found)
    setExcluded(new Set())
    setError(found.length === 0 ? 'No "Categories"/"Amount" table found on this sheet.' : null)
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('idle')
    // The spreadsheet library is large and only needed here, so it loads on first use.
    const XLSX = await import('xlsx')
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const allSheets = Object.fromEntries(
      wb.SheetNames.map((name) => [name, XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: undefined })]),
    )
    setSheets(allSheets)
    const defaultSheet = wb.SheetNames.find((n) => n.toLowerCase() !== 'scratchpad') ?? wb.SheetNames[0]
    loadSheet(allSheets, defaultSheet)
  }

  function toggleRow(name: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function handleImport() {
    setStatus('importing')
    const existingByName = new Map((existingCategories ?? []).map((c) => [c.name.toLowerCase(), c]))

    for (const row of rows) {
      if (excluded.has(row.name)) continue
      const existing = existingByName.get(row.name.toLowerCase())
      const categoryId = existing ? existing.id : (await createCategory({ name: row.name })).id
      await setBudgetOverride({ categoryId, effectiveMonth, amount: row.amount })
    }

    setStatus('done')
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-base font-semibold text-slate-900">Import categories &amp; budgets from Excel</h3>
      <p className="mb-3 text-sm text-slate-500">
        Reads a "Categories" / "Amount" table from a sheet (e.g. your Starling budget table) and creates or updates
        matching categories with those monthly budgets, starting from the month you choose.
      </p>

      <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="text-sm" />

      {sheets && Object.keys(sheets).length > 1 && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <label htmlFor="sheet-select" className="text-slate-500">
            Sheet
          </label>
          <select
            id="sheet-select"
            value={sheetName}
            onChange={(e) => loadSheet(sheets, e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            {Object.keys(sheets).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {rows.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="effective-month" className="text-slate-500">
              Budgets apply from
            </label>
            <input
              id="effective-month"
              type="month"
              value={effectiveMonth}
              onChange={(e) => setEffectiveMonth(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1"
            />
            <span className="text-xs text-slate-400">Rollover starts in this month.</span>
          </div>

          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {rows.map((row) => {
              const isNew = !existingCategories?.some((c) => c.name.toLowerCase() === row.name.toLowerCase())
              return (
                <li key={row.name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!excluded.has(row.name)}
                    onChange={() => toggleRow(row.name)}
                    id={`row-${row.name}`}
                  />
                  <label htmlFor={`row-${row.name}`} className="flex-1">
                    {row.name}
                  </label>
                  <span className="text-slate-500">{formatCurrency(row.amount)}</span>
                  <span className="w-16 text-xs text-slate-400">{isNew ? 'new' : 'update'}</span>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={handleImport}
            disabled={status === 'importing'}
            className="mt-4 rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === 'importing' ? 'Importing…' : `Import ${rows.length - excluded.size} categories`}
          </button>

          {status === 'done' && <p className="mt-2 text-sm text-emerald-600">Done — check the Dashboard.</p>}
        </>
      )}
    </div>
  )
}

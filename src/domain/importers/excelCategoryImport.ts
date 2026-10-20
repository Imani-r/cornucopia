export interface CategoryBudgetRow {
  name: string
  amount: number
}

function matchesHeader(value: unknown, pattern: RegExp): boolean {
  return typeof value === 'string' && pattern.test(value.trim())
}

/**
 * Scans a sheet (as an array of rows, each an array of cell values — the shape produced by
 * `XLSX.utils.sheet_to_json(sheet, { header: 1 })`) for a "Categories" / "Amount" header pair,
 * then reads consecutive rows below it until the category or amount column stops looking like data.
 * Built against the user's own budget sheet's "Starling" table (a Categories column next to an
 * Amount (Personal) column), but the header match is generic so it isn't tied to that exact label.
 */
export function extractCategoryBudgets(rows: unknown[][]): CategoryBudgetRow[] {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? []
    for (let c = 0; c < row.length; c++) {
      if (matchesHeader(row[c], /^categor/i) && matchesHeader(row[c + 1], /amount/i)) {
        const results: CategoryBudgetRow[] = []
        for (let r2 = r + 1; r2 < rows.length; r2++) {
          const dataRow = rows[r2] ?? []
          const name = dataRow[c]
          const amount = dataRow[c + 1]
          if (typeof name !== 'string' || name.trim() === '') break
          if (typeof amount !== 'number') break
          results.push({ name: name.trim(), amount })
        }
        if (results.length > 0) return results
      }
    }
  }
  return []
}

import { describe, expect, it } from 'vitest'
import { extractCategoryBudgets } from './excelCategoryImport'

describe('extractCategoryBudgets', () => {
  it('reads category/amount pairs starting at the header row, stopping at the total row', () => {
    // A budget sheet with other content to the left, a small label above the table,
    // headers to the right, and a trailing total row with no name.
    const rows: unknown[][] = [
      [undefined, undefined, undefined, undefined, undefined, 'Bank'],
      ['Rent', 1000, '1st', undefined, undefined, undefined, 'Categories', 'Amount (Personal)'],
      ['Utilities', 90, '5th', undefined, undefined, undefined, 'Rent', 1000],
      ['Phone', 10, undefined, undefined, undefined, undefined, 'Bills', 150.5],
      ['Internet', 25, undefined, undefined, undefined, undefined, 'Groceries', 200],
      [undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1350.5],
    ]

    expect(extractCategoryBudgets(rows)).toEqual([
      { name: 'Rent', amount: 1000 },
      { name: 'Bills', amount: 150.5 },
      { name: 'Groceries', amount: 200 },
    ])
  })

  it('returns an empty array when no Categories/Amount header pair is found', () => {
    expect(extractCategoryBudgets([['Rent', 1000], ['Bills', 150]])).toEqual([])
  })

  it('stops at a non-numeric amount even if the category cell still has text', () => {
    const rows: unknown[][] = [
      ['Categories', 'Amount (Personal)'],
      ['Rent', 1000],
      ['Total', 'n/a'],
    ]
    expect(extractCategoryBudgets(rows)).toEqual([{ name: 'Rent', amount: 1000 }])
  })
})

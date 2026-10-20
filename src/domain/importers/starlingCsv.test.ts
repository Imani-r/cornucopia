import { describe, expect, it } from 'vitest'
import {
  matchCategory,
  normalizeCategoryLabel,
  parseStarlingDate,
  starlingImportKey,
  toStarlingTransactions,
} from './starlingCsv'

describe('parseStarlingDate', () => {
  it('converts DD/MM/YYYY to ISO YYYY-MM-DD', () => {
    expect(parseStarlingDate('01/05/2024')).toBe('2024-05-01')
    expect(parseStarlingDate('31/12/2026')).toBe('2026-12-31')
  })
})

describe('toStarlingTransactions', () => {
  it('keeps money in and money out, as positive amounts with a direction', () => {
    const rows = [
      { date: '01/05/2024', counterParty: 'App Store', reference: 'APP STORE', amount: -0.99, balance: '100.00', spendingCategory: 'SUBSCRIPTIONS' },
      { date: '06/05/2024', counterParty: 'Jane Doe', reference: 'JANE DOE', amount: 65.0, balance: '165.00', spendingCategory: 'INCOME' },
    ]
    expect(toStarlingTransactions(rows)).toEqual([
      {
        date: '2024-05-01',
        merchant: 'App Store',
        amount: 0.99,
        direction: 'out',
        spendingCategory: 'SUBSCRIPTIONS',
        importKey: starlingImportKey(rows[0]),
      },
      {
        date: '2024-05-06',
        merchant: 'Jane Doe',
        amount: 65,
        direction: 'in',
        spendingCategory: 'INCOME',
        importKey: starlingImportKey(rows[1]),
      },
    ])
  })

  it('drops rows that move no money', () => {
    const rows = [{ date: '01/05/2024', counterParty: 'Card check', amount: 0, spendingCategory: 'GENERAL' }]
    expect(toStarlingTransactions(rows)).toEqual([])
  })
})

describe('starlingImportKey', () => {
  const row = { date: '02/05/2024', counterParty: 'Corner Shop', reference: 'CORNER SHOP', amount: -3.5, balance: '96.50', spendingCategory: 'GROCERIES' }

  it('gives the same key for the same row appearing in two overlapping exports', () => {
    expect(starlingImportKey({ ...row })).toBe(starlingImportKey(row))
  })

  it('tells apart two identical same-day purchases by the balance left after each', () => {
    expect(starlingImportKey({ ...row, balance: '93.00' })).not.toBe(starlingImportKey(row))
  })
})

describe('matchCategory', () => {
  const appCategories = [
    'Rent',
    'Bills',
    'Groceries',
    'Subscriptions',
    'Car',
    'Shopping (clothes, books, etc.)',
    'Personal Care',
    'Fitness',
    'Transport',
    'Gifts',
    'Lifestyle (incl. eating out)',
  ]

  it('matches Starling categories to budget categories by whole words', () => {
    expect(matchCategory('GROCERIES', appCategories)).toBe('Groceries')
    expect(matchCategory('SHOPPING', appCategories)).toBe('Shopping (clothes, books, etc.)')
    expect(matchCategory('LIFESTYLE', appCategories)).toBe('Lifestyle (incl. eating out)')
  })

  it('applies the BILLS_AND_SERVICES alias', () => {
    expect(matchCategory('BILLS_AND_SERVICES', appCategories)).toBe('Bills')
  })

  it('matches whole words only, so PERSONAL_CARE does not land in Car', () => {
    expect(matchCategory('PERSONAL_CARE', appCategories)).toBe('Personal Care')
    // Even when Car is the only candidate, "car" is not a whole word of "personal care".
    expect(matchCategory('PERSONAL_CARE', ['Car'])).toBeNull()
  })

  it('maps EATING_OUT to a category whose label mentions eating out', () => {
    expect(matchCategory('EATING_OUT', appCategories)).toBe('Lifestyle (incl. eating out)')
  })

  it('returns null for categories with no reasonable match', () => {
    expect(matchCategory('PAYMENTS', appCategories)).toBeNull()
    expect(matchCategory('ENTERTAINMENT', appCategories)).toBeNull()
  })
})

describe('normalizeCategoryLabel', () => {
  it('lowercases and collapses underscores/whitespace to single spaces', () => {
    expect(normalizeCategoryLabel('BILLS_AND_SERVICES')).toBe('bills and services')
    expect(normalizeCategoryLabel('  Personal   Care ')).toBe('personal care')
  })
})

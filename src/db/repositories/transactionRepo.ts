import { db } from '../db'
import type { TransactionRecord } from '../schema'

export async function listTransactionsForCategory(categoryId: string): Promise<TransactionRecord[]> {
  return db.transactions.where('categoryId').equals(categoryId).sortBy('date')
}

export function monthOfTransaction(t: TransactionRecord): string {
  return t.date.slice(0, 7)
}

/** Sets (replaces) the single monthly-total entry for a category+month. This is the MVP data-entry
 *  path for someone reading a lump sum off a bank statement, rather than itemizing every purchase. */
export async function setMonthlyLumpSum(input: {
  categoryId: string
  month: string // "YYYY-MM"
  amount: number
}): Promise<void> {
  const existing = await db.transactions
    .where('categoryId')
    .equals(input.categoryId)
    .and((t) => t.kind === 'lump_sum' && monthOfTransaction(t) === input.month)
    .first()

  if (existing) {
    await db.transactions.update(existing.id, { amount: input.amount })
    return
  }

  const record: TransactionRecord = {
    id: crypto.randomUUID(),
    categoryId: input.categoryId,
    date: `${input.month}-01`,
    amount: input.amount,
    kind: 'lump_sum',
    createdAt: new Date().toISOString(),
  }
  await db.transactions.add(record)
}

export interface ItemizedImportInput {
  categoryId?: string
  date: string
  amount: number
  direction: 'in' | 'out'
  merchant: string
  bankCategory: string
  importKey: string
}

/** Which of these import keys are already stored, i.e. came in with an earlier, overlapping export. */
export async function findExistingImportKeys(importKeys: string[]): Promise<Set<string>> {
  const existing = await db.transactions.where('importKey').anyOf(importKeys).toArray()
  return new Set(existing.map((t) => t.importKey!))
}

/** Adds itemized transactions, skipping any whose import key is already stored (or repeated in this batch). */
export async function importItemizedTransactions(items: ItemizedImportInput[]): Promise<{ added: number; duplicates: number }> {
  return db.transaction('rw', db.transactions, async () => {
    const seen = await findExistingImportKeys(items.map((i) => i.importKey))
    const createdAt = new Date().toISOString()
    const records: TransactionRecord[] = []

    for (const item of items) {
      if (seen.has(item.importKey)) continue
      seen.add(item.importKey)
      records.push({ id: crypto.randomUUID(), kind: 'itemized', createdAt, ...item })
    }

    await db.transactions.bulkAdd(records)
    return { added: records.length, duplicates: items.length - records.length }
  })
}

/** Sums spending by month. A month with no entries is simply absent from the result
 *  (looks up as `undefined`) — distinct from a month explicitly logged as £0. */
export function sumActualsByMonth(transactions: TransactionRecord[]): Record<string, number> {
  const sums: Record<string, number> = {}
  for (const t of transactions) {
    if (t.direction === 'in') continue
    const month = monthOfTransaction(t)
    sums[month] = (sums[month] ?? 0) + t.amount
  }
  return sums
}

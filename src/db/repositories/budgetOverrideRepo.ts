import { db } from '../db'
import type { BudgetOverrideRecord } from '../schema'

export async function listBudgetOverrides(categoryId: string): Promise<BudgetOverrideRecord[]> {
  return db.budgetOverrides.where('categoryId').equals(categoryId).sortBy('effectiveMonth')
}

/** Sets the base budget effective from `effectiveMonth` onward. Replaces any existing override for that exact month. */
export async function setBudgetOverride(input: {
  categoryId: string
  effectiveMonth: string
  amount: number
}): Promise<void> {
  const existing = await db.budgetOverrides
    .where('categoryId')
    .equals(input.categoryId)
    .and((o) => o.effectiveMonth === input.effectiveMonth)
    .first()

  if (existing) {
    await db.budgetOverrides.update(existing.id, { amount: input.amount })
    return
  }

  const record: BudgetOverrideRecord = {
    id: crypto.randomUUID(),
    categoryId: input.categoryId,
    effectiveMonth: input.effectiveMonth,
    amount: input.amount,
    createdAt: new Date().toISOString(),
  }
  await db.budgetOverrides.add(record)
}

import { db } from '../db'

/** Saved choices of budget category (or skip) per bank spending category, keyed by spending category. */
export async function getCategoryMappings(): Promise<Record<string, string>> {
  const all = await db.categoryMappings.toArray()
  return Object.fromEntries(all.map((m) => [m.spendingCategory, m.target]))
}

export async function saveCategoryMappings(mapping: Record<string, string>): Promise<void> {
  await db.categoryMappings.bulkPut(
    Object.entries(mapping).map(([spendingCategory, target]) => ({ spendingCategory, target })),
  )
}
